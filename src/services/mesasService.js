import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
const WS_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

let socket = null;


const mesasService = {
    
  async connect() {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
      }

      if (socket?.connected) {
        return socket;
      }
      socket = io(WS_BASE_URL, {
        auth: {
          token: token || null 
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
      });

            socket.on('connect', () => {
        socket.emit('join:mesas');
      });

      socket.on('connect_error', (error) => {
      });

      socket.on('disconnect', (reason) => {
      });

      socket.on('reconnect', (attemptNumber) => {
        socket.emit('join:mesas');
      });

      socket.on('reconnect_error', (error) => {
      });

      socket.on('reconnect_failed', () => {
      });
      socket.on('joined:mesas', (data) => {
      });

      socket.on('left:mesas', (data) => {
      });

      socket.on('joined:mesa', (data) => {
      });

      socket.on('left:mesa', (data) => {
      });
      socket.on('error', (error) => {
      });

      return socket;
    } catch (error) {
      return null;
    }
  },

  
  disconnect() {
    if (socket) {
      socket.emit('leave:mesas');
      
            this.removeAllListeners();
      socket.disconnect();
      socket = null;
    }
  },

  
  isConnected() {
    return socket?.connected || false;
  },

  
  getSocket() {
    return socket;
  },

  
  reconnect() {
    if (socket && !socket.connected) {
      socket.connect();
    }
  },

  
  joinMesas() {
    if (socket && socket.connected) {
      socket.emit('join:mesas');
    } else {
    }
  },

  
  leaveMesas() {
    if (socket && socket.connected) {
      socket.emit('leave:mesas');
    }
  },

  
  joinMesa(mesaId) {
    if (socket && socket.connected) {
      socket.emit('join:mesa', { mesaId });
    } else {
    }
  },

  
  leaveMesa(mesaId) {
    if (socket && socket.connected) {
      socket.emit('leave:mesa', { mesaId });
    }
  },

  
  getConnectedClients() {
    if (socket && socket.connected) {
      socket.emit('mesas:get-connected-clients');
    }
  },

  
  getEstadoMesa(mesaId) {
    if (socket && socket.connected) {
      socket.emit('mesa:get-estado', { mesaId });
    }
  },

  
  onMesaCreada(callback) {
    if (!socket) {
      return;
    }
    socket.on('mesa:creada', (payload) => {
      callback(payload);
    });
  },

  
  onMesaActualizada(callback) {
    if (!socket) {
      return;
    }
    socket.on('mesa:actualizada', (payload) => {
      callback(payload);
    });
  },

  
  onMesaEliminada(callback) {
    if (!socket) {
      return;
    }
    socket.on('mesa:eliminada', (payload) => {
      callback(payload);
    });
  },

  
  onMesaEstadoCambiado(callback) {
    if (!socket) {
      return;
    }
    socket.on('mesa:estado-cambiado', (payload) => {
      callback(payload);
    });
  },

  
  onMesasActualizar(callback) {
    if (!socket) {
      return;
    }
    socket.on('mesas:actualizar', (payload) => {
      callback(payload);
    });
  },

  
  onNotificacion(callback) {
    if (!socket) {
      return;
    }
    socket.on('notificacion', (payload) => {
      callback(payload);
    });
  },

  
  onConnectedClients(callback) {
    if (!socket) {
      return;
    }
    socket.on('mesas:connected-clients', (data) => {
      callback(data);
    });
  },

  
  onMesaEstado(callback) {
    if (!socket) {
      return;
    }
    socket.on('mesa:estado', (data) => {
      callback(data);
    });
  },

  
  onError(callback) {
    if (!socket) {
      return;
    }
    socket.on('error', (error) => {
      callback(error);
    });
  },

  
  off(event, callback) {
    if (socket) {
      if (callback) {
        socket.off(event, callback);
      } else {
        socket.off(event);
      }
    }
  },

  
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

    
  async getMesas() {
    try {
      const response = await api.get('/mesas');
      return response.data.data || [];
    } catch (error) {
      throw error;
    }
  },

  
  async getMesaById(id) {
    try {
      const response = await api.get(`/mesas/${id}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  
  async createMesa(nombre) {
    try {
      const response = await api.post('/mesas', { nombre });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  
  async updateMesa(id, nombre) {
    try {
      const response = await api.put(`/mesas/${id}`, { nombre });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  
  async ocuparMesa(mesaId, idCliente = null) {
    try {
      const payload = idCliente ? { idCliente } : {};
      const response = await api.post(`/mesas/${mesaId}/ocupar`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  async liberarMesa(mesaId) {
    try {
      const response = await api.post(`/mesas/${mesaId}/liberar`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  async cambiarEstadoMesa(mesaId, estado) {
    try {
      const response = await api.patch(`/mesas/${mesaId}/estado`, { estado });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  async getEstadisticas() {
    try {
      const response = await api.get('/mesas/estadisticas/resumen');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  async deleteMesa(id) {
    try {
      const response = await api.delete(`/mesas/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  async actualizarPosicionMesa(idMesa, posX, posY) {
    try {
      const response = await api.patch(`/mesas/${idMesa}/posicion`, {
        posX,
        posY
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },


  
  async getGrupos() {
    try {
      try {
        const response = await api.get('/mesas-grupo');
        return response.data.data || response.data || [];
      } catch (error1) {
        const response = await api.get('/mesas-grupo/grupos');
        return response.data.data || response.data || [];
      }
    } catch (error) {
      throw error;
    }
  },

  
  async createGrupo(nombre, mesasIds) {
    try {
      const response = await api.post('/mesas-grupo/grupos', { 
        nombre, 
        mesas: mesasIds 
      });
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  },

  
  async deleteGrupo(id) {
    try {
      const response = await api.delete(`/mesas-grupo/grupos/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  async actualizarMesasGrupo(grupoId, { agregar = [], remover = [] }) {
    try {
      const response = await api.patch(`/mesas-grupo/grupos/${grupoId}/mesas`, {
        agregar,
        remover
      });
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  },

  
  async removerMesasDeGrupo(grupoId, mesasIdsARemover, todasLasMesasDelGrupo, nombreGrupo) {
    try {
            const mesasRestantes = todasLasMesasDelGrupo.filter(id => !mesasIdsARemover.includes(id));
      if (mesasRestantes.length < 2) {
        return await this.deleteGrupo(grupoId);
      }
      return await this.actualizarMesasGrupo(grupoId, { remover: mesasIdsARemover });
      
    } catch (error) {
      throw error;
    }
  },

  
  async actualizarEstado(idMesa, estado) {
    try {
      const response = await api.patch(`/mesas/${idMesa}`, { estado });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async createGrupo(nombre, mesasIds) {
    try {
      const response = await api.post('/mesas-grupo', grupoData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async disolverGrupo(idGrupo) {
    try {
      const response = await api.post(`/mesas-grupo/${idGrupo}/disolver`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async actualizarGrupo(idGrupo, grupoData) {
    try {
      const response = await api.put(`/mesas-grupo/${idGrupo}`, grupoData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async removerMesasDelGrupo(idGrupo, mesasIds) {
    try {
      const response = await api.post(`/mesas-grupo/${idGrupo}/remover-mesas`, { mesasIds });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async actualizarEstado(idGrupo, estado) {
    try {
      const response = await api.patch(`/mesas-grupo/${idGrupo}/estado`, { estado });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default mesasService;
