import api from "./api";

const cajaService = {
  // Abrir una nueva caja diaria
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

  // Cerrar la caja diaria actual
  cerrarCaja: async (datosCierre) => {
    // datosCierre debe contener: montoFinalReportado, observacion, conteoEfectivo, conteoTarjetas, subtotalesPorMedio
    try {
      const response = await api.post("/caja-diaria/cerrar", datosCierre);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener la caja diaria actual
  obtenerCajaActual: async () => {
    try {
      const response = await api.get("/caja-diaria/actual");
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener historial de cajas
  obtenerHistorial: async (params = {}) => {
    try {
      const response = await api.get("/caja-diaria/historial", { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener detalle de una caja específica
  obtenerDetalleCaja: async (id) => {
    try {
      const response = await api.get(`/caja-diaria/${id}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener movimientos de una caja específica
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

  // Obtener auditoría de una caja
  obtenerAuditoria: async (id) => {
    try {
      const response = await api.get(`/caja-diaria/${id}/auditoria`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Registrar un movimiento manual (INGRESO/EGRESO)
  registrarMovimientoManual: async (datosMovimiento) => {
    // datosMovimiento: { tipo, monto, concepto, metodoPago }
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
