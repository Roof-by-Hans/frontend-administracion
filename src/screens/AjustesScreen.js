import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DashboardLayout from "../components/layout/DashboardLayout";
import LimitesSubscripcionModal from "../components/LimitesSubscripcionModal";
import { useAuth } from "../context/AuthContext";
import usuarioService from "../services/usuarioService";
import Alert from "@blazejkustra/react-native-alert";

export default function AjustesScreen({ onNavigate, currentScreen }) {
  const [modalLimitesVisible, setModalLimitesVisible] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [guardandoFoto, setGuardandoFoto] = useState(false);
  
  const { user, logout, updateUser } = useAuth();
  const userName = user?.nombreUsuario || user?.usuario || "Usuario";
  const userPhoto = user?.fotoPerfilUrl || null;
  const isAdmin = user?.roles?.includes("Administrador") || user?.roles?.includes("Admin") || false;

  // Función para abrir modal de límites de subscripción
  const handleAbrirLimites = () => {
    setModalLimitesVisible(true);
  };

  // Seleccionar foto de perfil
  const handleSeleccionarFoto = async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permisos necesarios", "Se necesitan permisos para acceder a la galería de fotos");
        return;
      }

      // Abrir selector de imagen
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setFotoPerfil(selectedImage);
        
        // Guardar automáticamente
        await handleGuardarFoto(selectedImage);
      }
    } catch (error) {
      Alert.alert("Error", "Error al seleccionar la imagen");
    }
  };

  // Guardar foto de perfil
  const handleGuardarFoto = async (imagen) => {
    if (!user?.id && !user?.idUsuario) {
      Alert.alert("Error", "No se pudo identificar el usuario");
      return;
    }

    try {
      setGuardandoFoto(true);

      const formData = new FormData();

      // Agregar foto
      if (Platform.OS === "web") {
        const response = await fetch(imagen.uri);
        const blob = await response.blob();
        formData.append("fotoPerfil", blob, "foto.jpg");
      } else {
        const fileUri = imagen.uri;
        const filename = fileUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("fotoPerfil", {
          uri: fileUri,
          name: filename,
          type: type,
        });
      }

      const userId = user.id || user.idUsuario;
      const response = await usuarioService.actualizarUsuario(userId, formData);

      if (response.success && response.data) {
        // Actualizar el contexto con la nueva foto
        if (updateUser) {
          updateUser(response.data);
        }
        
        Alert.alert("Éxito", "Foto de perfil actualizada correctamente");
        setFotoPerfil(null); // Limpiar la foto temporal
      }
    } catch (error) {
      console.error("Error al guardar foto:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Error al actualizar la foto de perfil"
      );
    } finally {
      setGuardandoFoto(false);
    }
  };

  // Eliminar foto de perfil
  const handleEliminarFoto = async () => {
    if (!user?.id && !user?.idUsuario) {
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

              const userId = user.id || user.idUsuario;
              const response = await usuarioService.actualizarUsuario(userId, formData);

              if (response.success && response.data) {
                if (updateUser) {
                  updateUser(response.data);
                }
                
                Alert.alert("Éxito", "Foto de perfil eliminada correctamente");
                setFotoPerfil(null);
              }
            } catch (error) {
              console.error("Error al eliminar foto:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || "Error al eliminar la foto de perfil"
              );
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

        {/* Sección Perfil de Usuario */}
        <View style={styles.perfilSection}>
          <Text style={styles.sectionTitle}>Mi Perfil</Text>
          <View style={styles.perfilCard}>
            {/* Foto de Perfil */}
            <View style={styles.fotoContainer}>
              {fotoPerfil || userPhoto ? (
                <Image
                  source={{ uri: fotoPerfil?.uri || userPhoto }}
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

            {/* Información del Usuario */}
            <View style={styles.infoContainer}>
              <Text style={styles.nombreUsuario}>{userName}</Text>
              <Text style={styles.rolUsuario}>{user?.rol || "Usuario"}</Text>
              
              {/* Botones de Foto */}
              <View style={styles.fotoBotones}>
                <TouchableOpacity
                  style={styles.botonCambiarFoto}
                  onPress={handleSeleccionarFoto}
                  disabled={guardandoFoto}
                >
                  <MaterialCommunityIcons name="camera" size={18} color="#fff" />
                  <Text style={styles.botonTexto}>
                    {userPhoto || fotoPerfil ? "Cambiar foto" : "Agregar foto"}
                  </Text>
                </TouchableOpacity>
                
                {(userPhoto || fotoPerfil) && (
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
  fotoBotones: {
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
