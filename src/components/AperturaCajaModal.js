import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function AperturaCajaModal({ visible, onClose, onConfirm, loading }) {
  const [montoInicial, setMontoInicial] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!montoInicial.trim()) {
      setError("El monto inicial es obligatorio (puede ser 0)");
      return;
    }

    const monto = parseFloat(montoInicial);
    if (isNaN(monto) || monto < 0) {
      setError("Ingrese un monto válido mayor o igual a 0");
      return;
    }

    onConfirm(monto);
    setMontoInicial("");
    setError("");
  };

  const handleClose = () => {
    setMontoInicial("");
    setError("");
    onClose();
  };

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
                <MaterialCommunityIcons name="store-clock-outline" size={28} color="#2e7d32" />
              </View>
              <Text style={styles.title}>Abrir Caja Diaria</Text>
              <Text style={styles.subtitle}>
                Ingrese el monto inicial (fondo de caja) para comenzar las operaciones del día.
              </Text>
            </View>

            {/* Body */}
            <View style={styles.body}>
              <Text style={styles.label}>Monto Inicial</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  value={montoInicial}
                  onChangeText={(text) => {
                    setMontoInicial(text);
                    setError("");
                  }}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  autoFocus={true}
                />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

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
                    <MaterialCommunityIcons name="check" size={18} color="#fff" />
                    <Text style={styles.confirmButtonText}>Abrir Caja</Text>
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
    maxWidth: 400,
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
  },
  header: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#f1f8e9",
    borderBottomWidth: 1,
    borderBottomColor: "#dcedc8",
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
    color: "#1b5e20",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#558b2f",
    textAlign: "center",
    lineHeight: 20,
  },
  body: {
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#37474f",
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
    fontSize: 18,
    color: "#263238",
    fontWeight: "500",
    height: "100%",
    outlineStyle: "none",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 12,
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#eceff1",
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
    backgroundColor: "#2e7d32",
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
