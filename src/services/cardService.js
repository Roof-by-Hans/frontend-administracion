import axios from "axios";

const CARD_SERVICE_URL =
  process.env.EXPO_PUBLIC_CARD_SERVICE_URL || "http://localhost:3500/api";
const RFID_TIMEOUT = Number(process.env.EXPO_PUBLIC_RFID_TIMEOUT) || 10000;const cardApi = axios.create({
  baseURL: CARD_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Servicio de tarjetas RFID
 * Maneja todas las operaciones relacionadas con el lector RFID
 */
const cardService = {
  /**
   * Escanear una tarjeta RFID
   * @param {number} timeoutMs - Tiempo máximo de espera en milisegundos (opcional)
   * @returns {Promise<{uid: string}>} UID de la tarjeta escaneada
   */
  scanRFID: async (timeoutMs = RFID_TIMEOUT) => {
    try {
      const response = await cardApi.post("/rfid/scan", {
        timeoutMs,
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 504) {
        throw new Error(
          "Tiempo de espera agotado. No se detectó ninguna tarjeta."
        );
      }
      throw new Error(
        error.response?.data?.error || "Error al escanear la tarjeta RFID"
      );
    }
  },
};

export default cardService;
