import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IconButton } from "@mui/material";
import DashboardLayout from "../components/layout/DashboardLayout";
import MozoModal from "../components/MozoModal";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import { useAuth } from "../context/AuthContext";

// Datos iniciales de mozos (vacío - se llenarán manualmente)
const MOZOS_INICIALES = [];

const STORAGE_KEY = "mozos_data";

export default function MozosScreen({ onNavigate, currentScreen }) {
  const [mozos, setMozos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [mozoEditando, setMozoEditando] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [mozoAEliminar, setMozoAEliminar] = useState(null);

  const { user, logout } = useAuth();
  const userName = user?.usuario || "Usuario";

  // Cargar mozos desde localStorage al montar el componente
  useEffect(() => {
    const cargarMozos = () => {
      try {
        const mozosGuardados = localStorage.getItem(STORAGE_KEY);
        if (mozosGuardados) {
          setMozos(JSON.parse(mozosGuardados));
        } else {
          setMozos(MOZOS_INICIALES);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(MOZOS_INICIALES));
        }
      } catch (error) {
        console.error("Error al cargar mozos:", error);
        setMozos(MOZOS_INICIALES);
      }
    };

    cargarMozos();
  }, []);

  // Guardar mozos en localStorage cada vez que cambien
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mozos));
    } catch (error) {
      console.error("Error al guardar mozos:", error);
    }
  }, [mozos]);

  // Filtrar mozos según la búsqueda manual
  const mozosFiltrados = mozos.filter((mozo) => {
    const terminoBusqueda = busqueda.toLowerCase().trim();
    if (!terminoBusqueda) return true;

    const nombreCompleto = `${mozo.nombre} ${mozo.apellido}`.toLowerCase();
    return (
      nombreCompleto.includes(terminoBusqueda) ||
      mozo.telefono.includes(terminoBusqueda) ||
      mozo.turno.toLowerCase().includes(terminoBusqueda)
    );
  });

  // Definir columnas para el DataGrid
  const columns = [
    {
      field: 'nombre',
      headerName: 'Nombre',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'apellido',
      headerName: 'Apellido',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'telefono',
      headerName: 'Teléfono',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'turno',
      headerName: 'Turno',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      minWidth: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <View style={styles.actionsContainer}>
          <IconButton
            onClick={() => handleEditarMozo(params.row)}
            color="primary"
            size="small"
            title="Editar"
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#1976d2" />
          </IconButton>
          <IconButton
            onClick={() => handleEliminarMozo(params.row.id)}
            color="error"
            size="small"
            title="Eliminar"
          >
            <MaterialCommunityIcons name="delete" size={20} color="#d32f2f" />
          </IconButton>
        </View>
      ),
    },
  ];

  const handleAgregarMozo = () => {
    setMozoEditando(null);
    setModalVisible(true);
  };

  const handleEditarMozo = (mozo) => {
    setMozoEditando(mozo);
    setModalVisible(true);
  };

  // Función para abrir modal de confirmación de eliminación
  const handleEliminarMozo = (mozoId) => {
    setMozoAEliminar(mozoId);
    setConfirmModalVisible(true);
  };

  // Función para confirmar la eliminación
  const confirmarEliminacion = () => {
    if (mozoAEliminar) {
      setMozos(mozos.filter(m => m.id !== mozoAEliminar));
      setConfirmModalVisible(false);
      setMozoAEliminar(null);
    }
  };

  // Función para cancelar la eliminación
  const cancelarEliminacion = () => {
    setConfirmModalVisible(false);
    setMozoAEliminar(null);
  };

  const handleGuardarMozo = (mozoData) => {
    if (mozoEditando) {
      // Editar mozo existente
      setMozos(mozos.map((m) => (m.id === mozoData.id ? mozoData : m)));
    } else {
      // Agregar nuevo mozo
      const nuevoMozo = {
        ...mozoData,
        id: Math.max(...mozos.map(m => m.id), 0) + 1
      };
      setMozos([...mozos, nuevoMozo]);
    }
    setModalVisible(false);
    setMozoEditando(null);
  };

  return (
    <DashboardLayout 
      onNavigate={onNavigate} 
      currentScreen={currentScreen}
      userName={userName}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Administrar Mozos</Text>
        </View>

        {/* Controles superiores: Buscador y Botón Agregar */}
        <View style={styles.controlsContainer}>
          <View style={styles.controlsRow}>
            {/* Buscador */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color="#666"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar mozos por nombre, apellido, teléfono o turno..."
                placeholderTextColor="#999"
                value={busqueda}
                onChangeText={setBusqueda}
              />
              {busqueda.length > 0 && (
                <TouchableOpacity onPress={() => setBusqueda("")} style={styles.clearButton}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Botón Agregar */}
            <TouchableOpacity style={styles.addButton} onPress={handleAgregarMozo}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DataGrid con filtrado y ordenamiento nativo */}
        <DataTable
          rows={mozosFiltrados}
          columns={columns}
          pageSize={10}
        />

        {/* Modal para agregar/editar mozo */}
        <MozoModal
          visible={modalVisible}
          mozo={mozoEditando}
          onClose={() => {
            setModalVisible(false);
            setMozoEditando(null);
          }}
          onSave={handleGuardarMozo}
        />

        {/* Modal de confirmación para eliminar */}
        <ConfirmModal
          visible={confirmModalVisible}
          title="Eliminar Mozo"
          message="¿Estás seguro de que deseas eliminar este mozo? Esta acción no se puede deshacer."
          onConfirm={confirmarEliminacion}
          onCancel={cancelarEliminacion}
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
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  controlsContainer: {
    marginBottom: 20,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    outlineStyle: "none",
  },
  clearButton: {
    marginLeft: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
});
