import api from "./api";

const USUARIOS_ENDPOINT = "/usuarios";

/**
 * Servicio para operaciones relacionadas con usuarios del sistema.
 */
const usuarioService = {
  /**
   * Obtener todos los usuarios.
   * @returns {Promise} Axios response con la lista de usuarios.
   */
  getUsuarios: async () => {
    const response = await api.get(USUARIOS_ENDPOINT);
    return response.data;
  },

  /**
   * Obtener un usuario por ID.
   * @param {string|number} usuarioId Identificador del usuario.
   * @returns {Promise} Axios response con los datos del usuario.
   */
  getUsuarioPorId: async (usuarioId) => {
    const response = await api.get(`${USUARIOS_ENDPOINT}/${usuarioId}`);
    return response.data;
  },

  /**
   * Actualizar un usuario existente (incluyendo foto de perfil).
   * @param {string|number} usuarioId Identificador del usuario.
   * @param {FormData} usuarioData Datos actualizados del usuario.
   * @returns {Promise} Axios response con el usuario actualizado.
   */
  actualizarUsuario: async (usuarioId, usuarioData) => {
    const response = await api.put(
      `${USUARIOS_ENDPOINT}/${usuarioId}`,
      usuarioData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },

  /**
   * Crear un nuevo usuario.
   * @param {FormData} usuarioData Datos del nuevo usuario.
   * @returns {Promise} Axios response con el usuario creado.
   */
  crearUsuario: async (usuarioData) => {
    const response = await api.post(USUARIOS_ENDPOINT, usuarioData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Eliminar un usuario.
   * @param {string|number} usuarioId Identificador del usuario a eliminar.
   * @returns {Promise} Axios response de la operación.
   */
  eliminarUsuario: async (usuarioId) => {
    const response = await api.delete(`${USUARIOS_ENDPOINT}/${usuarioId}`);
    return response.data;
  },
};

export default usuarioService;
