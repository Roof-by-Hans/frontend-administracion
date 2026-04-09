import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  useWindowDimensions,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import Alert from "@blazejkustra/react-native-alert";
import API_URL from "../config/api";
import OlvidarContraseñaModal from "../components/OlvidarContraseñaModal";
import RestablecerContraseñaScreen from "./RestablecerContraseñaScreen";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [recordarme, setRecordarme] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOlvidarVisible, setModalOlvidarVisible] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const { login } = useAuth();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 400;

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      if (token) {
        setResetToken(token);
      }
    }
  }, []);

  const handleLogin = async () => {
    if (!usuario.trim() || !contrasena.trim()) {
      Alert.alert("Error", "Por favor complete todos los campos");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombreUsuario: usuario,
          contrasena: contrasena,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await login(data.data.usuario, data.data.token);
        if (recordarme) {
          await AsyncStorage.setItem("recordarme", "true");
        }
      } else {
        Alert.alert(
          "Credenciales inválidas",
          data.message || "Usuario o contraseña incorrectos. Por favor, verifica tus datos e intenta nuevamente."
        );
      }
    } catch (error) {
      setError("Error al iniciar sesión. Por favor, intenta nuevamente.");
      Alert.alert("Error", "No se pudo iniciar sesión. Verifica tus credenciales o tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  if (resetToken) {
    return (
      <RestablecerContraseñaScreen
        tokenDirecto={resetToken}
        onVolver={() => {
          setResetToken(null);
          if (Platform.OS === "web" && typeof window !== "undefined") {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.loginCard}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Image
              source={require("../../assets/hans-logo.png")}
              style={styles.logo}
            />
          </View>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ingrese el usuario..."
            placeholderTextColor="#999"
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ingrese la contraseña..."
            placeholderTextColor="#999"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry={true}
            autoCapitalize="none"
          />
        </View>

        <View
          style={[
            styles.optionsContainer,
            isSmallScreen && styles.optionsContainerStacked,
          ]}
        >
          <TouchableOpacity
            style={[
              styles.checkboxContainer,
              isSmallScreen && styles.checkboxContainerStacked,
            ]}
            onPress={() => setRecordarme(!recordarme)}
          >
            <View
              style={[styles.checkbox, recordarme && styles.checkboxSelected]}
            >
              {recordarme && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Recordarme</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.forgotPasswordContainer,
              isSmallScreen && styles.forgotPasswordContainerStacked,
            ]}
            onPress={() => setModalOlvidarVisible(true)}
          >
            <Text style={styles.forgotPassword}>Recuperar contraseña</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>INGRESAR</Text>
        </TouchableOpacity>

        
        <OlvidarContraseñaModal
          visible={modalOlvidarVisible}
          onClose={() => setModalOlvidarVisible(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loginCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 30,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoPlaceholder: {},
  logo: {
    width: 120,
    height: 120,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    flexWrap: "wrap",
    width: "100%",
  },
  optionsContainerStacked: {
    alignItems: "flex-start",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxContainerStacked: {
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 3,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#666",
    textDecorationLine: "none",
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
  },
  forgotPasswordContainerStacked: {
    alignSelf: "flex-start",
  },
  forgotPassword: {
    fontSize: 14,
    color: "#333333",
    textDecorationLine: "none",
  },
  loginButton: {
    backgroundColor: "#333333",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
