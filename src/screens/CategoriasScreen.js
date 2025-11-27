import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IconButton } from "@mui/material";
import DashboardLayout from "../components/layout/DashboardLayout";
import CategoriaModal from "../components/CategoriaModal";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import { useAuth } from "../context/AuthContext";
import * as categoriasService from "../services/categoriasService";
import Alert from "@blazejkustra/react-native-alert";

export default function CategoriasScreen({ onNavigate, currentScreen }) {
  const [categorias, setCategorias] = useState([]);
  const [categoriasPlanas, setCategoriasPlanas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const userName = user?.usuario || "Usuario";

  // Cargar categorías desde el backend al montar el componente
  useEffect(() => {
    cargarCategorias();
  }, []);

  // Función auxiliar para crear un mapa de todas las categorías con su idCatPadre
  const crearMapaCategorias = (arbol, mapa = {}) => {
    arbol.forEach(cat => {
      mapa[cat.id] = {
        id: cat.id,
        nombre: cat.nombre,
        idCatPadre: cat.idCatPadre || null,
      };
      if (cat.children && cat.children.length > 0) {
        crearMapaCategorias(cat.children, mapa);
      }
    });
    return mapa;
  };

  const cargarCategorias = async () => {
    try {
      setCargando(true);
      setError(null);
      const response = await categoriasService.getCategorias();
      
      if (response.success && response.data) {
        setCategorias(response.data);
        // Convertir a formato plano para la tabla
        const planas = categoriasService.aplanarCategorias(response.data);
        setCategoriasPlanas(planas);
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      setError("Error al cargar las categorías. Por favor, intenta nuevamente.");
      Alert.alert("Error", "No se pudieron cargar las categorías del servidor.");
    } finally {
      setCargando(false);
    }
  };

  // Filtrar categorías según la búsqueda manual
  const categoriasFiltradas = categoriasPlanas.filter((categoria) => {
    const terminoBusqueda = busqueda.toLowerCase().trim();
    if (!terminoBusqueda) return true;

    return categoria.nombre.toLowerCase().includes(terminoBusqueda);
  });

  // Crear mapa de categorías para búsqueda rápida
  const mapaCategorias = crearMapaCategorias(categorias);

  // Preparar datos para la tabla con ID único
  const categoriasParaTabla = categoriasFiltradas.map(cat => {
    const categoriaCompleta = mapaCategorias[cat.id];
    const idPadre = categoriaCompleta?.idCatPadre;
    
    let nombrePadre = 'Raíz';
    if (idPadre) {
      const padre = mapaCategorias[idPadre];
      nombrePadre = padre ? padre.nombre : 'N/A';
    }
    
    return {
      ...cat,
      idCatPadre: idPadre,
      nombrePadre: nombrePadre,
    };
  });

  // Definir columnas para el DataGrid
  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
    },
    {
      field: 'nombre',
      headerName: 'Nombre',
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
        <View style={styles.categoryNameCell}>
          <Text style={styles.categoryNameText}>
            {params.row.nombreConIndentacion}
          </Text>
        </View>
      ),
    },
    {
      field: 'nombrePadre',
      headerName: 'Categoría Padre',
      flex: 1,
      minWidth: 200,
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
            onClick={() => handleEditarCategoria(params.row)}
            color="primary"
            size="small"
            title="Editar"
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#1976d2" />
          </IconButton>
          <IconButton
            onClick={() => handleEliminarCategoria(params.row.id)}
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

  const handleAgregarCategoria = () => {
    setCategoriaEditando(null);
    setModalVisible(true);
  };

  const handleEditarCategoria = (categoria) => {
    // Buscar la categoría completa con idCatPadre en la estructura original
    const categoriaCompleta = encontrarCategoriaEnArbol(categorias, categoria.id);
    setCategoriaEditando(categoriaCompleta || categoria);
    setModalVisible(true);
  };

  // Función auxiliar para buscar categoría en árbol jerárquico
  const encontrarCategoriaEnArbol = (arbol, id) => {
    for (const cat of arbol) {
      if (cat.id === id) return cat;
      if (cat.children && cat.children.length > 0) {
        const encontrada = encontrarCategoriaEnArbol(cat.children, id);
        if (encontrada) return encontrada;
      }
    }
    return null;
  };

  // Función para abrir modal de confirmación de eliminación
  const handleEliminarCategoria = (categoriaId) => {
    setCategoriaAEliminar(categoriaId);
    setConfirmModalVisible(true);
  };

  // Función para confirmar la eliminación
  const confirmarEliminacion = async () => {
    if (categoriaAEliminar) {
      try {
        setCargando(true);
        await categoriasService.eliminarCategoria(categoriaAEliminar);
        
        // Recargar categorías
        await cargarCategorias();
        setConfirmModalVisible(false);
        setCategoriaAEliminar(null);
        Alert.alert("Éxito", "Categoría eliminada correctamente.");
      } catch (error) {
        console.error("Error al eliminar categoría:", error);
        const mensaje = error.response?.data?.message || "No se pudo eliminar la categoría. Puede que tenga productos o subcategorías asociadas.";
        Alert.alert("Error", mensaje);
      } finally {
        setCargando(false);
      }
    }
  };

  // Función para cancelar la eliminación
  const cancelarEliminacion = () => {
    setConfirmModalVisible(false);
    setCategoriaAEliminar(null);
  };

  const handleGuardarCategoria = async (categoriaData) => {
    try {
      setCargando(true);
      
      if (categoriaEditando) {
        // Editar categoría existente
        const datosActualizacion = {
          nombre: categoriaData.nombre,
          idCatPadre: categoriaData.idCatPadre,
        };
        
        const response = await categoriasService.actualizarCategoria(
          categoriaData.id,
          datosActualizacion
        );
        
        if (response.success) {
          await cargarCategorias();
          Alert.alert("Éxito", "Categoría actualizada correctamente.");
        }
      } else {
        // Agregar nueva categoría
        const datosNuevaCategoria = {
          nombre: categoriaData.nombre,
          idCatPadre: categoriaData.idCatPadre,
        };
        
        const response = await categoriasService.crearCategoria(datosNuevaCategoria);
        
        if (response.success) {
          await cargarCategorias();
          Alert.alert("Éxito", "Categoría creada correctamente.");
        }
      }
      
      setModalVisible(false);
      setCategoriaEditando(null);
    } catch (error) {
      console.error("Error al guardar categoría:", error);
      const mensaje = error.response?.data?.message || "Error al guardar la categoría. Por favor, intenta nuevamente.";
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
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Administrar Categorías</Text>
          <Text style={styles.subtitle}>
            Organiza tus productos en categorías y subcategorías jerárquicas
          </Text>
        </View>

        {/* Mostrar error si existe */}
        {error && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#d32f2f" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={cargarCategorias} style={styles.retryButton}>
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
                placeholder="Buscar categorías por nombre..."
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
            <TouchableOpacity 
              style={[styles.addButton, cargando && styles.addButtonDisabled]} 
              onPress={handleAgregarCategoria}
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
            <Text style={styles.loadingText}>Cargando categorías...</Text>
          </View>
        )}

        {/* DataGrid con filtrado y ordenamiento nativo */}
        {!cargando && (
          <DataTable
            rows={categoriasParaTabla}
            columns={columns}
            pageSize={10}
            rowHeight={52}
          />
        )}

        {/* Modal para agregar/editar categoría */}
        <CategoriaModal
          visible={modalVisible}
          categoria={categoriaEditando}
          onClose={() => {
            setModalVisible(false);
            setCategoriaEditando(null);
          }}
          onSave={handleGuardarCategoria}
        />

        {/* Modal de confirmación para eliminar */}
        <ConfirmModal
          visible={confirmModalVisible}
          title="Eliminar Categoría"
          message="¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer. Si la categoría tiene productos o subcategorías asociadas, no podrá ser eliminada."
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
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
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
  categoryNameCell: {
    height: '100%',
    justifyContent: 'center',
  },
  categoryNameText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  errorText: {
    flex: 1,
    color: '#d32f2f',
    fontSize: 14,
    marginLeft: 8,
  },
  retryButton: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addButtonDisabled: {
    backgroundColor: '#a5d6a7',
    opacity: 0.6,
  },
});
