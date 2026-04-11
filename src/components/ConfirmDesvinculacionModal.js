import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

/**
 * Modal de confirmación para desvincular tarjeta de cliente anterior
 * @param {Object} props
 * @param {boolean} props.visible - Si el modal está visible
 * @param {Object} props.conflicto - Información del conflicto
 * @param {Object} props.conflicto.clienteActual - Cliente que tiene la tarjeta actualmente
 * @param {string} props.conflicto.clienteActual.nombre - Nombre del cliente actual
 * @param {string} props.conflicto.clienteActual.apellido - Apellido del cliente actual
 * @param {Object} props.conflicto.tarjetaActual - Info de la tarjeta
 * @param {string} props.conflicto.tarjetaActual.uuid - UID de la tarjeta
 * @param {string} props.conflicto.tarjetaActual.tipo - Tipo de suscripción
 * @param {string} props.conflicto.tarjetaActual.nivel - Nivel de suscripción
 * @param {Object} props.clienteNuevo - Cliente nuevo al que se asignará
 * @param {string} props.clienteNuevo.nombre - Nombre del cliente nuevo
 * @param {string} props.clienteNuevo.apellido - Apellido del cliente nuevo
 * @param {Function} props.onConfirm - Callback al confirmar
 * @param {Function} props.onCancel - Callback al cancelar
 */
