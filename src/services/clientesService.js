import api from "./api";

const CLIENTES_ENDPOINT = "/clientes";


const clienteService = {
 
getClientes: async (params = {}) => {
  let endpoint = CLIENTES_ENDPOINT;
  
  
  if (params.estado && params.estado !== 'todos') {
    endpoint = `${CLIENTES_ENDPOINT}?estado=${params.estado}`;
  }
  
  const response = await api.get(endpoint);
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
