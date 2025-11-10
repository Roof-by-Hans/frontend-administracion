import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configura la URL base del backend desde las variables de entorno
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

// Crea una instancia de axios con configuración base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar el token JWT a las peticiones
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Silenciar logs en producción
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      // Si es 401, el token expiró o es inválido
      if (error.response.status === 401) {
        try {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          // Nota: El AuthContext detectará esto y redirigirá al login
        } catch (e) {
          // Silenciar logs en producción
        }
      }
    } else if (error.request) {
      console.error('Error de red - No se recibió respuesta del servidor');
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

