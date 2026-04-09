import api from './api';


const transaccionesService = {
  
  async registrarConsumo(data) {
    try {
      const response = await api.post('/transacciones/consumo', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  async registrarRecarga(data) {
    try {
      const response = await api.post('/transacciones/recarga', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  async registrarPago(data) {
    try {
      const response = await api.post('/transacciones/pago', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  async revertirFactura(idFactura, motivo) {
    try {
      const response = await api.post(`/transacciones/revertir/${idFactura}`, { motivo });
      return {
        data: response.data.data,
        warning: response.data.data?.warning ?? null,
        message: response.data.message,
      };
    } catch (error) {
      throw error;
    }
  },
};

export default transaccionesService;
