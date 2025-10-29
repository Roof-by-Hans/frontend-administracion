import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IconButton } from "@mui/material";
import DashboardLayout from "../components/layout/DashboardLayout";
import ClienteModal from "../components/ClienteModal";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import { useAuth } from "../context/AuthContext";

// Datos iniciales de clientes (vacío - se llenarán manualmente)
const CLIENTES_INICIALES = [];

const STORAGE_KEY = "clientes_data";

export default function ClientesScreen({ onNavigate, currentScreen }) {
  const [clientes, setClientes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [clienteAEliminar, setClienteAEliminar] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  
  const { user, logout } = useAuth();
  const userName = user?.usuario || "Usuario";

  // Cargar clientes desde localStorage al montar el componente
  useEffect(() => {
    const cargarClientes = () => {
      try {
        const clientesGuardados = localStorage.getItem(STORAGE_KEY);
        if (clientesGuardados) {
          setClientes(JSON.parse(clientesGuardados));
        } else {
          // Si no hay clientes guardados, usar los datos iniciales
          setClientes(CLIENTES_INICIALES);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(CLIENTES_INICIALES));
        }
      } catch (error) {
        console.error("Error al cargar clientes:", error);
        setClientes(CLIENTES_INICIALES);
      }
    };

    cargarClientes();
  }, []);

  // Guardar clientes en localStorage cada vez que cambien
  useEffect(() => {
    // Guardar siempre, incluso si está vacío
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
    } catch (error) {
      console.error("Error al guardar clientes:", error);
    }
  }, [clientes]);

  // Filtrar clientes según la búsqueda manual
  const clientesFiltrados = clientes.filter((cliente) => {
    const terminoBusqueda = busqueda.toLowerCase().trim();
    if (!terminoBusqueda) return true;

    return (
      cliente.nombre.toLowerCase().includes(terminoBusqueda) ||
      cliente.apellido.toLowerCase().includes(terminoBusqueda) ||
      cliente.telefono.includes(terminoBusqueda) ||
      cliente.suscripcion.toLowerCase().includes(terminoBusqueda)
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
      field: 'suscripcion',
      headerName: 'Suscripción',
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
            onClick={() => handleEditarCliente(params.row)}
            color="primary"
            size="small"
            title="Editar"
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#1976d2" />
          </IconButton>
          <IconButton
            onClick={() => handleEliminarCliente(params.row.id)}
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

  // Función para abrir modal de agregar cliente
  const handleAgregarCliente = () => {
    setClienteSeleccionado(null);
    setModalVisible(true);
  };

  // Función para abrir modal de editar cliente
  const handleEditarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setModalVisible(true);
  };

  // Función para abrir modal de confirmación de eliminación
  const handleEliminarCliente = (clienteId) => {
    setClienteAEliminar(clienteId);
    setConfirmModalVisible(true);
  };

  // Función para confirmar la eliminación
  const confirmarEliminacion = () => {
    if (clienteAEliminar) {
      setClientes(clientes.filter(c => c.id !== clienteAEliminar));
      setConfirmModalVisible(false);
      setClienteAEliminar(null);
    }
  };

  // Función para cancelar la eliminación
  const cancelarEliminacion = () => {
    setConfirmModalVisible(false);
    setClienteAEliminar(null);
  };

  // Función para guardar cliente (agregar o editar)
  const handleGuardarCliente = (clienteData) => {
    if (clienteSeleccionado) {
      // Editar cliente existente
      setClientes(clientes.map(c => 
        c.id === clienteSeleccionado.id ? { ...clienteData, id: c.id } : c
      ));
    } else {
      // Agregar nuevo cliente
      const nuevoCliente = {
        ...clienteData,
        id: Math.max(...clientes.map(c => c.id), 0) + 1
      };
      setClientes([...clientes, nuevoCliente]);
    }
    setModalVisible(false);
    setClienteSeleccionado(null);
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
        <View style={styles.header}>
          <Text style={styles.title}>Administrar Clientes</Text>
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
                placeholder="Buscar por nombre, apellido, teléfono o suscripción..."
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
            <TouchableOpacity style={styles.agregarButton} onPress={handleAgregarCliente}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.agregarButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DataGrid con filtrado y ordenamiento nativo */}
        <DataTable
          rows={clientesFiltrados}
          columns={columns}
          pageSize={10}
        />

        {/* Modal para agregar/editar cliente */}
        <ClienteModal
          visible={modalVisible}
          cliente={clienteSeleccionado}
          onClose={() => {
            setModalVisible(false);
            setClienteSeleccionado(null);
          }}
          onGuardar={handleGuardarCliente}
        />

        {/* Modal de confirmación para eliminar */}
        <ConfirmModal
          visible={confirmModalVisible}
          title="Confirmar eliminación"
          message="¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer."
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
  agregarButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  agregarButtonText: {
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
