import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DashboardLayout from "../components/layout/DashboardLayout";
import CardPreview from "../components/CardPreview";
import RfidScanModal from "../components/RfidScanModal";
import ConfirmDesvinculacionModal from "../components/ConfirmDesvinculacionModal";
import SuccessModal from "../components/SuccessModal";
import { useAuth } from "../context/AuthContext";
import cardService from "../services/cardService";
import tarjetaService from "../services/tarjetaService";
import clienteService from "../services/clienteService";
import Alert from "@blazejkustra/react-native-alert";

export default function EmitirTarjetaScreen({ onNavigate, currentScreen }) {
  const [selectedClient, setSelectedClient] = useState("");
  const [subscriptionType, setSubscriptionType] = useState("");
  const [nivelSuscripcion, setNivelSuscripcion] = useState("");
  const [saldoInicial, setSaldoInicial] = useState("");
  const [clientes, setClientes] = useState([]);
  const [tiposSuscripcion, setTiposSuscripcion] = useState([]);
  const [nivelesSuscripcion, setNivelesSuscripcion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanStatus, setScanStatus] = useState(""); 
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [conflictoInfo, setConflictoInfo] = useState(null);
  const [datosEmisionPendiente, setDatosEmisionPendiente] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { user, logout } = useAuth();
  const displayName = user?.usuario || "Usuario";
  const { width } = useWindowDimensions();
  const isCompact = width < 768;
  const isMedium = width >= 768 && width < 1024;

    useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);

            const [clientesRes, tiposRes, nivelesRes] = await Promise.all([
        clienteService.getClientes(),
        tarjetaService.getTiposSuscripcion(),
        tarjetaService.getNivelesSuscripcion(),
      ]);

      setClientes(clientesRes.data || []);
      setTiposSuscripcion(tiposRes.data || []);
      setNivelesSuscripcion(nivelesRes.data || []);
      if (tiposRes.data && tiposRes.data.length > 0) {
                const tipoCredito = tiposRes.data.find((t) => t.nombre === "CREDITO");
        if (tipoCredito) {
          setSubscriptionType(tipoCredito.id.toString());
        } else {
          setSubscriptionType(tiposRes.data[0].id.toString());
        }
      }

      if (nivelesRes.data && nivelesRes.data.length > 0) {
        setNivelSuscripcion(nivelesRes.data[0].id.toString());
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getClientName = () => {
    if (!selectedClient) return "NOMBRE APELLIDO";
    const cliente = clientes.find((c) => c.id === parseInt(selectedClient));
    return cliente
      ? `${cliente.nombre} ${cliente.apellido}`
      : "NOMBRE APELLIDO";
  };

    const getTipoSuscripcionSeleccionado = () => {
    return tiposSuscripcion.find((t) => t.id === parseInt(subscriptionType));
  };

    const esTipoCredito = () => {
    const tipo = getTipoSuscripcionSeleccionado();
    return tipo?.nombre === "CREDITO";
  };

  const esTipoPrepago = () => {
    const tipo = getTipoSuscripcionSeleccionado();
    return tipo?.nombre === "PREPAGA";
  };

  const handleEmitir = async () => {
    if (!selectedClient) {
      Alert.alert("Error", "Por favor selecciona un cliente");
      return;
    }

    if (!subscriptionType) {
      Alert.alert("Error", "Por favor selecciona un tipo de suscripción");
      return;
    }

        if (esTipoCredito()) {
      if (!nivelSuscripcion) {
        Alert.alert("Error", "Por favor selecciona un nivel de suscripción");
        return;
      }
    } else if (esTipoPrepago()) {
      if (saldoInicial && saldoInicial.trim() !== "") {
        const saldo = parseFloat(saldoInicial);
        if (isNaN(saldo) || saldo < 0) {
          Alert.alert("Error", "El saldo debe ser un número mayor o igual a 0");
          return;
        }
      }
    }
    setScanStatus("scanning");
    setErrorMessage("");

    try {
            const response = await cardService.scanRFID();
      const datosEmision = {
        rfidUid: response.uid,
        idCliente: parseInt(selectedClient),
        idTipoSuscripcion: parseInt(subscriptionType),
      };

            if (esTipoCredito()) {
        datosEmision.idNivelSuscripcion = parseInt(nivelSuscripcion);
      } else if (esTipoPrepago()) {
        if (saldoInicial && saldoInicial.trim() !== "") {
          datosEmision.saldoInicial = parseFloat(saldoInicial);
        }
      }
      await procesarEmision(datosEmision);

            setScanStatus("");
    } catch (error) {
    }
  };

    const procesarEmision = async (datosEmision) => {
    try {
      const resultado = await tarjetaService.asociarTarjetaCliente(
        datosEmision
      );
      const clienteNombre = getClientName();
      setSuccessMessage(`Tarjeta emitida exitosamente para ${clienteNombre}`);
      setShowSuccessModal(true);

            setSelectedClient("");
      setSaldoInicial("");
    } catch (error) {
      throw error;
    }
  };
  const handleConfirmarDesvinculacion = async () => {
    if (!datosEmisionPendiente) return;

    setShowConfirmModal(false);

    try {
      const datosConForzar = {
        ...datosEmisionPendiente,
        forzarDesvinculacion: true,
      };

      await procesarEmision(datosConForzar);

            setConflictoInfo(null);
      setDatosEmisionPendiente(null);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Error al procesar la desvinculación"
      );
      setScanStatus("error");

            setConflictoInfo(null);
      setDatosEmisionPendiente(null);
    }
  };
  const handleCancelarDesvinculacion = () => {
    setShowConfirmModal(false);
    setConflictoInfo(null);
    setDatosEmisionPendiente(null);
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
      <View style={styles.wrapper}>
        <Text style={[styles.pageTitle, isCompact && styles.pageTitleCompact]}>
          Emitir nueva tarjeta
        </Text>

        
        <View
          style={[
            styles.mainContainer,
            isCompact && styles.mainContainerCompact,
          ]}
        >
          
          <View style={styles.cardSection}>
            <CardPreview clientName={getClientName()} />
          </View>

          
          <View style={styles.formContainer}>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Cliente</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedClient}
                  onValueChange={(value) => setSelectedClient(value)}
                  style={styles.picker}
                  dropdownIconColor="#666"
                >
                  <Picker.Item label="Seleccionar cliente..." value="" />
                  {clientes.map((cliente) => (
                    <Picker.Item
                      key={cliente.id}
                      label={`${cliente.nombre} ${cliente.apellido}`}
                      value={cliente.id.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tipo de Suscripción</Text>
              <View style={styles.radioGroup}>
                {tiposSuscripcion.map((tipo) => (
                  <TouchableOpacity
                    key={tipo.id}
                    style={styles.radioOption}
                    onPress={() => setSubscriptionType(tipo.id.toString())}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioCircle}>
                      {subscriptionType === tipo.id.toString() && (
                        <View style={styles.radioSelected} />
                      )}
                    </View>
                    <Text style={styles.radioLabel}>
                      {tipo.nombre === "CREDITO" ? "Crédito" : "Prepago"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            
            {esTipoCredito() && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nivel de Suscripción</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={nivelSuscripcion}
                    onValueChange={(value) => setNivelSuscripcion(value)}
                    style={styles.picker}
                    dropdownIconColor="#666"
                  >
                    {nivelesSuscripcion.map((nivel) => (
                      <Picker.Item
                        key={nivel.id}
                        label={`${nivel.nombre} (Límite: $${nivel.limiteCredito})`}
                        value={nivel.id.toString()}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            
            {esTipoPrepago() && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Saldo Inicial</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ingrese el saldo inicial (opcional)"
                  value={saldoInicial}
                  onChangeText={setSaldoInicial}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedClient || scanStatus === "scanning") &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleEmitir}
              disabled={!selectedClient || scanStatus === "scanning"}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>Emitir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      
      <RfidScanModal
        visible={scanStatus !== ""}
        status={scanStatus}
        errorMessage={errorMessage}
        onClose={handleCloseModal}
      />

      
      <ConfirmDesvinculacionModal
        visible={showConfirmModal}
        conflicto={conflictoInfo}
        clienteNuevo={{
          nombre:
            clientes.find((c) => c.id === parseInt(selectedClient))?.nombre ||
            "",
          apellido:
            clientes.find((c) => c.id === parseInt(selectedClient))?.apellido ||
            "",
        }}
        onConfirm={handleConfirmarDesvinculacion}
        onCancel={handleCancelarDesvinculacion}
      />

      
      <SuccessModal
        visible={showSuccessModal}
        title="¡Éxito!"
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
  mainContainer: {
    flexDirection: "row",
    gap: 48,
    alignItems: "flex-start",
  },
  mainContainerCompact: {
    flexDirection: "column",
    gap: 24,
  },
  cardSection: {
    flex: 0,
    minWidth: 380,
  },
  formContainer: {
    flex: 1,
    maxWidth: 600,
    gap: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2f2f2f",
    marginBottom: 12,
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
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#2f2f2f",
    height: 50,
    outlineStyle: "none",
  },
  radioGroup: {
    gap: 16,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#4a4a4a",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4a4a4a",
  },
  radioLabel: {
    fontSize: 15,
    color: "#3f3f3f",
  },
  submitButton: {
    backgroundColor: "#000000",
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 24,
    alignSelf: "flex-start",
    marginTop: 12,
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
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
