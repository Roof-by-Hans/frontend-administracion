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
      const url = error.response.config.url;

      // Si es 401, el token expiró o es inválido - limpiar sesión
      if (status === 401) {
        try {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("user");
          // Nota: El AuthContext detectará esto y redirigirá al login
        } catch (e) {
          // Silenciar logs en producción
        }
      }
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
    } else {
      // Algo pasó al configurar la petición
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
      const response = await api.post("/auth/login", {
        nombreUsuario,
        contrasena,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Servicio de clientes
export const clienteService = {
  /**
   * Obtener todos los clientes
   * @returns {Promise} Lista de clientes
   */
  getClientes: async () => {
    return await api.get("/clientes");
  },

  /**
   * Obtener un cliente por ID
   * @param {number} id - ID del cliente
   * @returns {Promise} Datos del cliente
   */
  getClientePorId: async (id) => {
    return await api.get(`/clientes/${id}`);
  },

  /**
   * Crear un nuevo cliente
   * @param {FormData} formData - Datos del cliente en formato FormData
   * @returns {Promise} Cliente creado
   */
  crearCliente: async (formData) => {
    return await api.post("/clientes", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Actualizar un cliente existente
   * @param {number} id - ID del cliente
   * @param {FormData} formData - Datos actualizados del cliente
   * @returns {Promise} Cliente actualizado
   */
  actualizarCliente: async (id, formData) => {
    return await api.put(`/clientes/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Eliminar un cliente
   * @param {number} id - ID del cliente a eliminar
   * @returns {Promise} Confirmación de eliminación
   */
  eliminarCliente: async (id) => {
    return await api.delete(`/clientes/${id}`);
  },
};

export default api;
