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

// Obtener todos los mozos
export const getMozos = async () => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/mozos`, {
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
      throw new Error(data.message || "Error al obtener mozos");
    }

    return data.data;
  } catch (error) {
    console.error("Error en getMozos:", error);
    throw error;
  }
};

// Obtener solo mozos activos
export const getMozosActivos = async () => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/mozos/activos`, {
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
      throw new Error(data.message || "Error al obtener mozos activos");
    }

    return data.data;
  } catch (error) {
    console.error("Error en getMozosActivos:", error);
    throw error;
  }
};

// Obtener un mozo por ID
export const getMozoById = async (id) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/mozos/${id}`, {
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
      throw new Error(data.message || "Error al obtener mozo");
    }

    return data.data;
  } catch (error) {
    console.error("Error en getMozoById:", error);
    throw error;
  }
};
