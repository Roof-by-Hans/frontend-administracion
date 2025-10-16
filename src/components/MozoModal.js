import React, { useState, useEffect } from "react";
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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function MozoModal({ visible, onClose, onSave, mozo = null }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [turno, setTurno] = useState("");

  useEffect(() => {
    if (mozo) {
      // Modo edición
      setNombre(mozo.nombre);
      setApellido(mozo.apellido);
      setTelefono(mozo.telefono);
      setTurno(mozo.turno);
    } else {
      // Modo creación
      limpiarCampos();
    }
  }, [mozo, visible]);

  const limpiarCampos = () => {
    setNombre("");
    setApellido("");
    setTelefono("");
    setTurno("");
  };

  const handleGuardar = () => {
    // Validaciones
    if (!nombre.trim()) {
      alert("El nombre del mozo es obligatorio");
      return;
    }
    if (!apellido.trim()) {
      alert("El apellido es obligatorio");
      return;
    }
    if (!telefono.trim()) {
      alert("El teléfono es obligatorio");
      return;
    }
    if (!turno.trim()) {
      alert("El turno es obligatorio");
      return;
    }

    const mozoData = {
      id: mozo ? mozo.id : Date.now(),
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefono.trim(),
      turno: turno.trim(),
    };

    onSave(mozoData);
    limpiarCampos();
    onClose();
  };

  const handleCancelar = () => {
    limpiarCampos();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancelar}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {mozo ? "Editar Mozo" : "Agregar Mozo"}
              </Text>
              <TouchableOpacity
                onPress={handleCancelar}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Carlos"
                  value={nombre}
                  onChangeText={setNombre}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Apellido *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Pérez"
                  value={apellido}
                  onChangeText={setApellido}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Teléfono *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: +598 99 123 456"
                  value={telefono}
                  onChangeText={setTelefono}
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Turno *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Mañana, Tarde, Noche"
                  value={turno}
                  onChangeText={setTurno}
                  placeholderTextColor="#999"
                />
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelar}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleGuardar}
              >
                <Text style={styles.saveButtonText}>
                  {mozo ? "Actualizar" : "Guardar"}
                </Text>
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
    maxWidth: 500,
    maxHeight: "80%",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f1f1f",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f1f1f",
    outlineStyle: "none",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#4A90E2",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
