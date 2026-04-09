import api from "./api";

const CLIENTES_ENDPOINT = "/clientes";


const clienteService = {
  
  getClientes: async () => {
    const response = await api.get(CLIENTES_ENDPOINT);
    return response.data; 
  },

  
  crearCliente: async (clienteData) => {
    const response = await api.post(CLIENTES_ENDPOINT, clienteData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data; 
  },

  
  actualizarCliente: async (clienteId, clienteData) => {
    const response = await api.put(
      `${CLIENTES_ENDPOINT}/${clienteId}`,
      clienteData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data; 
  },

  
  eliminarCliente: async (clienteId) => {
    const response = await api.delete(`${CLIENTES_ENDPOINT}/${clienteId}`);
    return response.data; 
  },

  
  desvincularTarjeta: async (clienteId) => {
    const response = await api.patch(
      `${CLIENTES_ENDPOINT}/${clienteId}/desvincular-tarjeta`
    );
    return response.data; 
  },

  
  toggleCliente: async (clienteId) => {
    const response = await api.patch(
      `${CLIENTES_ENDPOINT}/${clienteId}/toggle`
    );
    return response.data; 
  },
};

export default clienteService;
