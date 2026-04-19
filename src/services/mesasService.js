import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';const WS_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

let socket = null;

/**
 * Servicio de mesas con WebSocket y API REST
 * Basado en la documentación del backend: docs/websocket-mesas.md
 */
const mesasService = {
    /**
   * Inicializar conexión WebSocket
   * @returns {Promise<Socket|null>} - Instancia del socket o null si hay error
   */
  async connect() {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.warn('[WARN] No hay token disponible para WebSocket (conexión como invitado)');
      }

      if (socket?.connected) {
        return socket;
      }
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

            socket.on('connect', () => {        socket.emit('join:mesas');
      });

      socket.on('connect_error', (error) => {
        console.error('[ERROR] Error de conexión WebSocket:', error.message);
      });

      socket.on('disconnect', (reason) => {
      });

      socket.on('reconnect', (attemptNumber) => {        socket.emit('join:mesas');
      });

      socket.on('reconnect_error', (error) => {
        console.error('[ERROR] Error de reconexión:', error.message);
      });

      socket.on('reconnect_failed', () => {
        console.error('[ERROR] Falló la reconexión después de todos los intentos');
      });      socket.on('joined:mesas', (data) => {
      });

      socket.on('left:mesas', (data) => {
      });

      socket.on('joined:mesa', (data) => {
      });

      socket.on('left:mesa', (data) => {
      });      socket.on('error', (error) => {
        console.error('[WARN] Error del servidor:', error);
      });

      return socket;
    } catch (error) {
      console.error('[ERROR] Error al conectar WebSocket:', error);
      return null;
    }
  },

  /**
   * Desconectar WebSocket
   */
  disconnect() {
    if (socket) {      socket.emit('leave:mesas');
      
            this.removeAllListeners();      socket.disconnect();
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
      socket.connect();
    }
  },
  /**
   * Unirse a la sala general de mesas
   */
  joinMesas() {
    if (socket && socket.connected) {
      socket.emit('join:mesas');
    } else {
      console.warn('[WARN] Socket no conectado');
    }
  },

  /**
   * Salir de la sala general de mesas
   */
  leaveMesas() {
    if (socket && socket.connected) {
      socket.emit('leave:mesas');
    }
  },

  /**
   * Unirse a una sala de mesa específica
   * @param {number} mesaId - ID de la mesa
   */
  joinMesa(mesaId) {
    if (socket && socket.connected) {
      socket.emit('join:mesa', { mesaId });
    } else {
      console.warn('[WARN] Socket no conectado');
    }
  },

  /**
   * Salir de una sala de mesa específica
   * @param {number} mesaId - ID de la mesa
   */
  leaveMesa(mesaId) {
    if (socket && socket.connected) {
      socket.emit('leave:mesa', { mesaId });
    }
  },

  /**
   * Solicitar lista de clientes conectados a la sala de mesas
   */
  getConnectedClients() {
    if (socket && socket.connected) {
      socket.emit('mesas:get-connected-clients');
    }
  },

  /**
   * Solicitar estado actual de una mesa
   * @param {number} mesaId - ID de la mesa
   */
  getEstadoMesa(mesaId) {
    if (socket && socket.connected) {
      socket.emit('mesa:get-estado', { mesaId });
    }
  },
  /**
   * Escuchar evento de mesa creada
   * @param {Function} callback - Función que recibe el payload: { message, data, timestamp }
   */
  onMesaCreada(callback) {
    if (!socket) {
      console.warn('[WARN] Socket no inicializado');
      return;
    }
    socket.on('mesa:creada', (payload) => {
      callback(payload);
    });
  },

  /**
   * Escuchar evento de mesa actualizada
   * @param {Function} callback - Función que recibe el payload: { message, data, timestamp }
   */
  onMesaActualizada(callback) {
    if (!socket) {
      console.warn('[WARN] Socket no inicializado');
      return;
    }
    socket.on('mesa:actualizada', (payload) => {
      callback(payload);
    });
  },

  /**
   * Escuchar evento de mesa eliminada
   * @param {Function} callback - Función que recibe el payload: { message, data: { id }, timestamp }
   */
  onMesaEliminada(callback) {
    if (!socket) {
      console.warn('[WARN] Socket no inicializado');
      return;
    }
    socket.on('mesa:eliminada', (payload) => {
      callback(payload);
    });
  },

  /**
   * Escuchar evento de estado de mesa cambiado
   * @param {Function} callback - Función que recibe el payload: { message, data: { id, estado }, timestamp }
   */
  onMesaEstadoCambiado(callback) {
    if (!socket) {
      console.warn('[WARN] Socket no inicializado');
      return;
    }
    socket.on('mesa:estado-cambiado', (payload) => {
      callback(payload);
    });
  },

  /**
   * Escuchar evento para recargar todas las mesas
   * @param {Function} callback - Función que se ejecuta cuando se debe refrescar
   */
  onMesasActualizar(callback) {
    if (!socket) {
      console.warn('[WARN] Socket no inicializado');
      return;
    }
    socket.on('mesas:actualizar', (payload) => {
      callback(payload);
    });
  },

  /**
   * Escuchar notificaciones generales
   * @param {Function} callback - Función que recibe el payload: { message, type, timestamp }
   */
  onNotificacion(callback) {
    if (!socket) {
      console.warn('[WARN] Socket no inicializado');
      return;
    }
    socket.on('notificacion', (payload) => {
      callback(payload);
    });
  },

  /**
   * Escuchar respuesta de clientes conectados
   * @param {Function} callback - Función que recibe el payload: { count, clients }
   */
  onConnectedClients(callback) {
    if (!socket) {
      console.warn('[WARN] Socket no inicializado');
      return;
    }
    socket.on('mesas:connected-clients', (data) => {
      callback(data);
    });
  },

  /**
   * Escuchar respuesta de estado de mesa
   * @param {Function} callback - Función que recibe el payload: { mesaId, message, timestamp }
   */
  onMesaEstado(callback) {
    if (!socket) {
      console.warn('[WARN] Socket no inicializado');
      return;
    }
    socket.on('mesa:estado', (data) => {
      callback(data);
    });
  },

  /**
   * Escuchar errores del servidor
   * @param {Function} callback - Función que recibe el error: { message, code }
   */
  onError(callback) {
    if (!socket) {
      console.warn('[WARN] Socket no inicializado');
      return;
    }
    socket.on('error', (error) => {
      console.error('[WARN] Error del servidor:', error);
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
    }
  },

    /**
   * Obtener todas las mesas
   */
  async getMesas() {
    try {
      const response = await api.get('/mesas');
      return response.data.data || [];
    } catch (error) {
      console.error('[ERROR] Error al obtener mesas:', error.message);
      throw error;
    }
  },

  /**
   * Obtener una mesa por ID
   */
  async getMesaById(id) {
    try {
      const response = await api.get(`/mesas/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('[ERROR] Error al obtener mesa:', error.message);
      throw error;
    }
  },

  /**
   * Crear una nueva mesa
   */
  async createMesa(nombre) {
    try {
      const response = await api.post('/mesas', { nombre });
      return response.data.data;
    } catch (error) {
      console.error('[ERROR] Error al crear mesa:', error.message);
      throw error;
    }
  },

  /**
   * Actualizar una mesa
   */
  async updateMesa(id, nombre) {
    try {
      const response = await api.put(`/mesas/${id}`, { nombre });
      return response.data.data;
    } catch (error) {
      console.error('[ERROR] Error al actualizar mesa:', error.message);
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
      const payload = idCliente ? { idCliente } : {};
      const response = await api.post(`/mesas/${mesaId}/ocupar`, payload);
      return response.data;
    } catch (error) {
      console.error('[ERROR] Error al ocupar mesa:', error.message);
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
      const response = await api.post(`/mesas/${mesaId}/liberar`);
      return response.data;
    } catch (error) {
      console.error('[ERROR] Error al liberar mesa:', error.message);
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
      const response = await api.patch(`/mesas/${mesaId}/estado`, { estado });
      return response.data;
    } catch (error) {
      console.error('[ERROR] Error al cambiar estado de mesa:', error.message);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de mesas
   * @returns {Promise<Object>} - { disponibles, ocupadas, reservadas, total, fueraDeServicio }
   */
  async getEstadisticas() {
    try {
      const response = await api.get('/mesas/estadisticas/resumen');
      return response.data;
    } catch (error) {
      console.error('[ERROR] Error al obtener estadísticas:', error.message);
      throw error;
    }
  },

  /**
   * Eliminar una mesa
   */
  async deleteMesa(id) {
    try {
      const response = await api.delete(`/mesas/${id}`);
      return response.data;
    } catch (error) {
      console.error('[ERROR] Error al eliminar mesa:', error.message);
      throw error;
    }
  },

  /**
   * Actualizar posición de una mesa
   */
  async actualizarPosicionMesa(idMesa, posX, posY) {
    try {
      const response = await api.patch(`/mesas/${idMesa}/posicion`, {
        posX,
        posY
      });
      return response.data;
    } catch (error) {
      console.error('[ERROR] Error al actualizar posición:', error);
      throw error;
    }
  },


  /**
   * Obtener todos los grupos de mesas
   */
  async getGrupos() {
    try {      try {
        const response = await api.get('/mesas-grupo');
        return response.data.data || response.data || [];
      } catch (error1) {
        const response = await api.get('/mesas-grupo/grupos');
        return response.data.data || response.data || [];
      }
    } catch (error) {
      console.error('[ERROR] Error al obtener grupos:', error.message);
      throw error;
    }
  },

  /**
   * Crear un grupo de mesas
   */
  async createGrupo(nombre, mesasIds) {
    try {
      const response = await api.post('/mesas-grupo/grupos', { 
        nombre, 
        mesas: mesasIds 
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('[ERROR] Error al crear grupo:', error.message);
      console.error('[ERROR] Detalles:', error.response?.data);
      throw error;
    }
  },

  /**
   * Disolver un grupo
   */
  async deleteGrupo(id) {
    try {
      const response = await api.delete(`/mesas-grupo/grupos/${id}`);
      return response.data;
    } catch (error) {
      console.error('[ERROR] Error al disolver grupo:', error.message);
      throw error;
    }
  },

  /**
   * Actualizar mesas de un grupo (agregar o remover)
   * Usa el nuevo endpoint PATCH optimizado
   */
  async actualizarMesasGrupo(grupoId, { agregar = [], remover = [] }) {
    try {
      const response = await api.patch(`/mesas-grupo/grupos/${grupoId}/mesas`, {
        agregar,
        remover
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('[ERROR] Error al actualizar grupo:', error.message);
      console.error('[ERROR] Detalles:', error.response?.data);
      throw error;
    }
  },

  /**
   * Remover mesas específicas de un grupo
   * Si solo queda 1 mesa después de remover, disuelve el grupo
   * Si quedan 2+ mesas, usa el endpoint PATCH para actualizar
   */
  async removerMesasDeGrupo(grupoId, mesasIdsARemover, todasLasMesasDelGrupo, nombreGrupo) {
    try {
            const mesasRestantes = todasLasMesasDelGrupo.filter(id => !mesasIdsARemover.includes(id));      if (mesasRestantes.length < 2) {
        return await this.deleteGrupo(grupoId);
      }      return await this.actualizarMesasGrupo(grupoId, { remover: mesasIdsARemover });
      
    } catch (error) {
      console.error('[ERROR] Error al remover mesas del grupo:', error.message);
      throw error;
    }
  },

  /**
   * Actualizar el estado de una mesa (DISPONIBLE, OCUPADA, etc.)
   * @param {number} idMesa - ID de la mesa
   * @param {string} estado - Nuevo estado ('DISPONIBLE', 'OCUPADA', 'RESERVADA', 'FUERA_DE_SERVICIO')
   * @returns {Promise<Object>} - Mesa actualizada
   */
  async actualizarEstado(idMesa, estado) {
    try {
      const response = await api.patch(`/mesas/${idMesa}`, { estado });
      return response.data;
    } catch (error) {
      console.error('[ERROR] Error al actualizar estado:', error.message);
      throw error;
    }
  },
};

export default mesasService;
