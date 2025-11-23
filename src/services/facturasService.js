import api from './api';

/**
 * Servicio para gestionar facturas
 */
const facturasService = {
  /**
   * Obtener todas las facturas
   * @param {Object} params - Parámetros de consulta
   * @param {string} [params.estado] - Filtrar por estado (pendiente/pagada)
   * @param {string} [params.fechaDesde] - Fecha desde (formato ISO)
   * @param {string} [params.fechaHasta] - Fecha hasta (formato ISO)
   * @returns {Promise<Array>} - Lista de facturas
   */
  async getFacturas(params = {}) {
    try {
      const response = await api.get('/facturas', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener facturas:', error);
      throw error;
    }
  },

  /**
   * Obtener facturas pendientes
   * @returns {Promise<Array>} - Lista de facturas pendientes
   */
  async getFacturasPendientes() {
    try {
      const response = await api.get('/facturas/pendientes');
      return response.data;
    } catch (error) {
      console.error('Error al obtener facturas pendientes:', error);
      throw error;
    }
  },

  /**
   * Obtener una factura por ID con sus detalles
   * @param {number} id - ID de la factura
   * @returns {Promise<Object>} - Datos de la factura con detalles
   */
  async getFacturaById(id) {
    try {
      const response = await api.get(`/facturas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener factura:', error);
      throw error;
    }
  },

  /**
   * Obtener detalles de una factura específica
   * @param {number} id - ID de la factura
   * @returns {Promise<Array>} - Array de detalles de la factura
   */
  async getDetallesFactura(id) {
    try {
      const response = await api.get(`/facturas/${id}/detalles`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalles de factura:', error);
      throw error;
    }
  },

  /**
   * Obtener facturas de un cliente específico
   * @param {number} idCliente - ID del cliente
   * @returns {Promise<Array>} - Lista de facturas del cliente
   */
  async getFacturasByCliente(idCliente) {
    try {
      const response = await api.get(`/facturas/cliente/${idCliente}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener facturas del cliente:', error);
      throw error;
    }
  },

  /**
   * Obtener productos consumidos por un cliente
   * @param {number} idCliente - ID del cliente
   * @returns {Promise<Array>} - Lista de productos consumidos
   */
  async getProductosConsumidos(idCliente) {
    try {
      const response = await api.get(`/facturas/cliente/${idCliente}/productos-consumidos`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener productos consumidos:', error);
      throw error;
    }
  },

  /**
   * Obtener factura activa de una mesa
   * @param {number} idMesa - ID de la mesa
   * @returns {Promise<Object|null>} - Factura activa o null
   */
  async getFacturaActivaMesa(idMesa) {
    try {
      const response = await api.get(`/mesas/${idMesa}/factura-activa`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error al obtener factura activa de mesa:', error);
      throw error;
    }
  },

  /**
   * Obtener factura activa de un grupo de mesas
   * @param {number} idGrupo - ID del grupo
   * @returns {Promise<Object|null>} - Factura activa o null
   */
  async getFacturaActivaGrupo(idGrupo) {
    try {
      const response = await api.get(`/mesas-grupo/grupos/${idGrupo}/factura-activa`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error al obtener factura activa de grupo:', error);
      throw error;
    }
  },

  /**
   * Cambiar estado de una factura
   * @param {number} id - ID de la factura
   * @param {string} estado - Nuevo estado (pendiente/pagada/cancelada)
   * @returns {Promise<Object>} - Factura actualizada
   */
  async cambiarEstado(id, estado) {
    try {
      const response = await api.patch(`/facturas/${id}/estado`, { estado });
      return response.data;
    } catch (error) {
      console.error('Error al cambiar estado de factura:', error);
      throw error;
    }
  },
};

export default facturasService;
