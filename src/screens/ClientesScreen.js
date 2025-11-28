import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IconButton, Avatar } from "@mui/material";
import DashboardLayout from "../components/layout/DashboardLayout";
import ClienteModal from "../components/ClienteModal";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import SuccessModal from "../components/SuccessModal";
import ConfirmTarjetaDesvinculacionModal from "../components/ConfirmTarjetaDesvinculacionModal";
import { useAuth } from "../context/AuthContext";
import clienteService from "../services/clientesService";
import Alert from "@blazejkustra/react-native-alert";

export default function ClientesScreen({ onNavigate, currentScreen }) {
  const [clientes, setClientes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [clienteAEliminar, setClienteAEliminar] = useState(null);
  const [desvincularModalVisible, setDesvincularModalVisible] = useState(false);
  const [clienteADesvincular, setClienteADesvincular] = useState(null);
  const [desvinculandoTarjeta, setDesvinculandoTarjeta] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { user, logout } = useAuth();
  const userName = user?.usuario || "Usuario";

  // Estabilizar la referencia de logout con useCallback
  const handleLogout = useCallback(() => {
    if (logout && typeof logout === 'function') {
      logout();
    }
  }, [logout]);

  // Cargar clientes desde la API al montar el componente
  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clienteService.getClientes();

      // El backend devuelve { success, data, message }
      // El servicio ya devuelve response.data, así que accedemos directamente a .data
      const clientesData = response.data || [];

      // Asegurarse de que cada cliente tenga un ID válido
      const clientesConId = clientesData.map((cliente) => ({
        ...cliente,
        id:
          cliente.id ||
          cliente.idCliente ||
          Math.random().toString(36).substr(2, 9),
      }));
      setClientes(clientesConId);
    } catch (error) {
      // Error ya logueado en el interceptor de axios
      // Manejo específico de errores
      if (error.response?.status === 401) {
        setError("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
        // El interceptor ya limpió el token, el AuthContext redirigirá
        setTimeout(() => logout(), 2000);
      } else if (error.response?.status === 403) {
        setError("No tienes permisos para ver los clientes.");
      } else if (error.code === "ERR_NETWORK" || !error.response) {
        setError(
          "No se pudo conectar con el servidor. Verifica tu conexión a internet."
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Error al cargar los clientes. Por favor, intenta nuevamente."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtrar clientes según la búsqueda manual
  const clientesFiltrados = clientes.filter((cliente) => {
    const terminoBusqueda = busqueda.toLowerCase().trim();
    if (!terminoBusqueda) return true;

    return (
      cliente.nombre?.toLowerCase().includes(terminoBusqueda) ||
      cliente.apellido?.toLowerCase().includes(terminoBusqueda) ||
      cliente.telefono?.includes(terminoBusqueda) ||
      cliente.email?.toLowerCase().includes(terminoBusqueda)
    );
  });

  // Definir columnas para el DataGrid
  const columns = [
    {
      field: "fotoPerfil",
      headerName: "Foto",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        if (!params || !params.row) return null;
        return (
          <View style={styles.avatarContainer}>
            <Avatar
              src={params.row.fotoPerfilUrl}
              alt={`${params.row.nombre} ${params.row.apellido}`}
              sx={{ width: 40, height: 40 }}
            >
              {params.row.nombre?.[0]}
              {params.row.apellido?.[0]}
            </Avatar>
          </View>
        );
      },
    },
    {
      field: "nombre",
      headerName: "Nombre",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "apellido",
      headerName: "Apellido",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: "telefono",
      headerName: "Teléfono",
      flex: 1,
      minWidth: 130,
      valueGetter: (value, row) => row?.telefono || "-",
      renderCell: (params) => (
        <Text
          style={{
            color: params.row?.telefono ? "#333" : "#999",
            fontStyle: params.row?.telefono ? "normal" : "italic",
          }}
        >
          {params.row?.telefono || "No especificado"}
        </Text>
      ),
    },
    {
      field: "acciones",
      headerName: "Acciones",
      minWidth: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        if (!params || !params.row) return null;
        return (
          <View style={styles.actionsContainer}>
            <IconButton
              onClick={() => handleEditarCliente(params.row)}
              color="primary"
              size="small"
              title="Editar"
            >
              <MaterialCommunityIcons name="pencil" size={20} color="#1976d2" />
            </IconButton>
            {params.row?.idTarjeta && (
              <IconButton
                onClick={() => handleDesvincularTarjeta(params.row)}
                color="warning"
                size="small"
                title="Desvincular tarjeta"
              >
                <MaterialCommunityIcons
                  name="credit-card-off-outline"
                  size={20}
                  color="#ff9800"
                />
              </IconButton>
            )}
            <IconButton
              onClick={() => handleEliminarCliente(params.row.id)}
              color="error"
              size="small"
              title="Eliminar"
            >
              <MaterialCommunityIcons name="delete" size={20} color="#d32f2f" />
            </IconButton>
          </View>
        );
      },
    },
  ];

  // Función para abrir modal de agregar cliente
  const handleAgregarCliente = () => {
    setClienteSeleccionado(null);
    setModalVisible(true);
  };

  // Función para abrir modal de editar cliente
  const handleEditarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setModalVisible(true);
  };

  // Función para abrir modal de confirmación de eliminación
  const handleEliminarCliente = (clienteId) => {
    setClienteAEliminar(clienteId);
    setConfirmModalVisible(true);
  };

  // Función para abrir modal de desvinculación de tarjeta
  const handleDesvincularTarjeta = (cliente) => {
    setClienteADesvincular(cliente);
    setDesvincularModalVisible(true);
  };

  // Función para confirmar la eliminación
  const confirmarEliminacion = async () => {
    if (!clienteAEliminar) return;

    try {
      setLoading(true);
      await clienteService.eliminarCliente(clienteAEliminar);

      // Actualizar la lista local
      setClientes(clientes.filter((c) => c.id !== clienteAEliminar));
      setConfirmModalVisible(false);
      setClienteAEliminar(null);

      Alert.alert("Éxito", "Cliente eliminado correctamente");
    } catch (error) {
      // Error ya logueado en el interceptor de axios
      // Cerrar el modal de confirmación
      setConfirmModalVisible(false);

      // Manejo específico según el código de error
      if (error.response?.status === 401) {
        Alert.alert(
          "Sesión expirada",
          "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          [{ text: "OK", onPress: () => logout() }]
        );
      } else if (error.response?.status === 409) {
        // Error de conflicto - cliente tiene registros relacionados
        Alert.alert(
          "No se puede eliminar el cliente",
          "Este cliente tiene registros relacionados (suscripciones, movimientos, etc.) y no puede ser eliminado. " +
            "Si deseas desactivar este cliente, considera actualizar su estado en lugar de eliminarlo.",
          [{ text: "Entendido", style: "default" }]
        );
      } else if (error.response?.status === 404) {
        // Cliente no encontrado
        Alert.alert(
          "Cliente no encontrado",
          "El cliente que intentas eliminar no existe o ya fue eliminado.",
          [
            {
              text: "Actualizar lista",
              onPress: () => cargarClientes(),
              style: "default",
            },
          ]
        );
      } else {
        // Otros errores
        const mensaje =
          error.response?.data?.message ||
          "Error al eliminar el cliente. Por favor, intenta nuevamente.";
        Alert.alert("Error", mensaje);
      }

      setClienteAEliminar(null);
    } finally {
      setLoading(false);
    }
  };

  // Función para cancelar la eliminación
  const cancelarEliminacion = () => {
    setConfirmModalVisible(false);
    setClienteAEliminar(null);
  };

  const cancelarDesvinculacionTarjeta = () => {
    if (desvinculandoTarjeta) return;
    setDesvincularModalVisible(false);
    setClienteADesvincular(null);
  };

  const confirmarDesvinculacionTarjeta = async () => {
    if (!clienteADesvincular) return;

    try {
      setDesvinculandoTarjeta(true);
      const response = await clienteService.desvincularTarjeta(
        clienteADesvincular.id
      );

      setClientes((prevClientes) =>
        prevClientes.map((cliente) =>
          cliente.id === clienteADesvincular.id
            ? { ...cliente, idTarjeta: null, tarjeta: null }
            : cliente
        )
      );

      setSuccessMessage(
        response?.message ||
          `Tarjeta desvinculada correctamente de ${
            clienteADesvincular.nombre || ""
          } ${clienteADesvincular.apellido || ""}`
      );
      setShowSuccessModal(true);
      setDesvincularModalVisible(false);
      setClienteADesvincular(null);
    } catch (error) {
      console.error("Error al desvincular tarjeta del cliente:", error);

      if (error.response?.status === 401) {
        Alert.alert(
          "Sesión expirada",
          "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          [{ text: "OK", onPress: () => logout() }]
        );
      } else if (error.response?.status === 403) {
        Alert.alert(
          "Sin permisos",
          "No tienes permisos para realizar esta acción."
        );
      } else if (error.response?.status === 404) {
        Alert.alert(
          "Cliente no encontrado",
          "El cliente no existe o ya fue modificado. Refrescando la lista...",
          [
            {
              text: "Aceptar",
              onPress: () => cargarClientes(),
            },
          ]
        );
      } else if (error.response?.status === 400) {
        Alert.alert(
          "Operación no válida",
          error.response?.data?.message ||
            "El cliente no tiene una tarjeta asociada."
        );
      } else {
        const mensaje =
          error.response?.data?.message ||
          "Error al desvincular la tarjeta. Por favor, intenta nuevamente.";
        Alert.alert("Error", mensaje);
      }
    } finally {
      setDesvinculandoTarjeta(false);
    }
  };

  // Función para guardar cliente (agregar o editar)
  const handleGuardarCliente = async (formData, clienteId) => {
    try {
      setLoading(true);

      if (clienteId) {
        // Editar cliente existente
        const response = await clienteService.actualizarCliente(
          clienteId,
          formData
        );

        // El backend devuelve { success, data, message }
        // El servicio ya devuelve response.data, así que accedemos directamente a .data
        const clienteActualizado = response.data;

        // Actualizar la lista local
        setClientes(
          clientes.map((c) => (c.id === clienteId ? clienteActualizado : c))
        );

        Alert.alert("Éxito", "Cliente actualizado correctamente");
      } else {
        // Crear nuevo cliente
        const response = await clienteService.crearCliente(formData);

        // El backend devuelve { success, data, message }
        // El servicio ya devuelve response.data, así que accedemos directamente a .data
        const clienteCreado = response.data;

        // Agregar a la lista local
        setClientes([...clientes, clienteCreado]);

        Alert.alert("Éxito", "Cliente creado correctamente");
      }

      setModalVisible(false);
      setClienteSeleccionado(null);
    } catch (error) {
      // Error ya logueado en el interceptor de axios
      // Manejo específico según el código de error
      if (error.response?.status === 401) {
        Alert.alert(
          "Sesión expirada",
          "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          [{ text: "OK", onPress: () => logout() }]
        );
      } else if (error.response?.status === 409) {
        // Conflicto - email duplicado
        Alert.alert(
          "Email ya registrado",
          "Ya existe un cliente registrado con este correo electrónico. Por favor, utiliza otro email.",
          [{ text: "Entendido", style: "default" }]
        );
      } else if (error.response?.status === 404) {
        // Recurso no encontrado (ej: tarjeta)
        Alert.alert(
          "Recurso no encontrado",
          error.response?.data?.message || "El recurso especificado no existe.",
          [{ text: "Entendido", style: "default" }]
        );
      } else if (error.response?.status === 400) {
        // Validación fallida
        Alert.alert(
          "Datos inválidos",
          error.response?.data?.message ||
            "Por favor, verifica los datos ingresados.",
          [{ text: "Entendido", style: "default" }]
        );
      } else {
        // Otros errores
        const mensaje =
          error.response?.data?.message ||
          "Error al guardar el cliente. Por favor, intenta nuevamente.";
        Alert.alert("Error", mensaje);
      }
    } finally {
  return (
    <DashboardLayout
      userName={userName}
      currentScreen={currentScreen}
      onNavigate={onNavigate}
      onLogout={handleLogout}
    > userName={userName}
      currentScreen={currentScreen}
      onNavigate={onNavigate}
      onLogout={logout}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Administrar Clientes</Text>
        </View>

        {/* Controles superiores: Buscador y Botón Agregar */}
        <View style={styles.controlsContainer}>
          <View style={styles.controlsRow}>
            {/* Buscador */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color="#666"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre, apellido, email o teléfono..."
                placeholderTextColor="#999"
                value={busqueda}
                onChangeText={setBusqueda}
              />
              {busqueda.length > 0 && (
                <TouchableOpacity
                  onPress={() => setBusqueda("")}
                  style={styles.clearButton}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Botón Agregar */}
            <TouchableOpacity
              style={styles.agregarButton}
              onPress={handleAgregarCliente}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.agregarButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mensaje de error si existe */}
        {error && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={20}
              color="#f44336"
            />
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              onPress={cargarClientes}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading indicator */}
        {loading && clientes.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Cargando clientes...</Text>
          </View>
        )}

        {/* DataGrid con filtrado y ordenamiento nativo */}
        {!loading && !error && clientesFiltrados.length > 0 && (
          <DataTable rows={clientesFiltrados} columns={columns} pageSize={10} />
        )}

        {/* Estado vacío */}
        {!loading && !error && clientesFiltrados.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={80}
              color="#ccc"
            />
            <Text style={styles.emptyStateTitle}>
              {busqueda
                ? "No se encontraron clientes"
                : "No hay clientes registrados"}
            </Text>
            <Text style={styles.emptyStateText}>
              {busqueda
                ? "Intenta con otros términos de búsqueda"
                : "Comienza agregando tu primer cliente"}
            </Text>
            {!busqueda && (
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleAgregarCliente}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                <Text style={styles.emptyStateButtonText}>Agregar Cliente</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Modal para agregar/editar cliente */}
        <ClienteModal
          visible={modalVisible}
          cliente={clienteSeleccionado}
          onClose={() => {
            setModalVisible(false);
            setClienteSeleccionado(null);
          }}
          onGuardar={handleGuardarCliente}
        />

        {/* Modal de confirmación para eliminar */}
        <ConfirmModal
          visible={confirmModalVisible}
          title="Confirmar eliminación"
          message="¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer."
          onConfirm={confirmarEliminacion}
          onCancel={cancelarEliminacion}
        />

        <ConfirmTarjetaDesvinculacionModal
          visible={desvincularModalVisible}
          cliente={clienteADesvincular}
          loading={desvinculandoTarjeta}
          onConfirm={confirmarDesvinculacionTarjeta}
          onCancel={cancelarDesvinculacionTarjeta}
        />

        <SuccessModal
          visible={showSuccessModal}
          title="Operación exitosa"
          message={successMessage}
          onClose={() => {
            setShowSuccessModal(false);
            setSuccessMessage("");
          }}
          autoCloseDelay={3000}
        />
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  controlsContainer: {
    marginBottom: 20,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    outlineStyle: "none",
  },
  clearButton: {
    marginLeft: 8,
  },
  agregarButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  agregarButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  avatarContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorMessage: {
    flex: 1,
    color: "#c62828",
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: "#f44336",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
