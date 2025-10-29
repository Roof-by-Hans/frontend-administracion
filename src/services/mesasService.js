import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// URL del servidor (sin /api para WebSocket)
const WS_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

let socket = null;

/**
 * Servicio de mesas con WebSocket y API REST
 * Basado en la documentación del backend: docs/websocket-mesas.md
 */
const mesasService = {
  // ==================== GESTIÓN DE CONEXIÓN ====================

  /**
   * Inicializar conexión WebSocket
   * @returns {Promise<Socket|null>} - Instancia del socket o null si hay error
   */
  async connect() {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.warn('⚠️ No hay token disponible para WebSocket (conexión como invitado)');
      }

      if (socket?.connected) {
        console.log('✅ Socket ya está conectado');
        return socket;
      }

      console.log('🔌 Conectando WebSocket a:', WS_BASE_URL);

      socket = io(WS_BASE_URL, {
        auth: {
          token: token || null // Permitir conexión sin token (invitado)
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
      });

      // Eventos de conexión
      socket.on('connect', () => {
        console.log('✅ WebSocket conectado:', socket.id);
        // Unirse automáticamente a la sala de mesas
        socket.emit('join:mesas');
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Error de conexión WebSocket:', error.message);
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket desconectado:', reason);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 WebSocket reconectado después de', attemptNumber, 'intentos');
        // Re-unirse a la sala después de reconectar
        socket.emit('join:mesas');
      });

      socket.on('reconnect_error', (error) => {
        console.error('❌ Error de reconexión:', error.message);
      });

      socket.on('reconnect_failed', () => {
        console.error('❌ Falló la reconexión después de todos los intentos');
      });

      // Confirmaciones de sala
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

      // Manejo de errores
      socket.on('error', (error) => {
        console.error('⚠️ Error del servidor:', error);
      });

      return socket;
    } catch (error) {
      console.error('❌ Error al conectar WebSocket:', error);
      return null;
    }
  },

  /**
   * Desconectar WebSocket
   */
  disconnect() {
    if (socket) {
      console.log('🔌 Desconectando WebSocket...');
      
      // Salir de la sala antes de desconectar
      socket.emit('leave:mesas');
      
      // Remover todos los listeners
      this.removeAllListeners();
      
      // Desconectar
      socket.disconnect();
      socket = null;
    }
  },

  /**
   * Verificar si está conectado
   * @returns {boolean} - true si está conectado, false en caso contrario
   */
  isConnected() {
    return socket?.connected || false;
  },

  /**
   * Obtener instancia del socket
   * @returns {Socket|null} - Instancia del socket o null
   */
  getSocket() {
    return socket;
  },

  /**
   * Forzar reconexión
   */
  reconnect() {
    if (socket && !socket.connected) {
      console.log('🔄 Reconectando socket...');
      socket.connect();
    }
  },

  // ==================== EMITIR EVENTOS (CLIENT -> SERVER) ====================

  /**
   * Unirse a la sala general de mesas
   */
  joinMesas() {
    if (socket && socket.connected) {
      console.log('📥 Uniéndose a sala de mesas...');
      socket.emit('join:mesas');
    } else {
      console.warn('⚠️ Socket no conectado');
    }
  },

  /**
   * Salir de la sala general de mesas
   */
  leaveMesas() {
    if (socket && socket.connected) {
      console.log('📤 Saliendo de sala de mesas...');
      socket.emit('leave:mesas');
    }
  },

  /**
   * Unirse a una sala de mesa específica
   * @param {number} mesaId - ID de la mesa
   */
  joinMesa(mesaId) {
    if (socket && socket.connected) {
      console.log('📥 Uniéndose a mesa:', mesaId);
      socket.emit('join:mesa', { mesaId });
    } else {
      console.warn('⚠️ Socket no conectado');
    }
  },

  /**
   * Salir de una sala de mesa específica
   * @param {number} mesaId - ID de la mesa
   */
  leaveMesa(mesaId) {
    if (socket && socket.connected) {
      console.log('📤 Saliendo de mesa:', mesaId);
      socket.emit('leave:mesa', { mesaId });
    }
  },

  /**
   * Solicitar lista de clientes conectados a la sala de mesas
   */
  getConnectedClients() {
    if (socket && socket.connected) {
      console.log('👥 Solicitando clientes conectados...');
      socket.emit('mesas:get-connected-clients');
    }
  },

  /**
   * Solicitar estado actual de una mesa
   * @param {number} mesaId - ID de la mesa
   */
  getEstadoMesa(mesaId) {
    if (socket && socket.connected) {
      console.log('📊 Solicitando estado de mesa:', mesaId);
      socket.emit('mesa:get-estado', { mesaId });
    }
  },

  // ==================== ESCUCHAR EVENTOS (SERVER -> CLIENT) ====================

  /**
   * Escuchar evento de mesa creada
   * @param {Function} callback - Función que recibe el payload: { message, data, timestamp }
   */
  onMesaCreada(callback) {
    if (!socket) {
      console.warn('⚠️ Socket no inicializado');
      return;
    }
    socket.on('mesa:creada', (payload) => {
      console.log('🆕 Mesa creada:', payload);
      callback(payload);
    });
  },

  /**
   * Escuchar evento de mesa actualizada
   * @param {Function} callback - Función que recibe el payload: { message, data, timestamp }
   */
  onMesaActualizada(callback) {
    if (!socket) {
      console.warn('⚠️ Socket no inicializado');
      return;
    }
    socket.on('mesa:actualizada', (payload) => {
      console.log('🔄 Mesa actualizada:', payload);
      callback(payload);
    });
  },

  /**
   * Escuchar evento de mesa eliminada
   * @param {Function} callback - Función que recibe el payload: { message, data: { id }, timestamp }
   */
  onMesaEliminada(callback) {
    if (!socket) {
      console.warn('⚠️ Socket no inicializado');
      return;
    }
    socket.on('mesa:eliminada', (payload) => {
      console.log('🗑️ Mesa eliminada:', payload);
      callback(payload);
    });
  },

  /**
   * Escuchar evento de estado de mesa cambiado
   * @param {Function} callback - Función que recibe el payload: { message, data: { id, estado }, timestamp }
   */
  onMesaEstadoCambiado(callback) {
    if (!socket) {
      console.warn('⚠️ Socket no inicializado');
      return;
    }
    socket.on('mesa:estado-cambiado', (payload) => {
      console.log('🔄 Estado de mesa cambió:', payload);
      callback(payload);
    });
  },

  /**
   * Escuchar evento para recargar todas las mesas
   * @param {Function} callback - Función que se ejecuta cuando se debe refrescar
   */
  onMesasActualizar(callback) {
    if (!socket) {
      console.warn('⚠️ Socket no inicializado');
      return;
    }
    socket.on('mesas:actualizar', (payload) => {
      console.log('🔄 Solicitud de actualización masiva:', payload);
      callback(payload);
    });
  },

  /**
   * Escuchar notificaciones generales
   * @param {Function} callback - Función que recibe el payload: { message, type, timestamp }
   */
  onNotificacion(callback) {
    if (!socket) {
      console.warn('⚠️ Socket no inicializado');
      return;
    }
    socket.on('notificacion', (payload) => {
      console.log('🔔 Notificación:', payload);
      callback(payload);
    });
  },

  /**
   * Escuchar respuesta de clientes conectados
   * @param {Function} callback - Función que recibe el payload: { count, clients }
   */
  onConnectedClients(callback) {
    if (!socket) {
      console.warn('⚠️ Socket no inicializado');
      return;
    }
    socket.on('mesas:connected-clients', (data) => {
      console.log('👥 Clientes conectados:', data);
      callback(data);
    });
  },

  /**
   * Escuchar respuesta de estado de mesa
   * @param {Function} callback - Función que recibe el payload: { mesaId, message, timestamp }
   */
  onMesaEstado(callback) {
    if (!socket) {
      console.warn('⚠️ Socket no inicializado');
      return;
    }
    socket.on('mesa:estado', (data) => {
      console.log('📊 Estado de mesa:', data);
      callback(data);
    });
  },

  /**
   * Escuchar errores del servidor
   * @param {Function} callback - Función que recibe el error: { message, code }
   */
  onError(callback) {
    if (!socket) {
      console.warn('⚠️ Socket no inicializado');
      return;
    }
    socket.on('error', (error) => {
      console.error('⚠️ Error del servidor:', error);
      callback(error);
    });
  },

  /**
   * Remover un listener específico
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Callback a remover (opcional)
   */
  off(event, callback) {
    if (socket) {
      if (callback) {
        socket.off(event, callback);
      } else {
        socket.off(event);
      }
    }
  },

  /**
   * Remover todos los listeners de eventos de mesas
   */
  removeAllListeners() {
    if (socket) {
      socket.off('mesa:creada');
      socket.off('mesa:actualizada');
      socket.off('mesa:estado-cambiado');
      socket.off('mesa:eliminada');
      socket.off('mesas:actualizar');
      socket.off('notificacion');
      socket.off('mesas:connected-clients');
      socket.off('mesa:estado');
      socket.off('joined:mesas');
      socket.off('left:mesas');
      socket.off('joined:mesa');
      socket.off('left:mesa');
      socket.off('error');
      console.log('🔇 Todos los listeners removidos');
    }
  },

  // ==================== API REST ====================

  /**
   * Obtener todas las mesas
   */
  async getMesas() {
    try {
      console.log('📥 Obteniendo todas las mesas...');
      const response = await api.get('/mesas');
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Error al obtener mesas:', error.message);
      throw error;
    }
  },

  /**
   * Obtener una mesa por ID
   */
  async getMesaById(id) {
    try {
      console.log('📥 Obteniendo mesa:', id);
      const response = await api.get(`/mesas/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error al obtener mesa:', error.message);
      throw error;
    }
  },

  /**
   * Crear una nueva mesa
   */
  async createMesa(nombre) {
    try {
      console.log('📤 Creando mesa:', nombre);
      const response = await api.post('/mesas', { nombre });
      return response.data.data;
    } catch (error) {
      console.error('❌ Error al crear mesa:', error.message);
      throw error;
    }
  },

  /**
   * Actualizar una mesa
   */
  async updateMesa(id, nombre) {
    try {
      console.log('📤 Actualizando mesa:', id, nombre);
      const response = await api.put(`/mesas/${id}`, { nombre });
      return response.data.data;
    } catch (error) {
      console.error('❌ Error al actualizar mesa:', error.message);
      throw error;
    }
  },

  /**
   * Ocupar una mesa (crear pedido)
   * @param {number} mesaId - ID de la mesa
   * @param {number} idCliente - ID del cliente (opcional)
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async ocuparMesa(mesaId, idCliente = null) {
    try {
      console.log('📤 Ocupando mesa:', mesaId, idCliente ? `con cliente ${idCliente}` : 'sin cliente');
      const payload = idCliente ? { idCliente } : {};
      const response = await api.post(`/mesas/${mesaId}/ocupar`, payload);
      return response.data;
    } catch (error) {
      console.error('❌ Error al ocupar mesa:', error.message);
      throw error;
    }
  },

  /**
   * Liberar una mesa (finalizar pedido/pago)
   * @param {number} mesaId - ID de la mesa
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async liberarMesa(mesaId) {
    try {
      console.log('📤 Liberando mesa:', mesaId);
      const response = await api.post(`/mesas/${mesaId}/liberar`);
      return response.data;
    } catch (error) {
      console.error('❌ Error al liberar mesa:', error.message);
      throw error;
    }
  },

  /**
   * Cambiar el estado de una mesa manualmente
   * @param {number} mesaId - ID de la mesa
   * @param {string} estado - Estado: 'DISPONIBLE', 'OCUPADA', 'RESERVADA', 'FUERA_DE_SERVICIO'
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  async cambiarEstadoMesa(mesaId, estado) {
    try {
      console.log('📤 Cambiando estado de mesa:', mesaId, 'a', estado);
      const response = await api.patch(`/mesas/${mesaId}/estado`, { estado });
      return response.data;
    } catch (error) {
      console.error('❌ Error al cambiar estado de mesa:', error.message);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de mesas
   * @returns {Promise<Object>} - { disponibles, ocupadas, reservadas, total, fueraDeServicio }
   */
  async getEstadisticas() {
    try {
      console.log('📊 Obteniendo estadísticas de mesas...');
      const response = await api.get('/mesas/estadisticas/resumen');
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error.message);
      throw error;
    }
  },

  /**
   * Eliminar una mesa
   */
  async deleteMesa(id) {
    try {
      console.log('📤 Eliminando mesa:', id);
      const response = await api.delete(`/mesas/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error al eliminar mesa:', error.message);
      throw error;
    }
  },

  /**
   * Obtener todos los grupos
   */
  async getGrupos() {
    try {
      console.log('📥 Obteniendo grupos...');
      const response = await api.get('/mesas-grupo/grupos');
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Error al obtener grupos:', error.message);
      throw error;
    }
  },

  /**
   * Crear un grupo de mesas
   */
  /**
   * Crear un grupo de mesas
   */
  async createGrupo(nombre, mesasIds) {
    try {
      console.log('📤 Creando grupo:', nombre, mesasIds);
      const response = await api.post('/mesas-grupo', { nombre, mesas: mesasIds });
      return response.data.data;
    } catch (error) {
      console.error('❌ Error al crear grupo:', error.message);
      throw error;
    }
  },

  /**
   * Obtener todos los grupos
   */
  async getGrupos() {
    try {
      console.log('📥 Obteniendo grupos...');
      const response = await api.get('/mesas-grupo');
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Error al obtener grupos:', error.message);
      throw error;
    }
  },

  /**
   * Disolver un grupo
   */
  async deleteGrupo(id) {
    try {
      console.log('📤 Disolviendo grupo:', id);
      const response = await api.delete(`/mesas-grupo/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error al disolver grupo:', error.message);
      throw error;
    }
  },
};

export default mesasService;
