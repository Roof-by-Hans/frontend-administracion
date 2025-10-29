import { useEffect, useRef, useState } from 'react';
import { AppState, Alert } from 'react-native';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL del servidor (sin /api para WebSocket)
const SOCKET_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

/**
 * Hook personalizado para manejar WebSocket de mesas
 * @param {Object} options - Opciones de configuración
 * @param {Function} options.onRefreshRequest - Callback cuando se solicita refrescar mesas
 * @param {Function} options.onNotification - Callback para notificaciones
 * @returns {Object} - Socket, estado de conexión, mesas y funciones auxiliares
 */
export function useMesasSocket(options = {}) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mesas, setMesas] = useState([]);
  const appState = useRef(AppState.currentState);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    let socket = null;

    const initSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          console.warn('⚠️ No hay token disponible para WebSocket');
          return;
        }

        console.log('🔌 Inicializando socket a:', SOCKET_URL);
        
        socket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 10
        });

        socketRef.current = socket;

        // ==================== EVENTOS DE CONEXIÓN ====================
        
        socket.on('connect', () => {
          console.log('✅ Socket conectado:', socket.id);
          setIsConnected(true);
          reconnectAttempts.current = 0;
          
          // Unirse automáticamente a la sala de mesas
          socket.emit('join:mesas');
        });

        socket.on('disconnect', (reason) => {
          console.log('❌ Socket desconectado:', reason);
          setIsConnected(false);
        });

        socket.on('reconnect', (attemptNumber) => {
          console.log('🔄 Socket reconectado después de', attemptNumber, 'intentos');
          reconnectAttempts.current = 0;
          // Re-unirse a la sala
          socket.emit('join:mesas');
        });

        socket.on('reconnect_attempt', (attemptNumber) => {
          console.log('🔄 Intento de reconexión:', attemptNumber);
          reconnectAttempts.current = attemptNumber;
        });

        socket.on('reconnect_error', (error) => {
          console.error('❌ Error de reconexión:', error.message);
        });

        socket.on('reconnect_failed', () => {
          console.error('❌ Falló la reconexión después de todos los intentos');
          Alert.alert(
            'Error de conexión',
            'No se pudo reconectar al servidor. Por favor, verifica tu conexión e intenta nuevamente.',
            [{ text: 'OK' }]
          );
        });

        // ==================== CONFIRMACIONES DE SALA ====================

        socket.on('joined:mesas', (data) => {
          console.log('✅ Unido a sala de mesas:', data);
        });

        socket.on('left:mesas', (data) => {
          console.log('👋 Saliste de sala de mesas:', data);
        });

        socket.on('joined:mesa', (data) => {
          console.log('✅ Unido a mesa específica:', data);
        });

        socket.on('left:mesa', (data) => {
          console.log('👋 Saliste de mesa específica:', data);
        });

        // ==================== EVENTOS DE MESAS ====================

        socket.on('mesa:creada', (payload) => {
          console.log('🆕 Mesa creada:', payload.data);
          
          if (payload.data) {
            setMesas(prev => [...prev, payload.data]);
            
            // Notificar al usuario
            if (options.onNotification) {
              options.onNotification({
                type: 'success',
                message: payload.message || `Mesa ${payload.data.nombreMesa} creada`,
                timestamp: payload.timestamp
              });
            }
          }
        });

        socket.on('mesa:actualizada', (payload) => {
          console.log('🔄 Mesa actualizada:', payload.data);
          
          if (payload.data) {
            setMesas(prev => 
              prev.map(mesa => 
                mesa.idMesa === payload.data.idMesa ? payload.data : mesa
              )
            );
            
            if (options.onNotification) {
              options.onNotification({
                type: 'info',
                message: payload.message || `Mesa ${payload.data.nombreMesa} actualizada`,
                timestamp: payload.timestamp
              });
            }
          }
        });

        socket.on('mesa:eliminada', (payload) => {
          console.log('🗑️ Mesa eliminada:', payload.data);
          
          if (payload.data?.id) {
            setMesas(prev => 
              prev.filter(mesa => mesa.idMesa !== payload.data.id)
            );
            
            if (options.onNotification) {
              options.onNotification({
                type: 'warning',
                message: payload.message || `Mesa eliminada`,
                timestamp: payload.timestamp
              });
            }
          }
        });

        socket.on('mesa:estado-cambiado', (payload) => {
          console.log('🔄 Estado de mesa cambiado:', payload);
          
          if (payload.data) {
            // Mapear estados del backend al frontend
            const estadoMap = {
              'DISPONIBLE': 'libre',
              'OCUPADA': 'ocupada',
              'RESERVADA': 'reservada',
              'FUERA_DE_SERVICIO': 'fuera_servicio'
            };
            
            const estadoLocal = estadoMap[payload.data.estado] || payload.data.estado;
            
            setMesas(prev => {
              const nuevasMesas = prev.map(mesa => {
                if (mesa.idMesa === payload.data.id || mesa.numero === payload.data.id) {
                  // Determinar el pedido según el nuevo estado
                  let nuevoPedido;
                  if (estadoLocal === 'libre') {
                    // Si está libre, NO hay pedido
                    nuevoPedido = null;
                  } else if (estadoLocal === 'ocupada' && !mesa.pedido) {
                    // Si se ocupa y no tenía pedido, crear uno nuevo
                    nuevoPedido = {
                      mozo: "Sistema",
                      horaInicio: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                      comensales: 0,
                      items: []
                    };
                  } else {
                    // Mantener el pedido existente
                    nuevoPedido = mesa.pedido;
                  }
                  
                  return { 
                    ...mesa, 
                    estado: estadoLocal,
                    pedido: nuevoPedido
                  };
                }
                return mesa;
              });
              
              return nuevasMesas;
            });
            
            // Notificación opcional (comentada para no saturar)
            // if (options.onNotification) {
            //   options.onNotification({
            //     type: 'info',
            //     message: payload.message || `Mesa cambió a ${estadoLocal}`,
            //     timestamp: payload.timestamp
            //   });
            // }
          }
        });

        socket.on('mesas:actualizar', (payload) => {
          console.log('🔄 Solicitud de actualización masiva de mesas');
          
          // Llamar al callback para recargar desde la API REST
          if (options.onRefreshRequest) {
            options.onRefreshRequest();
          }
        });

        // ==================== EVENTOS DE GRUPOS DE MESAS ====================

        socket.on('grupo:creado', (payload) => {
          console.log('🔗 Grupo de mesas creado:', payload);
          
          if (payload.data && payload.data.mesas) {
            const grupoId = payload.data.id;
            // Usar idMesa o id dependiendo de qué campo envía el backend
            const mesasDelGrupo = payload.data.mesas.map(m => m.idMesa || m.id);
            
            console.log('📊 Grupo ID:', grupoId, 'Mesas del grupo:', mesasDelGrupo);
            
            // Actualizar las mesas para reflejar que están en un grupo
            setMesas(prev => 
              prev.map(mesa => {
                if (mesasDelGrupo.includes(mesa.idMesa) || mesasDelGrupo.includes(mesa.numero)) {
                  // Encontrar las otras mesas del grupo (excluir la actual)
                  const otrasMesas = mesasDelGrupo.filter(id => 
                    id !== mesa.idMesa && id !== mesa.numero
                  );
                  
                  console.log(`✅ Mesa ${mesa.numero} ahora en grupo ${grupoId}, unida con:`, otrasMesas);
                  
                  return {
                    ...mesa,
                    grupo: grupoId,
                    unidaCon: otrasMesas,
                    nombreGrupo: payload.data.nombre
                  };
                }
                return mesa;
              })
            );

            if (options.onNotification) {
              options.onNotification({
                type: 'success',
                message: payload.message || `Grupo "${payload.data.nombre}" creado`,
                timestamp: payload.timestamp
              });
            }
          }
        });

        socket.on('grupo:disuelto', (payload) => {
          console.log('✂️ Grupo de mesas disuelto:', payload);
          
          if (payload.data && payload.data.mesasLiberadas) {
            const mesasLiberadas = payload.data.mesasLiberadas;
            
            // Remover la información de grupo de las mesas
            setMesas(prev =>
              prev.map(mesa => {
                if (mesasLiberadas.includes(mesa.idMesa) || mesasLiberadas.includes(mesa.numero)) {
                  return {
                    ...mesa,
                    grupo: null,
                    unidaCon: [],
                    nombreGrupo: null
                  };
                }
                return mesa;
              })
            );

            if (options.onNotification) {
              options.onNotification({
                type: 'info',
                message: payload.message || 'Grupo de mesas disuelto',
                timestamp: payload.timestamp
              });
            }
          }
        });

        socket.on('mesas:unidas', (payload) => {
          console.log('🔗 Mesas unidas al grupo:', payload);
          
          if (payload.data && payload.data.mesasUnidas) {
            const grupoId = payload.data.idGrupo;
            const mesasUnidas = payload.data.mesasUnidas;
            
            // Actualizar las mesas que se unieron al grupo
            setMesas(prev =>
              prev.map(mesa => {
                if (mesasUnidas.includes(mesa.idMesa) || mesasUnidas.includes(mesa.numero)) {
                  // Encontrar las otras mesas del grupo
                  const otrasMesas = mesasUnidas.filter(id => 
                    id !== mesa.idMesa && id !== mesa.numero
                  );
                  
                  return {
                    ...mesa,
                    grupo: grupoId,
                    unidaCon: otrasMesas,
                    nombreGrupo: payload.data.nombreGrupo
                  };
                }
                return mesa;
              })
            );
          }
        });

        socket.on('mesas:separadas', (payload) => {
          console.log('✂️ Mesas separadas del grupo:', payload);
          
          if (payload.data && payload.data.mesasSeparadas) {
            const mesasSeparadas = payload.data.mesasSeparadas;
            
            // Remover las mesas del grupo
            setMesas(prev =>
              prev.map(mesa => {
                if (mesasSeparadas.includes(mesa.idMesa) || mesasSeparadas.includes(mesa.numero)) {
                  return {
                    ...mesa,
                    grupo: null,
                    unidaCon: [],
                    nombreGrupo: null
                  };
                }
                return mesa;
              })
            );
          }
        });

        // ==================== NOTIFICACIONES GENERALES ====================

        socket.on('notificacion', (payload) => {
          console.log('🔔 Notificación:', payload);
          
          if (options.onNotification) {
            options.onNotification(payload);
          }
        });

        // ==================== RESPUESTAS A SOLICITUDES ====================

        socket.on('mesas:connected-clients', (data) => {
          console.log('👥 Clientes conectados:', data);
        });

        socket.on('mesa:estado', (data) => {
          console.log('📊 Estado de mesa:', data);
        });

        // ==================== MANEJO DE ERRORES ====================

        socket.on('error', (error) => {
          console.error('⚠️ Error de socket:', error);
          
          if (options.onNotification) {
            options.onNotification({
              type: 'error',
              message: error.message || 'Error en el socket',
              code: error.code
            });
          }
        });

        socket.on('connect_error', (error) => {
          console.error('❌ Error de conexión:', error.message);
        });

      } catch (error) {
        console.error('❌ Error al inicializar socket:', error);
      }
    };

    initSocket();

    // ==================== MANEJO DE ESTADO DE LA APP ====================

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // La app volvió a foreground
        console.log('📱 App en foreground, verificando conexión...');
        
        if (socket && !socket.connected) {
          console.log('🔄 Reconectando socket...');
          socket.connect();
        }
      }
      
      appState.current = nextAppState;
    });

    // ==================== CLEANUP ====================

    return () => {
      console.log('🧹 Limpiando listeners (manteniendo socket activo para otras pantallas)...');
      
      // NO desconectamos el socket aquí para mantener la conexión activa
      // entre cambios de pantalla y recibir actualizaciones en tiempo real
      
      // Solo removemos listeners para evitar duplicados
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('reconnect');
        socket.off('reconnect_attempt');
        socket.off('reconnect_error');
        socket.off('reconnect_failed');
        socket.off('joined:mesas');
        socket.off('left:mesas');
        socket.off('joined:mesa');
        socket.off('left:mesa');
        socket.off('mesa:creada');
        socket.off('mesa:actualizada');
        socket.off('mesa:eliminada');
        socket.off('mesa:estado-cambiado');
        socket.off('mesas:actualizar');
        socket.off('grupo:creado');
        socket.off('grupo:disuelto');
        socket.off('mesas:unidas');
        socket.off('mesas:separadas');
        socket.off('notificacion');
        socket.off('mesas:connected-clients');
        socket.off('mesa:estado');
        socket.off('error');
        socket.off('connect_error');
        
        // NO desconectamos el socket para mantener tiempo real
        // socket.disconnect();
      }
      
      subscription?.remove();
    };
  }, []); // Solo se ejecuta al montar y desmontar

  // ==================== FUNCIONES AUXILIARES ====================

  /**
   * Unirse a una sala de mesa específica
   * @param {number} mesaId - ID de la mesa
   */
  const joinMesa = (mesaId) => {
    if (socketRef.current && isConnected) {
      console.log('📥 Uniéndose a mesa:', mesaId);
      socketRef.current.emit('join:mesa', { mesaId });
    } else {
      console.warn('⚠️ Socket no conectado, no se puede unir a mesa');
    }
  };

  /**
   * Salir de una sala de mesa específica
   * @param {number} mesaId - ID de la mesa
   */
  const leaveMesa = (mesaId) => {
    if (socketRef.current && isConnected) {
      console.log('📤 Saliendo de mesa:', mesaId);
      socketRef.current.emit('leave:mesa', { mesaId });
    }
  };

  /**
   * Solicitar el estado actual de una mesa
   * @param {number} mesaId - ID de la mesa
   */
  const getEstadoMesa = (mesaId) => {
    if (socketRef.current && isConnected) {
      console.log('📊 Solicitando estado de mesa:', mesaId);
      socketRef.current.emit('mesa:get-estado', { mesaId });
    }
  };

  /**
   * Obtener lista de clientes conectados a la sala de mesas
   */
  const getConnectedClients = () => {
    if (socketRef.current && isConnected) {
      console.log('👥 Solicitando clientes conectados');
      socketRef.current.emit('mesas:get-connected-clients');
    }
  };

  /**
   * Forzar reconexión manual
   */
  const reconnect = () => {
    if (socketRef.current) {
      console.log('🔄 Reconectando manualmente...');
      socketRef.current.connect();
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    reconnectAttempts: reconnectAttempts.current,
    mesas,
    setMesas,
    joinMesa,
    leaveMesa,
    getEstadoMesa,
    getConnectedClients,
    reconnect
  };
}
