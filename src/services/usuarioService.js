import api from "./api";

const USUARIOS_ENDPOINT = "/usuarios";

export const getUsuarios = async () => {
  const response = await api.get(USUARIOS_ENDPOINT);
  return response.data;
};

export const getUsuarioPorId = async (usuarioId) => {
  const response = await api.get(`${USUARIOS_ENDPOINT}/${usuarioId}`);
  return response.data;
};

export const actualizarUsuario = async (usuarioId, usuarioData) => {
  const response = await api.put(`${USUARIOS_ENDPOINT}/${usuarioId}`, usuarioData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const crearUsuario = async (usuarioData) => {
  const response = await api.post(USUARIOS_ENDPOINT, usuarioData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const eliminarUsuario = async (usuarioId) => {
  const response = await api.delete(`${USUARIOS_ENDPOINT}/${usuarioId}`);
  return response.data;
};

export const toggleUsuario = async (usuarioId) => {
  const response = await api.patch(`${USUARIOS_ENDPOINT}/${usuarioId}/toggle`);
  return response.data;
};


const usuarioService = {
  
  getUsuarios: async () => {
    return getUsuarios();
  },

  
  getUsuarioPorId: async (usuarioId) => {
    return getUsuarioPorId(usuarioId);
  },

  
  actualizarUsuario: async (usuarioId, usuarioData) => {
    return actualizarUsuario(usuarioId, usuarioData);
  },

  actualizarMiEmail: async (email) => {
    const response = await api.put(`${USUARIOS_ENDPOINT}/me/email`, {
      email: email ?? "",
    });
    return response.data;
  },

  
  crearUsuario: async (usuarioData) => {
    return crearUsuario(usuarioData);
  },

  
  eliminarUsuario: async (usuarioId) => {
    return eliminarUsuario(usuarioId);
  },

  
  toggleUsuario: async (usuarioId) => {
    return toggleUsuario(usuarioId);
  },
};

export default usuarioService;
