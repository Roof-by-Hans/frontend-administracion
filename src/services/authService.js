import api from './api';

/**
 * Servicio de autenticación
 * Maneja todas las operaciones relacionadas con login, logout y gestión de sesión
 */
const authService = {
  /**
   * Iniciar sesión
   * @param {string} nombreUsuario - Nombre de usuario
   * @param {string} contrasena - Contraseña
   * @returns {Promise} Respuesta con token y datos del usuario
   */
  login: async (nombreUsuario, contrasena) => {
    try {
      const response = await api.post('/auth/login', {
        nombreUsuario,
        contrasena,
      });
      return response.data;
    } catch (error) {
      console.error('Error en login:', error.message);
      throw error;
    }
  },

  /**
   * Cerrar sesión (opcional - si tienes endpoint de logout en backend)
   * @returns {Promise}
   */
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Error en logout:', error.message);
      // No lanzar error, el logout local se hará de todas formas
      return null;
    }
  },

  /**
   * Verificar token (opcional - si tienes endpoint de verificación)
   * @returns {Promise}
   */
  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      console.error('Error al verificar token:', error.message);
      throw error;
    }
  },

  /**
   * Refrescar token (opcional - si implementas refresh tokens)
   * @param {string} refreshToken - Token de refresco
   * @returns {Promise}
   */
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      return response.data;
    } catch (error) {
      console.error('Error al refrescar token:', error.message);
      throw error;
    }
  },

  /**
   * Solicitar recuperación de contraseña
   * @param {string} nombreUsuario - Nombre de usuario
   * @param {string} email - Email del usuario
   * @returns {Promise}
   */
  olvidarContrasena: async (nombreUsuario, email) => {
    try {
      const response = await api.post('/auth/forgot-password', { nombreUsuario, email });
      return response.data;
    } catch (error) {
      console.error('Error al solicitar recuperación:', error.message);
      throw error;
    }
  },

  /**
   * Restablecer contraseña con token
   * @param {string} token - Token de reset
   * @param {string} contrasenaNueva - Nueva contraseña
   * @returns {Promise}
   */
  restablecerContrasena: async (token, contrasenaNueva) => {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        contrasenaNueva,
      });
      return response.data;
    } catch (error) {
      console.error('Error al restablecer contraseña:', error.message);
      throw error;
    }
  },
};

export default authService;
