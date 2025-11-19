import API_URL from "../config/api";

// Obtener el token del almacenamiento
const getToken = () => {
  return localStorage.getItem("token");
};

// Manejar token inválido
const handleInvalidToken = (data) => {
  // Solo redirigir si el token realmente expiró o es inválido
  if (
    data &&
    (data.expired ||
      data.message?.includes("Token") ||
      data.message?.includes("token"))
  ) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }
};

// Obtener todos los usuarios
export const getUsuarios = async () => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/usuarios`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      handleInvalidToken(data);
      throw new Error(data.message || "Sesión expirada");
    }

    if (!response.ok) {
      throw new Error(data.message || "Error al obtener usuarios");
    }

    return data.data;
  } catch (error) {
    console.error("Error en getUsuarios:", error);
    throw error;
  }
};

// Obtener un usuario por ID
export const getUsuarioById = async (id) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      handleInvalidToken(data);
      throw new Error(data.message || "Sesión expirada");
    }

    if (!response.ok) {
      throw new Error(data.message || "Error al obtener usuario");
    }

    return data.data;
  } catch (error) {
    console.error("Error en getUsuarioById:", error);
    throw error;
  }
};

// Crear un nuevo usuario
export const crearUsuario = async (usuarioData) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/usuarios`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(usuarioData),
    });

    const data = await response.json();

    if (response.status === 401) {
      handleInvalidToken(data);
      throw new Error(data.message || "Sesión expirada");
    }

    if (!response.ok) {
      throw new Error(data.message || "Error al crear usuario");
    }

    return data.data;
  } catch (error) {
    console.error("Error en crearUsuario:", error);
    throw error;
  }
};

// Actualizar un usuario
export const actualizarUsuario = async (id, usuarioData) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(usuarioData),
    });

    const data = await response.json();

    if (response.status === 401) {
      handleInvalidToken(data);
      throw new Error(data.message || "Sesión expirada");
    }

    if (!response.ok) {
      throw new Error(data.message || "Error al actualizar usuario");
    }

    return data.data;
  } catch (error) {
    console.error("Error en actualizarUsuario:", error);
    throw error;
  }
};

// Eliminar un usuario
export const eliminarUsuario = async (id) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      handleInvalidToken(data);
      throw new Error(data.message || "Sesión expirada");
    }

    if (!response.ok) {
      throw new Error(data.message || "Error al eliminar usuario");
    }

    return data;
  } catch (error) {
    console.error("Error en eliminarUsuario:", error);
    throw error;
  }
};
