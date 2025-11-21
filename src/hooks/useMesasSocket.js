import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import Alert from "@blazejkustra/react-native-alert";
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

        // ==================== EVENTO PRINCIPAL: LISTA COMPLETA ====================
        
        /**
         * Evento principal que se emite:
         * 1. Automáticamente al hacer join:mesas
         * 2. Automáticamente al crear/disolver grupos
         * 3. Cada vez que hay cambios importantes en mesas
         * 
         * Esto reemplaza la necesidad de hacer polling o requests adicionales
         */
        socket.on('mesas:lista-completa', (payload) => {
          console.log('═══════════════════════════════════════');
          console.log('📋 EVENTO: mesas:lista-completa RECIBIDO');
          console.log('📊 Total de mesas:', payload.data?.length || 0);
          console.log('📊 Timestamp:', payload.timestamp);
          console.log('📦 Payload completo:', JSON.stringify(payload, null, 2));
          console.log('═══════════════════════════════════════');
          
          if (payload.data && Array.isArray(payload.data)) {
            // Log de mesas con grupos del backend
            const mesasConGrupo = payload.data.filter(m => m.grupo);
            console.log('🔗 Mesas con grupo en payload:', mesasConGrupo.length);
            mesasConGrupo.forEach(m => {
              console.log(`   - Mesa ${m.idMesa} (${m.nombreMesa}):`, {
                grupo: m.grupo,
                idMesa: m.idMesa
              });
            });
            
            // Transformar la estructura del backend al formato del frontend
            const mesasTransformadas = payload.data.map((mesa, index) => {
              // Mapear estados del backend a estados locales
              const estadoMap = {
                'DISPONIBLE': 'libre',
                'OCUPADA': 'ocupada',
                'RESERVADA': 'reservada',
                'FUERA_DE_SERVICIO': 'fuera_servicio'
              };
              const estadoLocal = estadoMap[mesa.estado] || 'libre';

              // Extraer información del grupo si existe
              const grupoInfo = mesa.grupo ? {
                id: mesa.grupo.id,
                nombre: mesa.grupo.nombre
              } : null;

              // Si hay grupo, unidaCon contendrá los IDs de otras mesas del grupo
              // (esto lo calcularemos después con todas las mesas)
              
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
            });

            // Segundo paso: calcular unidaCon para cada mesa en grupo
            mesasTransformadas.forEach(mesa => {
              if (mesa.grupo) {
                // Encontrar todas las mesas con el mismo grupo (usar numero local, no idMesa)
                const mesasDelMismoGrupo = mesasTransformadas
                  .filter(m => m.grupo === mesa.grupo && m.numero !== mesa.numero)
                  .map(m => m.numero);
                
                mesa.unidaCon = mesasDelMismoGrupo;
                
                console.log(`🔗 Mesa ${mesa.numero} en grupo ${mesa.grupo}, unida con:`, mesasDelMismoGrupo);
              }
            });

            console.log('✅ Mesas transformadas:', mesasTransformadas.length);
            console.log('📊 Mesas en grupos:', mesasTransformadas.filter(m => m.grupo).length);
            console.log('📋 Detalle de grupos:', mesasTransformadas
              .filter(m => m.grupo)
              .map(m => ({
                numero: m.numero,
                nombre: m.nombre,
                grupo: m.grupo,
                nombreGrupo: m.nombreGrupo,
                unidaCon: m.unidaCon
              }))
            );
            
            // FUSIONAR con el estado existente para mantener posiciones actualizadas
            setMesas(prev => {
              console.log('🔄 Fusionando mesas:lista-completa con estado actual');
              console.log('   Mesas actuales:', prev.length);
              console.log('   Mesas del backend:', mesasTransformadas.length);
              
              // Crear un mapa de mesas existentes por ID
              const mesasExistentesMap = new Map();
              prev.forEach(mesa => {
                mesasExistentesMap.set(mesa.idMesa || mesa.numero, mesa);
              });
              
              // Fusionar: usar posición existente si la mesa ya está en el estado
              const mesasFusionadas = mesasTransformadas.map(mesaBackend => {
                const mesaExistente = mesasExistentesMap.get(mesaBackend.idMesa);
                if (mesaExistente) {
                  // Mesa ya existe - mantener su posición actual
                  console.log(`   🔄 Mesa ${mesaBackend.numero} - MANTENIENDO posición:`, mesaExistente.posicion);
                  return {
                    ...mesaBackend,
                    posicion: mesaExistente.posicion // Mantener posición actual
                  };
                }
                // Mesa nueva - usar posición del backend
                console.log(`   ➕ Mesa ${mesaBackend.numero} - NUEVA con posición:`, mesaBackend.posicion);
                return mesaBackend;
              });
              
              console.log('   Resultado fusionado:', mesasFusionadas.length, 'mesas');
              return mesasFusionadas;
            });

            // Notificar al callback si existe
            if (options.onRefreshRequest) {
              console.log('🔔 Notificando actualización de lista completa');
            }
          }
        });

        // ==================== EVENTOS DE MESAS INDIVIDUALES ====================

        socket.on('mesa:creada', (payload) => {
          console.log('🆕 Mesa creada desde WebSocket:', payload.data);
          
          if (payload.data) {
            // Transformar datos del backend al formato frontend
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
            
            console.log('📍 Mesa transformada con posición:', mesaTransformada.posicion);
            
            // Verificar si ya existe (evitar duplicados de actualización optimista)
            setMesas(prev => {
              const existe = prev.some(m => m.idMesa === mesa.idMesa || m.numero === mesa.idMesa);
              if (existe) {
                console.log('⚠️ Mesa ya existe en el estado, actualizando...');
                return prev.map(m => 
                  m.idMesa === mesa.idMesa || m.numero === mesa.idMesa 
                    ? { ...m, ...mesaTransformada } 
                    : m
                );
              }
              console.log('➕ Agregando nueva mesa al estado');
              return [...prev, mesaTransformada];
            });
            
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

        // Escuchar actualización de posición en tiempo real
        socket.on('mesa:posicion-actualizada', (payload) => {
          console.log('🔥 WEBSOCKET RECIBIDO: mesa:posicion-actualizada');
          console.log('📍 Payload completo:', JSON.stringify(payload));
          
          // El backend envía: { message, data: { idMesa, posX, posY, mesa }, timestamp }
          const data = payload.data || payload;
          console.log('📍 idMesa:', data.idMesa, 'posX:', data.posX, 'posY:', data.posY);
          
          setMesas((prevMesas) => {
            console.log('📍 Mesas actuales antes de actualizar:', prevMesas.length);
            const mesasActualizadas = prevMesas.map((mesa) => {
              if (mesa.idMesa === data.idMesa) {
                console.log(`✅ Actualizando mesa ${mesa.idMesa} de pos (${mesa.posicion?.x}, ${mesa.posicion?.y}) a (${data.posX}, ${data.posY})`);
                return { ...mesa, posicion: { x: data.posX, y: data.posY } };
              }
              return mesa;
            });
            console.log('📍 Mesas después de actualizar:', mesasActualizadas.length);
            return mesasActualizadas;
          });
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
              // Primero encontrar la mesa que cambió
              const mesaCambiada = prev.find(m => 
                m.idMesa === payload.data.id || m.numero === payload.data.id
              );

              if (!mesaCambiada) {
                console.warn('⚠️ Mesa no encontrada:', payload.data.id);
                return prev;
              }

              // Si la mesa está en un grupo, obtener todas las mesas del grupo
              const mesasDelGrupo = mesaCambiada.grupo 
                ? prev.filter(m => m.grupo === mesaCambiada.grupo).map(m => m.numero)
                : [mesaCambiada.numero];

              console.log('📊 Actualizando estado a', estadoLocal, 'para mesas:', mesasDelGrupo);

              const nuevasMesas = prev.map(mesa => {
                // Actualizar la mesa que cambió Y todas las mesas de su grupo
                if (mesasDelGrupo.includes(mesa.numero)) {
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
          console.log('📦 Payload completo:', JSON.stringify(payload, null, 2));
          
          if (payload.data && payload.data.mesas) {
            const grupoId = payload.data.id;
            // Usar idMesa o id dependiendo de qué campo envía el backend
            const mesasDelGrupoBackend = payload.data.mesas.map(m => m.idMesa || m.id);
            
            console.log('📊 Grupo ID:', grupoId);
            console.log('📊 Mesas del grupo (IDs backend):', mesasDelGrupoBackend);
            
            // Actualizar las mesas para reflejar que están en un grupo
            setMesas(prev => {
              console.log('📋 Estado actual de mesas antes de actualizar:', prev.map(m => ({
                numero: m.numero,
                idMesa: m.idMesa,
                nombre: m.nombre,
                grupo: m.grupo,
                estado: m.estado
              })));

              const nuevasMesas = prev.map(mesa => {
                // Verificar si esta mesa está en el grupo usando ambos IDs
                const estaEnGrupo = mesasDelGrupoBackend.includes(mesa.idMesa) || 
                                   mesasDelGrupoBackend.includes(mesa.numero);
                
                if (estaEnGrupo) {
                  // Encontrar las otras mesas del grupo en el estado local
                  const otrasMesasLocal = prev
                    .filter(m => {
                      const estaOtraEnGrupo = mesasDelGrupoBackend.includes(m.idMesa) || 
                                             mesasDelGrupoBackend.includes(m.numero);
                      return estaOtraEnGrupo && m.numero !== mesa.numero;
                    })
                    .map(m => m.numero);
                  
                  console.log(`✅ Mesa ${mesa.numero} (ID: ${mesa.idMesa}) ahora en grupo ${grupoId}`);
                  console.log(`   Unida con mesas (números locales):`, otrasMesasLocal);
                  console.log(`   🔒 MANTENIENDO posición actual:`, mesa.posicion);
                  console.log(`   Estado actual: ${mesa.estado}`);
                  
                  return {
                    ...mesa,
                    grupo: grupoId,
                    unidaCon: otrasMesasLocal,
                    nombreGrupo: payload.data.nombre
                    // ⚠️ NO tocar mesa.posicion ni mesa.estado - se mantiene el actual
                    // El estado se actualiza a "ocupada" solo cuando se transfieren pedidos
                  };
                }
                return mesa;
              });

              console.log('📋 Estado de mesas después de actualizar:', nuevasMesas.map(m => ({
                numero: m.numero,
                idMesa: m.idMesa,
                nombre: m.nombre,
                grupo: m.grupo,
                unidaCon: m.unidaCon,
                estado: m.estado
              })));

              return nuevasMesas;
            });

            // Notificación visual más detallada
            if (options.onNotification) {
              options.onNotification({
                type: 'success',
                title: '✅ Grupo Creado',
                message: `"${payload.data.nombre}" con ${payload.data.mesas.length} mesa(s)`,
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

            // Log en consola
            console.log(`ℹ️ Grupo Disuelto: ${mesasLiberadas.length} mesa(s) liberada(s)`);
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

            // Notificación visual
            if (options.onNotification) {
              options.onNotification({
                type: 'success',
                title: '🔗 Mesas Unidas',
                message: `${mesasUnidas.length} mesa(s) unidas al grupo`,
                timestamp: payload.timestamp
              });
            }
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

            // Notificación visual
            if (options.onNotification) {
              options.onNotification({
                type: 'info',
                title: '✂️ Mesas Separadas',
                message: `${mesasSeparadas.length} mesa(s) separada(s) del grupo`,
                timestamp: payload.timestamp
              });
            }
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
