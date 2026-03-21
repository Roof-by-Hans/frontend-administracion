import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import Alert from "@blazejkustra/react-native-alert";
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';const SOCKET_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

const SocketContext = createContext(null);

/**
 * Hook para acceder al contexto del socket
 * @returns {Object} - Contexto del socket
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket debe usarse dentro de SocketProvider');
  }
  return context;
};

/**
 * Provider para compartir la conexión del socket entre componentes
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const appState = useRef(AppState.currentState);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    let mounted = true;

    const initSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const socket = io(SOCKET_URL, {
          auth: { token: token || null },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 10
        });

        if (!mounted) {
          socket.disconnect();
          return;
        }

        socketRef.current = socket;

                socket.on('connect', () => {
          if (!mounted) return;
          setIsConnected(true);
          setIsAuthenticated(!!token);
          reconnectAttempts.current = 0;
        });

        socket.on('disconnect', (reason) => {
          if (!mounted) return;
          setIsConnected(false);
        });

        socket.on('reconnect', (attemptNumber) => {
          if (!mounted) return;
          reconnectAttempts.current = 0;
        });

        socket.on('reconnect_attempt', (attemptNumber) => {
          reconnectAttempts.current = attemptNumber;
        });

        socket.on('reconnect_error', (error) => {
          console.error('❌ Error de reconexión global:', error.message);
        });

        socket.on('reconnect_failed', () => {
          console.error('❌ Falló la reconexión global después de todos los intentos');
          
          if (mounted) {
            Alert.alert(
              'Error de conexión',
              'No se pudo conectar al servidor. Por favor, verifica tu conexión.',
              [{ text: 'OK' }]
            );
          }
        });

        socket.on('connect_error', (error) => {
          console.error('❌ Error de conexión global:', error.message);
        });

                socket.on('authenticated', (data) => {
          if (!mounted) return;
          setIsAuthenticated(true);
          setUserId(data.userId);
          setUserRole(data.userRole);
        });

        socket.on('unauthorized', (data) => {
          if (!mounted) return;
          
          console.warn('⚠️ Usuario no autorizado:', data);
          setIsAuthenticated(false);
          setUserId(null);
          setUserRole(null);
        });

      } catch (error) {
        console.error('❌ Error al inicializar socket global:', error);
      }
    };

    initSocket();

        const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {        if (socketRef.current && !socketRef.current.connected) {
          socketRef.current.connect();
        }
      }
      
      appState.current = nextAppState;
    });

        return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('reconnect');
        socketRef.current.off('reconnect_attempt');
        socketRef.current.off('reconnect_error');
        socketRef.current.off('reconnect_failed');
        socketRef.current.off('connect_error');
        socketRef.current.off('authenticated');
        socketRef.current.off('unauthorized');
        socketRef.current.disconnect();
      }
      
      subscription?.remove();
    };
  }, []);

    /**
   * Actualizar token de autenticación
   * @param {string} newToken - Nuevo token JWT
   */
  const updateToken = async (newToken) => {
    try {
      await AsyncStorage.setItem('token', newToken);
      
      if (socketRef.current) {        socketRef.current.disconnect();
        socketRef.current.auth = { token: newToken };
        socketRef.current.connect();
      }
    } catch (error) {
      console.error('❌ Error al actualizar token:', error);
    }
  };

  /**
   * Remover token y desautenticar
   */
  const clearToken = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setIsAuthenticated(false);
      setUserId(null);
      setUserRole(null);
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.auth = { token: null };
      }
    } catch (error) {
      console.error('❌ Error al limpiar token:', error);
    }
  };

  /**
   * Forzar reconexión manual
   */
  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  };

  /**
   * Emitir un evento al servidor
   * @param {string} event - Nombre del evento
   * @param {any} data - Datos a enviar
   */
  const emit = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('⚠️ Socket no conectado, no se puede emitir:', event);
    }
  };

  /**
   * Suscribirse a un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Callback a ejecutar
   */
  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  /**
   * Desuscribirse de un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Callback a remover (opcional)
   */
  const off = (event, callback) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  };

  const value = {
    socket: socketRef.current,
    isConnected,
    isAuthenticated,
    userId,
    userRole,
    reconnectAttempts: reconnectAttempts.current,
    updateToken,
    clearToken,
    reconnect,
    emit,
    on,
    off
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
