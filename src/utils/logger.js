/**
 * Sistema de logging condicional para desarrollo/producción
 * Usa __DEV__ de React Native para detectar entorno
 *
 * Uso:
 *   import { logger } from "../utils/logger";
 *   logger.debug("Mensaje de debug");  // Solo en desarrollo
 *   logger.error("Error crítico", err); // Siempre visible
 */

const isDev = false;

export const logger = {
  /**
   * Log de debug - Solo visible en desarrollo
   * Usar para tracking de flujos, estados, etc.
   */
  debug: (...args) => {
    if (isDev) console.log(...args);
  },

  /**
   * Log informativo - Siempre visible
   * Usar para información importante que queremos ver en producción
   */
  info: (...args) => {

  },

  /**
   * Advertencia - Siempre visible
   * Usar para situaciones no críticas pero que merecen atención
   */
  warn: (...args) => {
    console.warn(...args);
  },

  /**
   * Error - Siempre visible (CRÍTICO)
   * Usar en todos los catch blocks y errores importantes
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Log de WebSocket/Socket.io
   */
  socket: (...args) => {
    if (isDev) console.log("🔌", ...args);
  },

  /**
   * Log de peticiones API
   */
  api: (...args) => {
    if (isDev) console.log("📡", ...args);
  },

  /**
   * Log de operación exitosa
   */
  success: (...args) => {
    if (isDev) console.log("✅", ...args);
  },

  /**
   * Log de datos/transformaciones
   */
  data: (...args) => {
    if (isDev) console.log("📊", ...args);
  },

  /**
   * Log de autenticación
   */
  auth: (...args) => {
    if (isDev) console.log("🔐", ...args);
  },

  /**
   * Log de navegación/UI
   */
  ui: (...args) => {
    if (isDev) console.log("🖥️", ...args);
  },
};

export default logger;
