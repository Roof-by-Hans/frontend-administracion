import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IconButton } from "@mui/material";
import Alert from "@blazejkustra/react-native-alert";
import DashboardLayout from "../components/layout/DashboardLayout";
import DataTable from "../components/DataTable";
import MovimientoCajaModal from "../components/MovimientoCajaModal";
import AperturaCajaModal from "../components/AperturaCajaModal";
import CierreCajaModal from "../components/CierreCajaModal";
import { useAuth } from "../context/AuthContext";
import cajaService from "../services/cajaService";

export default function CajaScreen({ onNavigate, currentScreen }) {
  // Estado de la Caja
  const [loading, setLoading] = useState(true);
  const [cajaActual, setCajaActual] = useState(null); // Objeto caja del backend
  const [movimientos, setMovimientos] = useState([]);
  
  // Totales calculados
  const [totales, setTotales] = useState({
    ingresos: 0,
    egresos: 0,
    saldo: 0,
  });

  // Filtros y UI
  const [busqueda, setBusqueda] = useState("");
  
  // Modales
  const [modalMovimientoVisible, setModalMovimientoVisible] = useState(false);
  const [modalAperturaVisible, setModalAperturaVisible] = useState(false);
  const [modalCierreVisible, setModalCierreVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { user, logout } = useAuth();
  const userName = user?.usuario || "Usuario";

  // Cargar datos iniciales
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cajaService.obtenerCajaActual();
      setCajaActual(data);

      if (data && data.estado === "ABIERTA") {
        // Cargar movimientos recientes
        const movs = await cajaService.obtenerMovimientos(data.id);
        setMovimientos(movs || []);
        
        // Actualizar totales desde la respuesta del backend (data.totales)
        if (data.totales) {
            setTotales({
                ingresos: parseFloat(data.totales.ingresos || 0),
                egresos: parseFloat(data.totales.egresos || 0),
                saldo: parseFloat(data.totales.montoEsperado || 0) // Monto inicial + (Ing - Egr + Ajustes)
            });
        }
      } else {
        setMovimientos([]);
        setTotales({ ingresos: 0, egresos: 0, saldo: 0 });
      }
    } catch (error) {
      console.error("Error al cargar caja:", error);
      // Podríamos mostrar un toast de error aquí
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Manejadores de Acciones
  const handleAbrirCaja = async (montoInicial) => {
    try {
      setActionLoading(true);
      await cajaService.abrirCaja(montoInicial);
      setModalAperturaVisible(false);
      await cargarDatos(); // Recargar todo
    } catch (error) {
      Alert.alert("Error", error.message || "Error al abrir la caja");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCerrarCaja = async (datosCierre) => {
    try {
      setActionLoading(true);
      const resultado = await cajaService.cerrarCaja(datosCierre);
      
      setModalCierreVisible(false);
      
      // Mostrar resumen de auditoría (opcional)
      const diferencia = resultado.auditoria?.diferencia || 0;
      let mensaje = "Caja cerrada correctamente.";
      if (diferencia !== 0) {
        mensaje += `\n\nDiferencia detectada: $${diferencia > 0 ? '+' : ''}${diferencia}`;
      }
      Alert.alert("Éxito", mensaje);

      await cargarDatos(); // Recargar para mostrar estado "CERRADA"
    } catch (error) {
      Alert.alert("Error", error.message || "Error al cerrar la caja");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGuardarMovimiento = async (movimientoData) => {
    try {
      setActionLoading(true);
      await cajaService.registrarMovimientoManual(movimientoData);
      setModalMovimientoVisible(false);
      await cargarDatos(); // Recargar movimientos y saldos
    } catch (error) {
      Alert.alert("Error", error.message || "Error al registrar movimiento");
    } finally {
      setActionLoading(false);
    }
  };

  // Definir columnas para DataGrid
  const columns = [
    {
      field: 'concepto', // Backend devuelve 'concepto'
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
        const tipo = params.value?.toUpperCase();
        
        if (tipo === 'INGRESO') {
          color = '#2e7d32';
          bgColor = '#e8f5e9';
        } else if (tipo === 'EGRESO') {
          color = '#c62828';
          bgColor = '#ffebee';
        } else if (tipo === 'APERTURA') {
          color = '#1565c0';
          bgColor = '#e3f2fd';
        } else if (tipo === 'CIERRE') {
          color = '#7b1fa2';
          bgColor = '#f3e5f5';
        } else if (tipo === 'AJUSTE') {
          color = '#ef6c00';
          bgColor = '#fff3e0';
        }

        return (
          <View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
            <View style={[styles.tipoBadge, { backgroundColor: bgColor }]}>
              <Text style={[styles.tipoText, { color }]}>{tipo}</Text>
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
        const tipo = row.tipo?.toUpperCase();
        const esEgreso = tipo === 'EGRESO';
        
        // Colores
        let color = '#333';
        if (tipo === 'INGRESO' || tipo === 'APERTURA') color = '#2e7d32';
        if (esEgreso) color = '#c62828';
        if (tipo === 'AJUSTE') color = '#ef6c00';

        const signo = esEgreso ? '-' : '';
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
      field: 'fecha', // Backend devuelve ISO string
      headerName: 'Fecha y Hora',
      width: 170,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const date = new Date(params.value);
        return (
            <Text>
                {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        )
      }
    },
  ];

  // Filtrar movimientos según búsqueda
  const movimientosFiltrados = movimientos.filter(mov =>
    mov.concepto?.toLowerCase().includes(busqueda.toLowerCase()) ||
    mov.tipo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const cajaAbierta = cajaActual && cajaActual.estado === "ABIERTA";

  if (loading) {
    return (
      <DashboardLayout onNavigate={onNavigate} currentScreen={currentScreen} userName={userName} onLogout={logout}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#1976d2" />
        </View>
      </DashboardLayout>
    );
  }

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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={styles.saldoLabel}>Estado de la Caja</Text>
                <View style={[styles.statusBadge, { backgroundColor: cajaAbierta ? '#e8f5e9' : '#ffebee' }]}>
                    <Text style={[styles.statusText, { color: cajaAbierta ? '#2e7d32' : '#c62828' }]}>
                        {cajaAbierta ? "ABIERTA" : "CERRADA"}
                    </Text>
                </View>
            </View>
            
            {cajaAbierta ? (
                <>
                    <Text style={styles.saldoSubtitle}>
                    Abierta el {new Date(cajaActual.fechaApertura).toLocaleDateString()} a las {new Date(cajaActual.fechaApertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {cajaActual.nombreCreador && (
                      <Text style={styles.creadoPorText}>
                        Por: {cajaActual.nombreCreador}
                      </Text>
                    )}
                    <Text style={styles.saldoMonto}>
                    ${totales.saldo.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.saldoActualLabel}>Saldo esperado en caja</Text>
                </>
            ) : (
                <>
                    <Text style={styles.saldoSubtitle}>
                        La caja se encuentra cerrada actualmente.
                    </Text>
                    {cajaActual && cajaActual.fecha && (
                         <Text style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                            Último cierre: {new Date(cajaActual.fecha).toLocaleDateString()}
                            {cajaActual.montoFinal != null ? ` - Saldo final: $${parseFloat(cajaActual.montoFinal).toLocaleString()}` : ''}
                        </Text>
                    )}
                </>
            )}
          </View>
          
          <View style={styles.botonesContainer}>
            {!cajaAbierta ? (
                 <TouchableOpacity style={styles.abrirButton} onPress={() => setModalAperturaVisible(true)}>
                    <MaterialCommunityIcons name="store-clock-outline" size={20} color="#fff" />
                    <Text style={styles.nuevoButtonText}>ABRIR CAJA</Text>
                </TouchableOpacity>
            ) : (
                <>
                    <TouchableOpacity style={styles.nuevoButton} onPress={() => setModalMovimientoVisible(true)}>
                    <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                    <Text style={styles.nuevoButtonText}>Nuevo Movimiento</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.cerrarButton} onPress={() => setModalCierreVisible(true)}>
                    <MaterialCommunityIcons name="lock" size={20} color="#fff" />
                    <Text style={styles.cerrarButtonText}>Cerrar Caja</Text>
                    </TouchableOpacity>
                </>
            )}
           
          </View>
        </View>

        {/* Desglose de Medios de Pago (Nuevo) */}
        {cajaAbierta && cajaActual?.desglose && cajaActual.desglose.length > 0 && (
          <View style={styles.desgloseCard}>
             <Text style={styles.desgloseTitle}>Desglose por Medio de Pago</Text>
             <View style={styles.desgloseGrid}>
                {cajaActual.desglose.map((item, index) => (
                  <View key={index} style={styles.desgloseItem}>
                     <Text style={styles.desgloseLabel}>{item.metodo}</Text>
                     <Text style={styles.desgloseValue}>
                       ${(parseFloat(item.total_ingreso) - parseFloat(item.total_egreso)).toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </Text>
                  </View>
                ))}
             </View>
          </View>
        )}

        {/* Sección de Movimientos Recientes */}
        {cajaAbierta ? (
            <View style={styles.movimientosSection}>
            <View style={styles.movimientosHeader}>
                <View>
                <Text style={styles.movimientosTitle}>Movimientos del Día</Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                     <Text style={[styles.movimientosSubtitle, { color: '#2e7d32' }]}>
                        Ingresos: ${totales.ingresos.toLocaleString()}
                    </Text>
                    <Text style={[styles.movimientosSubtitle, { color: '#c62828' }]}>
                        Egresos: ${totales.egresos.toLocaleString()}
                    </Text>
                </View>
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
        ) : (
            <View style={styles.emptyState}>
                 <MaterialCommunityIcons name="cash-register" size={64} color="#e0e0e0" />
                 <Text style={styles.emptyStateText}>
                    Abre la caja para comenzar a registrar operaciones
                 </Text>
            </View>
        )}

        {/* Modales */}
        <MovimientoCajaModal
          visible={modalMovimientoVisible}
          onClose={() => setModalMovimientoVisible(false)}
          onSave={handleGuardarMovimiento}
          loading={actionLoading}
        />

        <AperturaCajaModal 
            visible={modalAperturaVisible}
            onClose={() => setModalAperturaVisible(false)}
            onConfirm={handleAbrirCaja}
            loading={actionLoading}
        />

        <CierreCajaModal 
            visible={modalCierreVisible}
            onClose={() => setModalCierreVisible(false)}
            onConfirm={handleCerrarCaja}
            loading={actionLoading}
            saldoSistema={totales.saldo}
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
  },
  saldoSubtitle: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  creadoPorText: {
    fontSize: 12,
    color: "#1976d2",
    fontWeight: "600",
    marginBottom: 8,
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
  statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
  },
  statusText: {
      fontSize: 12,
      fontWeight: 'bold',
  },
  botonesContainer: {
    flexDirection: "row",
    gap: 12,
  },
  abrirButton: {
    backgroundColor: "#1976d2",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    shadowColor: "#1976d2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    fontWeight: '600',
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
  emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: 0.7,
  },
  emptyStateText: {
      marginTop: 16,
      fontSize: 16,
      color: '#9e9e9e',
      fontWeight: '500'
  },
  desgloseCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  desgloseTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f1f1f",
    marginBottom: 16,
  },
  desgloseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  desgloseItem: {
    minWidth: 120,
  },
  desgloseLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  desgloseValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f1f1f",
  }
});
