import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IconButton, Select, MenuItem, FormControl } from "@mui/material";
import DashboardLayout from "../components/layout/DashboardLayout";
import CategoriaModal from "../components/CategoriaModal";
import DataTable from "../components/DataTable";
import { useAuth } from "../context/AuthContext";
import * as categoriasService from "../services/categoriasService";
import Alert from "@blazejkustra/react-native-alert";

export default function CategoriasScreen({ onNavigate, currentScreen }) {
  const [categorias, setCategorias] = useState([]);
  const [categoriasPlanas, setCategoriasPlanas] = useState([]);
  const [categoriasTodas, setCategoriasTodas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const userName = user?.usuario || "Usuario";

    useEffect(() => {
    cargarCategorias();
  }, []);

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
        const treeData = response.data.tree || response.data;
        const flatData = response.data.flat || [];
        
        setCategorias(treeData);
        
                const mapaCategorias = {};
        flatData.forEach(cat => {
          mapaCategorias[cat.id] = cat;
        });
        const planas = flatData.map(cat => {
          const nivel = calcularNivel(cat.idCatPadre, mapaCategorias, 0);
          const indentacion = "  ".repeat(nivel);
          return {
            id: cat.id,
            nombre: cat.nombre,
            nombreConIndentacion: nivel > 0 ? `${indentacion}└ ${cat.nombre}` : cat.nombre,
            idCatPadre: cat.idCatPadre,
            nivel: nivel,
            habilitar: cat.habilitar ?? 1,
          };
        });
        planas.sort((a, b) => {
          if (a.nivel !== b.nivel) return a.nivel - b.nivel;
          return a.nombre.localeCompare(b.nombre);
        });
        
        setCategoriasPlanas(planas);
        
                setCategoriasTodas(flatData);
      }
    } catch (error) {
      setError("Error al cargar las categorías. Por favor, intenta nuevamente.");
      Alert.alert("Error", "No se pudieron cargar las categorías del servidor.");
    } finally {
      setCargando(false);
    }
  };
  
    const calcularNivel = (idPadre, mapa, nivelActual) => {
    if (!idPadre) return 0;
    const padre = mapa[idPadre];
    if (!padre) return 0;
    return 1 + calcularNivel(padre.idCatPadre, mapa, nivelActual);
  };

    const categoriasFiltradas = categoriasPlanas.filter((categoria) => {
    const terminoBusqueda = busqueda.toLowerCase().trim();
    if (terminoBusqueda) {
      if (!categoria.nombre.toLowerCase().includes(terminoBusqueda)) {
        return false;
      }
    }

    return true;
  });

    const mapaCategorias = {};
  categoriasTodas.forEach(cat => {
    mapaCategorias[cat.id] = cat;
  });
  const categoriasParaTabla = categoriasFiltradas.map(cat => {
    const idPadre = cat.idCatPadre;
    
    let nombrePadre = 'Raíz';
    if (idPadre && mapaCategorias[idPadre]) {
      nombrePadre = mapaCategorias[idPadre].nombre;
    }
    
    return {
      ...cat,
      idCatPadre: idPadre,
      nombrePadre: nombrePadre,
    };
  });
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
      field: 'estado',
      headerName: 'Estado',
      width: 100,
      sortable: true,
      valueGetter: (value, row) => row?.habilitar ? "Activo" : "Inactivo",
      filterOperators: [
        {
          label: "es",
          value: "is",
          requiresFilterValue: false,
          getApplyFilterFn: (filterItem) => {
            if (!filterItem.value || filterItem.value === "") {
              return null;
            }
            return (value) => {
              return value === filterItem.value;
            };
          },
          InputComponent: function EstadoFilterInput({ item, applyValue, focusRef }) {
            return (
              <FormControl sx={{ minWidth: 120 }}>
                <Select
                  size="small"
                  value={item.value || ""}
                  onChange={(e) => applyValue({ ...item, value: e.target.value })}
                  inputRef={focusRef}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="Activo">Activo</MenuItem>
                  <MenuItem value="Inactivo">Inactivo</MenuItem>
                </Select>
              </FormControl>
            );
          },
        },
      ],
      renderCell: (params) => {
        const habilitado = params.row.habilitar;
        return (
          <TouchableOpacity
            onPress={() => handleToggleCategoria(params.row)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: habilitado ? "#e8f5e9" : "#ffebee",
              borderWidth: 1,
              borderColor: habilitado ? "#4CAF50" : "#f44336",
            }}
          >
            <Text style={{
              color: habilitado ? "#2e7d32" : "#c62828",
              fontSize: 12,
              fontWeight: "600",
            }}>
              {habilitado ? "Activo" : "Inactivo"}
            </Text>
          </TouchableOpacity>
        );
      },
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          onClick={() => handleEditarCategoria(params.row)}
          color="primary"
          size="small"
          title="Editar"
        >
          <MaterialCommunityIcons name="pencil" size={20} color="#1976d2" />
        </IconButton>
      ),
    },
  ];

  const handleAgregarCategoria = () => {
    setCategoriaEditando(null);
    setModalVisible(true);
  };

  const handleEditarCategoria = (categoria) => {
        const categoriaCompleta = encontrarCategoriaEnArbol(categorias, categoria.id);
    setCategoriaEditando(categoriaCompleta || categoria);
    setModalVisible(true);
  };

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

    const handleToggleCategoria = async (categoriaRow) => {
    try {
      setCargando(true);
      const response = await categoriasService.toggleCategoria(categoriaRow.id);
      await cargarCategorias();
      
      const nuevoEstado = response.data?.habilitar === 1 ? "habilitada" : "deshabilitada";
      Alert.alert("Éxito", `Categoría ${nuevoEstado} correctamente.`);
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "No se pudo cambiar el estado de la categoría."
      );
    } finally {
      setCargando(false);
    }
  };

  const handleGuardarCategoria = async (categoriaData) => {
    try {
      setCargando(true);
      
      if (categoriaEditando) {
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
        
        <View style={styles.header}>
          <Text style={styles.title}>Administrar Categorías</Text>
          <Text style={styles.subtitle}>
            Organiza tus productos en categorías y subcategorías jerárquicas
          </Text>
        </View>

        
        {error && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#d32f2f" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={cargarCategorias} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        
        <View style={styles.controlsContainer}>
          <View style={styles.controlsRow}>
            
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

        
        {cargando && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Cargando categorías...</Text>
          </View>
        )}

        
        {!cargando && (
          <DataTable
            rows={categoriasParaTabla}
            columns={columns}
            pageSize={10}
            rowHeight={52}
          />
        )}

        
        <CategoriaModal
          visible={modalVisible}
          categoria={categoriaEditando}
          onClose={() => {
            setModalVisible(false);
            setCategoriaEditando(null);
          }}
          onSave={handleGuardarCategoria}
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
