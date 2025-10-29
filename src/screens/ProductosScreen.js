import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IconButton } from "@mui/material";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProductoModal from "../components/ProductoModal";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import { useAuth } from "../context/AuthContext";

// Datos iniciales de productos (vacío - se llenarán manualmente)
const PRODUCTOS_INICIALES = [];

const STORAGE_KEY = "productos_data";

export default function ProductosScreen({ onNavigate, currentScreen }) {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);

  const { user, logout } = useAuth();
  const userName = user?.usuario || "Usuario";

  // Cargar productos desde localStorage al montar el componente
  useEffect(() => {
    const cargarProductos = () => {
      try {
        const productosGuardados = localStorage.getItem(STORAGE_KEY);
        if (productosGuardados) {
          setProductos(JSON.parse(productosGuardados));
        } else {
          setProductos(PRODUCTOS_INICIALES);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(PRODUCTOS_INICIALES));
        }
      } catch (error) {
        console.error("Error al cargar productos:", error);
        setProductos(PRODUCTOS_INICIALES);
      }
    };

    cargarProductos();
  }, []);

  // Guardar productos en localStorage cada vez que cambien
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
    } catch (error) {
      console.error("Error al guardar productos:", error);
    }
  }, [productos]);

  // Filtrar productos según la búsqueda manual
  const productosFiltrados = productos.filter((producto) => {
    const terminoBusqueda = busqueda.toLowerCase().trim();
    if (!terminoBusqueda) return true;

    return (
      producto.nombre.toLowerCase().includes(terminoBusqueda) ||
      producto.categoria.toLowerCase().includes(terminoBusqueda) ||
      producto.precio.toString().includes(terminoBusqueda) ||
      producto.stock.toString().includes(terminoBusqueda)
    );
  });

  // Definir columnas para el DataGrid
  const columns = [
    {
      field: 'nombre',
      headerName: 'Nombre',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'categoria',
      headerName: 'Categoría',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'precio',
      headerName: 'Precio',
      width: 120,
      valueFormatter: (params) => {
        const numero = Number(params);
        return `$${numero.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      },
    },
    {
      field: 'stock',
      headerName: 'Stock',
      width: 100,
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
            onClick={() => handleEditarProducto(params.row)}
            color="primary"
            size="small"
            title="Editar"
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#1976d2" />
          </IconButton>
          <IconButton
            onClick={() => handleEliminarProducto(params.row.id)}
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

  const handleAgregarProducto = () => {
    setProductoEditando(null);
    setModalVisible(true);
  };

  const handleEditarProducto = (producto) => {
    setProductoEditando(producto);
    setModalVisible(true);
  };

  // Función para abrir modal de confirmación de eliminación
  const handleEliminarProducto = (productoId) => {
    setProductoAEliminar(productoId);
    setConfirmModalVisible(true);
  };

  // Función para confirmar la eliminación
  const confirmarEliminacion = () => {
    if (productoAEliminar) {
      setProductos(productos.filter(p => p.id !== productoAEliminar));
      setConfirmModalVisible(false);
      setProductoAEliminar(null);
    }
  };

  // Función para cancelar la eliminación
  const cancelarEliminacion = () => {
    setConfirmModalVisible(false);
    setProductoAEliminar(null);
  };

  const handleGuardarProducto = (productoData) => {
    if (productoEditando) {
      // Editar producto existente
      setProductos(productos.map((p) => (p.id === productoData.id ? productoData : p)));
    } else {
      // Agregar nuevo producto
      const nuevoProducto = {
        ...productoData,
        id: Math.max(...productos.map(p => p.id), 0) + 1
      };
      setProductos([...productos, nuevoProducto]);
    }
    setModalVisible(false);
    setProductoEditando(null);
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
          <Text style={styles.title}>Administrar Productos</Text>
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
                placeholder="Buscar productos por nombre, categoría, precio o stock..."
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
            <TouchableOpacity style={styles.addButton} onPress={handleAgregarProducto}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DataGrid con filtrado y ordenamiento nativo */}
        <DataTable
          rows={productosFiltrados}
          columns={columns}
          pageSize={10}
        />

        {/* Modal para agregar/editar producto */}
        <ProductoModal
          visible={modalVisible}
          producto={productoEditando}
          onClose={() => {
            setModalVisible(false);
            setProductoEditando(null);
          }}
          onSave={handleGuardarProducto}
        />

        {/* Modal de confirmación para eliminar */}
        <ConfirmModal
          visible={confirmModalVisible}
          title="Eliminar Producto"
          message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
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
