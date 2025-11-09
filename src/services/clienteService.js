import api from "./api";

/**
 * Servicio de clientes
 * Maneja todas las operaciones CRUD relacionadas con clientes
 */
const clienteService = {
  /**
   * Obtener todos los clientes
   * @returns {Promise} Lista de clientes
   */
  getClientes: async () => {
    try {
      const response = await api.get("/clientes");
      return response.data;
    } catch (error) {
      console.error("Error al obtener clientes:", error.message);
      throw error;
    }
  },

  /**
   * Obtener un cliente por ID
   * @param {number} id - ID del cliente
   * @returns {Promise} Datos del cliente
   */
  getClientePorId: async (id) => {
    try {
      const response = await api.get(`/clientes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener cliente ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Crear un nuevo cliente
   * @param {FormData} formData - Datos del cliente en formato FormData
   * @returns {Promise} Cliente creado
   */
  crearCliente: async (formData) => {
    try {
      const response = await api.post("/clientes", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error al crear cliente:", error.message);
      throw error;
    }
  },

  /**
   * Actualizar un cliente existente
   * @param {number} id - ID del cliente
   * @param {FormData} formData - Datos actualizados del cliente
   * @returns {Promise} Cliente actualizado
   */
  actualizarCliente: async (id, formData) => {
    try {
      const response = await api.put(`/clientes/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar cliente ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Eliminar un cliente
   * @param {number} id - ID del cliente a eliminar
   * @returns {Promise} Confirmación de eliminación
   */
  eliminarCliente: async (id) => {
    try {
      const response = await api.delete(`/clientes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar cliente ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Desvincular la tarjeta asociada a un cliente
   * @param {number} id - ID del cliente
   * @returns {Promise} Resultado de la operación
   */
  desvincularTarjeta: async (id) => {
    try {
      const response = await api.patch(`/clientes/${id}/desvincular-tarjeta`);
      return response.data;
    } catch (error) {
      console.error(
        `Error al desvincular la tarjeta del cliente ${id}:`,
        error.message
      );
      throw error;
    }
  },
};

export default clienteService;
