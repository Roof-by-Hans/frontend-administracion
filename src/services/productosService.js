import api from './api';

export const getProductos = async () => {
  try {
    const response = await api.get('/productos');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProductosHabilitados = async () => {
  try {
    const response = await api.get('/productos/habilitados');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getProductoPorId = async (id) => {
  try {
    const response = await api.get(`/productos/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const crearProducto = async (productoData) => {
  try {
    const response = await api.post('/productos', productoData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const actualizarProducto = async (id, productoData) => {
  try {
    const response = await api.put(`/productos/${id}`, productoData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const eliminarProducto = async (id) => {
  try {
    const response = await api.delete(`/productos/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const toggleProducto = async (id) => {
  try {
    const response = await api.patch(`/productos/${id}/toggle`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
