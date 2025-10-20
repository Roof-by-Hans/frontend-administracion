import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

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
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Error al cargar sesión guardada:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

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
        
        // Guardar el token
        if (recordarme) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(usuario));
        } else {
          // Solo guardar en sessionStorage si no se desea recordar
          sessionStorage.setItem('token', token);
          sessionStorage.setItem('user', JSON.stringify(usuario));
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
  const logout = () => {
    // Limpiar el almacenamiento
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    // Limpiar el estado
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
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