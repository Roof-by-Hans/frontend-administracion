import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Alert from "@blazejkustra/react-native-alert";
import authService from "../services/authService";

export default function RestablecerContraseñaScreen({ route, navigation, tokenDirecto, onVolver }) {
  const [token, setToken] = useState("");
  const [contrasenaNueva, setContrasenaNueva] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);

  useEffect(() => {
        if (tokenDirecto) {
      setToken(tokenDirecto);
      return;
    }
        if (route?.params?.token) {
      setToken(route.params.token);
    }
    if (route?.params?.search) {
      const params = new URLSearchParams(route.params.search);
      const tokenParam = params.get("token");
      if (tokenParam) {
        setToken(tokenParam);
      }
    }
  }, [route, tokenDirecto]);

  const validarFormulario = () => {
    if (!contrasenaNueva.trim()) {
      Alert.alert("Error", "Por favor ingresa una contraseña");
      return false;
    }

    if (contrasenaNueva.length < 6) {
      Alert.alert(
        "Error",
        "La contraseña debe tener al menos 6 caracteres"
      );
      return false;
    }

    if (!token) {
      Alert.alert("Error", "Token inválido. Solicita un nuevo enlace");
      return false;
    }

    return true;
  };

  const handleRestablecer = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      setCargando(true);
      await authService.restablecerContrasena(token, contrasenaNueva);
      setExito(true);

      setTimeout(() => {
        if (onVolver) {
          onVolver();
        } else {
          navigation?.goBack?.() ?? navigation?.navigate?.("Login");
        }
      }, 2000);
    } catch (error) {
      const mensaje =
        error.response?.data?.message ||
        "No pudimos restablecer tu contraseña";

      if (error.response?.status === 401) {
        Alert.alert(
          "Token expirado",
          "El enlace de recuperación ha expirado. Solicita uno nuevo."
        );
      } else {
        Alert.alert("Error", mensaje);
      }
    } finally {
      setCargando(false);
    }
  };

  if (exito) {
    return (
      <View style={styles.contenedor}>
        <View style={styles.pantallaExito}>
          <MaterialCommunityIcons
            name="check-circle"
            size={80}
            color="#4CAF50"
            style={styles.iconoExito}
          />
          <Text style={styles.tituloExito}>¡Contraseña restablecida!</Text>
          <Text style={styles.textoExito}>
            Tu contraseña ha sido cambiada correctamente. Ya puedes iniciar sesión
            con tu nueva contraseña.
          </Text>
          <Text style={styles.textoRedireccionando}>
            Redirigiendo al login...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.tarjeta}>
          <View style={styles.encabezado}>
            <MaterialCommunityIcons
              name="lock-reset"
              size={40}
              color="#4CAF50"
              style={styles.icono}
            />
            <Text style={styles.titulo}>Restablecer contraseña</Text>
            <Text style={styles.subtitulo}>
              Crea una nueva contraseña para tu cuenta
            </Text>
          </View>

          <View style={styles.formulario}>
            {/* Nueva contraseña */}
            <View style={styles.grupoInput}>
              <Text style={styles.etiqueta}>Nueva contraseña</Text>
              <View style={styles.inputConIcono}>
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu nueva contraseña"
                  placeholderTextColor="#999"
                  value={contrasenaNueva}
                  onChangeText={setContrasenaNueva}
                  secureTextEntry={!mostrarContrasena}
                  editable={!cargando}
                />
                <TouchableOpacity
                  onPress={() => setMostrarContrasena(!mostrarContrasena)}
                  style={styles.botonMostrar}
                >
                  <MaterialCommunityIcons
                    name={mostrarContrasena ? "eye-off" : "eye"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Requisitos */}
            <View style={styles.requisitos}>
              <Text style={styles.etiqueta}>Requisitos:</Text>
              <View style={styles.requisito}>
                <MaterialCommunityIcons
                  name={contrasenaNueva.length >= 6 ? "check-circle" : "circle-outline"}
                  size={16}
                  color={contrasenaNueva.length >= 6 ? "#4CAF50" : "#ccc"}
                />
                <Text style={styles.textoRequisito}>
                  Mínimo 6 caracteres
                </Text>
              </View>
            </View>

             de restablecer */}
            <TouchableOpacity
              style={[
                styles.botonRestablecer,
                cargando && styles.botonDeshabilitado,
              ]}
              onPress={handleRestablecer}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="lock"
                    size={20}
                    color="#fff"
                    style={styles.icono}
                  />
                  <Text style={styles.texto}>
                    Restablecer contraseña
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 20,
    justifyContent: "center",
    minHeight: "100%",
  },
  tarjeta: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  encabezado: {
    alignItems: "center",
    marginBottom: 30,
  },
  icono: {
    marginBottom: 10,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 5,
  },
  subtitulo: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  formulario: {
    paddingVertical: 10,
  },
  grupoInput: {
    marginBottom: 20,
  },
  etiqueta: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputConIcono: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: "#333",
  },
  botonMostrar: {
    paddingRight: 12,
  },
  requisitos: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  requisito: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  textoRequisito: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
  },
  botonRestablecer: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 10,
  },
  botonDeshabilitado: {
    opacity: 0.7,
  },
  icono: {
    marginRight: 8,
  },
  texto: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  pantallaExito: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  iconoExito: {
    marginBottom: 20,
  },
  tituloExito: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  textoExito: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  textoRedireccionando: {
    fontSize: 12,
    color: "#999",
  },
});
