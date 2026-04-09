import API_URL from "../config/api";

const getToken = () => {
  return localStorage.getItem("token");
};
const handleInvalidToken = (data) => {
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
    throw error;
  }
};

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
    throw error;
  }
};

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
    throw error;
  }
};
