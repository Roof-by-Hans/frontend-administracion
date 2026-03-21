import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IconButton } from "@mui/material";
import DashboardLayout from "../components/layout/DashboardLayout";
import UsuarioModal from "../components/UsuarioModal";
import DataTable from "../components/DataTable";
import { useAuth } from "../context/AuthContext";
import usuarioService from "../services/usuarioService";
import Alert from "@blazejkustra/react-native-alert";

const { getUsuarios, crearUsuario, actualizarUsuario, toggleUsuario } = usuarioService;

export default function GestionUsuariosScreen({ onNavigate, currentScreen }) {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const { user, logout } = useAuth();
  const userName = user?.usuario || "Usuario";

    useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      setError(null);
      const data = await getUsuarios();
      const usuariosData = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const usuariosConId = usuariosData.map((usuario) => ({
        ...usuario,
        id:
          usuario.id ||
          usuario.idUsuario ||
          Math.random().toString(36).substr(2, 9),
      }));

      setUsuarios(usuariosConId);
    } catch (err) {
      setError(err.message);
      console.error("Error al cargar usuarios:", err);
    } finally {
      setCargando(false);
    }
  };

    const usuariosFiltrados = (Array.isArray(usuarios) ? usuarios : []).filter((usuario) => {
    const terminoBusqueda = busqueda.toLowerCase().trim();    if (terminoBusqueda) {
      const nombreUsuario = usuario.nombreUsuario?.toLowerCase() || "";
      const roles = usuario.roles?.join(" ").toLowerCase() || "";
      if (!nombreUsuario.includes(terminoBusqueda) && !roles.includes(terminoBusqueda)) {
        return false;
      }
    }

    return true;
  });  const usuariosParaTabla = usuariosFiltrados.map((usuario) => ({
    id: usuario.id,
    nombreUsuario: usuario.nombreUsuario,
    roles: usuario.roles?.join(", ") || "Sin roles",
    rolesArray: usuario.roles || [],
    activoBool: usuario.activo,
  }));
  const columns = [
    {
      field: "id",
      headerName: "ID",
      width: 80,
    },
    {
      field: "nombreUsuario",
      headerName: "Usuario",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "roles",
      headerName: "Roles",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "estado",
      headerName: "Estado",
      width: 100,
      sortable: true,
      renderCell: (params) => {
        const activo = params.row.activoBool;
        return (
          <TouchableOpacity
            onPress={() => handleToggleUsuario(params.row)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: activo ? "#e8f5e9" : "#ffebee",
              borderWidth: 1,
              borderColor: activo ? "#4CAF50" : "#f44336",
            }}
          >
            <Text style={{
              color: activo ? "#2e7d32" : "#c62828",
              fontSize: 12,
              fontWeight: "600",
            }}>
              {activo ? "Activo" : "Inactivo"}
            </Text>
          </TouchableOpacity>
        );
      },
    },
    {
      field: "acciones",
      headerName: "Acciones",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          onClick={() => handleEditarUsuario(params.row)}
          color="primary"
          size="small"
          title="Editar"
        >
          <MaterialCommunityIcons name="pencil" size={20} color="#1976d2" />
        </IconButton>
      ),
    },
  ];

    const handleToggleUsuario = async (usuarioRow) => {
    try {
      setCargando(true);
      const response = await toggleUsuario(usuarioRow.id);      await cargarUsuarios();
      
      const nuevoEstado = response.data?.activo === 1 ? "habilitado" : "deshabilitado";
      Alert.alert("Éxito", `Usuario ${nuevoEstado} correctamente.`);
    } catch (error) {
      console.error("Error al togglear usuario:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "No se pudo cambiar el estado del usuario."
      );
    } finally {
      setCargando(false);
    }
  };

  const handleAgregarUsuario = () => {
    setUsuarioEditando(null);
    setModalVisible(true);
  };

  const handleEditarUsuario = (usuario) => {    const usuarioCompleto = usuarios.find((u) => u.id === usuario.id);
    setUsuarioEditando(usuarioCompleto || usuario);
    setModalVisible(true);
  };

  const handleGuardarUsuario = async (datosUsuario) => {
    try {
      setCargando(true);

      const formData = new FormData();
      formData.append("nombreUsuario", datosUsuario.nombreUsuario);
      formData.append("activo", datosUsuario.activo ? "true" : "false");
      if (datosUsuario.contrasena) {
        formData.append("contrasena", datosUsuario.contrasena);
      }
      if (datosUsuario.roles) {
        datosUsuario.roles.forEach((rol) => formData.append("roles[]", rol));
      }      formData.append("email", datosUsuario.email ?? "");

      if (usuarioEditando) {
        await actualizarUsuario(usuarioEditando.id, formData);
        Alert.alert("Éxito", "Usuario actualizado correctamente");
      } else {
        await crearUsuario(formData);
        Alert.alert("Éxito", "Usuario creado correctamente");
      }

      setModalVisible(false);
      setUsuarioEditando(null);
      await cargarUsuarios();
    } catch (err) {
      const mensaje =
        err.response?.data?.message ||
        err.message ||
        "No se pudo guardar el usuario";
      Alert.alert("Error", mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <DashboardLayout
      onNavigate={onNavigate}
      currentScreen={currentScreen}
      userName={userName}
      onLogout={logout}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Gestión de Usuarios</Text>
        </View>

        {/* Mostrar error si existe */}
        {error && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={20}
              color="#d32f2f"
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={cargarUsuarios}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

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
                placeholder="Buscar por nombre o rol..."
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

             Agregar */}
            <TouchableOpacity
              style={[styles.addButton, cargando && styles.addButtonDisabled]}
              onPress={handleAgregarUsuario}
              disabled={cargando}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Indicador de carga */}
        {cargando && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Cargando usuarios...</Text>
          </View>
        )}

        {/* DataGrid con filtrado y ordenamiento nativo */}
        {!cargando && (
          <DataTable
            rows={usuariosParaTabla}
            columns={columns}
            pageSize={10}
            rowHeight={52}
          />
        )}

        {/* Modal para agregar/editar usuario */}
        <UsuarioModal
          visible={modalVisible}
          usuario={usuarioEditando}
          onClose={() => {
            setModalVisible(false);
            setUsuarioEditando(null);
          }}
          onSave={handleGuardarUsuario}
        />
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
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
  errorText: {
    flex: 1,
    color: "#c62828",
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: "#d32f2f",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  controlsContainer: {
    marginBottom: 20,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    padding: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  estadoBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  estadoActivo: {
    backgroundColor: "#e8f5e9",
  },
  estadoInactivo: {
    backgroundColor: "#ffebee",
  },
  textoEstado: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
});
