import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function GestionarMesasModal({ 
  visible, 
  onClose, 
  mesas, 
  onAgregarMesa,
  onEliminarMesa 
}) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const handleAgregarMesa = () => {
    const nuevoNumero = mesas.length > 0 
      ? Math.max(...mesas.map(m => m.numero)) + 1 
      : 1;
    
    onAgregarMesa(nuevoNumero);
    Alert.alert("✅ Mesa agregada", `Se agregó la mesa ${nuevoNumero}`);
  };

  const handleEliminarMesa = (numero) => {
    Alert.alert(
      "⚠️ Eliminar mesa",
      `¿Estás seguro de eliminar la mesa ${numero}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            onEliminarMesa(numero);
            Alert.alert("✅ Mesa eliminada", `Se eliminó la mesa ${numero}`);
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, isTablet && styles.modalTablet]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <MaterialCommunityIcons name="cog" size={isTablet ? 32 : 24} color="#1f1f1f" />
              <Text style={[styles.title, isTablet && styles.titleTablet]}>Gestionar Mesas</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={isTablet ? 32 : 24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Agregar nueva mesa */}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAgregarMesa}
          >
            <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Agregar nueva mesa</Text>
          </TouchableOpacity>

          {/* Lista de mesas */}
          <Text style={styles.sectionTitle}>Mesas actuales</Text>
          <ScrollView style={styles.mesasList}>
            {mesas.map((mesa) => (
              <View key={mesa.numero} style={styles.mesaItem}>
                <View style={styles.mesaInfo}>
                  <View style={[
                    styles.mesaIndicador, 
                    { backgroundColor: mesa.estado === "ocupada" ? "#ff6b6b" : "#51cf66" }
                  ]}>
                    <Text style={styles.mesaNumero}>{mesa.numero}</Text>
                  </View>
                  <View>
                    <Text style={styles.mesaNombre}>Mesa {mesa.numero}</Text>
                    <Text style={styles.mesaEstado}>
                      {mesa.estado === "ocupada" ? "Ocupada" : "Libre"}
                      {mesa.unidaCon.length > 0 && ` • Unida con: ${mesa.unidaCon.join(", ")}`}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleEliminarMesa(mesa.numero)}
                  style={styles.deleteButton}
                  disabled={mesa.estado === "ocupada"}
                >
                  <MaterialCommunityIcons 
                    name="delete" 
                    size={20} 
                    color={mesa.estado === "ocupada" ? "#ccc" : "#ff6b6b"} 
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.note}>
            💡 Solo puedes eliminar mesas libres y sin uniones
          </Text>
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
  },
  modal: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTablet: {
    width: "70%",
    maxWidth: 700,
    maxHeight: "85%",
    padding: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  titleTablet: {
    fontSize: 32,
  },
  closeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#228be6",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 12,
  },
  mesasList: {
    maxHeight: 300,
  },
  mesaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 8,
  },
  mesaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  mesaIndicador: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  mesaNumero: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  mesaNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f1f1f",
  },
  mesaEstado: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  note: {
    fontSize: 13,
    color: "#868e96",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
});
