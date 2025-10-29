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
  
  // Estados para los errores
  const [errores, setErrores] = useState({
    nombre: "",
    categoria: "",
    precio: "",
    stock: "",
  });

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
    // Limpiar errores al abrir/cerrar modal
    setErrores({ nombre: "", categoria: "", precio: "", stock: "" });
  }, [producto, visible]);

  const limpiarCampos = () => {
    setNombre("");
    setCategoria("");
    setPrecio("");
    setStock("");
  };

  // Validación en tiempo real del nombre
  const handleNombreChange = (text) => {
    setNombre(text);
    if (text.trim() === "") {
      setErrores(prev => ({ ...prev, nombre: "El nombre del producto es obligatorio" }));
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(text)) {
      setErrores(prev => ({ ...prev, nombre: "El nombre solo debe contener letras" }));
    } else {
      setErrores(prev => ({ ...prev, nombre: "" }));
    }
  };

  // Validación en tiempo real de la categoría
  const handleCategoriaChange = (text) => {
    setCategoria(text);
    if (text.trim() === "") {
      setErrores(prev => ({ ...prev, categoria: "La categoría es obligatoria" }));
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(text)) {
      setErrores(prev => ({ ...prev, categoria: "La categoría solo debe contener letras" }));
    } else {
      setErrores(prev => ({ ...prev, categoria: "" }));
    }
  };

  // Validación en tiempo real del precio
  const handlePrecioChange = (text) => {
    setPrecio(text);
    if (text.trim() === "") {
      setErrores(prev => ({ ...prev, precio: "El precio es obligatorio" }));
    } else if (isNaN(parseFloat(text))) {
      setErrores(prev => ({ ...prev, precio: "El precio debe ser un número válido" }));
    } else if (parseFloat(text) <= 0) {
      setErrores(prev => ({ ...prev, precio: "El precio debe ser mayor a 0" }));
    } else {
      setErrores(prev => ({ ...prev, precio: "" }));
    }
  };

  // Validación en tiempo real del stock
  const handleStockChange = (text) => {
    setStock(text);
    if (text.trim() === "") {
      setErrores(prev => ({ ...prev, stock: "El stock es obligatorio" }));
    } else if (isNaN(parseInt(text))) {
      setErrores(prev => ({ ...prev, stock: "El stock debe ser un número válido" }));
    } else if (parseInt(text) < 0) {
      setErrores(prev => ({ ...prev, stock: "El stock no puede ser negativo" }));
    } else {
      setErrores(prev => ({ ...prev, stock: "" }));
    }
  };

  const handleGuardar = () => {
    // Validar que no haya errores
    const hayErrores = Object.values(errores).some(error => error !== "");
    const camposVacios = !nombre.trim() || !categoria.trim() || !precio.trim() || !stock.trim();
    
    if (hayErrores || camposVacios) {
      // Marcar todos los campos vacíos como error
      if (!nombre.trim()) setErrores(prev => ({ ...prev, nombre: "El nombre del producto es obligatorio" }));
      if (!categoria.trim()) setErrores(prev => ({ ...prev, categoria: "La categoría es obligatoria" }));
      if (!precio.trim()) setErrores(prev => ({ ...prev, precio: "El precio es obligatorio" }));
      if (!stock.trim()) setErrores(prev => ({ ...prev, stock: "El stock es obligatorio" }));
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
                  style={[styles.input, errores.nombre && styles.inputError]}
                  placeholder="Ej: Pizza Margarita"
                  value={nombre}
                  onChangeText={handleNombreChange}
                  placeholderTextColor="#999"
                />
                {errores.nombre ? (
                  <Text style={styles.errorText}>{errores.nombre}</Text>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Categoría *</Text>
                <TextInput
                  style={[styles.input, errores.categoria && styles.inputError]}
                  placeholder="Ej: Comidas"
                  value={categoria}
                  onChangeText={handleCategoriaChange}
                  placeholderTextColor="#999"
                />
                {errores.categoria ? (
                  <Text style={styles.errorText}>{errores.categoria}</Text>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Precio *</Text>
                <TextInput
                  style={[styles.input, errores.precio && styles.inputError]}
                  placeholder="Ej: 12.50"
                  value={precio}
                  onChangeText={handlePrecioChange}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
                {errores.precio ? (
                  <Text style={styles.errorText}>{errores.precio}</Text>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Stock *</Text>
                <TextInput
                  style={[styles.input, errores.stock && styles.inputError]}
                  placeholder="Ej: 50"
                  value={stock}
                  onChangeText={handleStockChange}
                  keyboardType="number-pad"
                  placeholderTextColor="#999"
                />
                {errores.stock ? (
                  <Text style={styles.errorText}>{errores.stock}</Text>
                ) : null}
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
  inputError: {
    borderColor: "#d32f2f",
    backgroundColor: "#ffebee",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 12,
    marginTop: 4,
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
