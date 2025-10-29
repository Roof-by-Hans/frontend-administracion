import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// URL del servidor (sin /api para WebSocket)
const WS_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

let socket = null;

/**
 * Servicio de mesas con WebSocket y API REST
 */
const mesasService = {
  /**
   * Inicializar conexión WebSocket
   */
  async connect() {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.error('❌ No hay token disponible para WebSocket');
        return null;
      }

      if (socket?.connected) {
        console.log('✅ Socket ya está conectado');
        return socket;
      }

      console.log('🔌 Conectando WebSocket a:', WS_BASE_URL);

      socket = io(WS_BASE_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      // Eventos de conexión
      socket.on('connect', () => {
        console.log('✅ WebSocket conectado:', socket.id);
        // Unirse a la sala de mesas
        socket.emit('join:mesas');
        console.log('📡 Unido a sala de mesas');
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
      console.log('🔌 Desconectando WebSocket');
      socket.disconnect();
      socket = null;
    }
  },

  /**
   * Verificar si está conectado
   */
  isConnected() {
    return socket?.connected || false;
  },

  /**
   * Obtener instancia del socket
   */
  getSocket() {
    return socket;
  },

  /**
   * Escuchar evento de mesa creada
   * @param {Function} callback - Función que recibe los datos de la mesa creada
   */
  onMesaCreada(callback) {
    if (!socket) {
      console.warn('⚠️ Socket no inicializado');
      return;
    }
    socket.on('mesa:creada', (data) => {
      console.log('📡 Mesa creada:', data);
      callback(data);
    });
  },

  /**
   * Escuchar evento de mesa actualizada
   * @param {Function} callback - Función que recibe los datos de la mesa actualizada
   */
  onMesaActualizada(callback) {
    if (!socket) {
      console.warn('⚠️ Socket no inicializado');
      return;
    }
    socket.on('mesa:actualizada', (data) => {
      console.log('📡 Mesa actualizada:', data);
      callback(data);
    });
  },

  /**
   * Escuchar evento de estado de mesa cambiado
   * @param {Function} callback - Función que recibe los datos del cambio de estado
   */
  onMesaEstadoCambiado(callback) {
    if (!socket) {
      console.warn('⚠️ Socket no inicializado');
      return;
    }
    socket.on('mesa:estado-cambiado', (data) => {
      console.log('📡 Estado de mesa cambió:', data);
      callback(data);
    });
  },

  /**
   * Escuchar evento de mesa eliminada
   * @param {Function} callback - Función que recibe el ID de la mesa eliminada
   */
  onMesaEliminada(callback) {
    if (!socket) {
      console.warn('⚠️ Socket no inicializado');
      return;
    }
    socket.on('mesa:eliminada', (data) => {
      console.log('📡 Mesa eliminada:', data);
      callback(data);
    });
  },

  /**
   * Escuchar evento para recargar todas las mesas
   * @param {Function} callback - Función que se ejecuta cuando se deben recargar las mesas
   */
  onMesasActualizar(callback) {
    if (!socket) {
      console.warn('⚠️ Socket no inicializado');
      return;
    }
    socket.on('mesas:actualizar', () => {
      console.log('📡 Recargar todas las mesas');
      callback();
    });
  },

  /**
   * Remover todos los listeners de eventos
   */
  removeAllListeners() {
    if (socket) {
      socket.off('mesa:creada');
      socket.off('mesa:actualizada');
      socket.off('mesa:estado-cambiado');
      socket.off('mesa:eliminada');
      socket.off('mesas:actualizar');
      console.log('🔇 Listeners removidos');
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
  async createGrupo(nombre, mesasIds) {
    try {
      console.log('📤 Creando grupo:', nombre, mesasIds);
      const response = await api.post('/mesas-grupo/grupos', { nombre, mesasIds });
      return response.data.data;
    } catch (error) {
      console.error('❌ Error al crear grupo:', error.message);
      throw error;
    }
  },

  /**
   * Disolver un grupo
   */
  async deleteGrupo(id) {
    try {
      console.log('📤 Disolviendo grupo:', id);
      const response = await api.delete(`/mesas-grupo/grupos/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error al disolver grupo:', error.message);
      throw error;
    }
  },
};

export default mesasService;
