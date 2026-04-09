import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";


export default function ConfirmTarjetaDesvinculacionModal({
  visible,
  cliente,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    if (!visible) {
      setConfirmado(false);
    }
  }, [visible]);

  if (!cliente) return null;

  const nombreCompleto = `${cliente.nombre || ""} ${
    cliente.apellido || ""
  }`.trim();

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="credit-card-off"
              size={78}
              color="#ff9800"
            />
          </View>

          <Text style={styles.title}>Desvincular tarjeta</Text>

          <Text style={styles.description}>
            Vas a desvincular la tarjeta actualmente asignada a este cliente.
            Esta acción resetea todos los datos de la tarjeta y no se puede
            deshacer automáticamente.
          </Text>

          <View style={styles.infoBox}>
            <View style={styles.infoBoxTitleRow}>
              <MaterialCommunityIcons
                name="account"
                size={18}
                color="#666"
                style={styles.infoBoxIcon}
              />
              <Text style={styles.infoBoxTitle}>Cliente seleccionado</Text>
            </View>
            <Text style={styles.infoBoxContent}>
              {nombreCompleto || "Sin información"}
            </Text>
            <Text style={styles.infoBoxSubtext}>
              Quedará sin una tarjeta asociada después de confirmar
            </Text>
          </View>

          <View style={styles.warningBox}>
            <View style={styles.warningTitleRow}>
              <MaterialCommunityIcons
                name="alert-outline"
                size={20}
                color="#c62828"
                style={styles.warningIcon}
              />
              <Text style={styles.warningTitle}>Consecuencias</Text>
            </View>
            <View style={styles.warningItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.warningText}>
                El cliente dejará de tener acceso a los beneficios asociados a
                la tarjeta
              </Text>
            </View>
            <View style={styles.warningItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.warningText}>
                Se reiniciará el tipo de suscripción, nivel y saldo de la
                tarjeta
              </Text>
            </View>
            <View style={styles.warningItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.warningText}>
                Esta tarjeta podrá asignarse manualmente a otro cliente en el
                futuro
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setConfirmado((prev) => !prev)}
            activeOpacity={0.75}
            disabled={loading}
          >
            <View
              style={[styles.checkbox, confirmado && styles.checkboxChecked]}
            >
              {confirmado && (
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              Entiendo las consecuencias y deseo desvincular la tarjeta
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.8}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                (!confirmado || loading) && styles.confirmButtonDisabled,
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
              disabled={!confirmado || loading}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? "Procesando..." : "Desvincular"}
              </Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ff9800",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: "#f5f5f5",
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
    padding: 16,
    borderRadius: 10,
    marginBottom: 18,
  },
  infoBoxTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoBoxIcon: {
    marginRight: 8,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },
  infoBoxContent: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  infoBoxSubtext: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },
  warningBox: {
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#ffcdd2",
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
  },
  warningTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  warningIcon: {
    marginRight: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#c62828",
  },
  warningItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bullet: {
    fontSize: 18,
    fontWeight: "700",
    color: "#c62828",
    marginRight: 8,
    lineHeight: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#bdbdbd",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    fontWeight: "500",
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#d0d0d0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
  },
  confirmButton: {
    backgroundColor: "#ff9800",
  },
  confirmButtonDisabled: {
    backgroundColor: "#e0e0e0",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
