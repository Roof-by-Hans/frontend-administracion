import api from './api';

/**
 * Servicio para gestionar transacciones (consumos, recargas y pagos)
 */
const transaccionesService = {
  /**
   * Registrar consumo de productos y generar factura automáticamente
   * @param {Object} data - Datos del consumo
   * @param {number} data.idCliente - ID del cliente
   * @param {number} [data.idMesa] - ID de la mesa (opcional)
   * @param {number} [data.idGrupo] - ID del grupo de mesas (opcional)
   * @param {Array} data.productos - Array de productos [{idProducto, cantidad, precioUnitario}]
   * @param {string} [data.observaciones] - Observaciones del consumo
   * @returns {Promise<Object>} - Factura generada
   */
  async registrarConsumo(data) {
    try {
      const response = await api.post('/transacciones/consumo', data);
      return response.data;
    } catch (error) {
      console.error('Error al registrar consumo:', error);
      throw error;
    }
  },

  /**
   * Registrar recarga de tarjeta prepaga
   * @param {Object} data - Datos de la recarga
   * @param {number} data.idTarjeta - ID de la tarjeta
   * @param {number} data.monto - Monto de la recarga
   * @param {string} [data.metodoPago] - Método de pago utilizado
   * @returns {Promise<Object>} - Datos de la recarga
   */
  async registrarRecarga(data) {
    try {
      const response = await api.post('/transacciones/recarga', data);
      return response.data;
    } catch (error) {
      console.error('Error al registrar recarga:', error);
      throw error;
    }
  },

  /**
   * Registrar pago de factura o reducción de deuda
   * @param {Object} data - Datos del pago
   * @param {number} data.idFactura - ID de la factura a pagar
   * @param {number} data.monto - Monto del pago
   * @param {string} [data.metodoPago] - Método de pago utilizado
   * @returns {Promise<Object>} - Datos del pago procesado
   */
  async registrarPago(data) {
    try {
      const response = await api.post('/transacciones/pago', data);
      return response.data;
    } catch (error) {
      console.error('Error al registrar pago:', error);
      throw error;
    }
  },

  /**
   * Revertir una factura COBRADA o PENDIENTE (rollback de pago)
   * @param {number} idFactura - ID de la factura a revertir
   * @param {string} motivo - Motivo de la reversión (requerido para auditoría)
   * @returns {Promise<{data: object, warning: string|null, message: string}>}
   */
  async revertirFactura(idFactura, motivo) {
    try {
      const response = await api.post(`/transacciones/revertir/${idFactura}`, { motivo });
      return {
        data: response.data.data,
        warning: response.data.data?.warning ?? null,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error al revertir factura:', error);
      throw error;
    }
  },
};

export default transaccionesService;
