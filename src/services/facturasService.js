import api from './api';


const facturasService = {
  
  async getFacturas(params = {}) {
    try {
      const response = await api.get('/facturas', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  async getFacturasPendientes() {
    try {
      const response = await api.get('/facturas/pendientes');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  async getFacturaById(id) {
    try {
      const response = await api.get(`/facturas/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  async getDetallesFactura(id) {
    try {
      const response = await api.get(`/facturas/${id}/detalles`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  async getFacturasByCliente(idCliente) {
    try {
      const response = await api.get(`/facturas/cliente/${idCliente}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  async getProductosConsumidos(idCliente) {
    try {
      const response = await api.get(`/facturas/cliente/${idCliente}/productos-consumidos`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  async getFacturaActivaMesa(idMesa) {
    try {
      const response = await api.get(`/mesas/${idMesa}/factura-activa`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  
  async getFacturaActivaGrupo(idGrupo) {
    try {
      const response = await api.get(`/mesas-grupo/grupos/${idGrupo}/factura-activa`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  
  async cambiarEstado(id, estado) {
    try {
      const response = await api.patch(`/facturas/${id}/estado`, { estado });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default facturasService;
