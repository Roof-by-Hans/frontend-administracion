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
import { Picker } from "@react-native-picker/picker";

export default function MozoModal({ visible, onClose, onSave, mozo = null }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [turno, setTurno] = useState("Mañana");
  const [errores, setErrores] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    turno: "",
  });

  useEffect(() => {
    if (mozo) {
      setNombre(mozo.nombre);
      setApellido(mozo.apellido);
      setTelefono(mozo.telefono);
      setTurno(mozo.turno);
    } else {
      limpiarCampos();
    }
        setErrores({ nombre: "", apellido: "", telefono: "", turno: "" });
  }, [mozo, visible]);

  const limpiarCampos = () => {
    setNombre("");
    setApellido("");
    setTelefono("");
    setTurno("Mañana");
  };
  const handleNombreChange = (text) => {
    setNombre(text);
    if (text.trim() === "") {
      setErrores(prev => ({ ...prev, nombre: "El nombre es obligatorio" }));
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(text)) {
      setErrores(prev => ({ ...prev, nombre: "El nombre solo debe contener letras" }));
    } else {
      setErrores(prev => ({ ...prev, nombre: "" }));
    }
  };
  const handleApellidoChange = (text) => {
    setApellido(text);
    if (text.trim() === "") {
      setErrores(prev => ({ ...prev, apellido: "El apellido es obligatorio" }));
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(text)) {
      setErrores(prev => ({ ...prev, apellido: "El apellido solo debe contener letras" }));
    } else {
      setErrores(prev => ({ ...prev, apellido: "" }));
    }
  };
  const handleTelefonoChange = (text) => {
    setTelefono(text);
    if (text.trim() === "") {
      setErrores(prev => ({ ...prev, telefono: "El teléfono es obligatorio" }));
    } else if (!/^\d+$/.test(text)) {
      setErrores(prev => ({ ...prev, telefono: "El teléfono solo debe contener números" }));
    } else if (text.length < 7) {
      setErrores(prev => ({ ...prev, telefono: "El teléfono debe tener al menos 7 dígitos" }));
    } else {
      setErrores(prev => ({ ...prev, telefono: "" }));
    }
  };

  const handleGuardar = () => {
        const hayErrores = Object.values(errores).some(error => error !== "");
    const camposVacios = !nombre.trim() || !apellido.trim() || !telefono.trim();
    
    if (hayErrores || camposVacios) {
      if (!nombre.trim()) setErrores(prev => ({ ...prev, nombre: "El nombre es obligatorio" }));
      if (!apellido.trim()) setErrores(prev => ({ ...prev, apellido: "El apellido es obligatorio" }));
      if (!telefono.trim()) setErrores(prev => ({ ...prev, telefono: "El teléfono es obligatorio" }));
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

            
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre *</Text>
                <TextInput
                  style={[styles.input, errores.nombre && styles.inputError]}
                  placeholder="Ej: Carlos"
                  value={nombre}
                  onChangeText={handleNombreChange}
                  placeholderTextColor="#999"
                />
                {errores.nombre ? (
                  <Text style={styles.errorText}>{errores.nombre}</Text>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Apellido *</Text>
                <TextInput
                  style={[styles.input, errores.apellido && styles.inputError]}
                  placeholder="Ej: Pérez"
                  value={apellido}
                  onChangeText={handleApellidoChange}
                  placeholderTextColor="#999"
                />
                {errores.apellido ? (
                  <Text style={styles.errorText}>{errores.apellido}</Text>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Teléfono *</Text>
                <TextInput
                  style={[styles.input, errores.telefono && styles.inputError]}
                  placeholder="Ej: +598 99 123 456"
                  value={telefono}
                  onChangeText={handleTelefonoChange}
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
                {errores.telefono ? (
                  <Text style={styles.errorText}>{errores.telefono}</Text>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Turno *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={turno}
                    onValueChange={(itemValue) => setTurno(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Mañana" value="Mañana" />
                    <Picker.Item label="Tarde" value="Tarde" />
                    <Picker.Item label="Noche" value="Noche" />
                  </Picker>
                </View>
              </View>
            </ScrollView>

            
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
  inputError: {
    borderColor: "#d32f2f",
    backgroundColor: "#ffebee",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 45,
    width: "100%",
    backgroundColor: "transparent",
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
    backgroundColor: "#4CAF50",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
