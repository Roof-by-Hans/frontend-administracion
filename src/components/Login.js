import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, useWindowDimensions } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [recordarme, setRecordarme] = useState(false);
  const { login } = useAuth();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 400;

  const handleLogin = () => {
    // Validación básica
    if (usuario.trim() && contrasena.trim()) {
      // Aquí puedes agregar validación real con una API
      login({ usuario, recordarme });
    } else {
      console.log("Por favor complete todos los campos");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginCard}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Image source={require('../../assets/hans-logo.png')} style={styles.logo} />
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

        {/* Opciones de recordar y recuperar contraseña */}
        <View style={[styles.optionsContainer, isSmallScreen && styles.optionsContainerStacked]}>
          <TouchableOpacity 
            style={[styles.checkboxContainer, isSmallScreen && styles.checkboxContainerStacked]}
            onPress={() => setRecordarme(!recordarme)}
          >
            <View style={[styles.checkbox, recordarme && styles.checkboxSelected]}>
              {recordarme && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Recordarme</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.forgotPasswordContainer, isSmallScreen && styles.forgotPasswordContainerStacked]}>
            <Text style={styles.forgotPassword}>Recuperar contraseña</Text>
          </TouchableOpacity>
        </View>

        {/* Botón de login */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>INGRESAR</Text>
        </TouchableOpacity>
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
  logoPlaceholder: {
    // width: 100,
    // height: 100,
    // borderRadius: 50,
    // backgroundColor: "#c9cbd0ff",
    // justifyContent: "center",
    // alignItems: "center",
  },
  logoText: {
    fontSize: 40,
    color: "#ffffff",
  },
  logo: {
    width: 120,
    height: 120
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
    textDecoration: "none"
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
    textDecoration: "none",
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