import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    const checkStoredSession = async () => {
      try {
        // ============================================
        // MODO DE DESARROLLO: Deshabilitado temporalmente
        // Comenta estas líneas para siempre empezar en login
        // ============================================
        /*
        const token = await AsyncStorage.getItem('token');
        const savedUser = await AsyncStorage.getItem('user');
        
        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        }
        */
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
      
      // ============================================
      // MODO DE DESARROLLO SIN BACKEND
      // Acepta cualquier usuario y contraseña
      // ============================================
      const usuarioMock = {
        id: 1,
        usuario: nombreUsuario,
        nombre: 'Usuario de Prueba',
        rol: 'admin'
      };
      
      const tokenMock = 'token-de-prueba-' + Date.now();
      
      // Guardar en AsyncStorage
      try {
        await AsyncStorage.setItem('token', tokenMock);
        await AsyncStorage.setItem('user', JSON.stringify(usuarioMock));
        
        if (recordarme) {
          await AsyncStorage.setItem('recordarme', 'true');
        }
      } catch (storageError) {
        console.error('Error al guardar en AsyncStorage:', storageError);
      }
      
      // Actualizar el estado
      setUser(usuarioMock);
      setIsAuthenticated(true);
      setLoading(false);
      
      return true;
      
      // ============================================
      // CÓDIGO ORIGINAL CON BACKEND (comentado para desarrollo)
      // Descomenta esto cuando el backend esté disponible
      // ============================================
      /*
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
      */
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error inesperado en el login');
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