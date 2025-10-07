import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import Navbar from "./src/components/Navbar";
import Counter from "./src/components/Counter";
import DemoModal from "./src/components/DemoModal";

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Navbar onOpenModal={() => setModalVisible(true)} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.hero}>
          <Text style={styles.logo}>⚛️</Text>
          <Text style={styles.title}>React + Expo</Text>
          <Text style={styles.subtitle}>Plantilla básica similar a Vite</Text>
        </View>

        <Counter />

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Características incluidas:</Text>
          <View style={styles.featureList}>
            <Text style={styles.feature}>✅ Menú de navegación</Text>
            <Text style={styles.feature}>✅ Contador interactivo</Text>
            <Text style={styles.feature}>✅ Modal/Popup demo</Text>
            <Text style={styles.feature}>
              ✅ Estructura organizada (src/components)
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Edita los archivos en src/components/ para comenzar
          </Text>
          <Text style={styles.footerEmoji}>🚀</Text>
        </View>
      </ScrollView>

      <DemoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: "center",
  },
  hero: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#aaa",
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 24,
    marginVertical: 16,
    width: "100%",
    maxWidth: 500,
    borderWidth: 1,
    borderColor: "#333",
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  featureList: {
    gap: 8,
  },
  feature: {
    fontSize: 16,
    color: "#aaa",
    lineHeight: 24,
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#646cff",
    textAlign: "center",
    marginBottom: 8,
  },
  footerEmoji: {
    fontSize: 32,
  },
});
