import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  TextInput,
} from "react-native";
import Alert from "@blazejkustra/react-native-alert";
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
  const [nombreNuevaMesa, setNombreNuevaMesa] = useState("");
  
  const handleAgregarMesa = () => {
    if (!nombreNuevaMesa.trim()) {
      Alert.alert("⚠️ Error", "Por favor ingresa un nombre para la mesa");
      return;
    }
    
    onAgregarMesa(nombreNuevaMesa.trim());
    setNombreNuevaMesa("");   };

  const handleEliminarMesa = (numero, nombre) => {
    Alert.alert(
      "⚠️ Confirmar eliminación",
      `¿Estás seguro de eliminar la mesa "${nombre || numero}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          onPress: () => onEliminarMesa(numero),
          style: "destructive"
        }
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
          <View style={styles.addSection}>
            <Text style={styles.sectionTitle}>Agregar nueva mesa</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nombre de la mesa (ej: Mesa Terraza 1)"
                value={nombreNuevaMesa}
                onChangeText={setNombreNuevaMesa}
                onSubmitEditing={handleAgregarMesa}
                returnKeyType="done"
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAgregarMesa}
              >
                <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista de mesas */}
          <Text style={styles.sectionTitle}>Mesas actuales ({mesas?.length || 0})</Text>
          <ScrollView style={styles.mesasList}>
            {mesas && mesas.length > 0 ? (
                            Array.from(new Map(mesas.map(m => [m.idMesa || m.numero, m])).values()).map((mesa) => (
                <View key={`modal-mesa-${mesa.idMesa || mesa.numero}`} style={styles.mesaItem}>
                  <View style={styles.mesaInfo}>
                    <View style={[
                      styles.mesaIndicador, 
                      { backgroundColor: mesa.estado === "ocupada" ? "#ff6b6b" : "#51cf66" }
                    ]}>
                      <Text style={styles.mesaNumero}>{mesa.numero}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mesaNombre}>{mesa.nombre || `Mesa ${mesa.numero}`}</Text>
                      <Text style={styles.mesaEstado}>
                        {mesa.estado === "ocupada" ? "Ocupada" : "Libre"}
                        {mesa.unidaCon && mesa.unidaCon.length > 0 && ` • Unida con: ${mesa.unidaCon.join(", ")}`}
                        {mesa.grupo && ` • Grupo: ${mesa.grupo.nombre || mesa.nombreGrupo}`}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleEliminarMesa(mesa.numero, mesa.nombre)}
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
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="table-furniture" size={64} color="#ccc" />
                <Text style={styles.emptyStateText}>No hay mesas creadas</Text>
                <Text style={styles.emptyStateSubtext}>Agrega tu primera mesa arriba</Text>
              </View>
            )}
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
  addSection: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#228be6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 15,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#868e96',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 4,
  },
  note: {
    fontSize: 13,
    color: "#868e96",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
});
