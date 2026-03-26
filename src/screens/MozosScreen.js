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
import DataTable from "../components/DataTable";
import { getMozos, getMozosActivos } from "../services/mozoService";
import { useAuth } from "../context/AuthContext";

export default function MozosScreen({ onNavigate, currentScreen }) {
  const { user, logout } = useAuth();
  const displayName = user?.usuario || "Usuario";
  const [mozos, setMozos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar mozos al montar el componente
  useEffect(() => {
    cargarMozos();
  }, []);

  const cargarMozos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMozosActivos(); // Solo mozos activos
      setMozos(data);
    } catch (err) {
      setError(err.message);
      console.error("Error al cargar mozos:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar mozos
  const mozosFiltrados = mozos.filter((mozo) => {
    const nombreUsuario = mozo.nombreUsuario?.toLowerCase() || "";
    const nombre = mozo.nombre?.toLowerCase() || "";
    const apellido = mozo.apellido?.toLowerCase() || "";
    const busquedaLower = busqueda.toLowerCase();

    return (
      nombreUsuario.includes(busquedaLower) ||
      nombre.includes(busquedaLower) ||
      apellido.includes(busquedaLower)
    );
  });

  // Definir columnas para DataTable
  const columns = [
    {
      field: "nombreUsuario",
      headerName: "Usuario",
      width: 150,
      headerAlign: "center",
      align: "left",
    },
    {
      field: "nombre",
      headerName: "Nombre",
      flex: 1,
      minWidth: 150,
      headerAlign: "center",
      align: "left",
    },
    {
      field: "apellido",
      headerName: "Apellido",
      flex: 1,
      minWidth: 150,
      headerAlign: "center",
      align: "left",
    },
    {
      field: "activo",
      headerName: "Estado",
      width: 130,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <View
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            width: "100%",
          }}
        >
          <View
            style={[
              styles.estadoBadge,
              params.row.activo ? styles.estadoActivo : styles.estadoInactivo,
            ]}
          >
            <Text
              style={[
                styles.estadoText,
                { color: params.row.activo ? "#2e7d32" : "#c62828" },
              ]}
            >
              {params.row.activo ? "Activo" : "Inactivo"}
            </Text>
          </View>
        </View>
      ),
    },
    {
      field: "roles",
      headerName: "Roles",
      width: 130,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <View
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            width: "100%",
          }}
        >
          <View style={styles.rolesContainer}>
            {params.row.roles &&
              params.row.roles.map((rol, index) => (
                <View key={index} style={styles.rolBadge}>
                  <Text style={styles.rolText}>{rol}</Text>
                </View>
              ))}
          </View>
        </View>
      ),
    },
  ];

  return (
    <DashboardLayout
      userName={displayName}
      onLogout={logout}
      onNavigate={onNavigate}
      currentScreen={currentScreen}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mozos</Text>
        </View>

        {/* Controles superiores */}
        <View style={styles.controlsContainer}>
          <View style={styles.controlsRow}>
            {/* Buscar mozos */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color="#666"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre de usuario..."
                value={busqueda}
                onChangeText={setBusqueda}
                placeholderTextColor="#999"
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

            {/* Botón actualizar */}
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={cargarMozos}
              disabled={loading}
            >
              <Text style={styles.refreshButtonText}>Actualizar</Text>
              {loading ? (
                <ActivityIndicator size="small" color="#4A90E2" />
              ) : (
                <MaterialCommunityIcons
                  name="refresh"
                  size={16}
                  color="#4A90E2"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* DataTable */}
        {!loading && !error && (
          <DataTable
            rows={mozosFiltrados}
            columns={columns}
            pageSize={10}
            exportFileBaseName="mozos"
          />
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Cargando mozos...</Text>
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={48}
              color="#E53935"
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={cargarMozos}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty state */}
        {!loading && !error && mozosFiltrados.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-tie" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>
              {busqueda
                ? "No se encontraron mozos"
                : "No hay mozos activos. Ve a 'Gestión de Usuarios' para asignar el rol Mozo"}
            </Text>
          </View>
        )}
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f1f1f",
    flex: 1,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 6,
  },
  refreshButtonText: {
    color: "#4A90E2",
    fontSize: 13,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#E53935",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#4A90E2",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  controlsContainer: {
    marginBottom: 20,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  searchContainer: {
    flex: 1,
    minWidth: 300,
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  tableContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderCell: {
    flex: 1,
    justifyContent: "center",
  },
  tableHeaderCellAcciones: {
    flex: 0.8,
    alignItems: "center",
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f1f1f",
  },
  tableBody: {
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
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
  estadoText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  rolesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  rolBadge: {
    backgroundColor: "#e3f2fd",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  rolText: {
    fontSize: 11,
    color: "#1976d2",
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 20,
    textAlign: "center",
  },
});
