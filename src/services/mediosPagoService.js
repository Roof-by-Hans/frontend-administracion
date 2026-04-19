import api from "./api";

const mediosPagoService = {
  obtenerTodos: async () => {
    try {
      const response = await api.get("/medios-pago");
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default mediosPagoService;
