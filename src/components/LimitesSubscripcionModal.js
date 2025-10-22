import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const STORAGE_KEY = "limites_subscripcion";

// Límites por defecto
const LIMITES_INICIALES = {
  basica: 100000,
  premium: 250000,
  vip: 500000,
};

const formatearNumero = (numero) => {
  return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

const quitarFormatoNumero = (texto) => {
  return texto.replace(/\./g, '');
};

export default function LimitesSubscripcionModal({ visible, onClose }) {
  const [limites, setLimites] = useState(LIMITES_INICIALES);
  const [errores, setErrores] = useState({
    basica: "",
    premium: "",
    vip: "",
  });
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // Cargar límites guardados al abrir el modal
  useEffect(() => {
    if (visible) {
      try {
        const limitesGuardados = localStorage.getItem(STORAGE_KEY);
        if (limitesGuardados) {
          setLimites(JSON.parse(limitesGuardados));
        } else {
          setLimites(LIMITES_INICIALES);
        }
        setErrores({ basica: "", premium: "", vip: "" });
      } catch (error) {
        console.error("Error al cargar límites:", error);
        setLimites(LIMITES_INICIALES);
      }
    }
  }, [visible]);

  // Validación en tiempo real
  const handleLimiteChange = (tipo, texto) => {
    // Remover '$' y espacios, solo dejar números y puntos
    const textoLimpio = texto.replace(/[$\s]/g, "");
    // Remover puntos para obtener el número real
    const numeroSinFormato = quitarFormatoNumero(textoLimpio);
    
    setLimites(prev => ({ ...prev, [tipo]: numeroSinFormato }));

    if (numeroSinFormato.trim() === "") {
      setErrores(prev => ({ ...prev, [tipo]: "El límite es obligatorio" }));
    } else if (!/^\d+$/.test(numeroSinFormato)) {
      setErrores(prev => ({ ...prev, [tipo]: "Solo se permiten números" }));
    } else if (parseInt(numeroSinFormato) < 1) {
      setErrores(prev => ({ ...prev, [tipo]: "El límite debe ser mayor a 0" }));
    } else if (parseInt(numeroSinFormato) > 999999999) {
      setErrores(prev => ({ ...prev, [tipo]: "El límite es demasiado alto" }));
    } else {
      setErrores(prev => ({ ...prev, [tipo]: "" }));
    }
  };

  // Validar y mostrar modal de confirmación. 
  const handleGuardar = () => {
    const nuevosErrores = {
      basica: "",
      premium: "",
      vip: "",
    };

    // Validar cada campo
    ["basica", "premium", "vip"].forEach(tipo => {
      const valor = limites[tipo].toString();
      if (!valor.trim()) {
        nuevosErrores[tipo] = "El límite es obligatorio";
      } else if (!/^\d+$/.test(valor)) {
        nuevosErrores[tipo] = "Solo se permiten números";
      } else if (parseInt(valor) < 1) {
        nuevosErrores[tipo] = "El límite debe ser mayor a 0";
      } else if (parseInt(valor) > 999999999) {
        nuevosErrores[tipo] = "El límite es demasiado alto";
      }
    });

    // Si hay errores, no continuar
    if (nuevosErrores.basica || nuevosErrores.premium || nuevosErrores.vip) {
      setErrores(nuevosErrores);
      return;
    }

    // Mostrar modal de confirmación
    setConfirmModalVisible(true);
  };

  // Confirmar y guardar cambios
  const confirmarGuardado = () => {
    try {
      const limitesAGuardar = {
        basica: parseInt(limites.basica),
        premium: parseInt(limites.premium),
        vip: parseInt(limites.vip),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitesAGuardar));
      setConfirmModalVisible(false);
      onClose();
    } catch (error) {
      console.error("Error al guardar límites:", error);
    }
  };

  // Cancelar confirmación
  const cancelarConfirmacion = () => {
    setConfirmModalVisible(false);
  };

  const handleCancelar = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleContainer}>
              <MaterialCommunityIcons name="credit-card-settings-outline" size={28} color="#333" />
              <Text style={styles.modalTitle}>Editar límites de suscripción</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>
              Define el límite de consumo para cada tipo de suscripción.
            </Text>

            {/* Suscripción Básica */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#666" />
                <Text style={styles.label}>Suscripción Básica *</Text>
              </View>
              <TextInput
                style={[styles.input, errores.basica && styles.inputError]}
                value={`$ ${formatearNumero(limites.basica)}`}
                onChangeText={(text) => handleLimiteChange("basica", text)}
                placeholder="Ej: $ 100.000"
                placeholderTextColor="#999"
                keyboardType="number-pad"
              />
              {errores.basica ? (
                <Text style={styles.errorText}>{errores.basica}</Text>
              ) : null}
            </View>

            {/* Suscripción Premium */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <MaterialCommunityIcons name="star-outline" size={20} color="#666" />
                <Text style={styles.label}>Suscripción Premium *</Text>
              </View>
              <TextInput
                style={[styles.input, errores.premium && styles.inputError]}
                value={`$ ${formatearNumero(limites.premium)}`}
                onChangeText={(text) => handleLimiteChange("premium", text)}
                placeholder="Ej: $ 250.000"
                placeholderTextColor="#999"
                keyboardType="number-pad"
              />
              {errores.premium ? (
                <Text style={styles.errorText}>{errores.premium}</Text>
              ) : null}
            </View>

            {/* Suscripción VIP */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <MaterialCommunityIcons name="crown-outline" size={20} color="#666" />
                <Text style={styles.label}>Suscripción VIP *</Text>
              </View>
              <TextInput
                style={[styles.input, errores.vip && styles.inputError]}
                value={`$ ${formatearNumero(limites.vip)}`}
                onChangeText={(text) => handleLimiteChange("vip", text)}
                placeholder="Ej: $ 500.000"
                placeholderTextColor="#999"
                keyboardType="number-pad"
              />
              {errores.vip ? (
                <Text style={styles.errorText}>{errores.vip}</Text>
              ) : null}
            </View>

            {/* Información adicional */}
            <View style={styles.infoContainer}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#2196F3" />
              <Text style={styles.infoText}>
                Los límites determinan el monto máximo de consumo permitido para cada tipo de suscripción.
              </Text>
            </View>
          </ScrollView>

          {/* Footer con botones */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancelar}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleGuardar}
            >
              <MaterialCommunityIcons name="check" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal de confirmación anidado */}
        {confirmModalVisible && (
          <View style={styles.confirmModalOverlay}>
            <View style={styles.confirmModalContent}>
              {/* Icono de confirmación */}
              <View style={styles.confirmIconContainer}>
                <MaterialCommunityIcons name="check-circle-outline" size={60} color="#4CAF50" />
              </View>

              {/* Título */}
              <Text style={styles.confirmTitle}>¿Guardar cambios?</Text>

              {/* Mensaje */}
              <Text style={styles.confirmMessage}>
                Los nuevos límites de Suscripción se aplicarán inmediatamente.
              </Text>

              {/* Resumen de cambios */}
              <View style={styles.resumenContainer}>
                <View style={styles.resumenItem}>
                  <Text style={styles.resumenLabel}>Básica:</Text>
                  <Text style={styles.resumenValue}>$ {formatearNumero(limites.basica)}</Text>
                </View>
                <View style={styles.resumenItem}>
                  <Text style={styles.resumenLabel}>Premium:</Text>
                  <Text style={styles.resumenValue}>$ {formatearNumero(limites.premium)}</Text>
                </View>
                <View style={styles.resumenItem}>
                  <Text style={styles.resumenLabel}>VIP:</Text>
                  <Text style={styles.resumenValue}>$ {formatearNumero(limites.vip)}</Text>
                </View>
              </View>

              {/* Botones */}
              <View style={styles.confirmButtonContainer}>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.confirmCancelButton]}
                  onPress={cancelarConfirmacion}
                >
                  <Text style={styles.confirmCancelButtonText}>No, volver</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.confirmSaveButton]}
                  onPress={confirmarGuardado}
                >
                  <MaterialCommunityIcons name="check" size={20} color="#fff" />
                  <Text style={styles.confirmSaveButtonText}>Sí, guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    maxWidth: 550,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#f44336",
    borderWidth: 2,
  },
  errorText: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor: "#e3f2fd",
    padding: 12,
    borderRadius: 8,
    gap: 10,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1976d2",
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#d0d0d0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Estilos del modal de confirmación
  confirmModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "85%",
    maxWidth: 400,
    padding: 30,
    alignItems: "center",
  },
  confirmIconContainer: {
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 15,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
  },
  resumenContainer: {
    width: "100%",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 15,
    marginBottom: 25,
    gap: 8,
  },
  resumenItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resumenLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  resumenValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "700",
  },
  confirmButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    width: "100%",
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  confirmCancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#d0d0d0",
  },
  confirmCancelButtonText: {
    color: "#666",
    fontSize: 15,
    fontWeight: "600",
  },
  confirmSaveButton: {
    backgroundColor: "#4CAF50",
  },
  confirmSaveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
