import api from './api';

/**
 * Servicio para gestionar categorías de productos
 * Basado en las rutas definidas en categoriaProductoRoutes.js
 */

/**
 * Obtiene todas las categorías de productos
 * @returns {Promise} Lista jerárquica de categorías
 */
export const getCategorias = async () => {
  try {
    const response = await api.get('/categorias-producto');
    return response.data;
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    throw error;
  }
};

/**
 * Obtiene una categoría por su ID
 * @param {number} id - ID de la categoría
 * @returns {Promise} Datos de la categoría
 */
export const getCategoriaPorId = async (id) => {
  try {
    const response = await api.get(`/categorias-producto/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener categoría ${id}:`, error);
    throw error;
  }
};

/**
 * Crea una nueva categoría
 * @param {Object} categoriaData - Datos de la categoría
 * @param {string} categoriaData.nombre - Nombre de la categoría
 * @param {number} [categoriaData.idCatPadre] - ID de la categoría padre (opcional)
 * @returns {Promise} Categoría creada
 */
export const crearCategoria = async (categoriaData) => {
  try {
    const response = await api.post('/categorias-producto', categoriaData);
    return response.data;
  } catch (error) {
    console.error('Error al crear categoría:', error);
    throw error;
  }
};

/**
 * Actualiza una categoría existente
 * @param {number} id - ID de la categoría a actualizar
 * @param {Object} categoriaData - Datos de la categoría a actualizar
 * @param {string} [categoriaData.nombre] - Nuevo nombre de la categoría
 * @param {number} [categoriaData.idCatPadre] - Nuevo ID de categoría padre
 * @returns {Promise} Categoría actualizada
 */
export const actualizarCategoria = async (id, categoriaData) => {
  try {
    const response = await api.put(`/categorias-producto/${id}`, categoriaData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar categoría ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina una categoría
 * @param {number} id - ID de la categoría a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const eliminarCategoria = async (id) => {
  try {
    const response = await api.delete(`/categorias-producto/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar categoría ${id}:`, error);
    throw error;
  }
};

/**
 * Toggle el estado de habilitación de una categoría
 * @param {number} id - ID de la categoría
 * @returns {Promise} Nuevo estado de la categoría
 */
export const toggleCategoria = async (id) => {
  try {
    const response = await api.patch(`/categorias-producto/${id}/toggle`);
    return response.data;
  } catch (error) {
    console.error(`Error al toggle categoría ${id}:`, error);
    throw error;
  }
};

/**
 * Convierte la estructura jerárquica de categorías a una lista plana
 * Útil para selectores y dropdowns
 * @param {Array} categorias - Array de categorías jerárquicas
 * @param {number} nivel - Nivel de indentación (para UI)
 * @returns {Array} Lista plana de categorías
 */
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
};export default {
  getCategorias,
  getCategoriaPorId,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  toggleCategoria,
  aplanarCategorias,
};
