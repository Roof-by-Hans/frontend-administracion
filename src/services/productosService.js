import api from './api';

export const getProductos = async (params = {}) => {
  try {
    let endpoint = '/productos';
    
  
    if (params.estado && params.estado !== 'todos') {
      endpoint = `/productos?estado=${params.estado}`;
    }
    
    const response = await api.get(endpoint);
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


export const crearProducto = async (productoData, imagen = null) => {
  try {
    const formData = new FormData();
    
        formData.append('nombre', productoData.nombre);
    formData.append('precio_unitario', productoData.precio_unitario.toString());
    formData.append('id_categoria', productoData.id_categoria.toString());
    
    if (productoData.descripcion) {
      formData.append('descripcion', productoData.descripcion);
    }
    
        if (imagen) {
      if (imagen.file) {
        formData.append('imagen', imagen.file, imagen.name || 'producto.jpg');
      }
      else if (typeof window !== 'undefined' && imagen.uri.startsWith('blob:')) {
        const response = await fetch(imagen.uri);
        const blob = await response.blob();
        formData.append('imagen', blob, imagen.name || 'producto.jpg');
      } 
      else {
        formData.append('imagen', {
          uri: imagen.uri,
          type: imagen.type || 'image/jpeg',
          name: imagen.name || 'producto.jpg',
        });
      }
    }
    
    const response = await api.post('/productos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};


export const actualizarProducto = async (id, productoData, imagen = null) => {
  try {
    const formData = new FormData();
    
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
    
        if (imagen) {
      if (imagen.file) {
        formData.append('imagen', imagen.file, imagen.name || 'producto.jpg');
      }
      else if (typeof window !== 'undefined' && imagen.uri.startsWith('blob:')) {
        const response = await fetch(imagen.uri);
        const blob = await response.blob();
        formData.append('imagen', blob, imagen.name || 'producto.jpg');
      } 
      else {
        formData.append('imagen', {
          uri: imagen.uri,
          type: imagen.type || 'image/jpeg',
          name: imagen.name || 'producto.jpg',
        });
      }
    }
    
    const response = await api.put(`/productos/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
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
export default {
  getProductos,
  getProductosHabilitados,
  getProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  toggleProducto,
};
