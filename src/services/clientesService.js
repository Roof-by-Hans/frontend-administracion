import api from "./api";

const CLIENTES_ENDPOINT = "/clientes";

/**
 * Servicio para operaciones relacionadas con clientes.
 */
const clienteService = {
  /**
   * Obtener todos los clientes.
   * @returns {Promise} Axios response con la lista de clientes.
   */
  getClientes: async () => {
    const response = await api.get(CLIENTES_ENDPOINT);
    return response.data; // Devuelve { success, data, message }
  },

  /**
   * Crear un nuevo cliente.
   * @param {FormData} clienteData Datos del cliente incluyendo archivos.
   * @returns {Promise} Axios response con el cliente creado.
   */
  crearCliente: async (clienteData) => {
    const response = await api.post(CLIENTES_ENDPOINT, clienteData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data; // Devuelve { success, data, message }
  },

  /**
   * Actualizar un cliente existente.
   * @param {string|number} clienteId Identificador del cliente.
   * @param {FormData} clienteData Datos actualizados del cliente.
   * @returns {Promise} Axios response con el cliente actualizado.
   */
  actualizarCliente: async (clienteId, clienteData) => {
    const response = await api.put(
      `${CLIENTES_ENDPOINT}/${clienteId}`,
      clienteData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data; // Devuelve { success, data, message }
  },

  /**
   * Eliminar un cliente.
   * @param {string|number} clienteId Identificador del cliente a eliminar.
   * @returns {Promise} Axios response de la operación.
   */
  eliminarCliente: async (clienteId) => {
    const response = await api.delete(`${CLIENTES_ENDPOINT}/${clienteId}`);
    return response.data; // Devuelve { success, message }
  },

  /**
   * Desvincular tarjeta de un cliente.
   * @param {string|number} clienteId Identificador del cliente.
   * @returns {Promise} Axios response de la operación.
   */
  desvincularTarjeta: async (clienteId) => {
    const response = await api.patch(
      `${CLIENTES_ENDPOINT}/${clienteId}/desvincular-tarjeta`
    );
    return response.data; // Devuelve { success, data, message }
  },

  /**
   * Toggle el estado de habilitación de un cliente.
   * @param {string|number} clienteId Identificador del cliente.
   * @returns {Promise} Axios response con el nuevo estado.
   */
  toggleCliente: async (clienteId) => {
    const response = await api.patch(
      `${CLIENTES_ENDPOINT}/${clienteId}/toggle`
    );
    return response.data; // Devuelve { success, data, message }
  },
};

export default clienteService;
