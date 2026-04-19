import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import Alert from "@blazejkustra/react-native-alert";
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';const SOCKET_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

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
          console.warn('[WARN] No hay token disponible para WebSocket');
          return;
        }
        socket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 10
        });

        socketRef.current = socket;

                socket.on('connect', () => {
          setIsConnected(true);
          reconnectAttempts.current = 0;          socket.emit('join:mesas');
        });

        socket.on('disconnect', (reason) => {
          setIsConnected(false);
        });

        socket.on('reconnect', (attemptNumber) => {
          reconnectAttempts.current = 0;          socket.emit('join:mesas');
        });

        socket.on('reconnect_attempt', (attemptNumber) => {
          reconnectAttempts.current = attemptNumber;
        });

        socket.on('reconnect_error', (error) => {
          console.error('[ERROR] Error de reconexión:', error.message);
        });

        socket.on('reconnect_failed', () => {
          console.error('[ERROR] Falló la reconexión después de todos los intentos');
          Alert.alert(
            'Error de conexión',
            'No se pudo reconectar al servidor. Por favor, verifica tu conexión e intenta nuevamente.',
            [{ text: 'OK' }]
          );
        });

                socket.on('joined:mesas', (data) => {
        });

        socket.on('left:mesas', (data) => {
        });

        socket.on('joined:mesa', (data) => {
        });

        socket.on('left:mesa', (data) => {
        });        
        /**
         * Evento principal que se emite:
         * 1. Automáticamente al hacer join:mesas
         * 2. Automáticamente al crear/disolver grupos
         * 3. Cada vez que hay cambios importantes en mesas
         * 
         * Esto reemplaza la necesidad de hacer polling o requests adicionales
         */
        socket.on('mesas:lista-completa', (payload) => {
          if (payload.data && Array.isArray(payload.data)) {            const mesasConGrupo = payload.data.filter(m => m.grupo);
            mesasConGrupo.forEach(m => {
            });
            
                        const mesasTransformadas = payload.data.map((mesa, index) => {
                            const estadoMap = {
                'DISPONIBLE': 'libre',
                'OCUPADA': 'ocupada',
                'RESERVADA': 'reservada',
                'FUERA_DE_SERVICIO': 'fuera_servicio'
              };
              const estadoLocal = estadoMap[mesa.estado] || 'libre';              const grupoInfo = mesa.grupo ? {
                id: mesa.grupo.id,
                nombre: mesa.grupo.nombre
              } : null;

              
              return {
                numero: mesa.idMesa,
                nombre: mesa.nombreMesa,
                estado: estadoLocal,
                posicion: { 
                  x: mesa.posX !== null && mesa.posX !== undefined ? mesa.posX : 50 + (index % 5) * 130, 
                  y: mesa.posY !== null && mesa.posY !== undefined ? mesa.posY : 50 + Math.floor(index / 5) * 130 
                },
                unidaCon: [], // Se completará después
                pedido: estadoLocal === "ocupada" ? {
                  mozo: "Sistema",
                  horaInicio: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                  comensales: mesa.idClienteActual ? 1 : 0,
                  items: []
                } : null,
                grupo: grupoInfo?.id || null,
                nombreGrupo: grupoInfo?.nombre || null,
                idMesa: mesa.idMesa,
                nombreMesa: mesa.nombreMesa,
                idClienteActual: mesa.idClienteActual || null
              };
            });            mesasTransformadas.forEach(mesa => {
              if (mesa.grupo) {                const mesasDelMismoGrupo = mesasTransformadas
                  .filter(m => m.grupo === mesa.grupo && m.numero !== mesa.numero)
                  .map(m => m.numero);
                
                mesa.unidaCon = mesasDelMismoGrupo;
              }
            });            setMesas(prev => {
                            const mesasExistentesMap = new Map();
              prev.forEach(mesa => {
                mesasExistentesMap.set(mesa.idMesa || mesa.numero, mesa);
              });              const mesasFusionadas = mesasTransformadas.map(mesaBackend => {
                const mesaExistente = mesasExistentesMap.get(mesaBackend.idMesa);
                if (mesaExistente) {                  return {
                    ...mesaBackend,
                    posicion: mesaExistente.posicion // Mantener posición actual
                  };
                }                return mesaBackend;
              });
              return mesasFusionadas;
            });            if (options.onRefreshRequest) {
            }
          }
        });

                socket.on('mesa:creada', (payload) => {
          if (payload.data) {
                        const mesa = payload.data;
            const estadoMap = {
              'DISPONIBLE': 'libre',
              'OCUPADA': 'ocupada',
              'RESERVADA': 'reservada',
              'FUERA_DE_SERVICIO': 'fuera_servicio'
            };
            
            const mesaTransformada = {
              numero: mesa.idMesa,
              nombre: mesa.nombreMesa,
              estado: estadoMap[mesa.estado] || 'libre',
              posicion: { 
                x: mesa.posX !== null && mesa.posX !== undefined ? mesa.posX : 50, 
                y: mesa.posY !== null && mesa.posY !== undefined ? mesa.posY : 50 
              },
              unidaCon: [],
              pedido: null,
              grupo: null,
              nombreGrupo: null,
              idMesa: mesa.idMesa,
              nombreMesa: mesa.nombreMesa
            };
                        setMesas(prev => {
              const existe = prev.some(m => m.idMesa === mesa.idMesa || m.numero === mesa.idMesa);
              if (existe) {
                return prev.map(m => 
                  m.idMesa === mesa.idMesa || m.numero === mesa.idMesa 
                    ? { ...m, ...mesaTransformada } 
                    : m
                );
              }
              return [...prev, mesaTransformada];
            });            if (options.onNotification) {
              options.onNotification({
                type: 'success',
                message: payload.message || `Mesa ${payload.data.nombreMesa} creada`,
                timestamp: payload.timestamp
              });
            }
          }
        });

        socket.on('mesa:actualizada', (payload) => {
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
        });        socket.on('mesa:posicion-actualizada', (payload) => {          const data = payload.data || payload;
          setMesas((prevMesas) => {
            const mesasActualizadas = prevMesas.map((mesa) => {
              if (mesa.idMesa === data.idMesa) {
                return { ...mesa, posicion: { x: data.posX, y: data.posY } };
              }
              return mesa;
            });
            return mesasActualizadas;
          });
        });

        socket.on('mesa:estado-cambiado', (payload) => {
          if (payload.data) {
                        const estadoMap = {
              'DISPONIBLE': 'libre',
              'OCUPADA': 'ocupada',
              'RESERVADA': 'reservada',
              'FUERA_DE_SERVICIO': 'fuera_servicio'
            };
            
            const estadoLocal = estadoMap[payload.data.estado] || payload.data.estado;
            
            setMesas(prev => {              const mesaCambiada = prev.find(m => 
                m.idMesa === payload.data.id || m.numero === payload.data.id
              );

              if (!mesaCambiada) {
                console.warn('[WARN] Mesa no encontrada:', payload.data.id);
                return prev;
              }              const mesasDelGrupo = mesaCambiada.grupo 
                ? prev.filter(m => m.grupo === mesaCambiada.grupo).map(m => m.numero)
                : [mesaCambiada.numero];
              const nuevasMesas = prev.map(mesa => {
                                if (mesasDelGrupo.includes(mesa.numero)) {                  let nuevoPedido;
                  if (estadoLocal === 'libre') {                    nuevoPedido = null;
                  } else if (estadoLocal === 'ocupada' && !mesa.pedido) {                    nuevoPedido = {
                      mozo: "Sistema",
                      horaInicio: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                      comensales: 0,
                      items: []
                    };
                  } else {                    nuevoPedido = mesa.pedido;
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
            });          }
        });

        socket.on('mesas:actualizar', (payload) => {
                    if (options.onRefreshRequest) {
            options.onRefreshRequest();
          }
        });

                socket.on('grupo:creado', (payload) => {
          
          if (payload.data && payload.data.mesas) {
            const grupoId = payload.data.id;            const mesasDelGrupoBackend = payload.data.mesas.map(m => m.idMesa || m.id);
            
                        setMesas(prev => {

              const nuevasMesas = prev.map(mesa => {
                                const estaEnGrupo = mesasDelGrupoBackend.includes(mesa.idMesa) || 
                                   mesasDelGrupoBackend.includes(mesa.numero);
                
                if (estaEnGrupo) {                  const otrasMesasLocal = prev
                    .filter(m => {
                      const estaOtraEnGrupo = mesasDelGrupoBackend.includes(m.idMesa) || 
                                             mesasDelGrupoBackend.includes(m.numero);
                      return estaOtraEnGrupo && m.numero !== mesa.numero;
                    })
                    .map(m => m.numero);
                  
                  return {
                    ...mesa,
                    grupo: grupoId,
                    unidaCon: otrasMesasLocal,
                    nombreGrupo: payload.data.nombre                  };
                }
                return mesa;
              });


              return nuevasMesas;
            });            if (options.onNotification) {
              options.onNotification({
                type: 'success',
                title: 'Grupo Creado',
                message: `"${payload.data.nombre}" con ${payload.data.mesas.length} mesa(s)`,
                timestamp: payload.timestamp
              });
            }
          }
        });

        socket.on('grupo:disuelto', (payload) => {
          if (payload.data && payload.data.mesasLiberadas) {
            const mesasLiberadas = payload.data.mesasLiberadas;
            
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
            );          }
        });

        socket.on('mesas:unidas', (payload) => {
          if (payload.data && payload.data.mesasUnidas) {
            const grupoId = payload.data.idGrupo;
            const mesasUnidas = payload.data.mesasUnidas;
            
                        setMesas(prev =>
              prev.map(mesa => {
                if (mesasUnidas.includes(mesa.idMesa) || mesasUnidas.includes(mesa.numero)) {                  const otrasMesas = mesasUnidas.filter(id => 
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
            );            if (options.onNotification) {
              options.onNotification({
                type: 'success',
                title: 'Mesas Unidas',
                message: `${mesasUnidas.length} mesa(s) unidas al grupo`,
                timestamp: payload.timestamp
              });
            }
          }
        });

        socket.on('mesas:separadas', (payload) => {
          if (payload.data && payload.data.mesasSeparadas) {
            const mesasSeparadas = payload.data.mesasSeparadas;
            
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
            );            if (options.onNotification) {
              options.onNotification({
                type: 'info',
                title: 'Mesas Separadas',
                message: `${mesasSeparadas.length} mesa(s) separada(s) del grupo`,
                timestamp: payload.timestamp
              });
            }
          }
        });

                socket.on('notificacion', (payload) => {
          if (options.onNotification) {
            options.onNotification(payload);
          }
        });

                socket.on('mesas:connected-clients', (data) => {
        });

        socket.on('mesa:estado', (data) => {
        });

                socket.on('error', (error) => {
          console.error('[ERROR] Error de socket:', error);
          
          if (options.onNotification) {
            options.onNotification({
              type: 'error',
              message: error.message || 'Error en el socket',
              code: error.code
            });
          }
        });

        socket.on('connect_error', (error) => {
          console.error('[ERROR] Error de conexión:', error.message);
        });

      } catch (error) {
        console.error('[ERROR] Error al inicializar socket:', error);
      }
    };

    initSocket();

        const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {        if (socket && !socket.connected) {
          socket.connect();
        }
      }
      
      appState.current = nextAppState;
    });

        return () => {      if (socket) {
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
        socket.off('mesa:posicion-actualizada');
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
        socket.off('connect_error');              }
      
      subscription?.remove();
    };
  }, []); // Solo se ejecuta al montar y desmontar

    /**
   * Unirse a una sala de mesa específica
   * @param {number} mesaId - ID de la mesa
   */
  const joinMesa = (mesaId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join:mesa', { mesaId });
    } else {
      console.warn('[WARN] Socket no conectado, no se puede unir a mesa');
    }
  };

  /**
   * Salir de una sala de mesa específica
   * @param {number} mesaId - ID de la mesa
   */
  const leaveMesa = (mesaId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave:mesa', { mesaId });
    }
  };

  /**
   * Solicitar el estado actual de una mesa
   * @param {number} mesaId - ID de la mesa
   */
  const getEstadoMesa = (mesaId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mesa:get-estado', { mesaId });
    }
  };

  /**
   * Obtener lista de clientes conectados a la sala de mesas
   */
  const getConnectedClients = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mesas:get-connected-clients');
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