export default function ConfirmDesvinculacionModal({
  visible,
  conflicto,
  clienteNuevo,
  onConfirm,
  onCancel,
}) {
  const [confirmado, setConfirmado] = useState(false);

    const handleCancel = () => {
    setConfirmado(false);
    onCancel();
  };

  const handleConfirm = () => {
    if (confirmado) {
      setConfirmado(false);
      onConfirm();
    }
  };

  if (!conflicto) return null;

  const clienteActual = conflicto.clienteActual || {};
  const tarjetaActual = conflicto.tarjetaActual || {};
  const esMismoCliente = conflicto.esMismoCliente || false;

    return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
          >
            {/* Icono de advertencia */}
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={80}
                color="#ff9800"
              />
            </View>

            <Text style={styles.title}>
              {esMismoCliente
                ? "Advertencia: Cambio de Tipo de Tarjeta"
                : "Advertencia de Desvinculación"}
            </Text>

            {/* Mensaje principal */}
            <Text style={styles.warningText}>
              {esMismoCliente
                ? "Está a punto de cambiar el tipo de suscripción de esta tarjeta. Esta acción resetea completamente los datos de la tarjeta."
                : "Esta tarjeta ya está asignada a otro cliente. Si continúa, se realizarán las siguientes acciones:"}
            </Text>

            {/* Información del cliente actual */}
            <View style={styles.infoBox}>
              <View style={styles.infoBoxTitleContainer}>
                <MaterialCommunityIcons
                  name="account"
                  size={18}
                  color="#666"
                  style={styles.infoBoxIcon}
                />
                <Text style={styles.infoBoxTitle}>
                  {esMismoCliente ? "Cliente:" : "Cliente Actual:"}
                </Text>
              </View>
              {clienteActual &&
              (clienteActual.nombre || clienteActual.apellido) ? (
                <Text style={styles.infoBoxContent}>
                  {clienteActual.nombre || ""} {clienteActual.apellido || ""}
                </Text>
              ) : (
                <Text style={[styles.infoBoxContent, styles.warningColor]}>
                  Sin información disponible
                </Text>
              )}
              <Text style={styles.infoBoxSubtext}>
                {esMismoCliente
                  ? "Se resetearán los datos de su tarjeta"
                  : "Se desvinculará esta tarjeta"}
              </Text>
            </View>

            {/* Información del cliente nuevo - solo si NO es el mismo cliente */}
            {!esMismoCliente && (
              <View style={[styles.infoBox, styles.infoBoxSuccess]}>
                <View style={styles.infoBoxTitleContainer}>
                  <MaterialCommunityIcons
                    name="account-arrow-right"
                    size={18}
                    color="#2e7d32"
                    style={styles.infoBoxIcon}
                  />
                  <Text style={[styles.infoBoxTitle, styles.successText]}>
                    Nuevo Cliente:
                  </Text>
                </View>
                <Text style={styles.infoBoxContent}>
                  {clienteNuevo?.nombre} {clienteNuevo?.apellido}
                </Text>
                <Text style={styles.infoBoxSubtext}>
                  Se asignará esta tarjeta con los nuevos datos
                </Text>
              </View>
            )}

            {/* Consecuencias */}
            <View style={styles.consequencesBox}>
              <View style={styles.consequencesTitleContainer}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={20}
                  color="#e65100"
                  style={styles.consequencesTitleIcon}
                />
                <Text style={styles.consequencesTitle}>
                  Consecuencias Importantes:
                </Text>
              </View>

              {!esMismoCliente && (
                <View style={styles.consequenceItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.consequenceText}>
                    El cliente{" "}
                    <Text style={styles.bold}>
                      {clienteActual.nombre || "anterior"}{" "}
                      {clienteActual.apellido || ""}
                    </Text>{" "}
                    quedará sin tarjeta asignada
                  </Text>
                </View>
              )}

              <View style={styles.consequenceItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.consequenceText}>
                  Se resetearán <Text style={styles.bold}>completamente</Text>{" "}
                  los datos de la tarjeta (saldo, crédito, historial, etc.)
                </Text>
              </View>

              <View style={styles.consequenceItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.consequenceText}>
                  Esta acción{" "}
                  <Text style={styles.bold}>NO tiene reversión automática</Text>
                </Text>
              </View>

              {esMismoCliente && (
                <View style={styles.consequenceItem}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.consequenceText}>
                    Se perderá todo el saldo o crédito disponible actual
                  </Text>
                </View>
              )}
            </View>

            {/* Checkbox de confirmación */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setConfirmado(!confirmado)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.checkbox, confirmado && styles.checkboxChecked]}
              >
                {confirmado && (
                  <MaterialCommunityIcons name="check" size={20} color="#fff" />
                )}
              </View>
              <Text style={styles.checkboxLabel}>
                Confirmo que entiendo las consecuencias y deseo continuar con la
                desvinculación
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* es de acción */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                !confirmado && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              activeOpacity={0.8}
              disabled={!confirmado}
            >
              <Text style={styles.confirmButtonText}>
                Confirmar Desvinculación
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 600,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  scrollView: {
    padding: 32,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ff9800",
    marginBottom: 20,
    textAlign: "center",
  },
  warningText: {
    fontSize: 16,
    color: "#444",
    marginBottom: 24,
    lineHeight: 24,
    textAlign: "center",
  },
  infoBox: {
    backgroundColor: "#f5f5f5",
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  infoBoxSuccess: {
    borderLeftColor: "#4CAF50",
    backgroundColor: "#f1f8f4",
  },
  infoBoxTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoBoxIcon: {
    marginRight: 6,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },
  successText: {
    color: "#2e7d32",
  },
  infoBoxContent: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  infoBoxId: {
    fontSize: 13,
    color: "#999",
    marginBottom: 4,
  },
  warningColor: {
    color: "#e65100",
  },
  infoBoxSubtext: {
    fontSize: 13,
    color: "#777",
    fontStyle: "italic",
  },
  consequencesBox: {
    backgroundColor: "#fff3e0",
    borderWidth: 2,
    borderColor: "#ff9800",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  consequencesTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  consequencesTitleIcon: {
    marginRight: 6,
  },
  consequencesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e65100",
  },
  consequenceItem: {
    flexDirection: "row",
    marginBottom: 10,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 16,
    color: "#e65100",
    marginRight: 8,
    fontWeight: "bold",
  },
  consequenceText: {
    fontSize: 14,
    color: "#444",
    flex: 1,
    lineHeight: 20,
  },
  bold: {
    fontWeight: "700",
    color: "#333",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
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
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d0d0d0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#ff9800",
    paddingVertical: 14,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: "#bdbdbd",
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
