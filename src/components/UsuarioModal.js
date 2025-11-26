import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const ROLES_DISPONIBLES = ["Admin", "Mozo", "Emisor", "Cajero"];

export default function UsuarioModal({
  visible,
  onClose,
  onSave,
  usuario = null,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    nombreUsuario: "",
    contrasena: "",
    confirmarContrasena: "",
    activo: true,
    roles: [],
  });

  const isEdit = !!usuario;

  useEffect(() => {
    if (usuario) {
      setFormData({
        nombreUsuario: usuario.nombreUsuario || "",
        contrasena: "",
        confirmarContrasena: "",
        activo: usuario.activo !== undefined ? usuario.activo : true,
        roles: usuario.roles || [],
      });
    } else {
      setFormData({
        nombreUsuario: "",
        contrasena: "",
        confirmarContrasena: "",
        activo: true,
        roles: [],
      });
    }
  }, [usuario, visible]);

  const handleRolToggle = (rol) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(rol)
        ? prev.roles.filter((r) => r !== rol)
        : [...prev.roles, rol],
    }));
  };

  const handleSave = () => {
    // Validaciones
    if (!formData.nombreUsuario.trim()) {
      Alert.alert("Error", "El nombre de usuario es obligatorio");
      return;
    }

    if (!isEdit) {
      if (!formData.contrasena) {
        Alert.alert("Error", "La contraseña es obligatoria");
        return;
      }
      if (formData.contrasena !== formData.confirmarContrasena) {
        Alert.alert("Error", "Las contraseñas no coinciden");
        return;
      }
    } else {
      if (
        formData.contrasena &&
        formData.contrasena !== formData.confirmarContrasena
      ) {
        Alert.alert("Error", "Las contraseñas no coinciden");
        return;
      }
    }

    if (formData.roles.length === 0) {
      Alert.alert("Error", "Debe seleccionar al menos un rol");
      return;
    }

    // Preparar datos para enviar
    const dataToSend = {
      nombreUsuario: formData.nombreUsuario,
      activo: formData.activo,
      roles: formData.roles,
    };

    // Solo incluir contraseña si se proporcionó
    if (formData.contrasena) {
      dataToSend.contrasena = formData.contrasena;
    }

    onSave(dataToSend);
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEdit ? "Editar Usuario" : "Nuevo Usuario"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Nombre de usuario */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre de Usuario *</Text>
              <TextInput
                style={styles.input}
                value={formData.nombreUsuario}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, nombreUsuario: text }))
                }
                placeholder="Ingrese nombre de usuario"
                autoCapitalize="none"
                editable={!isEdit} // No permitir editar el username
              />
            </View>

            {/* Contraseña */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Contraseña {!isEdit && "*"}
                {isEdit && " (dejar vacío para no cambiar)"}
              </Text>
              <TextInput
                style={styles.input}
                value={formData.contrasena}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, contrasena: text }))
                }
                placeholder="Ingrese contraseña"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Confirmar Contraseña */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Confirmar Contraseña {!isEdit && "*"}
              </Text>
              <TextInput
                style={styles.input}
                value={formData.confirmarContrasena}
                onChangeText={(text) =>
                  setFormData((prev) => ({
                    ...prev,
                    confirmarContrasena: text,
                  }))
                }
                placeholder="Confirme la contraseña"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Estado Activo */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Estado</Text>
              <View style={styles.switchContainer}>
                <TouchableOpacity
                  style={[
                    styles.switchButton,
                    formData.activo && styles.switchButtonActive,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, activo: true }))
                  }
                >
                  <Text
                    style={[
                      styles.switchButtonText,
                      formData.activo && styles.switchButtonTextActive,
                    ]}
                  >
                    Activo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.switchButton,
                    !formData.activo && styles.switchButtonActive,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, activo: false }))
                  }
                >
                  <Text
                    style={[
                      styles.switchButtonText,
                      !formData.activo && styles.switchButtonTextActive,
                    ]}
                  >
                    Inactivo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Roles */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Roles *</Text>
              <View style={styles.rolesContainer}>
                {ROLES_DISPONIBLES.map((rol) => (
                  <TouchableOpacity
                    key={rol}
                    style={[
                      styles.roleChip,
                      formData.roles.includes(rol) && styles.roleChipSelected,
                    ]}
                    onPress={() => handleRolToggle(rol)}
                  >
                    <MaterialCommunityIcons
                      name={
                        formData.roles.includes(rol)
                          ? "checkbox-marked"
                          : "checkbox-blank-outline"
                      }
                      size={20}
                      color={formData.roles.includes(rol) ? "#4A90E2" : "#999"}
                    />
                    <Text
                      style={[
                        styles.roleChipText,
                        formData.roles.includes(rol) &&
                          styles.roleChipTextSelected,
                      ]}
                    >
                      {rol}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEdit ? "Guardar Cambios" : "Crear Usuario"}
                </Text>
              )}
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
    borderRadius: 12,
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
  },
  switchContainer: {
    flexDirection: "row",
    gap: 10,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  switchButtonActive: {
    backgroundColor: "#4A90E2",
    borderColor: "#4A90E2",
  },
  switchButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  switchButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  rolesContainer: {
    gap: 10,
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  roleChipSelected: {
    borderColor: "#4A90E2",
    backgroundColor: "#E3F2FD",
  },
  roleChipText: {
    fontSize: 14,
    color: "#666",
  },
  roleChipTextSelected: {
    color: "#4A90E2",
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#4A90E2",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
});
