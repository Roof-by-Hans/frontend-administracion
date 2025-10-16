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
import ProductoModal from "../components/ProductoModal";

// Datos iniciales de productos
const PRODUCTOS_INICIALES = [
  {
    id: 1,
    nombre: "Pizza Margarita",
    categoria: "Comidas",
    precio: 12.5,
    stock: 25,
  },
  {
    id: 2,
    nombre: "Hamburguesa Premium",
    categoria: "Comidas",
    precio: 15.0,
    stock: 30,
  },
  {
    id: 3,
    nombre: "Coca Cola",
    categoria: "Bebidas",
    precio: 2.5,
    stock: 100,
  },
  {
    id: 4,
    nombre: "Cerveza Artesanal",
    categoria: "Bebidas",
    precio: 6.5,
    stock: 50,
  },
];

export default function ProductosScreen({ onNavigate, currentScreen }) {
  const [productos, setProductos] = useState(PRODUCTOS_INICIALES);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);

  // Filtrar productos
  const productosFiltrados = productos.filter((producto) => {
    const coincideBusqueda = producto.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase());
    const coincideCategoria =
      !categoriaFiltro ||
      producto.categoria.toLowerCase().includes(categoriaFiltro.toLowerCase());
    return coincideBusqueda && coincideCategoria;
  });

  const handleAgregarProducto = () => {
    setProductoEditando(null);
    setModalVisible(true);
  };

  const handleEditarProducto = (producto) => {
    setProductoEditando(producto);
    setModalVisible(true);
  };

  const handleEliminarProducto = (id) => {
    // Para web usamos window.confirm
    if (typeof window !== "undefined" && window.confirm) {
      const confirmar = window.confirm(
        "¿Estás seguro de que deseas eliminar este producto?"
      );
      if (confirmar) {
        setProductos(productos.filter((p) => p.id !== id));
      }
    } else {
      // Para móvil usamos Alert.alert
      Alert.alert(
        "Eliminar Producto",
        "¿Estás seguro de que deseas eliminar este producto?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => {
              setProductos(productos.filter((p) => p.id !== id));
            },
          },
        ]
      );
    }
  };

  const handleGuardarProducto = (productoData) => {
    if (productoEditando) {
      // Editar producto existente
      setProductos(
        productos.map((p) => (p.id === productoData.id ? productoData : p))
      );
    } else {
      // Agregar nuevo producto
      setProductos([...productos, productoData]);
    }
  };

  return (
    <DashboardLayout onNavigate={onNavigate} currentScreen={currentScreen}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Administrar Productos</Text>
        </View>

        {/* Controles superiores */}
        <View style={styles.controlsContainer}>
          <View style={styles.controlsRow}>
            {/* Buscar productos */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color="#666"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar productos..."
                value={busqueda}
                onChangeText={setBusqueda}
                placeholderTextColor="#999"
              />
            </View>

            {/* Filtrar por categoría */}
            <View style={styles.filterContainer}>
              <MaterialCommunityIcons
                name="filter-outline"
                size={20}
                color="#666"
                style={styles.filterIcon}
              />
              <TextInput
                style={styles.filterInput}
                placeholder="Filtrar por categoría"
                value={categoriaFiltro}
                onChangeText={setCategoriaFiltro}
                placeholderTextColor="#999"
              />
            </View>

            {/* Botón agregar */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAgregarProducto}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabla de productos */}
        <View style={styles.tableContainer}>
          {/* Header de la tabla */}
          <View style={styles.tableHeader}>
            <View style={styles.tableHeaderCell}>
              <Text style={styles.tableHeaderText}>Nombre</Text>
            </View>
            <View style={styles.tableHeaderCell}>
              <Text style={styles.tableHeaderText}>Categoría</Text>
            </View>
            <View style={styles.tableHeaderCell}>
              <Text style={styles.tableHeaderText}>Precio</Text>
            </View>
            <View style={styles.tableHeaderCell}>
              <Text style={styles.tableHeaderText}>Stock</Text>
            </View>
            <View
              style={[styles.tableHeaderCell, styles.tableHeaderCellAcciones]}
            >
              <Text style={styles.tableHeaderText}>Acciones</Text>
            </View>
          </View>

          {/* Filas de la tabla */}
          <ScrollView style={styles.tableBody}>
            {productosFiltrados.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="package-variant"
                  size={48}
                  color="#ccc"
                />
                <Text style={styles.emptyStateText}>
                  No se encontraron productos
                </Text>
              </View>
            ) : (
              productosFiltrados.map((producto) => (
                <View key={producto.id} style={styles.tableRow}>
                  <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{producto.nombre}</Text>
                  </View>
                  <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>
                      {producto.categoria}
                    </Text>
                  </View>
                  <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>
                      ${producto.precio.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.tableCell}>
                    <Text style={styles.tableCellText}>{producto.stock}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.tableCellAcciones]}>
                    <View style={styles.actionsContainer}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEditarProducto(producto)}
                      >
                        <MaterialCommunityIcons
                          name="pencil"
                          size={18}
                          color="#4A90E2"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleEliminarProducto(producto.id)}
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
        <ProductoModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={handleGuardarProducto}
          producto={productoEditando}
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
  filterContainer: {
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
  filterIcon: {
    marginRight: 8,
  },
  filterInput: {
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
