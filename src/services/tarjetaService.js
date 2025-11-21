import api from "./api";

/**
 * Servicio de tarjetas
 * Maneja todas las operaciones relacionadas con tarjetas, tipos y niveles de suscripción
 */
const tarjetaService = {
  /**
   * Obtener todos los tipos de suscripción (PREPAGA, CREDITO)
   * @returns {Promise} Lista de tipos de suscripción
   */
  getTiposSuscripcion: async () => {
    try {
      const response = await api.get("/tipos-suscripcion");
      return response.data;
    } catch (error) {
      console.error("Error al obtener tipos de suscripción:", error.message);
      throw error;
    }
  },

  /**
   * Obtener todos los niveles de suscripción (Básica, Premium, VIP)
   * @returns {Promise} Lista de niveles de suscripción
   */
  getNivelesSuscripcion: async () => {
    try {
      const response = await api.get("/niveles-suscripcion");
      return response.data;
    } catch (error) {
      console.error("Error al obtener niveles de suscripción:", error.message);
      throw error;
    }
  },

  /**
   * Verificar si un UID de RFID ya existe en el sistema
   * @param {string} rfidUid - UID de la tarjeta RFID
   * @returns {Promise} Información sobre si el UID existe
   */
  verificarUid: async (rfidUid) => {
    try {
      const response = await api.post("/tarjetas/verificar-uid", { rfidUid });
      return response.data;
    } catch (error) {
      console.error("Error al verificar UID:", error.message);
      throw error;
    }
  },

  /**
   * Asociar una tarjeta a un cliente
   * @param {Object} datos - Datos de asociación
   * @param {string} datos.rfidUid - UID de la tarjeta RFID escaneada
   * @param {number} datos.idCliente - ID del cliente
   * @param {number} datos.idTipoSuscripcion - ID del tipo de suscripción
   * @param {number} [datos.idNivelSuscripcion] - ID del nivel (solo para CREDITO)
   * @param {number} [datos.saldoInicial] - Saldo inicial (solo para PREPAGA)
   * @param {boolean} [datos.forzarDesvinculacion] - Forzar desvinculación si hay conflicto
   * @returns {Promise} Tarjeta asociada
   */
  asociarTarjetaCliente: async (datos) => {
    try {
      const response = await api.post("/tarjetas/asociar", datos);
      return response.data;
    } catch (error) {
      console.error("Error al asociar tarjeta al cliente:", error.message);
      throw error;
    }
  },

  /**
   * Obtener todas las tarjetas
   * @returns {Promise} Lista de tarjetas
   */
  getTarjetas: async () => {
    try {
      const response = await api.get("/tarjetas");
      return response.data;
    } catch (error) {
      console.error("Error al obtener tarjetas:", error.message);
      throw error;
    }
  },

  /**
   * Cargar saldo a una tarjeta
   * @param {number} idTarjeta - ID de la tarjeta
   * @param {number} monto - Monto a cargar
   * @returns {Promise} Tarjeta actualizada con nuevo saldo
   */
  cargarSaldo: async (idTarjeta, monto) => {
    try {
      const response = await api.patch(`/tarjetas/${idTarjeta}/saldo`, {
        monto,
        operacion: "agregar",
      });
      return response.data;
    } catch (error) {
      console.error("Error al cargar saldo:", error.message);
      throw error;
    }
  },

  /**
   * Obtener tarjeta por ID
   * @param {number} idTarjeta - ID de la tarjeta
   * @returns {Promise} Información de la tarjeta
   */
  getTarjetaPorId: async (idTarjeta) => {
    try {
      const response = await api.get(`/tarjetas/${idTarjeta}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener tarjeta:", error.message);
      throw error;
    }
  },
};

export default tarjetaService;
