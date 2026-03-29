import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, ActivityIndicator, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DashboardLayout from "../components/layout/DashboardLayout";
import LimitesSubscripcionModal from "../components/LimitesSubscripcionModal";
import RecortarImagenModal from "../components/RecortarImagenModal";
import { useAuth } from "../context/AuthContext";
import usuarioService from "../services/usuarioService";
import Alert from "@blazejkustra/react-native-alert";

export default function AjustesScreen({ onNavigate, currentScreen }) {
  const [modalLimitesVisible, setModalLimitesVisible] = useState(false);
  const [modalRecortarVisible, setModalRecortarVisible] = useState(false);
  const [fotoTemporal, setFotoTemporal] = useState(null);
  const [guardandoFoto, setGuardandoFoto] = useState(false);
  const [email, setEmail] = useState("");
  const [guardandoEmail, setGuardandoEmail] = useState(false);

  const { user, logout, updateUser } = useAuth();
  const userName = user?.nombreUsuario || user?.usuario || "Usuario";
  const userPhoto = user?.fotoPerfilUrl || null;
  const isAdmin = user?.roles?.includes("Administrador") || user?.roles?.includes("Admin") || false;

    useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user?.email]);

  const handleGuardarEmail = async () => {

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        Alert.alert("Error", "El formato del email es inválido");
        return;
      }
    }

    if (!user?.id) {
      Alert.alert("Error", "No se pudo identificar el usuario");
      return;
    }

    try {
      setGuardandoEmail(true);
      const response = await usuarioService.actualizarMiEmail(email.trim());

      if (response.success && response.data) {
        updateUser(response.data);
        Alert.alert("Éxito", "Email actualizado correctamente");
      } else {
        Alert.alert("Error", response.message || "No se pudo actualizar el email");
      }
    } catch (error) {
      console.error("Error al guardar email:", error);
      Alert.alert("Error", error.response?.data?.message || "Error al actualizar el email");
    } finally {
      setGuardandoEmail(false);
    }
  };

  const handleAbrirLimites = () => {
    setModalLimitesVisible(true);
  };

  const handleSeleccionarFoto = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permisos necesarios", "Se necesitan permisos para acceder a la galería de fotos");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFotoTemporal(result.assets[0]);
        setModalRecortarVisible(true);
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
      Alert.alert("Error", "Error al seleccionar la imagen");
    }
  };

  const handleConfirmarRecorte = async (datosRecorte) => {
    if (!fotoTemporal || !user?.id) {
      Alert.alert("Error", "No se pudo identificar el usuario o la imagen");
      return;
    }

    try {
      setGuardandoFoto(true);      const imagenRecortada = await recortarImagen(fotoTemporal.uri, datosRecorte);
      const formData = new FormData();

      if (Platform.OS === "web") {
        formData.append("fotoPerfil", imagenRecortada, "foto.jpg");
      } else {
        const filename = `foto_${Date.now()}.jpg`;
        formData.append("fotoPerfil", {
          uri: imagenRecortada,
          name: filename,
          type: "image/jpeg",
        });
      }
      const response = await usuarioService.actualizarUsuario(user.id, formData);
      if (response.success && response.data) {
        updateUser(response.data);
        Alert.alert("Éxito", "Foto de perfil actualizada correctamente");
        setModalRecortarVisible(false);
        setFotoTemporal(null);
      } else {
        console.error("Respuesta sin éxito:", response);
        Alert.alert("Error", response.message || "Error al actualizar la foto de perfil");
      }
    } catch (error) {
      console.error("Error completo al guardar foto:", error);
      console.error("Error stack:", error.stack);
      console.error("Error response:", error.response);
      
      const errorMessage = error.response?.data?.message 
        || error.message 
        || "Error al actualizar la foto de perfil";
      
      Alert.alert("Error", errorMessage);
    } finally {
      setGuardandoFoto(false);
    }
  };

    const recortarImagen = async (imageSrc, cropData) => {
    return new Promise((resolve, reject) => {
      if (Platform.OS === "web") {
        const img = document.createElement("img");
        img.crossOrigin = "anonymous";
        
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            const outputSize = 250;
            canvas.width = outputSize;
            canvas.height = outputSize;

                        ctx.clearRect(0, 0, outputSize, outputSize);

                        ctx.beginPath();
            ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();            const scaledWidth = cropData.imageWidth * cropData.zoom;
            const scaledHeight = cropData.imageHeight * cropData.zoom;

            const centerX = (cropData.circleSize - scaledWidth) / 2;
            const centerY = (cropData.circleSize - scaledHeight) / 2;
            
            const drawX = centerX + cropData.position.x;
            const drawY = centerY + cropData.position.y;            const scale = outputSize / cropData.circleSize;            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, outputSize, outputSize);            ctx.beginPath();
            ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();            ctx.drawImage(
              img,
              drawX * scale,
              drawY * scale,
              scaledWidth * scale,
              scaledHeight * scale
            );            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error("No se pudo crear el blob"));
                }
              },
              "image/jpeg",
              0.9
            );
          } catch (error) {
            console.error("Error en el procesamiento del canvas:", error);
            reject(error);
          }
        };
        
        img.onerror = (error) => {
          console.error("Error al cargar la imagen:", error);
          reject(new Error("Error al cargar la imagen"));
        };
        
        img.src = imageSrc;
      } else {        resolve(imageSrc);
      }
    });
  };

  const handleCancelarRecorte = () => {
    setModalRecortarVisible(false);
    setFotoTemporal(null);
  };

  const handleEliminarFoto = async () => {
    if (!user?.id) {
      Alert.alert("Error", "No se pudo identificar el usuario");
      return;
    }

    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar tu foto de perfil?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              setGuardandoFoto(true);
              const formData = new FormData();
              formData.append("eliminarFotoPerfil", "true");
              const response = await usuarioService.actualizarUsuario(user.id, formData);

              if (response.success && response.data) {
                updateUser(response.data);
                Alert.alert("Éxito", "Foto de perfil eliminada correctamente");
                setFotoTemporal(null);
              }
            } catch (error) {
              console.error("Error al eliminar foto:", error);
              Alert.alert("Error", error.response?.data?.message || "Error al eliminar la foto de perfil");
            } finally {
              setGuardandoFoto(false);
            }
          },
        },
      ]
    );
  };

  return (
    <DashboardLayout
      userName={userName}
      currentScreen={currentScreen}
      onNavigate={onNavigate}
      onLogout={logout}
    >
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.title}>Ajustes Generales</Text>

        <View style={styles.perfilSection}>
          <Text style={styles.sectionTitle}>Mi Perfil</Text>
          <View style={styles.perfilCard}>
            <View style={styles.fotoContainer}>
              {userPhoto ? (
                <Image
                  source={{ uri: userPhoto }}
                  style={styles.fotoPreview}
                />
              ) : (
                <View style={styles.fotoPlaceholder}>
                  <MaterialCommunityIcons name="account" size={60} color="#999" />
                </View>
              )}
              {guardandoFoto && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                </View>
              )}
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.nombreUsuario}>{userName}</Text>
              <Text style={styles.rolUsuario}>{user?.roles?.join(", ") || "Usuario"}</Text>
              
              <View style={styles.fotoes}>
                <TouchableOpacity
                  style={styles.botonCambiarFoto}
                  onPress={handleSeleccionarFoto}
                  disabled={guardandoFoto}
                >
                  <MaterialCommunityIcons name="camera" size={18} color="#fff" />
                  <Text style={styles.botonTexto}>
                    {userPhoto ? "Cambiar foto" : "Agregar foto"}
                  </Text>
                </TouchableOpacity>
                
                {userPhoto && (
                  <TouchableOpacity
                    style={styles.botonEliminarFoto}
                    onPress={handleEliminarFoto}
                    disabled={guardandoFoto}
                  >
                    <MaterialCommunityIcons name="delete" size={18} color="#fff" />
                    <Text style={styles.botonTexto}>Eliminar</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Email para recuperación de contraseña */}
              <View style={styles.emailContainer}>
                <Text style={styles.emailLabel}>
                  Email{" "}
                  <Text style={styles.emailHint}>(para recuperar contraseña)</Text>
                </Text>
                <View style={styles.emailFila}>
                  <TextInput
                    style={styles.emailInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="correo@ejemplo.com"
                    placeholderTextColor="#aaa"
                    keyboardType="email-address"
                    autoCapitalize="none"
                     editable={!guardandoEmail}
                  />
                  <TouchableOpacity
                    style={[
                      styles.botonGuardarEmail,
                      guardandoEmail && styles.botonDeshabilitado,
                    ]}
                    onPress={handleGuardarEmail}
                    disabled={guardandoEmail}
                  >
                    {guardandoEmail ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.botonTexto}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Grid de opciones */}
        <View style={styles.gridContainer}>
          {/* Card Financiero - Solo para administradores */}
          {isAdmin && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Financiero</Text>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={handleAbrirLimites}
              >
                <MaterialCommunityIcons name="credit-card-outline" size={20} color="#333" />
                <Text style={styles.optionText}>Editar límite subscripciones</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Card vacío 1 - Para futuras opciones */}
          <View style={[styles.card, styles.cardEmpty]}>
            <Text style={styles.cardEmptyText}>Próximamente</Text>
          </View>

          {/* Card vacío 2 - Para futuras opciones */}
          <View style={[styles.card, styles.cardEmpty]}>
            <Text style={styles.cardEmptyText}>Próximamente</Text>
          </View>

          {/* Card vacío 3 - Para futuras opciones */}
          <View style={[styles.card, styles.cardEmpty]}>
            <Text style={styles.cardEmptyText}>Próximamente</Text>
          </View>

          {/* Card vacío 4 - Para futuras opciones */}
          <View style={[styles.card, styles.cardEmpty]}>
            <Text style={styles.cardEmptyText}>Próximamente</Text>
          </View>
        </View>

        {/* Modal para editar límites de subscripción */}
        <LimitesSubscripcionModal
          visible={modalLimitesVisible}
          onClose={() => setModalLimitesVisible(false)}
        />

        <RecortarImagenModal
          visible={modalRecortarVisible}
          onClose={handleCancelarRecorte}
          onConfirm={handleConfirmarRecorte}
          imageUri={fotoTemporal?.uri}
          loading={guardandoFoto}
        />
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  perfilSection: {
    marginBottom: 30,
  },
  perfilCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fotoContainer: {
    position: "relative",
  },
  fotoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
  },
  fotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
  },
  nombreUsuario: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  rolUsuario: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  emailContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  emailLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emailHint: {
    fontSize: 12,
    fontWeight: "400",
    color: "#999",
  },
  emailFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emailInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fafafa",
  },
  botonGuardarEmail: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  botonDeshabilitado: {
    opacity: 0.7,
  },
  fotoes: {
    flexDirection: "row",
    gap: 10,
  },
  botonCambiarFoto: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  botonEliminarFoto: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f44336",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  botonGuardarFoto: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  botonCancelarFoto: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#757575",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  botonTexto: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    minWidth: 250,
    minHeight: 150,
    flex: 1,
    maxWidth: "48%",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 10,
  },
  optionText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  cardEmpty: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderStyle: "dashed",
  },
  cardEmptyText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
});
