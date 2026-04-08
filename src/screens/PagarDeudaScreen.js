import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DashboardLayout from "../components/layout/DashboardLayout";
import RfidScanModal from "../components/RfidScanModal";
import SuccessModal from "../components/SuccessModal";
import ConfirmPagoDeudaModal from "../components/ConfirmPagoDeudaModal";
import { useAuth } from "../context/AuthContext";
import cardService from "../services/cardService";
import tarjetaService from "../services/tarjetaService";
import clienteService from "../services/clienteService";
import { formatCurrency } from "../utils/formatCurrency";

export default function PagarDeudaScreen({ onNavigate, currentScreen }) {
    const [metodoSeleccion, setMetodoSeleccion] = useState("escanear"); // 'escanear' o 'lista'
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState(null);
  const [montoPagar, setMontoPagar] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [scanStatus, setScanStatus] = useState(""); // 'scanning', 'error'
  const [errorMessage, setErrorMessage] = useState("");  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { user, logout } = useAuth();
  const displayName = user?.usuario || "Usuario";
  const { width } = useWindowDimensions();
  const isCompact = width < 768;

    useEffect(() => {
    cargarClientesConTarjetasCredito();
  }, []);

  const cargarClientesConTarjetasCredito = async () => {
    try {
      setLoading(true);

            const clientesRes = await clienteService.getClientes();
      const todosLosClientes = clientesRes.data || [];

            const tarjetasRes = await tarjetaService.getTarjetas();
      const todasLasTarjetas = tarjetasRes.data || [];

            const tarjetasCredito = todasLasTarjetas.filter(
        (t) => t.nombreTipoSuscripcion === "CREDITO"
      );

            const mapaTarjetas = {};
      tarjetasCredito.forEach((tarjeta) => {
        mapaTarjetas[tarjeta.id] = tarjeta;
      });

            const clientesConTarjetaCredito = todosLosClientes.filter(
        (cliente) => cliente.idTarjeta && mapaTarjetas[cliente.idTarjeta]
      );

            const clientesConInfo = clientesConTarjetaCredito.map((cliente) => ({
        ...cliente,
        tarjeta: mapaTarjetas[cliente.idTarjeta],
      }));

      setClientes(clientesConInfo);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      alert("Error al cargar los datos. Por favor, recarga la página.");
    } finally {
      setLoading(false);
    }
  };

  const handleEscanearTarjeta = async () => {
    setScanStatus("scanning");
    setErrorMessage("");
    setTarjetaSeleccionada(null);

    try {      const response = await cardService.scanRFID();
      const rfidUid = response.uid;
            const verificacion = await tarjetaService.verificarUid(rfidUid);

      if (!verificacion.existe) {
        setErrorMessage("Esta tarjeta no está registrada en el sistema");
        setScanStatus("error");
        return;
      }

            if (verificacion.data.tipoSuscripcion !== "CREDITO") {
        setErrorMessage(
          "Solo se puede pagar deuda de tarjetas de CRÉDITO. Esta tarjeta es de tipo " +
            verificacion.data.tipoSuscripcion
        );
        setScanStatus("error");
        return;
      }

            if (!verificacion.data.asociadaACliente) {
        setErrorMessage("Esta tarjeta no está asociada a ningún cliente");
        setScanStatus("error");
        return;
      }

            const tarjetaCompleta = await tarjetaService.getTarjetaPorId(
        verificacion.data.idTarjeta
      );

      setTarjetaSeleccionada({
        ...tarjetaCompleta.data,
        cliente: verificacion.data.cliente,
      });

      setScanStatus("");
    } catch (error) {
      console.error("[ERROR] Error al escanear tarjeta:", error);
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Error al procesar la tarjeta"
      );
      setScanStatus("error");
    }
  };

  const handleSeleccionarCliente = async (idCliente) => {
    setClienteSeleccionado(idCliente);
    setTarjetaSeleccionada(null);

    if (!idCliente) return;

    try {
      const cliente = clientes.find((c) => c.id === parseInt(idCliente));
      if (!cliente || !cliente.tarjeta) return;

            const tarjetaCompleta = await tarjetaService.getTarjetaPorId(
        cliente.tarjeta.id
      );

      setTarjetaSeleccionada({
        ...tarjetaCompleta.data,
        cliente: {
          id: cliente.id,
          nombre: cliente.nombre,
          apellido: cliente.apellido,
        },
      });
    } catch (error) {
      console.error("Error al seleccionar cliente:", error);
      alert("Error al cargar los datos de la tarjeta");
    }
  };

  const handleSolicitarPago = () => {    if (!tarjetaSeleccionada) {
      alert("Por favor, selecciona o escanea una tarjeta primero");
      return;
    }

    if (!montoPagar || montoPagar.trim() === "") {
      alert("Por favor, ingresa el monto a pagar");
      return;
    }

    const monto = parseFloat(montoPagar);
    if (isNaN(monto) || monto <= 0) {
      alert("El monto debe ser un número mayor a 0");
      return;
    }

        setShowConfirmModal(true);
  };

  const handleConfirmarPago = async () => {
    setShowConfirmModal(false);

    try {
      setProcesando(true);

      const monto = parseFloat(montoPagar);

            const resultado = await tarjetaService.pagarDeuda(
        tarjetaSeleccionada.cliente.id,
        monto,
        metodoPago
      );
      const nuevaDeuda = resultado.data.saldos.deudaActual;

            setTarjetaSeleccionada({
        ...tarjetaSeleccionada,
        saldoActual: nuevaDeuda,
      });

            setSuccessMessage(
        `Se registraron $${formatCurrency(
          monto
        )} exitosamente. Deuda restante: $${formatCurrency(nuevaDeuda)}`
      );
      setShowSuccessModal(true);

            setMontoPagar("");      if (metodoSeleccion === "lista") {
        cargarClientesConTarjetasCredito();
      }
    } catch (error) {
      console.error("[ERROR] Error al registrar pago:", error);
      alert(
        error.response?.data?.message ||
          error.message ||
          "Error al registrar el pago"
      );
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelarPago = () => {
    setShowConfirmModal(false);
  };

  const handleLimpiar = () => {
    setTarjetaSeleccionada(null);
    setMontoPagar("");
    setMetodoPago("Efectivo");
    setClienteSeleccionado("");
  };

  const handleCloseModal = () => {
    setScanStatus("");
    setErrorMessage("");
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage("");
  };

  if (loading) {
    return (
      <DashboardLayout
        userName={displayName}
        onLogout={logout}
        onNavigate={onNavigate}
        currentScreen={currentScreen}
      >
        <View style={[styles.wrapper, styles.centerContent]}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userName={displayName}
      onLogout={logout}
      onNavigate={onNavigate}
      currentScreen={currentScreen}
    >
      <ScrollView style={styles.wrapper} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, isCompact && styles.pageTitleCompact]}>
          Pagar deuda de tarjeta crédito
        </Text>

        {/* Selector de método */}
        <View style={styles.metodoSelector}>
          <Text style={styles.sectionTitle}>
            ¿Cómo deseas identificar la tarjeta?
          </Text>
          <View style={styles.metodoButtons}>
            <TouchableOpacity
              style={[
                styles.metodoButton,
                metodoSeleccion === "escanear" && styles.metodoButtonActive,
              ]}
              onPress={() => {
                setMetodoSeleccion("escanear");
                handleLimpiar();
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="credit-card-scan-outline"
                size={24}
                color={metodoSeleccion === "escanear" ? "#fff" : "#4a4a4a"}
              />
              <Text
                style={[
                  styles.metodoButtonText,
                  metodoSeleccion === "escanear" &&
                    styles.metodoButtonTextActive,
                ]}
              >
                Escanear tarjeta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.metodoButton,
                metodoSeleccion === "lista" && styles.metodoButtonActive,
              ]}
              onPress={() => {
                setMetodoSeleccion("lista");
                handleLimpiar();
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={24}
                color={metodoSeleccion === "lista" ? "#fff" : "#4a4a4a"}
              />
              <Text
                style={[
                  styles.metodoButtonText,
                  metodoSeleccion === "lista" && styles.metodoButtonTextActive,
                ]}
              >
                Seleccionar de lista
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contenido según método seleccionado */}
        <View style={styles.contentSection}>
          {metodoSeleccion === "escanear" ? (            <View style={styles.scanSection}>
              <Text style={styles.instructionText}>
                Presiona el botón para escanear una tarjeta RFID
              </Text>
              <TouchableOpacity
                style={styles.scanButton}
                onPress={handleEscanearTarjeta}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="credit-card-scan-outline"
                  size={28}
                  color="#fff"
                />
                <Text style={styles.scanButtonText}>Escanear Tarjeta</Text>
              </TouchableOpacity>
            </View>
          ) : (            <View style={styles.listaSection}>
              <Text style={styles.label}>Seleccionar cliente</Text>
              {clientes.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="credit-card-off-outline"
                    size={48}
                    color="#999"
                  />
                  <Text style={styles.emptyText}>
                    No hay clientes con tarjetas CRÉDITO registradas
                  </Text>
                </View>
              ) : (
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={clienteSeleccionado}
                    onValueChange={handleSeleccionarCliente}
                    style={styles.picker}
                    dropdownIconColor="#666"
                  >
                    <Picker.Item label="Seleccionar cliente..." value="" />
                    {clientes.map((cliente) => (
                      <Picker.Item
                        key={cliente.id}
                        label={`${cliente.nombre} ${
                          cliente.apellido
                        } - Deuda: $${formatCurrency(
                          cliente.tarjeta.saldoActual
                        )}`}
                        value={cliente.id.toString()}
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </View>
          )}

          {/* Información de tarjeta seleccionada */}
          {tarjetaSeleccionada && (
            <View style={styles.tarjetaInfo}>
              <View style={styles.tarjetaHeader}>
                <MaterialCommunityIcons
                  name="credit-card-check-outline"
                  size={32}
                  color="#2196F3"
                />
                <Text style={styles.tarjetaHeaderText}>
                  Tarjeta seleccionada
                </Text>
              </View>

              <View style={styles.tarjetaDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cliente:</Text>
                  <Text style={styles.detailValue}>
                    {tarjetaSeleccionada.cliente.nombre}{" "}
                    {tarjetaSeleccionada.cliente.apellido}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tipo:</Text>
                  <Text style={styles.detailValue}>
                    {tarjetaSeleccionada.nombreTipoSuscripcion}
                    {tarjetaSeleccionada.nombreNivelSuscripcion
                      ? ` - ${tarjetaSeleccionada.nombreNivelSuscripcion}`
                      : ""}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Límite de crédito:</Text>
                  <Text style={styles.detailValue}>
                    ${formatCurrency(
                      tarjetaSeleccionada.limiteCreditoNivel || 0
                    )}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Deuda actual:</Text>
                  <Text style={[styles.detailValue, styles.deudaValue]}>
                    ${formatCurrency(tarjetaSeleccionada.saldoActual)}
                  </Text>
                </View>
              </View>

              {/* Formulario de pago */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Monto a pagar</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ingrese el monto (ej: 1000)"
                  value={montoPagar}
                  onChangeText={setMontoPagar}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />

                <Text style={styles.label}>Método de pago</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={metodoPago}
                    onValueChange={setMetodoPago}
                    style={styles.picker}
                    dropdownIconColor="#666"
                  >
                    <Picker.Item label="Efectivo" value="Efectivo" />
                    <Picker.Item
                      label="Tarjeta de Débito"
                      value="Tarjeta de Débito"
                    />
                    <Picker.Item
                      label="Tarjeta de Crédito"
                      value="Tarjeta de Crédito"
                    />
                    <Picker.Item label="Transferencia" value="Transferencia" />
                  </Picker>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleLimpiar}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.secondaryButtonText}>Limpiar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (procesando || !montoPagar) &&
                        styles.submitButtonDisabled,
                    ]}
                    onPress={handleSolicitarPago}
                    disabled={procesando || !montoPagar}
                    activeOpacity={0.8}
                  >
                    {procesando ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="cash-check"
                          size={20}
                          color="#fff"
                        />
                        <Text style={styles.submitButtonText}>
                          Registrar Pago
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de escaneo RFID */}
      <RfidScanModal
        visible={scanStatus !== ""}
        status={scanStatus}
        errorMessage={errorMessage}
        onClose={handleCloseModal}
      />

      {/* Modal de confirmación de pago */}
      <ConfirmPagoDeudaModal
        visible={showConfirmModal}
        clienteNombre={
          tarjetaSeleccionada
            ? `${tarjetaSeleccionada.cliente.nombre} ${tarjetaSeleccionada.cliente.apellido}`
            : ""
        }
        deudaActual={tarjetaSeleccionada?.saldoActual || 0}
        montoPago={montoPagar || 0}
        metodoPago={metodoPago}
        onConfirm={handleConfirmarPago}
        onCancel={handleCancelarPago}
      />

      {/* Modal de éxito */}
      <SuccessModal
        visible={showSuccessModal}
        title="¡Pago registrado!"
        message={successMessage}
        onClose={handleCloseSuccessModal}
        autoCloseDelay={3000}
      />
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1f1f1f",
    marginBottom: 32,
  },
  pageTitleCompact: {
    fontSize: 28,
    marginBottom: 20,
  },
  metodoSelector: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2f2f2f",
    marginBottom: 16,
  },
  metodoButtons: {
    flexDirection: "row",
    gap: 16,
  },
  metodoButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#d0d0d0",
  },
  metodoButtonActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  metodoButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a4a4a",
  },
  metodoButtonTextActive: {
    color: "#fff",
  },
  contentSection: {
    gap: 24,
  },
  scanSection: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 24,
  },
  instructionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    backgroundColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  listaSection: {
    gap: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2f2f2f",
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    paddingHorizontal: 12,
    overflow: "hidden",
    outlineStyle: "none",
  },
  picker: {
    height: 50,
    fontSize: 15,
    color: "#2f2f2f",
    backgroundColor: "transparent",
    borderWidth: 0,
    outlineStyle: "none",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  tarjetaInfo: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    gap: 24,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tarjetaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tarjetaHeaderText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  tarjetaDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 15,
    color: "#666",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2f2f2f",
  },
  deudaValue: {
    fontSize: 20,
    color: "#D32F2F", // Color rojo para deuda
  },
  formSection: {
    gap: 16,
  },
  textInput: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2f2f2f",
    height: 50,
    outlineStyle: "none",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#d0d0d0",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a4a4a",
  },
  submitButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: "#2196F3", // Azul para pago de deuda
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#9a9a9a",
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
