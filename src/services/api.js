import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configura la URL base del backend desde las variables de entorno
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

console.log('🔧 API Base URL configurada:', API_BASE_URL);

// Crea una instancia de axios con configuración base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token JWT a las peticiones
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Si es FormData, no establecer Content-Type (axios lo hará automáticamente con el boundary correcto)
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
    } catch (error) {
      console.error('Error al obtener token:', error);
    }
    console.log('📤 Petición:', config.method?.toUpperCase(), config.baseURL + config.url);
    return config;
  },
  (error) => {
    console.error('❌ Error en interceptor request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    console.log('✅ Respuesta exitosa:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    if (error.response) {
      // El servidor respondió con un código de error
      console.error('❌ Error de respuesta:', error.response.status, error.response.data);
      
      // Si es 401, el token expiró o es inválido
      if (error.response.status === 401) {
        try {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
        } catch (e) {
          console.error('Error al limpiar storage:', e);
        }
      }
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      console.error('❌ Error de red - No se recibió respuesta del servidor');
      console.error('URL:', API_BASE_URL);
    } else {
      // Algo pasó al configurar la petición
      console.error('❌ Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Servicio de autenticación
export const authService = {
  /**
   * Iniciar sesión
   * @param {string} nombreUsuario - Nombre de usuario
   * @param {string} contrasena - Contraseña
   * @returns {Promise} Respuesta con token y datos del usuario
   */
  login: async (nombreUsuario, contrasena) => {
    try {
      console.log('🔐 Intentando login con usuario:', nombreUsuario);
      const response = await api.post('/auth/login', {
        nombreUsuario,
        contrasena,
      });
      console.log('✅ Login exitoso');
      return response.data;
    } catch (error) {
      console.error('❌ Error en login:', error.message);
      throw error;
    }
  },
};

export default api;
