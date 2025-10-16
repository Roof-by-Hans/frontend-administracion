import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DashboardLayout from "../components/layout/DashboardLayout";
import MozoModal from "../components/MozoModal";

// Datos iniciales de mozos
const MOZOS_INICIALES = [
  {
    id: 1,
    nombre: "Carlos",
    apellido: "Pérez",
    telefono: "+598 99 123 456",
    turno: "Mañana",
  },
  {
    id: 2,
    nombre: "Ana",
    apellido: "Gómez",
    telefono: "+598 99 234 567",
    turno: "Tarde",
  },
  {
    id: 3,
    nombre: "Luis",
    apellido: "Rodríguez",
    telefono: "+598 99 345 678",
    turno: "Noche",
  },
];

export default function MozosScreen({ onNavigate, currentScreen }) {
  const [mozos, setMozos] = useState(MOZOS_INICIALES);
  const [busqueda, setBusqueda] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [mozoEditando, setMozoEditando] = useState(null);

  // Filtrar mozos
  const mozosFiltrados = mozos.filter((mozo) => {
    const nombreCompleto = `${mozo.nombre} ${mozo.apellido}`.toLowerCase();
    return nombreCompleto.includes(busqueda.toLowerCase());
  });

  const handleAgregarMozo = () => {
    setMozoEditando(null);
    setModalVisible(true);
  };

  const handleEditarMozo = (mozo) => {
    setMozoEditando(mozo);
    setModalVisible(true);
  };

  const handleEliminarMozo = (id) => {
    // Para web usamos window.confirm
    if (typeof window !== "undefined" && window.confirm) {
      const confirmar = window.confirm(
        "¿Estás seguro de que deseas eliminar este mozo?"
      );
      if (confirmar) {
        setMozos(mozos.filter((m) => m.id !== id));
      }
    } else {
      // Para móvil usamos Alert.alert
      Alert.alert(
        "Eliminar Mozo",
        "¿Estás seguro de que deseas eliminar este mozo?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => {
              setMozos(mozos.filter((m) => m.id !== id));
            },
          },
        ]
      );
    }
  };

  const handleGuardarMozo = (mozoData) => {
    if (mozoEditando) {
      // Editar mozo existente
      setMozos(mozos.map((m) => (m.id === mozoData.id ? mozoData : m)));
    } else {
      // Agregar nuevo mozo
      setMozos([...mozos, mozoData]);
    }
  };

  return (
    <DashboardLayout onNavigate={onNavigate} currentScreen={currentScreen}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Administrar Mozos</Text>
        </View>

        {/* Controles superiores */}
        <View style={styles.controlsContainer}>
          <View style={styles.controlsRow}>
            {/* Buscar mozos */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color="#666"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar mozos..."
                value={busqueda}
                onChangeText={setBusqueda}
                placeholderTextColor="#999"
              />
            </View>

            {/* Botón agregar */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAgregarMozo}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabla de mozos */}
        <View style={styles.tableContainer}>
          {/* Header de la tabla */}
          <View style={styles.tableHeader}>
            <View style={styles.tableHeaderCell}>
              <Text style={styles.tableHeaderText}>Nombre</Text>
            </View>
            <View style={styles.tableHeaderCell}>
              <Text style={styles.tableHeaderText}>Apellido</Text>
            </View>
            <View style={styles.tableHeaderCell}>
              <Text style={styles.tableHeaderText}>Teléfono</Text>
            </View>
            <View style={styles.tableHeaderCell}>
              <Text style={styles.tableHeaderText}>Turno</Text>
            </View>
            <View
              style={[styles.tableHeaderCell, styles.tableHeaderCellAcciones]}
            >
              <Text style={styles.tableHeaderText}>Acciones</Text>
            </View>
          </View>

          {/* Filas de la tabla */}
          <ScrollView style={styles.tableBody}>
            {mozosFiltrados.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="account-tie"
                  size={48}
                  color="#ccc"
                />
                <Text style={styles.emptyStateText}>
                  No se encontraron mozos
                </Text>
              </View>
            ) : (
              mozosFiltrados.map((mozo) => (
                <View key={mozo.id} style={styles.tableRow}>
                  <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{mozo.nombre}</Text>
                  </View>
                  <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{mozo.apellido}</Text>
                  </View>
                  <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{mozo.telefono}</Text>
                  </View>
                  <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{mozo.turno}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.tableCellAcciones]}>
                    <View style={styles.actionsContainer}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEditarMozo(mozo)}
                      >
                        <MaterialCommunityIcons
                          name="pencil"
                          size={18}
                          color="#4A90E2"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleEliminarMozo(mozo.id)}
                      >
                        <MaterialCommunityIcons
                          name="delete"
                          size={18}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Modal para agregar/editar */}
        <MozoModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={handleGuardarMozo}
          mozo={mozoEditando}
        />
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  controlsContainer: {
    marginBottom: 20,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  searchContainer: {
    flex: 1,
    minWidth: 200,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1f1f1f",
    outlineStyle: "none",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  tableContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderCell: {
    flex: 1,
    justifyContent: "center",
  },
  tableHeaderCellAcciones: {
    flex: 0.8,
    alignItems: "center",
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f1f1f",
  },
  tableBody: {
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  tableCell: {
    flex: 1,
    justifyContent: "center",
  },
  tableCellAcciones: {
    flex: 0.8,
    alignItems: "center",
  },
  tableCellText: {
    fontSize: 14,
    color: "#3f3f3f",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#E53935",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
  },
});
