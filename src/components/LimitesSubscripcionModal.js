import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Alert from "@blazejkustra/react-native-alert";
import tarjetaService from "../services/tarjetaService";

export default function LimitesSubscripcionModal({ visible, onClose }) {
  const [niveles, setNiveles] = useState([]);
  const [limites, setLimites] = useState({});
  const [errores, setErrores] = useState({});
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cargar niveles desde la API al abrir el modal
  useEffect(() => {
    if (visible) {
      cargarNiveles();
    }
  }, [visible]);

  const cargarNiveles = async () => {
    setLoading(true);
    try {
      const response = await tarjetaService.getNivelesSuscripcion();
      const nivelesData = response.data || [];
      
      setNiveles(nivelesData);
      
      // Inicializar límites con los valores actuales
      const limitesIniciales = {};
      const erroresIniciales = {};
      
      nivelesData.forEach(nivel => {
        limitesIniciales[nivel.id] = nivel.limiteCredito.toString();
        erroresIniciales[nivel.id] = "";
      });
      
      setLimites(limitesIniciales);
      setErrores(erroresIniciales);
    } catch (error) {
      console.error("Error al cargar niveles:", error);
      Alert.alert(
        "Error",
        "No se pudieron cargar los niveles de suscripción. Intente nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Validación en tiempo real
  const handleLimiteChange = (idNivel, texto) => {
    setLimites(prev => ({ ...prev, [idNivel]: texto }));

    if (texto.trim() === "") {
      setErrores(prev => ({ ...prev, [idNivel]: "El límite es obligatorio" }));
    } else if (!/^\d+(\.\d{0,2})?$/.test(texto)) {
      setErrores(prev => ({ ...prev, [idNivel]: "Formato inválido" }));
    } else if (parseFloat(texto) <= 0) {
      setErrores(prev => ({ ...prev, [idNivel]: "El límite debe ser mayor a 0" }));
    } else {
      setErrores(prev => ({ ...prev, [idNivel]: "" }));
    }
  };

  // Validar y mostrar modal de confirmación
  const handleGuardar = () => {
    const nuevosErrores = {};
    let hayErrores = false;

    // Validar cada campo
    niveles.forEach(nivel => {
      const valor = limites[nivel.id]?.toString() || "";
      if (!valor.trim()) {
        nuevosErrores[nivel.id] = "El límite es obligatorio";
        hayErrores = true;
      } else if (!/^\d+(\.\d{0,2})?$/.test(valor)) {
        nuevosErrores[nivel.id] = "Formato inválido";
        hayErrores = true;
      } else if (parseFloat(valor) <= 0) {
        nuevosErrores[nivel.id] = "El límite debe ser mayor a 0";
        hayErrores = true;
      }
    });

    // Si hay errores, no continuar
    if (hayErrores) {
      setErrores(nuevosErrores);
      return;
    }

    // Mostrar modal de confirmación
    setConfirmModalVisible(true);
  };

  // Confirmar y guardar cambios
  const confirmarGuardado = async () => {
    setSaving(true);
    setConfirmModalVisible(false);
    
    try {
      // Actualizar cada nivel en el backend
      const promesas = niveles.map(nivel => {
        const nuevoLimite = parseFloat(limites[nivel.id]);
        return tarjetaService.actualizarNivelSuscripcion(nivel.id, {
          nombre: nivel.nombre,
          limite_credito: nuevoLimite,
        });
      });
      
      await Promise.all(promesas);
      
      // Mostrar modal de éxito
      setSuccessModalVisible(true);
    } catch (error) {
      console.error("Error al guardar límites:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "No se pudieron guardar los cambios. Intente nuevamente."
      );
    } finally {
      setSaving(false);
    }
  };

  // Cancelar confirmación
  const cancelarConfirmacion = () => {
    setConfirmModalVisible(false);
  };

  const handleCancelar = () => {
    onClose();
  };

  const handleSuccessClose = () => {
    setSuccessModalVisible(false);
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
              <Text style={styles.modalTitle}>Editar Límites de Subscripción</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>
              Define el límite de crédito para cada nivel de suscripción de tarjetas.
            </Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Cargando niveles...</Text>
              </View>
            ) : niveles.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#999" />
                <Text style={styles.emptyText}>No hay niveles de suscripción disponibles</Text>
              </View>
            ) : (
              niveles.map((nivel) => (
                <View key={nivel.id} style={styles.formGroup}>
                  <View style={styles.labelContainer}>
                    <MaterialCommunityIcons 
                      name={getNivelIcon(nivel.nombre)} 
                      size={20} 
                      color="#666" 
                    />
                    <Text style={styles.label}>{nivel.nombre} *</Text>
                  </View>
                  <TextInput
                    style={[styles.input, errores[nivel.id] && styles.inputError]}
                    value={limites[nivel.id] || ""}
                    onChangeText={(text) => handleLimiteChange(nivel.id, text)}
                    placeholder="Ej: 50000.00"
                    placeholderTextColor="#999"
                    keyboardType="decimal-pad"
                  />
                  {errores[nivel.id] ? (
                    <Text style={styles.errorText}>{errores[nivel.id]}</Text>
                  ) : null}
                </View>
              ))
            )}

            {/* Información adicional */}
            {niveles.length > 0 && (
              <View style={styles.infoContainer}>
                <MaterialCommunityIcons name="information-outline" size={20} color="#2196F3" />
                <Text style={styles.infoText}>
                  Los límites determinan el monto máximo que pueden consumir los clientes con tarjetas de crédito de cada nivel.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer con botones */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancelar}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, (loading || saving || niveles.length === 0) && styles.buttonDisabled]}
              onPress={handleGuardar}
              disabled={loading || saving || niveles.length === 0}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
              )}
              <Text style={styles.saveButtonText}>
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Text>
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
                Los nuevos límites de subscripción se aplicarán inmediatamente.
              </Text>

              {/* Resumen de cambios */}
              <View style={styles.resumenContainer}>
                {niveles.map(nivel => (
                  <View key={nivel.id} style={styles.resumenItem}>
                    <Text style={styles.resumenLabel}>{nivel.nombre}:</Text>
                    <Text style={styles.resumenValue}>${parseFloat(limites[nivel.id] || 0).toFixed(2)}</Text>
                  </View>
                ))}
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

        {/* Modal de éxito */}
        {successModalVisible && (
          <View style={styles.confirmModalOverlay}>
            <View style={styles.confirmModalContent}>
              {/* Icono de éxito */}
              <View style={styles.successIconContainer}>
                <MaterialCommunityIcons name="check-circle" size={60} color="#4CAF50" />
              </View>

              {/* Título */}
              <Text style={styles.confirmTitle}>¡Cambios guardados!</Text>

              {/* Mensaje */}
              <Text style={styles.confirmMessage}>
                Los límites de suscripción se han actualizado correctamente.
              </Text>

              {/* Botón */}
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmSaveButton, { flex: 'none', width: '100%' }]}
                onPress={handleSuccessClose}
              >
                <Text style={styles.confirmSaveButtonText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

// Función helper para obtener icono según el nombre del nivel
const getNivelIcon = (nombreNivel) => {
  const nombre = nombreNivel.toLowerCase();
  if (nombre.includes('black') || nombre.includes('negro')) return 'crown';
  if (nombre.includes('gold') || nombre.includes('oro')) return 'star';
  if (nombre.includes('platinum') || nombre.includes('platino')) return 'diamond';
  if (nombre.includes('silver') || nombre.includes('plata')) return 'circle-outline';
  return 'credit-card-outline';
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
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
  successIconContainer: {
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
