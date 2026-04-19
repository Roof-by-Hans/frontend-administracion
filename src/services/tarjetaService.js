import api from "./api";


const tarjetaService = {
  
  getTiposSuscripcion: async () => {
    try {
      const response = await api.get("/tipos-suscripcion");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  getNivelesSuscripcion: async () => {
    try {
      const response = await api.get("/niveles-suscripcion");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  verificarUid: async (rfidUid) => {
    try {
      const response = await api.post("/tarjetas/verificar-uid", { rfidUid });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  asociarTarjetaCliente: async (datos) => {
    try {
      const response = await api.post("/tarjetas/asociar", datos);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  getTarjetas: async () => {
    try {
      const response = await api.get("/tarjetas");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  cargarSaldo: async (idCliente, monto, metodoPago, observaciones = "") => {
    try {
      const response = await api.post("/transacciones/recarga", {
        idCliente,
        monto,
        metodoPago,
        observaciones,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  getTarjetaPorId: async (idTarjeta) => {
    try {
      const response = await api.get(`/tarjetas/${idTarjeta}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  actualizarNivelSuscripcion: async (idNivel, datos) => {
    try {
      const response = await api.put(`/niveles-suscripcion/${idNivel}`, datos);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  pagarDeuda: async (idCliente, monto, metodoPago, idFactura = null, observaciones = "") => {
    try {
      const response = await api.post("/transacciones/pago", {
        idCliente,
        monto,
        metodoPago,
        idFactura,
        observaciones,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};


export default tarjetaService;
