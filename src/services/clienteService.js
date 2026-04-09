import api from "./api";


const clienteService = {
  
  getClientes: async () => {
    try {
      const response = await api.get("/clientes");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  getClientePorId: async (id) => {
    try {
      const response = await api.get(`/clientes/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  crearCliente: async (formData) => {
    try {
      const response = await api.post("/clientes", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  actualizarCliente: async (id, formData) => {
    try {
      const response = await api.put(`/clientes/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  eliminarCliente: async (id) => {
    try {
      const response = await api.delete(`/clientes/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  
  desvincularTarjeta: async (id) => {
    try {
      const response = await api.patch(`/clientes/${id}/desvincular-tarjeta`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default clienteService;
