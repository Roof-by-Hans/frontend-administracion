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
import { Picker } from "@react-native-picker/picker";

export default function ClienteModal({ visible, cliente, onClose, onGuardar }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [subscripcion, setSubscripcion] = useState("Básica");
  
  // Estados para los errores
  const [errores, setErrores] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
  });

  // Efecto para cargar datos del cliente al editar
  useEffect(() => {
    if (cliente) {
      setNombre(cliente.nombre);
      setApellido(cliente.apellido);
      setTelefono(cliente.telefono);
      setSubscripcion(cliente.subscripcion);
    } else {
      // Resetear campos al agregar nuevo
      setNombre("");
      setApellido("");
      setTelefono("");
      setSubscripcion("Básica");
    }
    // Limpiar errores al abrir/cerrar modal
    setErrores({ nombre: "", apellido: "", telefono: "" });
  }, [cliente, visible]);

  // Validación en tiempo real del nombre
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

  // Validación en tiempo real del apellido
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

  // Validación en tiempo real del teléfono
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

  // Validar y guardar cliente
  const handleGuardar = () => {
    // Validaciones finales
    const nuevosErrores = {
      nombre: "",
      apellido: "",
      telefono: "",
    };

    if (!nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
      nuevosErrores.nombre = "El nombre solo debe contener letras";
    }

    if (!apellido.trim()) {
      nuevosErrores.apellido = "El apellido es obligatorio";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellido)) {
      nuevosErrores.apellido = "El apellido solo debe contener letras";
    }

    if (!telefono.trim()) {
      nuevosErrores.telefono = "El teléfono es obligatorio";
    } else if (!/^\d+$/.test(telefono)) {
      nuevosErrores.telefono = "El teléfono solo debe contener números";
    } else if (telefono.length < 7) {
      nuevosErrores.telefono = "El teléfono debe tener al menos 7 dígitos";
    }

    // Si hay errores, actualizar el estado y no continuar
    if (nuevosErrores.nombre || nuevosErrores.apellido || nuevosErrores.telefono) {
      setErrores(nuevosErrores);
      return;
    }

    // Crear objeto cliente
    const clienteData = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefono.trim(),
      subscripcion: subscripcion,
    };

    onGuardar(clienteData);
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
            <Text style={styles.modalTitle}>
              {cliente ? "Editar Cliente" : "Agregar Cliente"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Campo Nombre */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={[styles.input, errores.nombre && styles.inputError]}
                value={nombre}
                onChangeText={handleNombreChange}
                placeholder="Ingrese el nombre"
                placeholderTextColor="#999"
              />
              {errores.nombre ? (
                <Text style={styles.errorText}>{errores.nombre}</Text>
              ) : null}
            </View>

            {/* Campo Apellido */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Apellido *</Text>
              <TextInput
                style={[styles.input, errores.apellido && styles.inputError]}
                value={apellido}
                onChangeText={handleApellidoChange}
                placeholder="Ingrese el apellido"
                placeholderTextColor="#999"
              />
              {errores.apellido ? (
                <Text style={styles.errorText}>{errores.apellido}</Text>
              ) : null}
            </View>

            {/* Campo Teléfono */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Teléfono *</Text>
              <TextInput
                style={[styles.input, errores.telefono && styles.inputError]}
                value={telefono}
                onChangeText={handleTelefonoChange}
                placeholder="Ingrese el teléfono"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
              {errores.telefono ? (
                <Text style={styles.errorText}>{errores.telefono}</Text>
              ) : null}
            </View>

            {/* Campo Suscripción */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Suscripción *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={subscripcion}
                  onValueChange={(itemValue) => setSubscripcion(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Básica" value="Básica" />
                  <Picker.Item label="Premium" value="Premium" />
                  <Picker.Item label="VIP" value="VIP" />
                </Picker>
              </View>
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
              <Text style={styles.saveButtonText}>Guardar</Text>
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
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
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
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
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
});
