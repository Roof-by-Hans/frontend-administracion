import api from './api';


const authService = {
  
  login: async (nombreUsuario, contrasena) => {
    try {
      const response = await api.post('/auth/login', {
        nombreUsuario,
        contrasena,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      return null;
    }
  },

 
  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  olvidarContrasena: async (nombreUsuario, email) => {
    try {
      const response = await api.post('/auth/forgot-password', { nombreUsuario, email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  restablecerContrasena: async (token, contrasenaNueva) => {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        contrasenaNueva,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default authService;
