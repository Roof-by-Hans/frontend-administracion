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
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as categoriasService from '../services/categoriasService';

export default function CategoriaModal({
  visible,
  onClose,
  onSave,
  categoria = null,
}) {
  const [categorias, setCategorias] = useState([]);
  const [categoriasPlanas, setCategoriasPlanas] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);
  const [nombre, setNombre] = useState("");
  const [categoriaPadreId, setCategoriaPadreId] = useState("");
  
  // Estados para los errores
  const [errores, setErrores] = useState({
    nombre: "",
  });

  // Cargar categorías al montar el componente
  useEffect(() => {
    if (visible) {
      cargarCategorias();
    }
  }, [visible]);

  const cargarCategorias = async () => {
    try {
      setCargandoCategorias(true);
      const response = await categoriasService.getCategorias();
      
      if (response.success && response.data) {
        setCategorias(response.data);
        // Convertir la estructura jerárquica a lista plana para el selector
        const planas = categoriasService.aplanarCategorias(response.data);
        
        // Si estamos editando, filtrar la categoría actual y sus hijos para evitar ciclos
        if (categoria) {
          // Helper function to collect all descendant IDs of a category
          function collectDescendantIds(catId, categoriasTree) {
            let ids = [];
            const findAndCollect = (nodes) => {
              for (const node of nodes) {
                if (node.id === catId) {
                  // Collect all descendants recursively
                  const collect = (children) => {
                    for (const child of children) {
                      ids.push(child.id);
                      if (child.children && child.children.length > 0) {
                        collect(child.children);
                      }
                    }
                  };
                  if (node.children && node.children.length > 0) {
                    collect(node.children);
                  }
                  break;
                } else if (node.children && node.children.length > 0) {
                  findAndCollect(node.children);
                }
              }
            };
            findAndCollect(categoriasTree);
            return ids;
          }
          const descendantIds = collectDescendantIds(categoria.id, response.data);
          const filtradas = planas.filter(cat => {
            // No permitir que sea su propio padre ni uno de sus descendientes
            if (cat.id === categoria.id) return false;
            if (descendantIds.includes(cat.id)) return false;
            return true;
          });
          setCategoriasPlanas(filtradas);
        } else {
          setCategoriasPlanas(planas);
        }
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      Alert.alert("Error", "No se pudieron cargar las categorías. Intenta nuevamente.");
    } finally {
      setCargandoCategorias(false);
    }
  };

  useEffect(() => {
    if (categoria) {
      // Modo edición
      setNombre(categoria.nombre);
      setCategoriaPadreId(categoria.idCatPadre?.toString() || "");
    } else {
      // Modo creación
      limpiarCampos();
    }
    // Limpiar errores al abrir/cerrar modal
    setErrores({ nombre: "" });
  }, [categoria, visible]);

  const limpiarCampos = () => {
    setNombre("");
    setCategoriaPadreId("");
  };

  // Validación en tiempo real del nombre
  const handleNombreChange = (text) => {
    setNombre(text);
    if (text.trim() === "") {
      setErrores(prev => ({ ...prev, nombre: "El nombre de la categoría es obligatorio" }));
    } else {
      setErrores(prev => ({ ...prev, nombre: "" }));
    }
  };

  const handleGuardar = () => {
    // Validar que no haya errores
    const hayErrores = Object.values(errores).some(error => error !== "");
    const camposVacios = !nombre.trim();
    
    if (hayErrores || camposVacios) {
      // Marcar todos los campos vacíos como error
      if (!nombre.trim()) setErrores(prev => ({ ...prev, nombre: "El nombre de la categoría es obligatorio" }));
      return;
    }

    const categoriaData = {
      id: categoria ? categoria.id : null,
      nombre: nombre.trim(),
      idCatPadre: categoriaPadreId ? parseInt(categoriaPadreId) : null,
    };

    onSave(categoriaData);
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
                {categoria ? "Editar Categoría" : "Agregar Categoría"}
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
                <Text style={styles.label}>Nombre de la Categoría *</Text>
                <TextInput
                  style={[styles.input, errores.nombre && styles.inputError]}
                  placeholder="Ej: Whiskies Premium"
                  value={nombre}
                  onChangeText={handleNombreChange}
                  placeholderTextColor="#999"
                />
                {errores.nombre ? (
                  <Text style={styles.errorText}>{errores.nombre}</Text>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Categoría Padre (opcional)</Text>
                {cargandoCategorias ? (
                  <View style={styles.loadingCategoriasContainer}>
                    <ActivityIndicator size="small" color="#4CAF50" />
                    <Text style={styles.loadingCategoriasText}>Cargando categorías...</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.selectContainer}>
                      <select
                        value={categoriaPadreId}
                        onChange={(e) => setCategoriaPadreId(e.target.value)}
                        style={styles.select}
                      >
                        <option value="">Sin categoría padre (Raíz)</option>
                        {categoriasPlanas.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nombreConIndentacion}
                          </option>
                        ))}
                      </select>
                    </View>
                    <Text style={styles.helperText}>
                      Las categorías raíz aparecen en el nivel superior. Las subcategorías se agrupan bajo su categoría padre.
                    </Text>
                  </>
                )}
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
                  {categoria ? "Actualizar" : "Guardar"}
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
    maxHeight: "70%",
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
    maxHeight: 300,
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
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
    outlineStyle: "none",
  },
  inputError: {
    borderColor: "#d32f2f",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 12,
    marginTop: 4,
  },
  selectContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  select: {
    width: "100%",
    padding: 10,
    fontSize: 14,
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  loadingCategoriasContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  loadingCategoriasText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
