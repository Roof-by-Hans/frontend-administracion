import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Alert from "@blazejkustra/react-native-alert";
import authService from "../services/authService";

export default function OlvidarContraseñaModal({ visible, onClose }) {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSolicitar = async () => {
    if (!nombreUsuario.trim()) {
      Alert.alert("Error", "Por favor ingresa tu nombre de usuario");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Error", "Por favor ingresa tu email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Por favor ingresa un email válido");
      return;
    }

    try {
      setCargando(true);
      await authService.olvidarContrasena(nombreUsuario, email);
      setEnviado(true);
      setTimeout(() => {
        setNombreUsuario("");
        setEmail("");
        setEnviado(false);
        onClose();
      }, 3000);
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "No pudimos procesar tu solicitud. Intenta más tarde."
      );
    } finally {
      setCargando(false);
    }
  };

  const handleCerrar = () => {
    setNombreUsuario("");
    setEmail("");
    setEnviado(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleCerrar}
    >
      <View style={styles.overlay}>
        <View style={styles.contenedor}>
          {!enviado ? (
            <>
              <View style={styles.encabezado}>
                <Text style={styles.titulo}>Recuperar contraseña</Text>
                <TouchableOpacity
                  onPress={handleCerrar}
                  style={styles.botonCerrar}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.cuerpo}>
                <Text style={styles.descripcion}>
                  Ingresa tu nombre de usuario y email para restablecer
                  tu contraseña.
                </Text>

                <View style={styles.grupoInput}>
                  <Text style={styles.etiqueta}>Nombre de Usuario</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="tu_usuario"
                    placeholderTextColor="#999"
                    value={nombreUsuario}
                    onChangeText={setNombreUsuario}
                    autoCapitalize="none"
                    editable={!cargando}
                  />
                </View>

                <View style={styles.grupoInput}>
                  <Text style={styles.etiqueta}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="tu@email.com"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!cargando}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.botonSolicitar,
                    cargando && styles.botonDeshabilitado,
                  ]}
                  onPress={handleSolicitar}
                  disabled={cargando}
                >
                  {cargando ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.textoBoton}>Enviar instrucciones</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleCerrar}>
                  <Text style={styles.enlace}>Volver al login</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.exito}>
              <MaterialCommunityIcons
                name="check-circle"
                size={60}
                color="#4CAF50"
                style={styles.iconoExito}
              />
              <Text style={styles.tituloExito}>¡Email enviado!</Text>
              <Text style={styles.textoExito}>
                Si el email existe en nuestro sistema, recibirás instrucciones
                para restablecer tu contraseña en los próximos minutos.
              </Text>
              <Text style={styles.textoAviso}>
                Cerrando en 3 segundos...
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  contenedor: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  titulo: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  botonCerrar: {
    padding: 5,
  },
  cuerpo: {
    padding: 20,
  },
  descripcion: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  grupoInput: {
    marginBottom: 20,
  },
  etiqueta: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  botonSolicitar: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  botonDeshabilitado: {
    opacity: 0.7,
  },
  textoBoton: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  enlace: {
    fontSize: 14,
    color: "#2196F3",
    textAlign: "center",
    marginTop: 10,
  },
  exito: {
    padding: 40,
    alignItems: "center",
  },
  iconoExito: {
    marginBottom: 15,
  },
  tituloExito: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  textoExito: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  textoAviso: {
    fontSize: 12,
    color: "#999",
  },
});
