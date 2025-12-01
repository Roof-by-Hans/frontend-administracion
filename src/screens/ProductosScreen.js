import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IconButton } from "@mui/material";
import DashboardLayout from "../components/layout/DashboardLayout";
import ProductoModal from "../components/ProductoModal";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import { useAuth } from "../context/AuthContext";
import * as productosService from "../services/productosService";
import Alert from "@blazejkustra/react-native-alert";

export default function ProductosScreen({ onNavigate, currentScreen }) {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const { user, logout } = useAuth();
  const userName = user?.usuario || "Usuario";

  // Cargar productos desde el backend al montar el componente
  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setCargando(true);
      setError(null);
      const response = await productosService.getProductos();

      if (response.success && response.data) {
        // Mapear los datos del backend al formato esperado por el frontend
        const productosFormateados = response.data.map((producto) => ({
          id: producto.id,
          nombre: producto.nombre,
          categoria: producto.categoria?.nombre || "Sin categoría",
          categoriaId: producto.idCategoria,
          precio: producto.precioUnitario,
          descripcion: producto.descripcion || "",
          fotoPrincipal: producto.fotoPrincipal,
          fotoPrincipalUrl: producto.fotoPrincipalUrl,
        }));
        setProductos(productosFormateados);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setError("Error al cargar los productos. Por favor, intenta nuevamente.");
      Alert.alert("Error", "No se pudieron cargar los productos del servidor.");
    } finally {
      setCargando(false);
    }
  };

  // Filtrar productos según la búsqueda manual
  const productosFiltrados = productos.filter((producto) => {
    const terminoBusqueda = busqueda.toLowerCase().trim();
    if (!terminoBusqueda) return true;

    return (
      producto.nombre.toLowerCase().includes(terminoBusqueda) ||
      producto.categoria.toLowerCase().includes(terminoBusqueda) ||
      producto.precio.toString().includes(terminoBusqueda)
    );
  });

  // Definir columnas para el DataGrid
  const columns = [
    {
      field: "id",
      headerName: "ID",
      width: 80,
    },
    {
      field: "fotoPrincipalUrl",
      headerName: "Imagen",
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <View style={styles.imageCell}>
          {params.row.fotoPrincipalUrl ? (
            <Image
              source={{ uri: params.row.fotoPrincipalUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <MaterialCommunityIcons name="image-off" size={24} color="#999" />
            </View>
          )}
        </View>
      ),
    },
    {
      field: "nombre",
      headerName: "Nombre",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "categoria",
      headerName: "Categoría",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "precio",
      headerName: "Precio",
      width: 120,
      valueFormatter: (params) => {
        const numero = Number(params);
        return `$${numero.toLocaleString("es-UY", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      },
    },
    {
      field: "descripcion",
      headerName: "Descripción",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "acciones",
      headerName: "Acciones",
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
    setProductoAEliminar(producto);
    setConfirmVisible(true);
  };

  // Función para confirmar la eliminación
  const confirmarEliminacion = async () => {
    if (productoAEliminar) {
      try {
        setCargando(true);
        await productosService.eliminarProducto(productoAEliminar);

        // Actualizar la lista local
        setProductos(productos.filter((p) => p.id !== productoAEliminar));
        setConfirmVisible(false);
        setProductoAEliminar(null);
        Alert.alert("Éxito", "Producto eliminado correctamente.");
      } catch (error) {
        console.error("Error al eliminar producto:", error);
        Alert.alert(
          "Error",
          "No se pudo eliminar el producto. Por favor, intenta nuevamente."
        );
      } finally {
        setCargando(false);
      }
    }
  };

  // Función para cancelar la eliminación
  const cancelarEliminacion = () => {
    setConfirmVisible(false);
    setProductoAEliminar(null);
  };

  const handleGuardarProducto = async (productoData) => {
    try {
      setCargando(true);

      if (productoEditando) {
        // Editar producto existente
        const datosActualizacion = {
          nombre: productoData.nombre,
          precio_unitario: productoData.precio,
          id_categoria: productoData.categoriaId,
          descripcion: productoData.descripcion,
        };

        const response = await productosService.actualizarProducto(
          productoData.id,
          datosActualizacion,
          productoData.imagen // Si hay una nueva imagen
        );

        if (response.success) {
          // Recargar productos para obtener los datos actualizados
          await cargarProductos();
          Alert.alert("Éxito", "Producto actualizado correctamente.");
        }
      } else {
        // Agregar nuevo producto
        const datosNuevoProducto = {
          nombre: productoData.nombre,
          precio_unitario: productoData.precio,
          id_categoria: productoData.categoriaId,
          descripcion: productoData.descripcion,
        };

        const response = await productosService.crearProducto(
          datosNuevoProducto,
          productoData.imagen // Si hay imagen
        );

        if (response.success) {
          // Recargar productos para obtener el nuevo producto
          await cargarProductos();
          Alert.alert("Éxito", "Producto creado correctamente.");
        }
      }

      setModalVisible(false);
      setProductoEditando(null);
    } catch (error) {
      console.error("Error al guardar producto:", error);
      const mensaje =
        error.response?.data?.message ||
        "Error al guardar el producto. Por favor, intenta nuevamente.";
      Alert.alert("Error", mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <DashboardLayout
      onNavigate={onNavigate}
      currentScreen={currentScreen}
      userName={userName}
      onLogout={logout}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Administrar Productos</Text>
        </View>

        {/* Mostrar error si existe */}
        {error && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={20}
              color="#d32f2f"
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={cargarProductos}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

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
                placeholder="Buscar productos por nombre, categoría o precio..."
                placeholderTextColor="#999"
                value={busqueda}
                onChangeText={setBusqueda}
              />
              {busqueda.length > 0 && (
                <TouchableOpacity
                  onPress={() => setBusqueda("")}
                  style={styles.clearButton}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Botón Agregar */}
            <TouchableOpacity
              style={[styles.addButton, cargando && styles.addButtonDisabled]}
              onPress={handleAgregarProducto}
              disabled={cargando}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Indicador de carga */}
        {cargando && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Cargando productos...</Text>
          </View>
        )}

        {/* DataGrid con filtrado y ordenamiento nativo */}
        {!cargando && (
          <DataTable
            rows={productosFiltrados}
            columns={columns}
            pageSize={10}
          />
        )}

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
          visible={confirmVisible}
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
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  imageCell: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  noImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#d32f2f",
  },
  errorText: {
    flex: 1,
    color: "#d32f2f",
    fontSize: 14,
    marginLeft: 8,
  },
  retryButton: {
    backgroundColor: "#d32f2f",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  addButtonDisabled: {
    backgroundColor: "#a5d6a7",
    opacity: 0.6,
  },
});
