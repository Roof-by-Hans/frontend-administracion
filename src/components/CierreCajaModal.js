import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function CierreCajaModal({
  visible,
  onClose,
  onConfirm,
  loading,
  saldoSistema = 0, // Dato informativo (opcional, si queremos mostrar cuánto debería haber)
}) {
  const [conteoEfectivo, setConteoEfectivo] = useState("");
  const [conteoTarjetas, setConteoTarjetas] = useState("");
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    const efectivo = parseFloat(conteoEfectivo || "0");
    const tarjetas = parseFloat(conteoTarjetas || "0");

    if (isNaN(efectivo) || efectivo < 0) {
      setError("El conteo de efectivo debe ser un número válido >= 0");
      return;
    }
    if (isNaN(tarjetas) || tarjetas < 0) {
      setError("El conteo de tarjetas debe ser un número válido >= 0");
      return;
    }

    const montoFinalReportado = efectivo + tarjetas;

    // Estructura que espera el backend
    // subtotalesPorMedio es opcional pero idealmente enviaríamos el detalle
    // Por simplicidad, asumiremos IDs genéricos o enviaremos solo el conteo global
    // El backend usa 'subtotalesPorMedio' para auditoría detallada. 
    // Si no tenemos los IDs de medios de pago a mano, podemos enviar array vacío o implementarlo luego.
    // Enviaremos array vacío por ahora para evitar errores de IDs incorrectos.
    
    onConfirm({
      montoFinalReportado,
      observacion,
      conteoEfectivo: efectivo,
      conteoTarjetas: tarjetas,
      subtotalesPorMedio: [], // TODO: Implementar si se requiere desglose por tipo de tarjeta
    });
  };

  const handleClose = () => {
    setConteoEfectivo("");
    setConteoTarjetas("");
    setObservacion("");
    setError("");
    onClose();
  };

  const totalReportado = (parseFloat(conteoEfectivo || 0) + parseFloat(conteoTarjetas || 0));

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="lock-check-outline" size={28} color="#c62828" />
              </View>
              <Text style={styles.title}>Cerrar Caja Diaria</Text>
              <Text style={styles.subtitle}>
                Realice el arqueo de caja ingresando los montos físicos encontrados.
              </Text>
            </View>

            <ScrollView style={styles.body}>
              {/* Sección Efectivo */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <MaterialCommunityIcons name="cash" size={18} color="#37474f" /> Efectivo
                </Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.input}
                    value={conteoEfectivo}
                    onChangeText={setConteoEfectivo}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                </View>
                <Text style={styles.helperText}>Total de billetes y monedas en caja</Text>
              </View>

              {/* Sección Tarjetas */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  <MaterialCommunityIcons name="credit-card" size={18} color="#37474f" /> Tarjetas (Vouchers)
                </Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.input}
                    value={conteoTarjetas}
                    onChangeText={setConteoTarjetas}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                  />
                </View>
                <Text style={styles.helperText}>Suma total de comprobantes de tarjeta</Text>
              </View>

              {/* Resumen en tiempo real */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Reportado</Text>
                <Text style={styles.summaryValue}>
                  ${totalReportado.toLocaleString("es-UY", { minimumFractionDigits: 2 })}
                </Text>
              </View>

              {/* Observaciones */}
              <View style={styles.section}>
                <Text style={styles.label}>Observaciones (Opcional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={observacion}
                  onChangeText={setObservacion}
                  placeholder="Comentarios sobre el cierre..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="lock" size={18} color="#fff" />
                    <Text style={styles.confirmButtonText}>Cerrar Caja</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 450,
    maxHeight: "90%",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#ffebee",
    borderBottomWidth: 1,
    borderBottomColor: "#ffcdd2",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#b71c1c",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#c62828",
    textAlign: "center",
    lineHeight: 20,
  },
  body: {
    padding: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#37474f",
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#546e7a",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#b0bec5",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    height: 48,
  },
  currencySymbol: {
    fontSize: 18,
    color: "#78909c",
    marginRight: 8,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#263238",
    fontWeight: "500",
    height: "100%",
    outlineStyle: "none",
    paddingVertical: 10,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#b0bec5",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  helperText: {
    fontSize: 12,
    color: "#90a4ae",
    marginTop: 4,
    marginLeft: 4,
  },
  summaryCard: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 12,
    marginTop: 0,
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#eceff1",
    backgroundColor: "#fafafa",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cfd8dc",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#546e7a",
  },
  confirmButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#c62828",
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
