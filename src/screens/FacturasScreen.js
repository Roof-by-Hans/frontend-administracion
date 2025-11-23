import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IconButton, Chip } from "@mui/material";
import DashboardLayout from "../components/layout/DashboardLayout";
import DataTable from "../components/DataTable";
import { useAuth } from "../context/AuthContext";
import facturasService from "../services/facturasService";
import mesasService from "../services/mesasService";

export default function InvoicesScreen({ onNavigate, currentScreen }) {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas"); // todas, COBRADA, PENDIENTE
  const [modalVisible, setModalVisible] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [detallesFactura, setDetallesFactura] = useState([]);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [mesas, setMesas] = useState([]);
  const [grupos, setGrupos] = useState([]);

  const { user, logout } = useAuth();
  const displayName = user?.usuario || "Usuario";

  useEffect(() => {
    cargarFacturas();
  }, []);

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      const [facturasData, mesasData, gruposData] = await Promise.all([
        facturasService.getFacturas(),
        mesasService.getMesas(),
        mesasService.getGrupos(),
      ]);
      setFacturas(facturasData.data || facturasData || []);
      setMesas(mesasData.data || mesasData || []);
      setGrupos(gruposData.data || gruposData || []);
    } catch (error) {
      console.error("Error al cargar facturas:", error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerNombreMesa = (idMesa) => {
    const mesa = mesas.find((m) => m.id === idMesa);
    return mesa ? `Mesa ${mesa.numero}` : `Mesa ${idMesa}`;
  };

  const obtenerNombreGrupo = (idGrupo) => {
    const grupo = grupos.find((g) => g.id === idGrupo);
    return grupo ? grupo.nombre : `Grupo ${idGrupo}`;
  };

  const handleVerDetalles = async (factura) => {
    setFacturaSeleccionada(factura);
    setModalVisible(true);
    setLoadingDetalles(true);
    
    try {
      // Cargar detalles completos de la factura
      const detalles = await facturasService.getDetallesFactura(factura.id);
      setDetallesFactura(detalles.data || detalles || []);
    } catch (error) {
      console.error("Error al cargar detalles de factura:", error);
      setDetallesFactura([]);
    } finally {
      setLoadingDetalles(false);
    }
  };

  const handleCerrarModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setFacturaSeleccionada(null);
      setDetallesFactura([]);
    }, 300);
  };

  // Filtrar facturas
  const facturasFiltradas = facturas.filter((factura) => {
    const terminoBusqueda = busqueda.toLowerCase().trim();
    const cumpleFiltroEstado = filtroEstado === "todas" || factura.estado === filtroEstado;
    
    if (!cumpleFiltroEstado) return false;
    if (!terminoBusqueda) return true;

    const clienteNombre = `${factura.cliente?.nombre || ""} ${factura.cliente?.apellido || ""}`.toLowerCase();
    const facturaId = factura.id?.toString() || "";
    
    return (
      facturaId.includes(terminoBusqueda) ||
      clienteNombre.includes(terminoBusqueda) ||
      factura.mesa?.numero?.toString().includes(terminoBusqueda)
    );
  });

  // Definir columnas
  const columns = [
    {
      field: "id",
      headerName: "# Factura",
      width: 100,
    },
    {
      field: "fecha",
      headerName: "Fecha",
      width: 180,
      renderCell: (params) => (
        <Text>
          {new Date(params.row.fecha).toLocaleDateString("es-AR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      ),
    },
    {
      field: "cliente",
      headerName: "Cliente",
      flex: 1,
      minWidth: 180,
      valueGetter: (value, row) => 
        `${row.cliente?.nombre || ""} ${row.cliente?.apellido || ""}`.trim() || "Sin cliente",
    },
    {
      field: "mesa",
      headerName: "Mesa/Grupo",
      width: 130,
      valueGetter: (value, row) => {
        if (row.idMesa) return obtenerNombreMesa(row.idMesa);
        if (row.idGrupo) return obtenerNombreGrupo(row.idGrupo);
        return "-";
      },
    },
    {
      field: "total",
      headerName: "Total",
      width: 120,
      type: "number",
      renderCell: (params) => (
        <Text style={{ fontWeight: "600", color: "#2E7D32" }}>
          ${parseFloat(params.row.total || 0).toFixed(2)}
        </Text>
      ),
    },
    {
      field: "estado",
      headerName: "Estado",
      width: 130,
      renderCell: (params) => {
        const estado = params.row.estado;
        const color = estado === "COBRADA" ? "success" : estado === "PENDIENTE" ? "warning" : "default";
        const label = estado === "COBRADA" ? "Pagada" : estado === "PENDIENTE" ? "Pendiente" : estado;
        
        return (
          <Chip 
            label={label}
            color={color}
            size="small"
            icon={<MaterialCommunityIcons 
              name={estado === "COBRADA" ? "check-circle" : "clock-outline"} 
              size={16} 
            />}
          />
        );
      },
    },
    {
      field: "acciones",
      headerName: "Acciones",
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <View style={styles.actionsContainer}>
          <IconButton
            onClick={() => handleVerDetalles(params.row)}
            color="primary"
            size="small"
            title="Ver detalles"
          >
            <MaterialCommunityIcons name="eye" size={20} color="#1976d2" />
          </IconButton>
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
          <Text style={styles.title}>Gestionar Facturas</Text>
        </View>

        {/* Controles superiores */}
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
                placeholder="Buscar por # factura, cliente o mesa..."
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

            {/* Filtro de estado */}
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filtroEstado === "todas" && styles.filterButtonActive,
                ]}
                onPress={() => setFiltroEstado("todas")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filtroEstado === "todas" && styles.filterButtonTextActive,
                  ]}
                >
                  Todas
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filtroEstado === "COBRADA" && styles.filterButtonActive,
                ]}
                onPress={() => setFiltroEstado("COBRADA")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filtroEstado === "COBRADA" && styles.filterButtonTextActive,
                  ]}
                >
                  Pagadas
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filtroEstado === "PENDIENTE" && styles.filterButtonActive,
                ]}
                onPress={() => setFiltroEstado("PENDIENTE")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filtroEstado === "PENDIENTE" && styles.filterButtonTextActive,
                  ]}
                >
                  Pendientes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Loading indicator */}
        {loading && facturas.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Cargando facturas...</Text>
          </View>
        )}

        {/* DataTable */}
        {!loading && facturasFiltradas.length > 0 && (
          <DataTable rows={facturasFiltradas} columns={columns} pageSize={15} />
        )}

        {/* Estado vacío */}
        {!loading && facturasFiltradas.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="receipt-text-outline"
              size={80}
              color="#ccc"
            />
            <Text style={styles.emptyStateTitle}>
              {busqueda || filtroEstado !== "todas"
                ? "No se encontraron facturas"
                : "No hay facturas registradas"}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {busqueda || filtroEstado !== "todas"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Las facturas se generan automáticamente al cobrar mesas"}
            </Text>
          </View>
        )}

        {/* Modal de detalles */}
        <Modal
          visible={modalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={handleCerrarModal}
        >
          <Pressable style={styles.modalOverlay} onPress={handleCerrarModal}>
            <Pressable
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              {facturaSeleccionada && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Header del modal */}
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      Factura #{facturaSeleccionada.id}
                    </Text>
                    <TouchableOpacity
                      onPress={handleCerrarModal}
                      style={styles.closeButton}
                    >
                      <MaterialCommunityIcons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>

                  {/* Información general */}
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Información General</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Fecha:</Text>
                      <Text style={styles.infoValue}>
                        {new Date(facturaSeleccionada.fecha).toLocaleDateString(
                          "es-AR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Estado:</Text>
                      <Chip
                        label={
                          facturaSeleccionada.estado === "COBRADA"
                            ? "Pagada"
                            : "Pendiente"
                        }
                        color={
                          facturaSeleccionada.estado === "COBRADA"
                            ? "success"
                            : "warning"
                        }
                        size="small"
                      />
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Mesa/Grupo:</Text>
                      <Text style={styles.infoValue}>
                        {facturaSeleccionada.idMesa
                          ? obtenerNombreMesa(facturaSeleccionada.idMesa)
                          : facturaSeleccionada.idGrupo
                          ? obtenerNombreGrupo(facturaSeleccionada.idGrupo)
                          : "-"}
                      </Text>
                    </View>
                  </View>

                  {/* Información del cliente */}
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Cliente</Text>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Nombre:</Text>
                      <Text style={styles.infoValue}>
                        {facturaSeleccionada.cliente
                          ? `${facturaSeleccionada.cliente.nombre} ${
                              facturaSeleccionada.cliente.apellido
                            }`
                          : "Sin cliente"}
                      </Text>
                    </View>
                    {facturaSeleccionada.cliente?.email && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email:</Text>
                        <Text style={styles.infoValue}>
                          {facturaSeleccionada.cliente.email}
                        </Text>
                      </View>
                    )}
                    {facturaSeleccionada.cliente?.telefono && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Teléfono:</Text>
                        <Text style={styles.infoValue}>
                          {facturaSeleccionada.cliente.telefono}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Detalle de productos */}
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Detalle de Productos</Text>
                    {loadingDetalles ? (
                      <View style={styles.loadingDetallesContainer}>
                        <ActivityIndicator size="small" color="#4CAF50" />
                        <Text style={styles.loadingDetallesText}>
                          Cargando detalles...
                        </Text>
                      </View>
                    ) : detallesFactura && detallesFactura.length > 0 ? (
                      detallesFactura.map((detalle, index) => (
                        <View key={index} style={styles.productoCard}>
                          <View style={styles.productoHeader}>
                            <Text style={styles.productoNombre}>
                              {detalle.producto?.nombre || "Producto"}
                            </Text>
                            <Text style={styles.productoTotal}>
                              ${parseFloat(detalle.subtotal || 0).toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.productoDetalle}>
                            <Text style={styles.productoInfo}>
                              Cantidad: {detalle.cantidad || 1}
                            </Text>
                            <Text style={styles.productoInfo}>
                              Precio unitario: $
                              {parseFloat(detalle.precioUnitario || 0).toFixed(2)}
                            </Text>
                          </View>
                          {detalle.observaciones && (
                            <Text style={styles.productoObservaciones}>
                              Nota: {detalle.observaciones}
                            </Text>
                          )}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>
                        No hay productos registrados
                      </Text>
                    )}
                  </View>

                  {/* Total */}
                  <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>
                      ${parseFloat(facturaSeleccionada.total || 0).toFixed(2)}
                    </Text>
                  </View>
                </ScrollView>
              )}
            </Pressable>
          </Pressable>
        </Modal>
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
  filterContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterButtonActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
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
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    maxWidth: 600,
    width: "100%",
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "400",
  },
  productoCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  productoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  productoNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  productoTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  productoDetalle: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  productoInfo: {
    fontSize: 13,
    color: "#666",
  },
  productoObservaciones: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 20,
  },
  loadingDetallesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 10,
  },
  loadingDetallesText: {
    fontSize: 14,
    color: "#666",
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: "#e0e0e0",
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
  },
});
