import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configura la URL base del backend desde las variables de entorno
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

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

      // Si es FormData, no establecer Content-Type (axios lo hará automáticamente con el boundary correcto)
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
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
      // El servidor respondió con un código de error
      const status = error.response.status;

      // Si es 401, el token expiró o es inválido - limpiar sesión
      if (status === 401) {
        try {
          console.log("🔒 Token JWT expirado o inválido - limpiando sesión");
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          await AsyncStorage.removeItem("recordarme");
          // Agregar un flag para que el AuthContext lo detecte inmediatamente
          await AsyncStorage.setItem("session_expired", "true");
          // El AuthContext detectará esto y redirigirá al login
        } catch (e) {
          console.error("Error al limpiar AsyncStorage:", e);
        }
      }
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      console.error("Error de red - No se recibió respuesta del servidor");
    } else {
      // Algo pasó al configurar la petición
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
