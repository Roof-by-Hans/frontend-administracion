import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authService from "../services/authService";
import Alert from "@blazejkustra/react-native-alert";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar sesión guardada (AsyncStorage)
  useEffect(() => {
    const checkStoredSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("Error al cargar sesión guardada:", err);
        try {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
        } catch (e) {
          console.error("Error al limpiar storage:", e);
        }
      } finally {
        setLoading(false);
      }
    };

    checkStoredSession();
  }, []);

  // Verificar periódicamente si el token sigue existiendo en AsyncStorage
  // Si fue eliminado por un 401, cerrar sesión
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const sessionExpired = await AsyncStorage.getItem("session_expired");
        
        if (!storedToken && isAuthenticated) {
          console.log("🚪 Token eliminado - cerrando sesión");
          
          // Si hay un flag de sesión expirada, mostrar mensaje
          if (sessionExpired === "true") {
            Alert.alert(
              "Sesión expirada",
              "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
            );
            await AsyncStorage.removeItem("session_expired");
          }
          
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Error al verificar token:", err);
      }
    }, 1000); // Verificar cada segundo

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // login: soporte dual para compatibilidad con código existente
  // - Si se llama como login(userData, token) -> guarda esa sesión
  // - Si se llama como login(nombreUsuario, contrasena, recordarme) -> usa authService
  const login = async (a, b, c = false) => {
    // Caso 1: llamada desde el antiguo flujo: login(userData, token)
    if (typeof a === "object" && typeof b === "string") {
      const userData = a;
      const authToken = b;
      setUser(userData);
      setToken(authToken);
      setIsAuthenticated(true);
      try {
        await AsyncStorage.setItem("token", authToken);
        await AsyncStorage.setItem("user", JSON.stringify(userData));
      } catch (err) {
        console.error("Error al guardar sesión en AsyncStorage:", err);
      }
      return true;
    }

    // Caso 2: llamada con credenciales: login(nombreUsuario, contrasena, recordarme)
    const nombreUsuario = a;
    const contrasena = b;
    const recordarme = c;
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(nombreUsuario, contrasena);
      if (response && response.data) {
        const { token: receivedToken, usuario } = response.data;
        setUser(usuario);
        setToken(receivedToken);
        setIsAuthenticated(true);
        try {
          await AsyncStorage.setItem("token", receivedToken);
          await AsyncStorage.setItem("user", JSON.stringify(usuario));
          if (recordarme) {
            await AsyncStorage.setItem("recordarme", "true");
          }
        } catch (storageErr) {
          console.error("Error al guardar en AsyncStorage:", storageErr);
        }
        setLoading(false);
        return true;
      } else {
        setError(response?.message || "Error al iniciar sesión");
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error("Error en login:", err);
      let errorMessage = "Error al conectar con el servidor";
      if (err.response) {
        if (err.response.status === 401)
          errorMessage = "Usuario o contraseña incorrectos";
        else if (err.response.status === 403)
          errorMessage = "Usuario inactivo. Contacte al administrador.";
        else if (err.response.data?.message)
          errorMessage = err.response.data.message;
      } else if (err.request) {
        errorMessage =
          "No se pudo conectar con el servidor. Verifique su conexión.";
      }
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("recordarme");
    } catch (err) {
      console.error("Error al limpiar AsyncStorage en logout:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        login,
        logout,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
