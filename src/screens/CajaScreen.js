import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IconButton } from "@mui/material";
import DashboardLayout from "../components/layout/DashboardLayout";
import DataTable from "../components/DataTable";
import MovimientoCajaModal from "../components/MovimientoCajaModal";
import ConfirmModal from "../components/ConfirmModal";
import { useAuth } from "../context/AuthContext";

// Datos iniciales vacíos
const MOVIMIENTOS_INICIALES = [];

const STORAGE_KEY = "caja_movimientos";
const SALDO_KEY = "caja_saldo";

export default function CajaScreen({ onNavigate, currentScreen }) {
  const [movimientos, setMovimientos] = useState([]);
  const [saldoActual, setSaldoActual] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [movimientoEditando, setMovimientoEditando] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [movimientoAEliminar, setMovimientoAEliminar] = useState(null);
  const [cerrarCajaVisible, setCerrarCajaVisible] = useState(false);

  const { user, logout } = useAuth();
  const userName = user?.usuario || "Usuario";

  // Cargar movimientos y saldo desde localStorage
  useEffect(() => {
    const cargarDatos = () => {
      try {
        const movimientosGuardados = localStorage.getItem(STORAGE_KEY);
        if (movimientosGuardados) {
          setMovimientos(JSON.parse(movimientosGuardados));
        } else {
          setMovimientos(MOVIMIENTOS_INICIALES);
        }

        const saldoGuardado = localStorage.getItem(SALDO_KEY);
        if (saldoGuardado) {
          setSaldoActual(parseFloat(saldoGuardado));
        }
      } catch (error) {
        console.error("Error al cargar datos de caja:", error);
      }
    };

    cargarDatos();
  }, []);

  // Guardar movimientos en localStorage
  useEffect(() => {
    if (movimientos.length >= 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(movimientos));
        // Recalcular saldo
        const nuevoSaldo = calcularSaldo(movimientos);
        setSaldoActual(nuevoSaldo);
        localStorage.setItem(SALDO_KEY, nuevoSaldo.toString());
      } catch (error) {
        console.error("Error al guardar movimientos:", error);
      }
    }
  }, [movimientos]);

  // Calcular saldo basado en movimientos
  const calcularSaldo = (movs) => {
    return movs.reduce((total, mov) => {
      if (mov.tipo === "Ingreso" || mov.tipo === "Apertura") {
        return total + parseFloat(mov.monto);
      } else if (mov.tipo === "Egreso") {
        return total - parseFloat(mov.monto);
      }
      return total;
    }, 0);
  };

  // Definir columnas para DataGrid
  const columns = [
    {
      field: 'descripcion',
      headerName: 'Descripción',
      flex: 1,
      minWidth: 200,
      headerAlign: 'center',
      align: 'left',
    },
    {
      field: 'tipo',
      headerName: 'Tipo',
      width: 130,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        let color = '#666';
        let bgColor = '#f0f0f0';
        
        if (params.value === 'Ingreso') {
          color = '#2e7d32';
          bgColor = '#e8f5e9';
        } else if (params.value === 'Egreso') {
          color = '#c62828';
          bgColor = '#ffebee';
        } else if (params.value === 'Apertura') {
          color = '#1565c0';
          bgColor = '#e3f2fd';
        } else if (params.value === 'Cierre') {
          color = '#7b1fa2';
          bgColor = '#f3e5f5';
        }

        return (
          <View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
            <View style={[styles.tipoBadge, { backgroundColor: bgColor }]}>
              <Text style={[styles.tipoText, { color }]}>{params.value}</Text>
            </View>
          </View>
        );
      },
    },
    {
      field: 'monto',
      headerName: 'Monto',
      width: 130,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const row = params.row;
        const esCierre = row.tipo === 'Cierre';
        const esEgreso = row.tipo === 'Egreso';
        
        if (esCierre) {
          return (
            <Text style={{ color: '#7b1fa2', fontWeight: '600' }}>
              -
            </Text>
          );
        }
        
        const color = esEgreso ? '#c62828' : '#2e7d32';
        const signo = esEgreso ? '-' : '+';
        const numero = Number(params.value);
        const formateado = numero.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        return (
          <Text style={{ color, fontWeight: '600' }}>
            {signo}${formateado}
          </Text>
        );
      },
    },
    {
      field: 'fecha',
      headerName: 'Fecha y Hora',
      width: 170,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'responsable',
      headerName: 'Responsable',
      width: 130,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: "acciones",
      headerName: "Acciones",
      width: 100,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: (params) => (
        <View style={{ flexDirection: "row", gap: 4, height: "100%", justifyContent: "center", alignItems: "center" }}>
          <IconButton
            size="small"
            onClick={() => handleEliminarMovimiento(params.row)}
            style={{ color: "#d32f2f" }}
          >
            <MaterialCommunityIcons name="delete" size={18} />
          </IconButton>
        </View>
      ),
    },
  ];

  // Filtrar movimientos según búsqueda
  const movimientosFiltrados = movimientos.filter(mov =>
    mov.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
    mov.tipo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    mov.responsable?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleNuevoMovimiento = () => {
    setMovimientoEditando(null);
    setModalVisible(true);
  };

  const handleEliminarMovimiento = (movimiento) => {
    setMovimientoAEliminar(movimiento);
    setConfirmVisible(true);
  };

  const confirmarEliminar = () => {
    if (movimientoAEliminar) {
      const nuevosMovimientos = movimientos.filter(
        (mov) => mov.id !== movimientoAEliminar.id
      );
      setMovimientos(nuevosMovimientos);
      setConfirmVisible(false);
      setMovimientoAEliminar(null);
    }
  };

  const handleGuardarMovimiento = (movimiento) => {
    let nuevosMovimientos;
    if (movimientoEditando) {
      // Editar movimiento existente
      nuevosMovimientos = movimientos.map((mov) =>
        mov.id === movimiento.id ? movimiento : mov
      );
    } else {
      // Agregar nuevo movimiento
      nuevosMovimientos = [...movimientos, movimiento];
    }
    setMovimientos(nuevosMovimientos);
  };

  const handleCerrarCaja = () => {
    setCerrarCajaVisible(true);
  };

  const confirmarCerrarCaja = () => {
    const now = new Date();
    const fecha = now.toLocaleDateString('es-UY', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }) + ' ' + now.toLocaleTimeString('es-UY', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Crear movimiento de cierre (con monto 0 para no afectar el saldo)
    const movimientoCierre = {
      id: Date.now(),
      tipoTransaccion: "Cierre de Caja",
      numeroFactura: "",
      descripcion: `Cierre de Caja - Saldo Final: $${saldoActual.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      tipo: "Cierre", // Nuevo tipo para identificar cierres
      monto: 0, // Monto 0 para no afectar el cálculo del saldo
      fecha: fecha,
      responsable: user?.usuario || "Usuario",
    };

    // Agregar el movimiento de cierre
    const nuevosMovimientos = [...movimientos, movimientoCierre];
    setMovimientos(nuevosMovimientos);

    // Guardar en localStorage con un indicador de caja cerrada
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevosMovimientos));
    localStorage.setItem("caja_cerrada", "true");
    localStorage.setItem("fecha_cierre", fecha);

    setCerrarCajaVisible(false);
  };

  return (
    <DashboardLayout 
      onNavigate={onNavigate} 
      currentScreen={currentScreen}
      userName={userName}
      onLogout={logout}
    >
      <View style={styles.container}>
        {/* Header con Estado de Caja */}
        <View style={styles.headerCard}>
          <View style={styles.saldoContainer}>
            <Text style={styles.saldoLabel}>Estado de la Caja</Text>
            <Text style={styles.saldoSubtitle}>
              Caja abierta el {new Date().toLocaleDateString('es-UY')} a las {new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={styles.saldoMonto}>
              ${saldoActual.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.saldoActualLabel}>Saldo actual</Text>
          </View>
          
          <View style={styles.botonesContainer}>
            <TouchableOpacity style={styles.nuevoButton} onPress={handleNuevoMovimiento}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.nuevoButtonText}>Nuevo Movimiento</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cerrarButton} onPress={handleCerrarCaja}>
              <MaterialCommunityIcons name="lock" size={20} color="#fff" />
              <Text style={styles.cerrarButtonText}>Cerrar Caja</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección de Movimientos Recientes */}
        <View style={styles.movimientosSection}>
          <View style={styles.movimientosHeader}>
            <View>
              <Text style={styles.movimientosTitle}>Movimientos Recientes</Text>
              <Text style={styles.movimientosSubtitle}>
                Últimos movimientos registrados en la caja
              </Text>
            </View>

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
                placeholder="Buscar movimientos..."
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
          </View>

          {/* Tabla de Movimientos */}
          <DataTable
            rows={movimientosFiltrados}
            columns={columns}
            pageSize={10}
          />
        </View>

        {/* Modal de Movimiento */}
        <MovimientoCajaModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setMovimientoEditando(null);
          }}
          onSave={handleGuardarMovimiento}
          movimiento={movimientoEditando}
          responsable={user?.usuario || "Usuario"}
        />

        {/* Modal de Confirmación */}
        <ConfirmModal
          visible={confirmVisible}
          onClose={() => {
            setConfirmVisible(false);
            setMovimientoAEliminar(null);
          }}
          onConfirm={confirmarEliminar}
          title="Eliminar Movimiento"
          message={`¿Estás seguro de eliminar el movimiento "${movimientoAEliminar?.descripcion}"? Esta acción no se puede deshacer.`}
        />

        {/* Modal de Cierre de Caja */}
        <ConfirmModal
          visible={cerrarCajaVisible}
          onClose={() => setCerrarCajaVisible(false)}
          onConfirm={confirmarCerrarCaja}
          title="Cerrar Caja"
          message={`¿Estás seguro de cerrar la caja?\n\nSaldo actual: $${saldoActual.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\nSe generará un movimiento de cierre con el saldo final.`}
          confirmText="Confirmar"
          confirmIcon="lock-check"
          confirmColor="#d32f2f"
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
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saldoContainer: {
    flex: 1,
  },
  saldoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  saldoSubtitle: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
  },
  saldoMonto: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1f1f1f",
    marginBottom: 4,
  },
  saldoActualLabel: {
    fontSize: 12,
    color: "#999",
  },
  botonesContainer: {
    flexDirection: "row",
    gap: 12,
  },
  nuevoButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nuevoButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  cerrarButton: {
    backgroundColor: "#f44336",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cerrarButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  movimientosSection: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  movimientosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  movimientosTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f1f1f",
    marginBottom: 4,
  },
  movimientosSubtitle: {
    fontSize: 13,
    color: "#999",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    width: 300,
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
  clearButton: {
    padding: 4,
  },
  tipoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tipoText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: 'center',
  },
});
