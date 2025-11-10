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
  getClientes: () => api.get(CLIENTES_ENDPOINT),

  /**
   * Crear un nuevo cliente.
   * @param {FormData} clienteData Datos del cliente incluyendo archivos.
   * @returns {Promise} Axios response con el cliente creado.
   */
  crearCliente: (clienteData) =>
    api.post(CLIENTES_ENDPOINT, clienteData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /**
   * Actualizar un cliente existente.
   * @param {string|number} clienteId Identificador del cliente.
   * @param {FormData} clienteData Datos actualizados del cliente.
   * @returns {Promise} Axios response con el cliente actualizado.
   */
  actualizarCliente: (clienteId, clienteData) =>
    api.put(`${CLIENTES_ENDPOINT}/${clienteId}`, clienteData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /**
   * Eliminar un cliente.
   * @param {string|number} clienteId Identificador del cliente a eliminar.
   * @returns {Promise} Axios response de la operación.
   */
  eliminarCliente: (clienteId) =>
    api.delete(`${CLIENTES_ENDPOINT}/${clienteId}`),
};

export default clienteService;
