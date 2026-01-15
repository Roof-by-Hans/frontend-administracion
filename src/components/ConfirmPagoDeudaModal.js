import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatCurrency } from "../utils/formatCurrency";

export default function ConfirmPagoDeudaModal({
  visible,
  clienteNombre,
  deudaActual,
  montoPago,
  metodoPago,
  onConfirm,
  onCancel,
}) {
  const deudaNueva = parseFloat(deudaActual) - parseFloat(montoPago);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Icono */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="credit-card-minus"
              size={56}
              color="#2196F3"
            />
          </View>

          {/* Título */}
          <Text style={styles.title}>Confirmar pago de deuda</Text>

          {/* Cliente */}
          <View style={styles.clienteContainer}>
            <MaterialCommunityIcons
              name="account-circle"
              size={20}
              color="#666"
            />
            <Text style={styles.clienteText}>{clienteNombre}</Text>
          </View>

          {/* Desglose de saldos */}
          <View style={styles.desglose}>
            {/* Deuda actual */}
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Deuda actual:</Text>
              <Text style={styles.itemValue}>
                ${formatCurrency(deudaActual)}
              </Text>
            </View>

            {/* Monto a pagar */}
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Monto a pagar:</Text>
              <Text style={[styles.itemValue, styles.montoPago]}>
                - ${formatCurrency(montoPago)}
              </Text>
            </View>

            {/* Método de pago */}
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Método de pago:</Text>
              <Text style={styles.itemValue}>{metodoPago}</Text>
            </View>

            {/* Separador */}
            <View style={styles.separator} />

            {/* Deuda nueva */}
            <View style={styles.itemRow}>
              <Text style={styles.saldoNuevoLabel}>Deuda restante:</Text>
              <Text style={styles.saldoNuevoValue}>
                ${formatCurrency(deudaNueva < 0 ? 0 : deudaNueva)}
              </Text>
            </View>
          </View>

          {/* Mensaje de confirmación */}
          <Text style={styles.message}>
            ¿Estás seguro de que deseas registrar este pago?
          </Text>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="check-bold"
                size={20}
                color="#fff"
              />
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 450,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f1f1f",
    marginBottom: 16,
    textAlign: "center",
  },
  clienteContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
  },
  clienteText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a4a4a",
  },
  desglose: {
    width: "100%",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    gap: 12,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemLabel: {
    fontSize: 15,
    color: "#666",
  },
  itemValue: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2f2f2f",
  },
  montoPago: {
    color: "#2196F3",
  },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 8,
  },
  saldoNuevoLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  saldoNuevoValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2196F3",
  },
  message: {
    fontSize: 15,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    width: "100%",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#d0d0d0",
  },
  cancelButtonText: {
    color: "#4a4a4a",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#2196F3",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
