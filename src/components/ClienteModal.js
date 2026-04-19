import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Alert from "@blazejkustra/react-native-alert";

export default function ClienteModal({ visible, cliente, onClose, onGuardar }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [preferencias, setPreferencias] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    contrasena: "",
    confirmarContrasena: "",
  });
  useEffect(() => {
    if (cliente) {
      setNombre(cliente.nombre || "");
      setApellido(cliente.apellido || "");
      setTelefono(cliente.telefono || "");
      setEmail(cliente.email || "");
      setPreferencias(cliente.preferencias || "");
      setFotoPerfil(null); 
      setContrasena(""); 
      setConfirmarContrasena("");
    } else {
            setNombre("");
      setApellido("");
      setTelefono("");
      setEmail("");
      setContrasena("");
      setConfirmarContrasena("");
      setPreferencias("");
      setFotoPerfil(null);
    }
        setErrores({
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      contrasena: "",
      confirmarContrasena: "",
    });
    setGuardando(false);
  }, [cliente, visible]);
  const handleNombreChange = (text) => {
    setNombre(text);
    if (text.trim() === "") {
      setErrores((prev) => ({ ...prev, nombre: "El nombre es obligatorio" }));
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(text)) {
      setErrores((prev) => ({
        ...prev,
        nombre: "El nombre solo debe contener letras",
      }));
    } else {
      setErrores((prev) => ({ ...prev, nombre: "" }));
    }
  };
  const handleApellidoChange = (text) => {
    setApellido(text);
    if (text.trim() === "") {
      setErrores((prev) => ({
        ...prev,
        apellido: "El apellido es obligatorio",
      }));
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(text)) {
      setErrores((prev) => ({
        ...prev,
        apellido: "El apellido solo debe contener letras",
      }));
    } else {
      setErrores((prev) => ({ ...prev, apellido: "" }));
    }
  };
  const handleTelefonoChange = (text) => {
    setTelefono(text);
    if (text.trim() !== "" && !/^\d+$/.test(text)) {
      setErrores((prev) => ({
        ...prev,
        telefono: "El teléfono solo debe contener números",
      }));
    } else if (text.trim() !== "" && text.length < 7) {
      setErrores((prev) => ({
        ...prev,
        telefono: "El teléfono debe tener al menos 7 dígitos",
      }));
    } else {
      setErrores((prev) => ({ ...prev, telefono: "" }));
    }
  };
  const handleEmailChange = (text) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (text.trim() === "") {
      setErrores((prev) => ({ ...prev, email: "El email es obligatorio" }));
    } else if (!emailRegex.test(text)) {
      setErrores((prev) => ({
        ...prev,
        email: "El formato del email es inválido",
      }));
    } else {
      setErrores((prev) => ({ ...prev, email: "" }));
    }
  };
  const handleContrasenaChange = (text) => {
    setContrasena(text);
    if (!cliente && text.trim() === "") {
      setErrores((prev) => ({
        ...prev,
        contrasena: "La contraseña es obligatoria",
      }));
    } else if (text.trim() !== "" && text.length < 6) {
      setErrores((prev) => ({
        ...prev,
        contrasena: "La contraseña debe tener al menos 6 caracteres",
      }));
    } else {
      setErrores((prev) => ({ ...prev, contrasena: "" }));
    }
        if (confirmarContrasena && text !== confirmarContrasena) {
      setErrores((prev) => ({
        ...prev,
        confirmarContrasena: "Las contraseñas no coinciden",
      }));
    } else if (confirmarContrasena) {
      setErrores((prev) => ({ ...prev, confirmarContrasena: "" }));
    }
  };
  const handleConfirmarContrasenaChange = (text) => {
    setConfirmarContrasena(text);
    if (text !== contrasena) {
      setErrores((prev) => ({
        ...prev,
        confirmarContrasena: "Las contraseñas no coinciden",
      }));
    } else {
      setErrores((prev) => ({ ...prev, confirmarContrasena: "" }));
    }
  };
  const handleSeleccionarFoto = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Se necesitan permisos para acceder a la galería de fotos");
        return;
      }

            const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setFotoPerfil(selectedImage);
      }
    } catch (error) {
      Alert.alert("Error al seleccionar la imagen");
    }
  };

    const handleGuardar = async () => {
    const nuevosErrores = {
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      contrasena: "",
      confirmarContrasena: "",
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

        if (telefono.trim() && !/^\d+$/.test(telefono)) {
      nuevosErrores.telefono = "El teléfono solo debe contener números";
    } else if (telefono.trim() && telefono.length < 7) {
      nuevosErrores.telefono = "El teléfono debe tener al menos 7 dígitos";
    }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      nuevosErrores.email = "El email es obligatorio";
    } else if (!emailRegex.test(email)) {
      nuevosErrores.email = "El formato del email es inválido";
    }

        if (!cliente) {
            if (!contrasena.trim()) {
        nuevosErrores.contrasena = "La contraseña es obligatoria";
      } else if (contrasena.length < 6) {
        nuevosErrores.contrasena =
          "La contraseña debe tener al menos 6 caracteres";
      }

      if (!confirmarContrasena) {
        nuevosErrores.confirmarContrasena = "Debe confirmar la contraseña";
      } else if (contrasena !== confirmarContrasena) {
        nuevosErrores.confirmarContrasena = "Las contraseñas no coinciden";
      }
    } else {
      if (contrasena.trim() && contrasena.length < 6) {
        nuevosErrores.contrasena =
          "La contraseña debe tener al menos 6 caracteres";
      }
      if (contrasena.trim() && contrasena !== confirmarContrasena) {
        nuevosErrores.confirmarContrasena = "Las contraseñas no coinciden";
      }
    }
    if (Object.values(nuevosErrores).some((error) => error !== "")) {
      setErrores(nuevosErrores);
      return;
    }

        setGuardando(true);
    try {
      const formData = new FormData();
      formData.append("nombre", nombre.trim());
      formData.append("apellido", apellido.trim());
      formData.append("email", email.trim());

      if (telefono.trim()) {
        formData.append("telefono", telefono.trim());
      }
      if (contrasena.trim()) {
        formData.append("contrasena", contrasena.trim());
      }

      if (preferencias.trim()) {
        formData.append("preferencias", preferencias.trim());
      }

            if (fotoPerfil) {
        if (Platform.OS === "web") {
          const response = await fetch(fotoPerfil.uri);
          const blob = await response.blob();
          formData.append("fotoPerfil", blob, "foto.jpg");
        } else {
          const fileUri = fotoPerfil.uri;
          const filename = fileUri.split("/").pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : "image/jpeg";

          formData.append("fotoPerfil", {
            uri: fileUri,
            name: filename,
            type: type,
          });
        }
      }

      await onGuardar(formData, cliente?.id);
    } finally {
      setGuardando(false);
    }
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
          
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {cliente ? "Editar Cliente" : "Agregar Cliente"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          
          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Foto de Perfil</Text>
              <View style={styles.fotoContainer}>
                {fotoPerfil || cliente?.fotoPerfilUrl ? (
                  <Image
                    source={{ uri: fotoPerfil?.uri || cliente?.fotoPerfilUrl }}
                    style={styles.fotoPreview}
                  />
                ) : (
                  <View style={styles.fotoPlaceholder}>
                    <MaterialCommunityIcons
                      name="account"
                      size={60}
                      color="#999"
                    />
                  </View>
                )}
                <View style={styles.fotoActions}>
                  <TouchableOpacity
                    style={styles.fotoButton}
                    onPress={handleSeleccionarFoto}
                  >
                    <MaterialCommunityIcons
                      name="camera"
                      size={20}
                      color="#4CAF50"
                    />
                    <Text style={styles.fotoButtonText}>
                      {fotoPerfil || cliente?.fotoPerfilUrl
                        ? "Cambiar foto"
                        : "Seleccionar foto"}
                    </Text>
                  </TouchableOpacity>
                  {(fotoPerfil || cliente?.fotoPerfilUrl) && (
                    <TouchableOpacity
                      style={styles.fotoButtonRemove}
                      onPress={() => setFotoPerfil(null)}
                    >
                      <MaterialCommunityIcons
                        name="delete"
                        size={20}
                        color="#f44336"
                      />
                      <Text style={styles.fotoButtonTextRemove}>Quitar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            
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

            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={[styles.input, errores.email && styles.inputError]}
                value={email}
                onChangeText={handleEmailChange}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errores.email ? (
                <Text style={styles.errorText}>{errores.email}</Text>
              ) : null}
            </View>

            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Teléfono</Text>
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

            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Contraseña {!cliente && "*"}</Text>
              <TextInput
                style={[styles.input, errores.contrasena && styles.inputError]}
                value={contrasena}
                onChangeText={handleContrasenaChange}
                placeholder={
                  cliente
                    ? "Dejar vacío para no cambiar"
                    : "Mínimo 6 caracteres"
                }
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
              />
              {errores.contrasena ? (
                <Text style={styles.errorText}>{errores.contrasena}</Text>
              ) : null}
            </View>

            
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Confirmar Contraseña {!cliente && "*"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  errores.confirmarContrasena && styles.inputError,
                ]}
                value={confirmarContrasena}
                onChangeText={handleConfirmarContrasenaChange}
                placeholder="Repetir contraseña"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
              />
              {errores.confirmarContrasena ? (
                <Text style={styles.errorText}>
                  {errores.confirmarContrasena}
                </Text>
              ) : null}
            </View>

            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Preferencias</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={preferencias}
                onChangeText={setPreferencias}
                placeholder="Ej: Sin lactosa, vegetariano, etc."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
              <Text style={styles.helpText}>
                Opcional: preferencias alimentarias del cliente
              </Text>
            </View>
          </ScrollView>

          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancelar}
              disabled={guardando}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                guardando && styles.saveButtonDisabled,
              ]}
              onPress={handleGuardar}
              disabled={guardando}
            >
              {guardando ? (
                <>
                  <MaterialCommunityIcons
                    name="loading"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.saveButtonText}>Guardando...</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </>
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
  fotoContainer: {
    alignItems: "center",
    gap: 15,
  },
  fotoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f5f5f5",
  },
  fotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  fotoActions: {
    flexDirection: "row",
    gap: 10,
  },
  fotoButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#e8f5e9",
    gap: 6,
  },
  fotoButtonText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "600",
  },
  fotoButtonRemove: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#ffebee",
    gap: 6,
  },
  fotoButtonTextRemove: {
    color: "#f44336",
    fontSize: 14,
    fontWeight: "600",
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
  saveButtonDisabled: {
    backgroundColor: "#a5d6a7",
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  helpText: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontStyle: "italic",
  },
});
