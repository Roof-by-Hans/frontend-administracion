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

export default function ProductoModal({
  visible,
  onClose,
  onSave,
  producto = null,
}) {
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");

  useEffect(() => {
    if (producto) {
      // Modo edición
      setNombre(producto.nombre);
      setCategoria(producto.categoria);
      setPrecio(producto.precio.toString());
      setStock(producto.stock.toString());
    } else {
      // Modo creación
      limpiarCampos();
    }
  }, [producto, visible]);

  const limpiarCampos = () => {
    setNombre("");
    setCategoria("");
    setPrecio("");
    setStock("");
  };

  const handleGuardar = () => {
    // Validaciones
    if (!nombre.trim()) {
      alert("El nombre del producto es obligatorio");
      return;
    }
    if (!categoria.trim()) {
      alert("La categoría es obligatoria");
      return;
    }
    if (!precio.trim() || isNaN(parseFloat(precio))) {
      alert("El precio debe ser un número válido");
      return;
    }
    if (!stock.trim() || isNaN(parseInt(stock))) {
      alert("El stock debe ser un número válido");
      return;
    }

    const productoData = {
      id: producto ? producto.id : Date.now(),
      nombre: nombre.trim(),
      categoria: categoria.trim(),
      precio: parseFloat(precio),
      stock: parseInt(stock),
    };

    onSave(productoData);
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
                {producto ? "Editar Producto" : "Agregar Producto"}
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
                <Text style={styles.label}>Nombre del Producto *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Pizza Margarita"
                  value={nombre}
                  onChangeText={setNombre}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Categoría *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Comidas"
                  value={categoria}
                  onChangeText={setCategoria}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Precio *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 12.50"
                  value={precio}
                  onChangeText={setPrecio}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Stock *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 50"
                  value={stock}
                  onChangeText={setStock}
                  keyboardType="number-pad"
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
                  {producto ? "Actualizar" : "Guardar"}
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
