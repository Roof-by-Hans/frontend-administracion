import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DashboardLayout from "../components/layout/DashboardLayout";
import ClienteModal from "../components/ClienteModal";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../context/AuthContext";

// Datos iniciales de clientes
const CLIENTES_INICIALES = [
  { id: 1, nombre: "Juan", apellido: "Pérez", telefono: "123456789", subscripcion: "Premium" },
  { id: 2, nombre: "María", apellido: "González", telefono: "987654321", subscripcion: "Básica" },
  { id: 3, nombre: "Carlos", apellido: "Rodríguez", telefono: "456789123", subscripcion: "Premium" },
  { id: 4, nombre: "Ana", apellido: "Martínez", telefono: "789123456", subscripcion: "Básica" },
  { id: 5, nombre: "Luis", apellido: "López", telefono: "321654987", subscripcion: "Premium" },
  { id: 6, nombre: "Laura", apellido: "Sánchez", telefono: "654987321", subscripcion: "Básica" },
  { id: 7, nombre: "Pedro", apellido: "Ramírez", telefono: "147258369", subscripcion: "Premium" },
  { id: 8, nombre: "Sofía", apellido: "Torres", telefono: "369258147", subscripcion: "Básica" },
];

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
    if (clientes.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
      } catch (error) {
        console.error("Error al guardar clientes:", error);
      }
    }
  }, [clientes]);

  // Filtrar clientes según la búsqueda
  const clientesFiltrados = clientes.filter((cliente) => {
    const terminoBusqueda = busqueda.toLowerCase().trim();
    if (!terminoBusqueda) return true;

    return (
      cliente.nombre.toLowerCase().includes(terminoBusqueda) ||
      cliente.apellido.toLowerCase().includes(terminoBusqueda) ||
      cliente.telefono.includes(terminoBusqueda) ||
      cliente.subscripcion.toLowerCase().includes(terminoBusqueda)
    );
  });

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
          <TouchableOpacity style={styles.agregarButton} onPress={handleAgregarCliente}>
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
            <Text style={styles.agregarButtonText}>Agregar Cliente</Text>
          </TouchableOpacity>
        </View>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, apellido, teléfono o Suscripción..."
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

        {/* Tabla de clientes */}
        <ScrollView style={styles.tableContainer}>
          {/* Header de la tabla */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.columnNombre]}>Nombre</Text>
            <Text style={[styles.tableHeaderText, styles.columnApellido]}>Apellido</Text>
            <Text style={[styles.tableHeaderText, styles.columnTelefono]}>Teléfono</Text>
            <Text style={[styles.tableHeaderText, styles.columnSubscripcion]}>Suscripción</Text>
            <Text style={[styles.tableHeaderText, styles.columnAcciones]}>Acciones</Text>
          </View>

          {/* Filas de la tabla */}
          {clientesFiltrados.length > 0 ? (
            clientesFiltrados.map((cliente) => (
              <View key={cliente.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.columnNombre]}>{cliente.nombre}</Text>
                <Text style={[styles.tableCell, styles.columnApellido]}>{cliente.apellido}</Text>
                <Text style={[styles.tableCell, styles.columnTelefono]}>{cliente.telefono}</Text>
                <Text style={[styles.tableCell, styles.columnSubscripcion]}>{cliente.subscripcion}</Text>
                <View style={[styles.tableCellAcciones, styles.columnAcciones]}>
                  {/* Botón Editar */}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditarCliente(cliente)}
                  >
                    <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
                  </TouchableOpacity>
                  {/* Botón Eliminar */}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleEliminarCliente(cliente.id)}
                  >
                    <MaterialCommunityIcons name="delete" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noResultsContainer}>
              <MaterialCommunityIcons name="account-search" size={48} color="#ccc" />
              <Text style={styles.noResultsText}>
                {busqueda ? "No se encontraron clientes que coincidan con la búsqueda" : "No hay clientes registrados"}
              </Text>
            </View>
          )}
        </ScrollView>

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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  agregarButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  agregarButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    outlineStyle: "none",
  },
  clearButton: {
    padding: 5,
  },
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 2,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  tableCell: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  tableCellAcciones: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  columnNombre: {
    flex: 1.5,
  },
  columnApellido: {
    flex: 1.5,
  },
  columnTelefono: {
    flex: 1.5,
  },
  columnSubscripcion: {
    flex: 1.5,
  },
  columnAcciones: {
    flex: 1.5,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#2196F3",
  },
  deleteButton: {
    backgroundColor: "#f44336",
  },
  noResultsContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  noResultsText: {
    marginTop: 15,
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});
