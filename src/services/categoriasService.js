import api from './api';


export const getCategorias = async (params = {}) => {
  try {
    let endpoint = '/categorias-producto';
    
    
    if (params.estado && params.estado !== 'todos') {
      endpoint = `/categorias-producto?estado=${params.estado}`;
    }
    
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const getCategoriaPorId = async (id) => {
  try {
    const response = await api.get(`/categorias-producto/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const crearCategoria = async (categoriaData) => {
  try {
    const response = await api.post('/categorias-producto', categoriaData);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const actualizarCategoria = async (id, categoriaData) => {
  try {
    const response = await api.put(`/categorias-producto/${id}`, categoriaData);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const eliminarCategoria = async (id) => {
  try {
    const response = await api.delete(`/categorias-producto/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const toggleCategoria = async (id) => {
  try {
    const response = await api.patch(`/categorias-producto/${id}/toggle`);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const aplanarCategorias = (categorias, nivel = 0) => {
  let resultado = [];
  
  categorias.forEach(categoria => {
    resultado.push({
      id: categoria.id,
      nombre: categoria.nombre,
      nivel: nivel,
      nombreConIndentacion: '  '.repeat(nivel) + categoria.nombre,
    });
    
    if (categoria.children && categoria.children.length > 0) {
      resultado = resultado.concat(aplanarCategorias(categoria.children, nivel + 1));
    }
  });
  
  return resultado;
};
export default {
  getCategorias,
  getCategoriaPorId,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  toggleCategoria,
  aplanarCategorias,
};
