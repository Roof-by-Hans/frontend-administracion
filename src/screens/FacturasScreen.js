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
  Platform,
} from "react-native";

/**
 * Componente date picker para web usando input nativo
 * Evita el problema de TouchableOpacity que no abre DateTimePicker en web
 */
function WebDateInput({ value, onChange, label, maxDate }) {
  const [dateValue, setDateValue] = useState(() => {
    if (!value) return "";
    const d = new Date(value);
    return d.toISOString().split("T")[0];
  });

  const handleChange = (e) => {
    const newDate = e.target.value;
    setDateValue(newDate);
    if (newDate && onChange) {
      onChange(null, new Date(newDate));
    }
  };

  return (
    <View style={styles.webDateInputContainer}>
      <Text style={styles.webDateInputLabel}>{label}</Text>
      <input
        type="date"
        value={dateValue}
        onChange={handleChange}
        max={maxDate ? new Date(maxDate).toISOString().split("T")[0] : undefined}
        style={styles.webDateInput}
      />
    </View>
  );
}
import DateTimePicker from "@react-native-community/datetimepicker";
import Alert from "@blazejkustra/react-native-alert";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IconButton, Chip } from "@mui/material";
import DashboardLayout from "../components/layout/DashboardLayout";
import DataTable from "../components/DataTable";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import facturasService from "../services/facturasService";
import mesasService from "../services/mesasService";
import transaccionesService from "../services/transaccionesService";

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
  const [modalReversionVisible, setModalReversionVisible] = useState(false);
  const [facturaARevertir, setFacturaARevertir] = useState(null);
  const [motivoReversion, setMotivoReversion] = useState("");
  const [revirtiendoFactura, setRevirtiendoFactura] = useState(false);

  // Estados para filtro de fechas
  const [fechaDesde, setFechaDesde] = useState(new Date());
  const [fechaHasta, setFechaHasta] = useState(new Date());
  const [showDatePickerDesde, setShowDatePickerDesde] = useState(false);
  const [showDatePickerHasta, setShowDatePickerHasta] = useState(false);
  const [warningFechas, setWarningFechas] = useState("");

  const { user, logout } = useAuth();
  const { on, off, emit } = useSocket();
  const displayName = user?.usuario || "Usuario";

  // Helper para detectar plataforma web
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    cargarFacturas();
  }, []);  useEffect(() => {
    emit("join:pedidos");

    const handlePagoRevertido = ({ data }) => {
      setFacturas((prev) =>
        prev.map((f) => (f.id === data.id ? { ...f, estado: "ANULADA" } : f))
      );
      setFacturaSeleccionada((prev) =>
        prev && prev.id === data.id ? { ...prev, estado: "ANULADA" } : prev
      );
    };

    on("pago:revertido", handlePagoRevertido);
    return () => off("pago:revertido", handlePagoRevertido);
  }, [on, off, emit]);

  const cargarFacturas = async (filtrosFecha = {}) => {
    try {
      setLoading(true);
      // Validar fechas si se proporcionan
      if (filtrosFecha.fechaDesde && filtrosFecha.fechaHasta) {
        const desde = new Date(filtrosFecha.fechaDesde);
        const hasta = new Date(filtrosFecha.fechaHasta);
        if (desde > hasta) {
          setWarningFechas("La fechaDesde no puede ser mayor que fechaHasta");
        } else {
          setWarningFechas("");
        }
      }
      
      const params = {
        desde: filtrosFecha.fechaDesde?.toISOString().split('T')[0],
        hasta: filtrosFecha.fechaHasta?.toISOString().split('T')[0],
      };
      
      const [facturasData, mesasData, gruposData] = await Promise.all([
        facturasService.getFacturas(params),
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

  // Handlers para filtro de fechas
  const handleFechaDesdeChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePickerDesde(false);
    }
    if (selectedDate) {
      setFechaDesde(selectedDate);
      // En web, necesitamos cerrar el picker después de seleccionar
      if (isWeb) {
        setShowDatePickerDesde(false);
      }
    }
  };

  const handleFechaHastaChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePickerHasta(false);
    }
    if (selectedDate) {
      setFechaHasta(selectedDate);
      // En web, necesitamos cerrar el picker después de seleccionar
      if (isWeb) {
        setShowDatePickerHasta(false);
      }
    }
  };

  const aplicarFiltroFechas = () => {
    if (fechaDesde > fechaHasta) {
      setWarningFechas("La fecha Desde no puede ser mayor que fecha Hasta");
      return;
    }
    setWarningFechas("");
    cargarFacturas({ fechaDesde, fechaHasta });
  };

  const limpiarFiltroFechas = () => {
    const hoy = new Date();
    setFechaDesde(hoy);
    setFechaHasta(hoy);
    setWarningFechas("");
    cargarFacturas({});
  };

  const handleVerDetalles = async (factura) => {
    setFacturaSeleccionada(factura);
    setModalVisible(true);
    setLoadingDetalles(true);
    
    try {
            const detalles = await facturasService.getDetallesFactura(factura.id);
      setDetallesFactura(detalles.data || detalles || []);
    } catch (error) {
      console.error("Error al cargar detalles de factura:", error);
      setDetallesFactura([]);
    } finally {
      setLoadingDetalles(false);
    }
  };

  const handleAbrirReversion = (factura) => {
    setFacturaARevertir(factura);
    setMotivoReversion("");
    setModalReversionVisible(true);
  };

  const handleConfirmarReversion = async () => {
    if (!motivoReversion.trim()) {
      Alert.alert("Error", "El motivo es obligatorio para revertir una factura.");
      return;
    }
    setRevirtiendoFactura(true);
    try {
      const { warning } = await transaccionesService.revertirFactura(
        facturaARevertir.id,
        motivoReversion.trim()
      );
      setModalReversionVisible(false);
      setFacturaARevertir(null);
      if (warning === "PAGO_REVERTIDO_SIN_CAJA") {
        Alert.alert(
          "Atención",
          `Factura #${facturaARevertir.id} revertida correctamente.\n\nNo había caja abierta. El egreso debe asentarse manualmente en la próxima apertura de caja.`
        );
      } else {
        Alert.alert("Éxito", `Factura #${facturaARevertir.id} revertida correctamente.`);
      }
    } catch (error) {
      const status = error?.response?.status;
      const mensaje = error?.response?.data?.message;
      if (status === 409) {
        Alert.alert("Sin efecto", "Esta factura ya estaba anulada.");
        setModalReversionVisible(false);
      } else if (status === 401) {
        Alert.alert("Sin permiso", "No tenés autorización para revertir pagos.");
      } else {
        Alert.alert("Error", mensaje ?? "No se pudo revertir la factura. Intentá de nuevo.");
      }
    } finally {
      setRevirtiendoFactura(false);
    }
  };

  const handleCerrarModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setFacturaSeleccionada(null);
      setDetallesFactura([]);
    }, 300);
  };

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
  });  const columns = [
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
        const color =
          estado === "COBRADA"
            ? "success"
            : estado === "PENDIENTE"
            ? "warning"
            : "default";
        const label =
          estado === "COBRADA"
            ? "Pagada"
            : estado === "PENDIENTE"
            ? "Pendiente"
            : "Anulada";
        const iconName =
          estado === "COBRADA"
            ? "check-circle"
            : estado === "PENDIENTE"
            ? "clock-outline"
            : "cancel";
        return (
          <Chip
            label={label}
            color={color}
            size="small"
            icon={<MaterialCommunityIcons name={iconName} size={16} />}
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
          {(params.row.estado === "COBRADA" || params.row.estado === "PENDIENTE") && (
            <IconButton
              onClick={() => handleAbrirReversion(params.row)}
              color="error"
              size="small"
              title="Revertir pago"
            >
              <MaterialCommunityIcons name="undo-variant" size={20} color="#d32f2f" />
            </IconButton>
          )}
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
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filtroEstado === "ANULADA" && styles.filterButtonActiveAnulada,
                ]}
                onPress={() => setFiltroEstado("ANULADA")}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filtroEstado === "ANULADA" && styles.filterButtonTextActive,
                  ]}
                >
                  Anuladas
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Filtro de fechas */}
          <View style={styles.dateFilterRow}>
            <Text style={styles.dateFilterLabel}>Filtrar por fecha:</Text>
            <View style={styles.dateFilterInputs}>
              {/* Fecha Desde - Web usa input nativo, mobile usa DateTimePicker */}
              {isWeb ? (
                <WebDateInput
                  value={fechaDesde}
                  onChange={handleFechaDesdeChange}
                  label="Desde:"
                  maxDate={new Date()}
                />
              ) : (
                <TouchableOpacity
                  style={styles.dateFilterButton}
                  onPress={() => setShowDatePickerDesde(true)}
                >
                  <MaterialCommunityIcons
                    name="calendar"
                    size={16}
                    color="#666"
                  />
                  <Text style={styles.dateFilterText}>
                    Desde: {fechaDesde.toLocaleDateString("es-AR")}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Fecha Hasta - Web usa input nativo, mobile usa DateTimePicker */}
              {isWeb ? (
                <WebDateInput
                  value={fechaHasta}
                  onChange={handleFechaHastaChange}
                  label="Hasta:"
                  maxDate={new Date()}
                />
              ) : (
                <TouchableOpacity
                  style={styles.dateFilterButton}
                  onPress={() => setShowDatePickerHasta(true)}
                >
                  <MaterialCommunityIcons
                    name="calendar"
                    size={16}
                    color="#666"
                  />
                  <Text style={styles.dateFilterText}>
                    Hasta: {fechaHasta.toLocaleDateString("es-AR")}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Botón aplicar */}
              <TouchableOpacity
                style={styles.applyFilterButton}
                onPress={aplicarFiltroFechas}
              >
                <MaterialCommunityIcons
                  name="filter-check"
                  size={16}
                  color="#fff"
                />
                <Text style={styles.applyFilterText}>Aplicar</Text>
              </TouchableOpacity>

              {/* Botón limpiar */}
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={limpiarFiltroFechas}
              >
                <MaterialCommunityIcons
                  name="filter-remove"
                  size={16}
                  color="#666"
                />
                <Text style={styles.clearFilterText}>Limpiar</Text>
              </TouchableOpacity>
            </View>

            {/* Warning de fechas */}
            {warningFechas ? (
              <View style={styles.warningContainer}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={16}
                  color="#F59E0B"
                />
                <Text style={styles.warningText}>{warningFechas}</Text>
              </View>
            ) : null}
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
                            : facturaSeleccionada.estado === "PENDIENTE"
                            ? "Pendiente"
                            : "Anulada"
                        }
                        color={
                          facturaSeleccionada.estado === "COBRADA"
                            ? "success"
                            : facturaSeleccionada.estado === "PENDIENTE"
                            ? "warning"
                            : "default"
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

                  {/* Acciones de reversión */}
                  {(facturaSeleccionada.estado === "COBRADA" ||
                    facturaSeleccionada.estado === "PENDIENTE") && (
                    <TouchableOpacity
                      style={styles.botonRevertir}
                      onPress={() => {
                        handleCerrarModal();
                        setTimeout(() => handleAbrirReversion(facturaSeleccionada), 350);
                      }}
                    >
                      <MaterialCommunityIcons
                        name="undo-variant"
                        size={18}
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.botonRevertirTexto}>
                        {facturaSeleccionada.estado === "COBRADA"
                          ? "Revertir pago"
                          : "Anular factura"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {facturaSeleccionada.estado === "ANULADA" && (
                    <View style={styles.badgeAnulada}>
                      <MaterialCommunityIcons
                        name="cancel"
                        size={14}
                        color="#fff"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.badgeAnuladaTexto}>ANULADA</Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Modal de reversión */}
        <Modal
          visible={modalReversionVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => !revirtiendoFactura && setModalReversionVisible(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => !revirtiendoFactura && setModalReversionVisible(false)}
          >
            <Pressable
              style={[styles.modalContent, styles.modalReversionContent]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Revertir factura #{facturaARevertir?.id}
                </Text>
                <TouchableOpacity
                  onPress={() => setModalReversionVisible(false)}
                  style={styles.closeButton}
                  disabled={revirtiendoFactura}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.reversionWarning}>
                Esta acción revertirá el pago y devolverá el saldo al cliente. No se puede deshacer.
              </Text>

              <Text style={styles.reversionLabel}>Motivo de la reversión *</Text>
              <TextInput
                style={styles.reversionInput}
                placeholder="Ej: Cliente solicitó cancelación del pedido"
                placeholderTextColor="#999"
                value={motivoReversion}
                onChangeText={setMotivoReversion}
                multiline
                numberOfLines={3}
                editable={!revirtiendoFactura}
              />

              <View style={styles.reversionActions}>
                <TouchableOpacity
                  style={styles.botonCancelar}
                  onPress={() => setModalReversionVisible(false)}
                  disabled={revirtiendoFactura}
                >
                  <Text style={styles.botonCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.botonConfirmarReversion,
                    revirtiendoFactura && styles.botonDeshabilitado,
                  ]}
                  onPress={handleConfirmarReversion}
                  disabled={revirtiendoFactura}
                >
                  {revirtiendoFactura ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.botonRevertirTexto}>Confirmar reversión</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* DateTimePicker - Fecha Desde */}
        {showDatePickerDesde && (
          <DateTimePicker
            value={fechaDesde}
            mode="date"
            display="default"
            onChange={handleFechaDesdeChange}
            maximumDate={new Date()}
          />
        )}

        {/* DateTimePicker - Fecha Hasta */}
        {showDatePickerHasta && (
          <DateTimePicker
            value={fechaHasta}
            mode="date"
            display="default"
            onChange={handleFechaHastaChange}
            maximumDate={new Date()}
          />
        )}
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
  // Estilos para filtro de fechas
  dateFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    flexWrap: "wrap",
  },
  dateFilterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  dateFilterInputs: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  dateFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dateFilterText: {
    fontSize: 13,
    color: "#333",
  },
  applyFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
  },
  applyFilterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  clearFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  warningText: {
    fontSize: 13,
    color: "#78350F",
    fontWeight: "500",
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
  botonRevertir: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 20,
  },
  botonRevertirTexto: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  badgeAnulada: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#6B7280",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 16,
  },
  badgeAnuladaTexto: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  modalReversionContent: {
    maxWidth: 480,
  },
  reversionWarning: {
    backgroundColor: "#FEF3C7",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    fontSize: 13,
    color: "#78350F",
    lineHeight: 20,
  },
  reversionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  reversionInput: {
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
    minHeight: 80,
    textAlignVertical: "top",
    backgroundColor: "#fafafa",
    marginBottom: 20,
    outlineStyle: "none",
  },
  reversionActions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  botonCancelar: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d0d0d0",
  },
  botonCancelarTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  botonConfirmarReversion: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  filterButtonActiveAnulada: {
    backgroundColor: "#6B7280",
    borderColor: "#6B7280",
  },
  // Estilos para WebDateInput (input type="date" nativo)
  webDateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  webDateInputLabel: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  webDateInput: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
    fontSize: 13,
    color: "#333",
    outlineStyle: "none",
  },
});
