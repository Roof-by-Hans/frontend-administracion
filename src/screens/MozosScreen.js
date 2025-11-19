import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DashboardLayout from "../components/layout/DashboardLayout";
import MozoModal from "../components/MozoModal";
import { getMozos, getMozosActivos } from "../services/mozoService";
import { useAuth } from "../context/AuthContext";

export default function MozosScreen({ onNavigate, currentScreen }) {
  const { user, logout } = useAuth();
  const displayName = user?.usuario || "Usuario";
  const [mozos, setMozos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [mozoEditando, setMozoEditando] = useState(null);
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
    return nombreUsuario.includes(busqueda.toLowerCase());
  });

  const handleAgregarMozo = () => {
    Alert.alert(
      "Información",
      "Para agregar un mozo, ve a 'Gestión de Usuarios' y asigna el rol 'Mozo' a un usuario"
    );
  };

  const handleEditarMozo = (mozo) => {
    Alert.alert(
      "Información",
      "Para editar un mozo, ve a 'Gestión de Usuarios'"
    );
  };

  const handleEliminarMozo = (id) => {
    Alert.alert(
      "Información",
      "Para eliminar un mozo, ve a 'Gestión de Usuarios'"
    );
  };

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
            </View>

            {/* Botón actualizar a la derecha */}
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

        {/* Tabla de mozos */}
        {!loading && !error && (
          <View style={styles.tableContainer}>
            {/* Header de la tabla */}
            <View style={styles.tableHeader}>
              <View style={styles.tableHeaderCell}>
                <Text style={styles.tableHeaderText}>Usuario</Text>
              </View>
              <View style={styles.tableHeaderCell}>
                <Text style={styles.tableHeaderText}>Estado</Text>
              </View>
              <View style={styles.tableHeaderCell}>
                <Text style={styles.tableHeaderText}>Roles</Text>
              </View>
            </View>

            {/* Filas de la tabla */}
            <ScrollView style={styles.tableBody}>
              {mozosFiltrados.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="account-tie"
                    size={48}
                    color="#ccc"
                  />
                  <Text style={styles.emptyStateText}>
                    {busqueda
                      ? "No se encontraron mozos"
                      : "No hay mozos activos. Ve a 'Gestión de Usuarios' para asignar el rol Mozo"}
                  </Text>
                </View>
              ) : (
                mozosFiltrados.map((mozo) => (
                  <View key={mozo.id} style={styles.tableRow}>
                    <View style={styles.tableCell}>
                      <Text style={styles.tableCellText}>
                        {mozo.nombreUsuario}
                      </Text>
                    </View>
                    <View style={styles.tableCell}>
                      <View
                        style={[
                          styles.estadoBadge,
                          mozo.activo
                            ? styles.estadoActivo
                            : styles.estadoInactivo,
                        ]}
                      >
                        <Text style={styles.estadoText}>
                          {mozo.activo ? "Activo" : "Inactivo"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tableCell}>
                      <View style={styles.rolesContainer}>
                        {mozo.roles &&
                          mozo.roles.map((rol, index) => (
                            <View key={index} style={styles.rolBadge}>
                              <Text style={styles.rolText}>{rol}</Text>
                            </View>
                          ))}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
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
    minWidth: 200,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1f1f1f",
    outlineStyle: "none",
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
  tableCell: {
    flex: 1,
    justifyContent: "center",
  },
  tableCellAcciones: {
    flex: 0.8,
    alignItems: "center",
  },
  tableCellText: {
    fontSize: 14,
    color: "#3f3f3f",
  },
  estadoBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  estadoActivo: {
    backgroundColor: "#D1FAE5",
  },
  estadoInactivo: {
    backgroundColor: "#FEE2E2",
  },
  estadoText: {
    fontSize: 12,
    fontWeight: "600",
  },
  rolesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  rolBadge: {
    backgroundColor: "#DBEAFE",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  rolText: {
    fontSize: 12,
    color: "#1E40AF",
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#E53935",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
  },
});
