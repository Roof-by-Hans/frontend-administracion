import api from "./api";

const cajaService = {
    abrirCaja: async (montoInicial = 0) => {
    try {
      const response = await api.post("/caja-diaria/abrir", {
        monto_inicial: montoInicial,
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

    cerrarCaja: async (datosCierre) => {
        try {
      const response = await api.post("/caja-diaria/cerrar", datosCierre);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

    obtenerCajaActual: async () => {
    try {
      const response = await api.get("/caja-diaria/actual");
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

    obtenerHistorial: async (params = {}) => {
    try {
      const response = await api.get("/caja-diaria/historial", { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

    obtenerDetalleCaja: async (id) => {
    try {
      const response = await api.get(`/caja-diaria/${id}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

    obtenerMovimientos: async (id, params = {}) => {
    try {
      const response = await api.get(`/caja-diaria/${id}/movimientos`, {
        params,
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

    obtenerAuditoria: async (id) => {
    try {
      const response = await api.get(`/caja-diaria/${id}/auditoria`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },  registrarMovimientoManual: async (datosMovimiento) => {
        try {
      const response = await api.post(
        "/caja-diaria/movimiento-manual",
        datosMovimiento
      );
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default cajaService;
