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
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as categoriasService from '../services/categoriasService';

export default function ProductoModal({
  visible,
  onClose,
  onSave,
  producto = null,
}) {
  const [categorias, setCategorias] = useState([]);
  const [categoriasPlanas, setCategoriasPlanas] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);
  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [precio, setPrecio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState(null);
  const [imagenUrl, setImagenUrl] = useState("");
  
  // Estados para los errores
  const [errores, setErrores] = useState({
    nombre: "",
    categoriaId: "",
    precio: "",
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
        setCategoriasPlanas(planas);
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      Alert.alert("Error", "No se pudieron cargar las categorías. Intenta nuevamente.");
    } finally {
      setCargandoCategorias(false);
    }
  };

  useEffect(() => {
    if (producto) {
      // Modo edición
      setNombre(producto.nombre);
      setCategoriaId(producto.categoriaId?.toString() || "");
      setPrecio(producto.precio.toString());
      setDescripcion(producto.descripcion || "");
      setImagenUrl(producto.fotoPrincipalUrl || "");
      setImagen(null);
    } else {
      // Modo creación
      limpiarCampos();
    }
    // Limpiar errores al abrir/cerrar modal
    setErrores({ nombre: "", categoriaId: "", precio: "" });
  }, [producto, visible]);

  const limpiarCampos = () => {
    setNombre("");
    setCategoriaId("");
    setPrecio("");
    setDescripcion("");
    setImagen(null);
    setImagenUrl("");
  };

  // Validación en tiempo real del nombre
  const handleNombreChange = (text) => {
    setNombre(text);
    if (text.trim() === "") {
      setErrores(prev => ({ ...prev, nombre: "El nombre del producto es obligatorio" }));
    } else {
      setErrores(prev => ({ ...prev, nombre: "" }));
    }
  };

  // Validación en tiempo real de la categoría
  const handleCategoriaChange = (value) => {
    setCategoriaId(value);
    if (!value || value === "") {
      setErrores(prev => ({ ...prev, categoriaId: "La categoría es obligatoria" }));
    } else {
      setErrores(prev => ({ ...prev, categoriaId: "" }));
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

  // Manejar selección de imagen (simulado para web)
  const handleSeleccionarImagen = async () => {
    try {
      // En web, usar input file nativo
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/jpg,image/png,image/webp';
        
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          
          // Validar tamaño (máx 5MB)
          if (file.size > 5 * 1024 * 1024) {
            Alert.alert('Error', 'La imagen no debe superar los 5MB');
            return;
          }
          
          // Validar tipo
          if (!file.type.startsWith('image/')) {
            Alert.alert('Error', 'Solo se permiten archivos de imagen');
            return;
          }
          
          // Crear URL para previsualización
          const uri = URL.createObjectURL(file);
          
          const imagenSeleccionada = {
            uri: uri,
            type: file.type,
            name: file.name,
          };
          
          setImagen(imagenSeleccionada);
          setImagenUrl(uri);
        };
        
        input.click();
        return;
      }
      
      // En móvil, usar ImagePicker
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          "Permisos requeridos",
          "Necesitas conceder permisos para acceder a la galería de imágenes."
        );
        return;
      }

      // Abrir el selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Preparar objeto de imagen para enviar al backend
        const imagenSeleccionada = {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `producto_${Date.now()}.jpg`,
        };
        
        setImagen(imagenSeleccionada);
        setImagenUrl(asset.uri); // Para previsualización
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen. Intenta nuevamente.");
    }
  };

  // Opción para tomar foto con la cámara
  const handleTomarFoto = async () => {
    try {
      // Solicitar permisos para acceder a la cámara
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          "Permisos requeridos",
          "Necesitas conceder permisos para usar la cámara."
        );
        return;
      }

      // Abrir la cámara
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        const imagenSeleccionada = {
          uri: asset.uri,
          type: 'image/jpeg',
          name: `foto_${Date.now()}.jpg`,
        };
        
        setImagen(imagenSeleccionada);
        setImagenUrl(asset.uri);
      }
    } catch (error) {
      console.error("Error al tomar foto:", error);
      Alert.alert("Error", "No se pudo tomar la foto. Intenta nuevamente.");
    }
  };

  // Mostrar opciones para seleccionar imagen
  const mostrarOpcionesImagen = () => {
    if (Platform.OS === 'web') {
      // En web, solo permitir seleccionar desde archivos
      handleSeleccionarImagen();
    } else {
      // En móvil, mostrar opciones
      Alert.alert(
        "Seleccionar imagen",
        "¿De dónde quieres obtener la imagen?",
        [
          {
            text: "Galería",
            onPress: handleSeleccionarImagen,
          },
          {
            text: "Cámara",
            onPress: handleTomarFoto,
          },
          {
            text: "Cancelar",
            style: "cancel",
          },
        ],
        { cancelable: true }
      );
    }
  };

  const handleGuardar = () => {
    // Validar que no haya errores
    const hayErrores = Object.values(errores).some(error => error !== "");
    const camposVacios = !nombre.trim() || !categoriaId || !precio.trim();
    
    if (hayErrores || camposVacios) {
      // Marcar todos los campos vacíos como error
      if (!nombre.trim()) setErrores(prev => ({ ...prev, nombre: "El nombre del producto es obligatorio" }));
      if (!categoriaId) setErrores(prev => ({ ...prev, categoriaId: "La categoría es obligatoria" }));
      if (!precio.trim()) setErrores(prev => ({ ...prev, precio: "El precio es obligatorio" }));
      return;
    }

    const productoData = {
      id: producto ? producto.id : Date.now(),
      nombre: nombre.trim(),
      categoriaId: parseInt(categoriaId),
      precio: parseFloat(precio),
      descripcion: descripcion.trim(),
      imagen: imagen, // Objeto de imagen si se seleccionó una nueva
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
                  placeholder="Ej: Whisky Lagavulin 16"
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
                {cargandoCategorias ? (
                  <View style={styles.loadingCategoriasContainer}>
                    <ActivityIndicator size="small" color="#4CAF50" />
                    <Text style={styles.loadingCategoriasText}>Cargando categorías...</Text>
                  </View>
                ) : (
                  <>
                    <View style={[styles.selectContainer, errores.categoriaId && styles.inputError]}>
                      <select
                        value={categoriaId}
                        onChange={(e) => handleCategoriaChange(e.target.value)}
                        style={styles.select}
                        disabled={categoriasPlanas.length === 0}
                      >
                        <option value="">Seleccionar categoría...</option>
                        {categoriasPlanas.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nombreConIndentacion}
                          </option>
                        ))}
                      </select>
                    </View>
                    {categoriasPlanas.length === 0 && !cargandoCategorias && (
                      <Text style={styles.warningText}>
                        No hay categorías disponibles. Crea categorías primero.
                      </Text>
                    )}
                  </>
                )}
                {errores.categoriaId ? (
                  <Text style={styles.errorText}>{errores.categoriaId}</Text>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Precio *</Text>
                <TextInput
                  style={[styles.input, errores.precio && styles.inputError]}
                  placeholder="Ej: 189.99"
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
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descripción del producto (opcional)"
                  value={descripcion}
                  onChangeText={setDescripcion}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Imagen del Producto</Text>
                {imagenUrl && (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: imagenUrl }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => {
                        setImagen(null);
                        setImagenUrl("");
                      }}
                    >
                      <MaterialCommunityIcons name="close-circle" size={24} color="#d32f2f" />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.imageButtonsContainer}>
                  <TouchableOpacity
                    style={styles.imageButton}
                    onPress={mostrarOpcionesImagen}
                  >
                    <MaterialCommunityIcons name="image" size={20} color="#4CAF50" />
                    <Text style={styles.imageButtonText}>
                      {imagenUrl ? "Cambiar imagen" : "Seleccionar imagen"}
                    </Text>
                  </TouchableOpacity>
                  {!Platform.OS === 'web' && (
                    <TouchableOpacity
                      style={[styles.imageButton, styles.cameraButton]}
                      onPress={handleTomarFoto}
                    >
                      <MaterialCommunityIcons name="camera" size={20} color="#2196F3" />
                      <Text style={[styles.imageButtonText, styles.cameraButtonText]}>
                        Tomar foto
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.helperText}>
                  Formatos: JPG, PNG. Tamaño máximo: 5MB
                </Text>
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
  selectContainer: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
  },
  select: {
    width: "100%",
    padding: 10,
    fontSize: 14,
    color: "#1f1f1f",
    backgroundColor: "transparent",
    border: "none",
    outlineStyle: "none",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  imagePreviewContainer: {
    alignItems: "center",
    marginBottom: 12,
    position: "relative",
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  imageButtonsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  imageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 8,
    borderStyle: "dashed",
    gap: 8,
    backgroundColor: "#f1f8f4",
  },
  imageButtonText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  cameraButton: {
    borderColor: "#2196F3",
    backgroundColor: "#e3f2fd",
  },
  cameraButtonText: {
    color: "#2196F3",
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
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    gap: 8,
  },
  loadingCategoriasText: {
    fontSize: 14,
    color: "#666",
  },
  warningText: {
    fontSize: 12,
    color: "#ff9800",
    marginTop: 4,
    fontStyle: "italic",
  },
});
