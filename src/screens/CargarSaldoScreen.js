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
import ConfirmCargarSaldoModal from "../components/ConfirmCargarSaldoModal";
import { useAuth } from "../context/AuthContext";
import cardService from "../services/cardService";
import tarjetaService from "../services/tarjetaService";
import clienteService from "../services/clienteService";
import { formatCurrency } from "../utils/formatCurrency";

export default function CargarSaldoScreen({ onNavigate, currentScreen }) {
  // Estados principales
  const [metodoSeleccion, setMetodoSeleccion] = useState("escanear"); // 'escanear' o 'lista'
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState(null);
  const [montoCargar, setMontoCargar] = useState("");

  // Estados para la lista
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [scanStatus, setScanStatus] = useState(""); // 'scanning', 'error'
  const [errorMessage, setErrorMessage] = useState("");

  // Estados para modales
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { user, logout } = useAuth();
  const displayName = user?.usuario || "Usuario";
  const { width } = useWindowDimensions();
  const isCompact = width < 768;

  // Cargar clientes con tarjetas PREPAGO al montar
  useEffect(() => {
    cargarClientesConTarjetasPrepago();
  }, []);

  const cargarClientesConTarjetasPrepago = async () => {
    try {
      setLoading(true);

      // Obtener todos los clientes
      const clientesRes = await clienteService.getClientes();
      const todosLosClientes = clientesRes.data || [];

      // Obtener todas las tarjetas
      const tarjetasRes = await tarjetaService.getTarjetas();
      const todasLasTarjetas = tarjetasRes.data || [];

      // Filtrar solo tarjetas PREPAGO
      const tarjetasPrepago = todasLasTarjetas.filter(
        (t) => t.nombreTipoSuscripcion === "PREPAGA"
      );

      // Crear un mapa de tarjetas por ID
      const mapaTarjetas = {};
      tarjetasPrepago.forEach((tarjeta) => {
        mapaTarjetas[tarjeta.id] = tarjeta;
      });

      // Filtrar clientes que tengan tarjeta PREPAGO
      const clientesConTarjetaPrepago = todosLosClientes.filter(
        (cliente) => cliente.idTarjeta && mapaTarjetas[cliente.idTarjeta]
      );

      // Agregar info de tarjeta a cada cliente
      const clientesConInfo = clientesConTarjetaPrepago.map((cliente) => ({
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

    try {
      // Escanear tarjeta RFID
      const response = await cardService.scanRFID();
      const rfidUid = response.uid;

      console.log("📡 Tarjeta escaneada:", rfidUid);

      // Buscar la tarjeta en el sistema
      const verificacion = await tarjetaService.verificarUid(rfidUid);

      if (!verificacion.existe) {
        setErrorMessage("Esta tarjeta no está registrada en el sistema");
        setScanStatus("error");
        return;
      }

      // Verificar que sea una tarjeta PREPAGO
      if (verificacion.data.tipoSuscripcion !== "PREPAGA") {
        setErrorMessage(
          "Solo se puede cargar saldo a tarjetas PREPAGO. Esta tarjeta es de tipo " +
            verificacion.data.tipoSuscripcion
        );
        setScanStatus("error");
        return;
      }

      // Verificar que esté asociada a un cliente
      if (!verificacion.data.asociadaACliente) {
        setErrorMessage("Esta tarjeta no está asociada a ningún cliente");
        setScanStatus("error");
        return;
      }

      // Obtener datos completos de la tarjeta
      const tarjetaCompleta = await tarjetaService.getTarjetaPorId(
        verificacion.data.idTarjeta
      );

      setTarjetaSeleccionada({
        ...tarjetaCompleta.data,
        cliente: verificacion.data.cliente,
      });

      setScanStatus("");
    } catch (error) {
      console.error("❌ Error al escanear tarjeta:", error);
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

      // Obtener datos actualizados de la tarjeta
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

  const handleSolicitarCarga = () => {
    // Validaciones
    if (!tarjetaSeleccionada) {
      alert("Por favor, selecciona o escanea una tarjeta primero");
      return;
    }

    if (!montoCargar || montoCargar.trim() === "") {
      alert("Por favor, ingresa el monto a cargar");
      return;
    }

    const monto = parseFloat(montoCargar);
    if (isNaN(monto) || monto <= 0) {
      alert("El monto debe ser un número mayor a 0");
      return;
    }

    // Mostrar modal de confirmación
    setShowConfirmModal(true);
  };

  const handleConfirmarCarga = async () => {
    setShowConfirmModal(false);

    try {
      setProcesando(true);

      const monto = parseFloat(montoCargar);

      // Llamar al servicio para cargar saldo
      const resultado = await tarjetaService.cargarSaldo(
        tarjetaSeleccionada.id,
        monto
      );

      console.log("✅ Saldo cargado exitosamente:", resultado);

      // Actualizar la tarjeta seleccionada con el nuevo saldo
      setTarjetaSeleccionada({
        ...tarjetaSeleccionada,
        saldoActual: resultado.data.saldoActual,
      });

      // Mostrar mensaje de éxito
      setSuccessMessage(
        `Se cargaron $${formatCurrency(
          monto
        )} exitosamente. Nuevo saldo: $${formatCurrency(
          resultado.data.saldoActual
        )}`
      );
      setShowSuccessModal(true);

      // Limpiar el campo de monto
      setMontoCargar("");

      // Recargar la lista de clientes si estamos en modo lista
      if (metodoSeleccion === "lista") {
        cargarClientesConTarjetasPrepago();
      }
    } catch (error) {
      console.error("❌ Error al cargar saldo:", error);
      alert(
        error.response?.data?.message ||
          error.message ||
          "Error al cargar el saldo"
      );
    } finally {
      setProcesando(false);
    }
  };

  const handleCancelarCarga = () => {
    setShowConfirmModal(false);
  };

  const handleLimpiar = () => {
    setTarjetaSeleccionada(null);
    setMontoCargar("");
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
          Cargar saldo a tarjeta prepago
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
          {metodoSeleccion === "escanear" ? (
            // Modo escaneo
            <View style={styles.scanSection}>
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
          ) : (
            // Modo lista
            <View style={styles.listaSection}>
              <Text style={styles.label}>Seleccionar cliente</Text>
              {clientes.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="credit-card-off-outline"
                    size={48}
                    color="#999"
                  />
                  <Text style={styles.emptyText}>
                    No hay clientes con tarjetas PREPAGO registradas
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
                        } - Saldo: $${formatCurrency(
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
                  color="#4CAF50"
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
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Saldo actual:</Text>
                  <Text style={[styles.detailValue, styles.saldoValue]}>
                    ${formatCurrency(tarjetaSeleccionada.saldoActual)}
                  </Text>
                </View>
              </View>

              {/* Formulario de carga */}
              <View style={styles.formSection}>
                <Text style={styles.label}>Monto a cargar</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ingrese el monto (ej: 1000)"
                  value={montoCargar}
                  onChangeText={setMontoCargar}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />

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
                      (procesando || !montoCargar) &&
                        styles.submitButtonDisabled,
                    ]}
                    onPress={handleSolicitarCarga}
                    disabled={procesando || !montoCargar}
                    activeOpacity={0.8}
                  >
                    {procesando ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons
                          name="cash-plus"
                          size={20}
                          color="#fff"
                        />
                        <Text style={styles.submitButtonText}>
                          Cargar Saldo
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

      {/* Modal de confirmación de carga */}
      <ConfirmCargarSaldoModal
        visible={showConfirmModal}
        clienteNombre={
          tarjetaSeleccionada
            ? `${tarjetaSeleccionada.cliente.nombre} ${tarjetaSeleccionada.cliente.apellido}`
            : ""
        }
        saldoActual={tarjetaSeleccionada?.saldoActual || 0}
        montoCarga={montoCargar || 0}
        onConfirm={handleConfirmarCarga}
        onCancel={handleCancelarCarga}
      />

      {/* Modal de éxito */}
      <SuccessModal
        visible={showSuccessModal}
        title="¡Saldo cargado!"
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
  saldoValue: {
    fontSize: 20,
    color: "#4CAF50",
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
    backgroundColor: "#000",
    shadowColor: "#000",
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
