import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar si hay una sesión guardada al cargar
  useEffect(() => {
    const checkStoredSession = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const savedUser = await AsyncStorage.getItem('user');
        
        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error al cargar sesión guardada:', err);
        try {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
        } catch (e) {
          console.error('Error al limpiar storage:', e);
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkStoredSession();
  }, []);

  // Verificar periódicamente si el token sigue existiendo (detecta cuando es eliminado por JWT expirado)
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenInterval = setInterval(async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        
        // Si el usuario está autenticado pero el token fue eliminado, cerrar sesión
        if (!token && isAuthenticated) {
          console.log('Token eliminado - cerrando sesión');
          setUser(null);
          setIsAuthenticated(false);
          setError('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        }
      } catch (err) {
        console.error('Error al verificar token:', err);
      }
    }, 2000); // Verificar cada 2 segundos

    return () => clearInterval(checkTokenInterval);
  }, [isAuthenticated]);

  /**
   * Iniciar sesión con credenciales
   * @param {string} nombreUsuario - Nombre de usuario
   * @param {string} contrasena - Contraseña
   * @param {boolean} recordarme - Si se debe recordar la sesión
   * @returns {Promise<boolean>} True si el login fue exitoso
   */
  const login = async (nombreUsuario, contrasena, recordarme = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Llamar al servicio de autenticación
      const response = await authService.login(nombreUsuario, contrasena);
      
      if (response.success && response.data) {
        const { token, usuario } = response.data;
        
        // Guardar el token en AsyncStorage
        try {
          await AsyncStorage.setItem('token', token);
          await AsyncStorage.setItem('user', JSON.stringify(usuario));
          
          // Opcional: guardar un flag de "recordarme" si lo necesitas
          if (recordarme) {
            await AsyncStorage.setItem('recordarme', 'true');
          }
        } catch (storageError) {
          console.error('Error al guardar en AsyncStorage:', storageError);
        }
        
        // Actualizar el estado
        setUser(usuario);
        setIsAuthenticated(true);
        setLoading(false);
        
        return true;
      } else {
        setError(response.message || 'Error al iniciar sesión');
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Error en login:', err);
      
      let errorMessage = 'Error al conectar con el servidor';
      
      if (err.response) {
        // El servidor respondió con un código de error
        if (err.response.status === 401) {
          errorMessage = 'Usuario o contraseña incorrectos';
        } else if (err.response.status === 403) {
          errorMessage = 'Usuario inactivo. Contacte al administrador.';
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión.';
      }
      
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  /**
   * Cerrar sesión
   */
  const logout = async () => {
    try {
      // Limpiar el almacenamiento con AsyncStorage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('recordarme');
      
      // Limpiar el estado
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  /**
   * Limpiar el error
   */
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      loading,
      error,
      login,
      logout,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
};