import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DashboardLayout from "../components/layout/DashboardLayout";
import LimitesSubscripcionModal from "../components/LimitesSubscripcionModal";
import { useAuth } from "../context/AuthContext";

export default function AjustesScreen({ onNavigate, currentScreen }) {
  const [modalLimitesVisible, setModalLimitesVisible] = useState(false);
  
  const { user, logout } = useAuth();
  const userName = user?.usuario || "Usuario";

  // Función para abrir modal de límites de subscripción
  const handleAbrirLimites = () => {
    setModalLimitesVisible(true);
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

        {/* Grid de opciones */}
        <View style={styles.gridContainer}>
          {/* Card Financiero */}
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
    marginBottom: 30,
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
