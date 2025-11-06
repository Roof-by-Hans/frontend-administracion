import api from './api';

/**
 * Servicio para gestionar productos
 * Basado en las rutas definidas en productoRoutes.js
 */

/**
 * Obtiene todos los productos disponibles
 * @returns {Promise} Lista de productos con sus categorías
 */
export const getProductos = async () => {
  try {
    const response = await api.get('/productos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
};

/**
 * Obtiene un producto por su ID
 * @param {number} id - ID del producto
 * @returns {Promise} Datos del producto
 */
export const getProductoPorId = async (id) => {
  try {
    const response = await api.get(`/productos/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener producto ${id}:`, error);
    throw error;
  }
};

/**
 * Crea un nuevo producto con imagen
 * @param {Object} productoData - Datos del producto
 * @param {string} productoData.nombre - Nombre del producto
 * @param {number} productoData.precio_unitario - Precio unitario
 * @param {number} productoData.id_categoria - ID de la categoría
 * @param {string} [productoData.descripcion] - Descripción del producto (opcional)
 * @param {Object} [imagen] - Objeto con la imagen del producto (opcional)
 * @returns {Promise} Producto creado
 */
export const crearProducto = async (productoData, imagen = null) => {
  try {
    const formData = new FormData();
    
    // Agregar datos del producto
    formData.append('nombre', productoData.nombre);
    formData.append('precio_unitario', productoData.precio_unitario.toString());
    formData.append('id_categoria', productoData.id_categoria.toString());
    
    if (productoData.descripcion) {
      formData.append('descripcion', productoData.descripcion);
    }
    
    // Agregar imagen si existe
    if (imagen && imagen.uri) {
      // Crear blob desde URI para web o usar directamente en mobile
      if (imagen.uri.startsWith('blob:') || imagen.uri.startsWith('data:')) {
        // Web: ya es un blob o data URL
        const response = await fetch(imagen.uri);
        const blob = await response.blob();
        formData.append('imagen', blob, imagen.name || 'producto.jpg');
      } else if (imagen.uri.startsWith('file://')) {
        // Mobile: usar objeto con uri, type, name
        formData.append('imagen', {
          uri: imagen.uri,
          type: imagen.type || 'image/jpeg',
          name: imagen.name || 'producto.jpg',
        });
      } else {
        // Otro tipo de URI (http, https, etc.)
        const response = await fetch(imagen.uri);
        const blob = await response.blob();
        formData.append('imagen', blob, imagen.name || 'producto.jpg');
      }
    }
    
    // No establecer Content-Type, axios lo hará automáticamente
    const response = await api.post('/productos', formData);
    
    return response.data;
  } catch (error) {
    console.error('Error al crear producto:', error);
    throw error;
  }
};

/**
 * Actualiza un producto existente con imagen opcional
 * @param {number} id - ID del producto a actualizar
 * @param {Object} productoData - Datos del producto a actualizar (todos opcionales)
 * @param {string} [productoData.nombre] - Nuevo nombre del producto
 * @param {number} [productoData.precio_unitario] - Nuevo precio unitario
 * @param {number} [productoData.id_categoria] - Nuevo ID de categoría
 * @param {string} [productoData.descripcion] - Nueva descripción
 * @param {Object} [imagen] - Nueva imagen del producto (opcional)
 * @returns {Promise} Producto actualizado
 */
export const actualizarProducto = async (id, productoData, imagen = null) => {
  try {
    const formData = new FormData();
    
    // Agregar solo los campos que se van a actualizar
    if (productoData.nombre !== undefined) {
      formData.append('nombre', productoData.nombre);
    }
    if (productoData.precio_unitario !== undefined) {
      formData.append('precio_unitario', productoData.precio_unitario.toString());
    }
    if (productoData.id_categoria !== undefined) {
      formData.append('id_categoria', productoData.id_categoria.toString());
    }
    if (productoData.descripcion !== undefined) {
      formData.append('descripcion', productoData.descripcion);
    }
    
    // Agregar imagen si existe
    if (imagen && imagen.uri) {
      // Crear blob desde URI para web o usar directamente en mobile
      if (imagen.uri.startsWith('blob:') || imagen.uri.startsWith('data:')) {
        // Web: ya es un blob o data URL
        const response = await fetch(imagen.uri);
        const blob = await response.blob();
        formData.append('imagen', blob, imagen.name || 'producto.jpg');
      } else if (imagen.uri.startsWith('file://')) {
        // Mobile: usar objeto con uri, type, name
        formData.append('imagen', {
          uri: imagen.uri,
          type: imagen.type || 'image/jpeg',
          name: imagen.name || 'producto.jpg',
        });
      } else {
        // Otro tipo de URI (http, https, etc.)
        const response = await fetch(imagen.uri);
        const blob = await response.blob();
        formData.append('imagen', blob, imagen.name || 'producto.jpg');
      }
    }
    
    // No establecer Content-Type, axios lo hará automáticamente
    const response = await api.put(`/productos/${id}`, formData);
    
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar producto ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina un producto del catálogo
 * @param {number} id - ID del producto a eliminar
 * @returns {Promise} Confirmación de eliminación
 */
export const eliminarProducto = async (id) => {
  try {
    const response = await api.delete(`/productos/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar producto ${id}:`, error);
    throw error;
  }
};

// Exportar todas las funciones como default también
export default {
  getProductos,
  getProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
};
