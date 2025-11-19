import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Alert from "@blazejkustra/react-native-alert";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DashboardLayout from "../components/layout/DashboardLayout";
import PagoFacturaModal from "../components/PagoFacturaModal";
import { useAuth } from "../context/AuthContext";
import facturasService from "../services/facturasService";

export default function InvoicesScreen({ onNavigate, currentScreen }) {
  const [facturas, setFacturas] = useState([]);
  const [facturasFiltradas, setFacturasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("todas"); // todas, pendiente, pagada
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [pagoModalVisible, setPagoModalVisible] = useState(false);
  const [facturaExpandida, setFacturaExpandida] = useState(null);

  const { user, logout } = useAuth();
  const displayName = user?.usuario || "Usuario";
  const { width } = useWindowDimensions();
  const isCompact = width < 768;

  useEffect(() => {
    cargarFacturas();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [filtroEstado, facturas]);

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      const data = await facturasService.getFacturas();
      setFacturas(data.data || data || []);
    } catch (error) {
      console.error("Error al cargar facturas:", error);
      Alert.alert("Error", "No se pudieron cargar las facturas");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarFacturas();
    setRefreshing(false);
  }, []);

  const aplicarFiltros = () => {
    let resultado = [...facturas];

    if (filtroEstado !== "todas") {
      resultado = resultado.filter((f) => f.estado === filtroEstado);
    }

    // Ordenar por fecha descendente
    resultado.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    setFacturasFiltradas(resultado);
  };

  const handlePagarFactura = (factura) => {
    setFacturaSeleccionada(factura);
    setPagoModalVisible(true);
  };

  const handlePagoExitoso = async () => {
    setPagoModalVisible(false);
    setFacturaSeleccionada(null);
    await cargarFacturas();
  };

  const toggleExpandirFactura = (idFactura) => {
    setFacturaExpandida(facturaExpandida === idFactura ? null : idFactura);
  };

  const renderFactura = (factura) => {
    const esExpandida = facturaExpandida === factura.id;
    const estadoColor =
      factura.estado === "pagada"
        ? "#34C759"
        : factura.estado === "pendiente"
        ? "#FF9500"
        : "#8E8E93";

    const estadoIcono =
      factura.estado === "pagada"
        ? "check-circle"
        : factura.estado === "pendiente"
        ? "clock-outline"
        : "alert-circle-outline";

    return (
      <View key={factura.id} style={styles.facturaCard}>
        <TouchableOpacity
          style={styles.facturaHeader}
          onPress={() => toggleExpandirFactura(factura.id)}
        >
          <View style={styles.facturaHeaderLeft}>
            <View style={styles.facturaNumero}>
              <MaterialCommunityIcons name="receipt" size={20} color="#007AFF" />
              <Text style={styles.facturaId}>Factura #{factura.id}</Text>
            </View>
            <Text style={styles.facturaFecha}>
              {new Date(factura.fecha).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <View style={styles.facturaHeaderRight}>
            <View style={[styles.estadoBadge, { backgroundColor: estadoColor + "20" }]}>
              <MaterialCommunityIcons name={estadoIcono} size={16} color={estadoColor} />
              <Text style={[styles.estadoText, { color: estadoColor }]}>
                {factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1)}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={esExpandida ? "chevron-up" : "chevron-down"}
              size={24}
              color="#666"
            />
          </View>
        </TouchableOpacity>

        <View style={styles.facturaInfo}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account" size={18} color="#666" />
            <Text style={styles.infoText}>
              {factura.cliente?.nombre} {factura.cliente?.apellido}
            </Text>
          </View>

          {factura.mesa && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="table-chair" size={18} color="#666" />
              <Text style={styles.infoText}>Mesa {factura.mesa.numero}</Text>
            </View>
          )}

          {factura.grupo && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="table-furniture" size={18} color="#666" />
              <Text style={styles.infoText}>Grupo: {factura.grupo.nombre}</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalMonto}>${parseFloat(factura.total).toFixed(2)}</Text>
          </View>
        </View>

        {esExpandida && factura.detalles && factura.detalles.length > 0 && (
          <View style={styles.detallesContainer}>
            <Text style={styles.detallesTitle}>Detalle de productos:</Text>
            {factura.detalles.map((detalle, index) => (
              <View key={index} style={styles.detalleItem}>
                <View style={styles.detalleInfo}>
                  <Text style={styles.detalleNombre}>
                    {detalle.producto?.nombre || "Producto"}
                  </Text>
                  <Text style={styles.detalleCantidad}>
                    {detalle.cantidad} x ${parseFloat(detalle.precio_unitario).toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.detalleSubtotal}>
                  ${parseFloat(detalle.subtotal).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {factura.estado === "pendiente" && (
          <View style={styles.facturaAcciones}>
            <TouchableOpacity
              style={styles.botonPagar}
              onPress={() => handlePagarFactura(factura)}
            >
              <MaterialCommunityIcons name="credit-card" size={20} color="#fff" />
              <Text style={styles.botonPagarText}>Pagar Factura</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const estadisticas = {
    total: facturas.length,
    pendientes: facturas.filter((f) => f.estado === "pendiente").length,
    pagadas: facturas.filter((f) => f.estado === "pagada").length,
    montoPendiente: facturas
      .filter((f) => f.estado === "pendiente")
      .reduce((sum, f) => sum + parseFloat(f.total), 0),
  };

  return (
    <DashboardLayout
      userName={displayName}
      onLogout={logout}
      onNavigate={onNavigate}
      currentScreen={currentScreen}
    >
      <View style={styles.wrapper}>
        <View style={styles.headerSection}>
          <View>
            <Text
              style={[styles.pageTitle, isCompact && styles.pageTitleCompact]}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              Facturas
            </Text>
            <Text style={[styles.pageSubtitle, isCompact && styles.pageSubtitleCompact]}>
              Gestiona y revisa las facturas generadas
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <MaterialCommunityIcons name="refresh" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Estadísticas */}
        <View style={[styles.statsContainer, isCompact && styles.statsContainerCompact]}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="receipt-text" size={24} color="#007AFF" />
            <Text style={styles.statNumber}>{estadisticas.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#FF9500" />
            <Text style={styles.statNumber}>{estadisticas.pendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#34C759" />
            <Text style={styles.statNumber}>{estadisticas.pagadas}</Text>
            <Text style={styles.statLabel}>Pagadas</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="currency-usd" size={24} color="#FF3B30" />
            <Text style={styles.statNumber}>${estadisticas.montoPendiente.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Por Cobrar</Text>
          </View>
        </View>

        {/* Filtros */}
        <View style={[styles.filtrosContainer, isCompact && styles.filtrosContainerCompact]}>
          <TouchableOpacity
            style={[
              styles.filtroBtn,
              filtroEstado === "todas" && styles.filtroBtnActivo,
            ]}
            onPress={() => setFiltroEstado("todas")}
          >
            <Text
              style={[
                styles.filtroBtnText,
                filtroEstado === "todas" && styles.filtroBtnTextActivo,
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filtroBtn,
              filtroEstado === "pendiente" && styles.filtroBtnActivo,
            ]}
            onPress={() => setFiltroEstado("pendiente")}
          >
            <Text
              style={[
                styles.filtroBtnText,
                filtroEstado === "pendiente" && styles.filtroBtnTextActivo,
              ]}
            >
              Pendientes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filtroBtn,
              filtroEstado === "pagada" && styles.filtroBtnActivo,
            ]}
            onPress={() => setFiltroEstado("pagada")}
          >
            <Text
              style={[
                styles.filtroBtnText,
                filtroEstado === "pagada" && styles.filtroBtnTextActivo,
              ]}
            >
              Pagadas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Facturas */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando facturas...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.facturasContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {facturasFiltradas.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="receipt-text-outline" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>No hay facturas</Text>
                <Text style={styles.emptyText}>
                  {filtroEstado === "todas"
                    ? "Aún no se han generado facturas"
                    : `No hay facturas ${filtroEstado}s`}
                </Text>
              </View>
            ) : (
              facturasFiltradas.map(renderFactura)
            )}
          </ScrollView>
        )}
      </View>

      {/* Modal de Pago */}
      {facturaSeleccionada && (
        <PagoFacturaModal
          visible={pagoModalVisible}
          onClose={() => {
            setPagoModalVisible(false);
            setFacturaSeleccionada(null);
          }}
          factura={facturaSeleccionada}
          onPagoExitoso={handlePagoExitoso}
        />
      )}
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingTop: 16,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 40,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  pageTitleCompact: {
    fontSize: 32,
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#6b6b6b",
    marginTop: 8,
  },
  pageSubtitleCompact: {
    fontSize: 14,
  },
  refreshButton: {
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statsContainerCompact: {
    flexDirection: "column",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f1f1f",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  filtrosContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  filtrosContainerCompact: {
    flexWrap: "wrap",
  },
  filtroBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filtroBtnActivo: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filtroBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  filtroBtnTextActivo: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
  },
  facturasContainer: {
    flex: 1,
  },
  facturaCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  facturaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  facturaHeaderLeft: {
    flex: 1,
  },
  facturaNumero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  facturaId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  facturaFecha: {
    fontSize: 12,
    color: "#666",
  },
  facturaHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: "600",
  },
  facturaInfo: {
    padding: 16,
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f1f1f",
  },
  totalMonto: {
    fontSize: 20,
    fontWeight: "700",
    color: "#007AFF",
  },
  detallesContainer: {
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  detallesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f1f1f",
    marginBottom: 12,
  },
  detalleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detalleInfo: {
    flex: 1,
  },
  detalleNombre: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  detalleCantidad: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  detalleSubtotal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  facturaAcciones: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  botonPagar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#34C759",
    padding: 14,
    borderRadius: 8,
  },
  botonPagarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  placeholderCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  placeholderCardCompact: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2f2f2f",
  },
  placeholderText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
