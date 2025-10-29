import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Alert, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Defs, Pattern, Rect, Line } from "react-native-svg";
import DashboardLayout from "../components/layout/DashboardLayout";
import Mesa from "../components/Mesa";
import MesaModal from "../components/MesaModal";
import GestionarMesasModal from "../components/GestionarMesasModal";
import { useAuth } from "../context/AuthContext";
import mesasService from "../services/mesasService";

// Fondo cuadriculado
const GridBackground = ({ width, height }) => {
  const gridSize = 30;
  return (
    <Svg height={height || "100%"} width={width || "100%"} style={StyleSheet.absoluteFill}>
      <Defs>
        <Pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
          <Line x1="0" y1="0" x2={gridSize} y2="0" stroke="#d8d8d8" strokeWidth="0.5" />
          <Line x1="0" y1="0" x2="0" y2={gridSize} stroke="#d8d8d8" strokeWidth="0.5" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#grid)" />
    </Svg>
  );
};

export default function MesasScreen({ onNavigate, currentScreen }) {
  const [mesas, setMesas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [modoActivo, setModoActivo] = useState(null);
  const [mesasSeleccionadas, setMesasSeleccionadas] = useState([]);
  const [gestionModalVisible, setGestionModalVisible] = useState(false);
  const [salonDimensions, setSalonDimensions] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  
  const { user, logout } = useAuth();
  const displayName = user?.usuario || "Usuario";
  const { width } = useWindowDimensions();
  const isCompact = width < 768;

  // Cargar mesas desde el backend
  const cargarMesas = useCallback(async () => {
    try {
      setLoading(true);
      const mesasData = await mesasService.getMesas();
      console.log('✅ Mesas cargadas:', mesasData);
      
      // Transformar datos del backend al formato local
      const mesasTransformadas = mesasData.map((mesa, index) => ({
        numero: mesa.idMesa,
        nombre: mesa.nombreMesa,
        estado: "libre", // Por ahora todas libres, puedes agregar lógica para determinar estado
        posicion: { 
          x: 50 + (index % 5) * 130, 
          y: 50 + Math.floor(index / 5) * 130 
        },
        unidaCon: [], // Se llenará con la lógica de grupos
        pedido: null,
        grupo: mesa.grupo || null
      }));
      
      setMesas(mesasTransformadas);
    } catch (error) {
      console.error('❌ Error al cargar mesas:', error);
      Alert.alert('Error', 'No se pudieron cargar las mesas del servidor');
      setMesas([]); // Mantener vacío en caso de error
    } finally {
      setLoading(false);
    }
  }, []);

  // Conectar WebSocket y configurar listeners
  useEffect(() => {
    let mounted = true;

    const setupWebSocket = async () => {
      try {
        // Conectar WebSocket
        await mesasService.connect();
        
        if (!mounted) return;
        
        setWsConnected(mesasService.isConnected());

        // Cargar mesas iniciales
        await cargarMesas();

        // Configurar listeners de WebSocket
        mesasService.onMesaCreada((data) => {
          console.log('🆕 Nueva mesa creada:', data);
          cargarMesas(); // Recargar todas las mesas
        });

        mesasService.onMesaActualizada((data) => {
          console.log('🔄 Mesa actualizada:', data);
          setMesas(prevMesas => 
            prevMesas.map(mesa => 
              mesa.numero === data.idMesa 
                ? { ...mesa, nombre: data.nombreMesa, grupo: data.grupo }
                : mesa
            )
          );
        });

        mesasService.onMesaEstadoCambiado((data) => {
          console.log('🔄 Estado de mesa cambió:', data);
          // Aquí puedes actualizar el estado de la mesa si el backend lo envía
          cargarMesas();
        });

        mesasService.onMesaEliminada((data) => {
          console.log('🗑️ Mesa eliminada:', data);
          setMesas(prevMesas => prevMesas.filter(mesa => mesa.numero !== data.idMesa));
        });

        mesasService.onMesasActualizar(() => {
          console.log('🔄 Recargando todas las mesas...');
          cargarMesas();
        });

      } catch (error) {
        console.error('❌ Error al configurar WebSocket:', error);
        if (mounted) {
          setWsConnected(false);
        }
      }
    };

    setupWebSocket();

    // Cleanup al desmontar
    return () => {
      mounted = false;
      mesasService.removeAllListeners();
      // No desconectamos aquí para mantener la conexión activa en otras pantallas
    };
  }, [cargarMesas]);

  const TAMANO_MESA = 80;
  const MARGEN_SEGURIDAD = 20; // Margen inferior y derecho

  // Verificar si dos mesas se superponen
  const verificarColision = (pos1, pos2, tamano = 80) => {
    return (
      pos1.x < pos2.x + tamano &&
      pos1.x + tamano > pos2.x &&
      pos1.y < pos2.y + tamano &&
      pos1.y + tamano > pos2.y
    );
  };

  const handlePosicionChange = (numero, nuevaPosicion) => {
    // Aplicar límites de zona segura
    const limiteX = salonDimensions.width > 0 
      ? salonDimensions.width - TAMANO_MESA - MARGEN_SEGURIDAD 
      : 9999;
    const limiteY = salonDimensions.height > 0 
      ? salonDimensions.height - TAMANO_MESA - MARGEN_SEGURIDAD 
      : 9999;

    const posicionLimitada = {
      x: Math.max(0, Math.min(nuevaPosicion.x, limiteX)),
      y: Math.max(0, Math.min(nuevaPosicion.y, limiteY))
    };

    // Verificar si la nueva posición colisiona con alguna otra mesa
    const hayColision = mesas.some(mesa => 
      mesa.numero !== numero && verificarColision(posicionLimitada, mesa.posicion)
    );

    // Solo actualizar si no hay colisión
    if (!hayColision) {
      setMesas(prev => prev.map(m => m.numero === numero ? { ...m, posicion: posicionLimitada } : m));
    }
  };

  const handleMesaPress = (numero) => {
    if (modoActivo === 'unir' || modoActivo === 'separar') {
      setMesasSeleccionadas(prev => prev.includes(numero) ? prev.filter(n => n !== numero) : [...prev, numero]);
      return;
    }
    if (!modoActivo) {
      const mesa = mesas.find(m => m.numero === numero);
      setMesaSeleccionada(mesa);
      setModalVisible(true);
    }
  };

  const activarModo = (modo) => {
    setModoActivo(prev => prev === modo ? null : modo);
    setMesasSeleccionadas([]);
  };

  const unirMesas = (numeros) => {
    const ordenadas = [...numeros].sort((a, b) => a - b);
    setMesas(prev => {
      const base = prev.find(m => m.numero === ordenadas[0]);
      let basePos = base?.posicion || { x: 50, y: 50 };
      const ancho = TAMANO_MESA, espacio = 10;
      
      // Calcular el ancho total del grupo de mesas
      const anchoTotal = (ordenadas.length * ancho) + ((ordenadas.length - 1) * espacio);
      
      // Verificar límites del salón
      const limiteX = salonDimensions.width > 0 
        ? salonDimensions.width - MARGEN_SEGURIDAD 
        : 9999;
      
      // Ajustar posición base si el grupo se sale por la derecha
      if (basePos.x + anchoTotal > limiteX) {
        basePos = { 
          x: Math.max(0, limiteX - anchoTotal),
          y: basePos.y 
        };
      }

      // Calcular posiciones para cada mesa
      const nuevasPosiciones = ordenadas.map((numero, index) => ({
        numero,
        posicion: { 
          x: basePos.x + index * (ancho + espacio), 
          y: basePos.y 
        }
      }));

      // Verificar que ninguna posición colisiona con mesas NO seleccionadas
      const mesasNoSeleccionadas = prev.filter(m => !ordenadas.includes(m.numero));
      let hayColisionConOtras = false;

      for (const nuevaPos of nuevasPosiciones) {
        for (const mesaExterna of mesasNoSeleccionadas) {
          if (verificarColision(nuevaPos.posicion, mesaExterna.posicion)) {
            hayColisionConOtras = true;
            break;
          }
        }
        if (hayColisionConOtras) break;
      }

      // Si hay colisión, buscar una posición alternativa
      if (hayColisionConOtras) {
        // Intentar mover el grupo hacia abajo
        let nuevaY = basePos.y;
        let encontrado = false;
        
        for (let intento = 0; intento < 10; intento++) {
          nuevaY += (ancho + espacio);
          
          // Verificar que no se salga por abajo
          const limiteY = salonDimensions.height > 0 
            ? salonDimensions.height - TAMANO_MESA - MARGEN_SEGURIDAD 
            : 9999;
          
          if (nuevaY > limiteY) break;
          
          // Recalcular posiciones con nueva Y
          const posicionesPrueba = ordenadas.map((numero, index) => ({
            numero,
            posicion: { x: basePos.x + index * (ancho + espacio), y: nuevaY }
          }));
          
          // Verificar colisiones
          let colision = false;
          for (const pos of posicionesPrueba) {
            for (const mesaExt of mesasNoSeleccionadas) {
              if (verificarColision(pos.posicion, mesaExt.posicion)) {
                colision = true;
                break;
              }
            }
            if (colision) break;
          }
          
          if (!colision) {
            // Encontramos posición válida
            basePos = { x: basePos.x, y: nuevaY };
            encontrado = true;
            break;
          }
        }
        
        if (!encontrado) {
          Alert.alert("⚠️ Advertencia", "No hay suficiente espacio para unir estas mesas. Intenta moverlas primero.");
          return prev; // No hacer nada
        }
      }

      // Buscar si alguna mesa del grupo está ocupada y tiene pedido
      const mesaConPedido = prev.find(m => ordenadas.includes(m.numero) && m.estado === "ocupada" && m.pedido);
      const pedidoCompartido = mesaConPedido ? mesaConPedido.pedido : null;

      // Aplicar las posiciones calculadas
      const actualizadas = prev.map(m => {
        const mesaPos = nuevasPosiciones.find(np => np.numero === m.numero);
        if (!mesaPos) return m;
        
        const nuevasUniones = ordenadas.filter(n => n !== m.numero);
        return {
          ...m,
          posicion: mesaPos.posicion,
          unidaCon: nuevasUniones,
          estado: pedidoCompartido ? "ocupada" : m.estado,
          pedido: pedidoCompartido || m.pedido,
        };
      });

      return actualizadas;
    });
    Alert.alert("✅ Mesas unidas", `Mesas ${numeros.join(", ")} unidas correctamente`);
  };

  const confirmarUnir = () => {
    if (mesasSeleccionadas.length < 2)
      return Alert.alert("Error", "Selecciona al menos 2 mesas");
    unirMesas(mesasSeleccionadas);
    setModoActivo(null);
    setMesasSeleccionadas([]);
  };

  const confirmarSeparar = () => {
    if (!mesasSeleccionadas.length)
      return Alert.alert("Error", "Selecciona al menos 1 mesa");
    setMesas(prev => prev.map(m => ({
      ...m,
      unidaCon: m.unidaCon.filter(n => !mesasSeleccionadas.includes(n)),
    })));
    Alert.alert("✅ Mesas separadas", "Se separaron correctamente");
    setModoActivo(null);
    setMesasSeleccionadas([]);
  };

  const handleIniciarPedido = (numero) => {
    setMesas(prevMesas => {
      // Encontrar la mesa y sus uniones
      const mesaActual = prevMesas.find(m => m.numero === numero);
      const mesasDelGrupo = [numero, ...(mesaActual.unidaCon || [])];
      
      const pedidoCompartido = {
        mozo: displayName,
        horaInicio: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        comensales: 0,
        items: []
      };
      
      // Aplicar el pedido a todas las mesas del grupo
      return prevMesas.map(mesa => 
        mesasDelGrupo.includes(mesa.numero)
          ? { ...mesa, estado: "ocupada", pedido: pedidoCompartido }
          : mesa
      );
    });
    
    const mesaActual = mesas.find(m => m.numero === numero);
    const cantidadMesas = 1 + (mesaActual.unidaCon?.length || 0);
    
    Alert.alert(
      "✅ Pedido iniciado", 
      cantidadMesas > 1 
        ? `Pedido iniciado para ${cantidadMesas} mesas unidas`
        : `Mesa ${numero} ahora está ocupada`
    );
  };

  const handleLimpiarMesa = (numero) => {
    setMesas(prevMesas => {
      // Encontrar la mesa y sus uniones
      const mesaActual = prevMesas.find(m => m.numero === numero);
      const mesasDelGrupo = [numero, ...(mesaActual.unidaCon || [])];
      
      // Limpiar TODAS las mesas del grupo y separar las uniones
      return prevMesas.map(mesa => {
        if (mesasDelGrupo.includes(mesa.numero)) {
          // Limpiar esta mesa del grupo
          return {
            ...mesa,
            estado: "libre",
            pedido: null,
            unidaCon: []
          };
        }
        // Si otras mesas tienen unión con alguna del grupo, limpiar esas referencias
        if (mesa.unidaCon.some(n => mesasDelGrupo.includes(n))) {
          return {
            ...mesa,
            unidaCon: mesa.unidaCon.filter(n => !mesasDelGrupo.includes(n))
          };
        }
        return mesa;
      });
    });
    
    const mesaActual = mesas.find(m => m.numero === numero);
    const cantidadMesas = 1 + (mesaActual.unidaCon?.length || 0);
    
    Alert.alert(
      "✅ Mesa limpiada", 
      cantidadMesas > 1 
        ? `Se liberaron ${cantidadMesas} mesas y se separaron`
        : `Mesa ${numero} ahora está libre`
    );
  };

  const handleAgregarMesa = async (nombreMesa) => {
    try {
      // Crear mesa en el backend
      const mesaCreada = await mesasService.createMesa(nombreMesa);
      console.log('✅ Mesa creada en backend:', mesaCreada);
      
      // Buscar una posición libre automáticamente
      const TAMANO_MESA = 80;
      const ESPACIO = 30;
      const COLUMNAS = 5;
      
      let posicionEncontrada = null;
      
      // Intentar posiciones en una cuadrícula
      for (let fila = 0; fila < 10; fila++) {
        for (let col = 0; col < COLUMNAS; col++) {
          const nuevaPos = {
            x: 50 + col * (TAMANO_MESA + ESPACIO),
            y: 50 + fila * (TAMANO_MESA + ESPACIO)
          };
          
          // Verificar si esta posición está libre
          const hayColision = mesas.some(mesa => 
            verificarColision(nuevaPos, mesa.posicion, TAMANO_MESA)
          );
          
          if (!hayColision) {
            posicionEncontrada = nuevaPos;
            break;
          }
        }
        if (posicionEncontrada) break;
      }
      
      // Si no se encontró posición, usar una por defecto
      if (!posicionEncontrada) {
        posicionEncontrada = { x: 50, y: 50 };
      }
      
      const nuevaMesa = {
        numero: mesaCreada.idMesa,
        nombre: mesaCreada.nombreMesa,
        estado: "libre",
        posicion: posicionEncontrada,
        unidaCon: [],
        pedido: null,
        grupo: null
      };
      
      // Agregar localmente (el WebSocket también la agregará)
      setMesas(prev => [...prev, nuevaMesa]);
      Alert.alert('✅ Éxito', `Mesa "${nombreMesa}" creada correctamente`);
    } catch (error) {
      console.error('❌ Error al crear mesa:', error);
      Alert.alert('Error', 'No se pudo crear la mesa en el servidor');
    }
  };

  const handleEliminarMesa = async (numero) => {
    // Verificar que la mesa esté libre y sin uniones
    const mesa = mesas.find(m => m.numero === numero);
    
    if (!mesa) return;
    
    if (mesa.estado === "ocupada") {
      Alert.alert("❌ Error", "No puedes eliminar una mesa ocupada");
      return;
    }
    
    if (mesa.unidaCon.length > 0) {
      Alert.alert("❌ Error", "No puedes eliminar una mesa que está unida. Sepárala primero.");
      return;
    }
    
    try {
      // Eliminar del backend
      await mesasService.deleteMesa(numero);
      console.log('✅ Mesa eliminada del backend:', numero);
      
      // Eliminar localmente (el WebSocket también la eliminará)
      setMesas(prev => 
        prev
          .filter(m => m.numero !== numero)
          .map(m => ({
            ...m,
            unidaCon: m.unidaCon.filter(n => n !== numero)
          }))
      );
      
      Alert.alert('✅ Éxito', 'Mesa eliminada correctamente');
    } catch (error) {
      console.error('❌ Error al eliminar mesa:', error);
      Alert.alert('Error', 'No se pudo eliminar la mesa del servidor');
    }
  };

  const stats = {
    ocupadas: mesas.filter(m => m.estado === "ocupada").length,
    libres: mesas.filter(m => m.estado === "libre").length,
    total: mesas.length
  };

  // Mostrar indicador de carga mientras se cargan las mesas
  if (loading) {
    return (
      <DashboardLayout userName={displayName} onLogout={logout} onNavigate={onNavigate} currentScreen={currentScreen}>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>Cargando mesas...</Text>
        </View>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userName={displayName} onLogout={logout} onNavigate={onNavigate} currentScreen={currentScreen}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={[styles.pageTitle, isCompact && styles.pageTitleCompact]}>Administrar Mesas</Text>
                {/* Indicador de conexión WebSocket */}
                <View style={[styles.wsIndicator, wsConnected ? styles.wsConnected : styles.wsDisconnected]}>
                  <Text style={styles.wsIndicatorText}>
                    {wsConnected ? '🟢 Conectado' : '🔴 Desconectado'}
                  </Text>
                </View>
              </View>
              <Text style={styles.pageSubtitle}>
                {modoActivo === 'mover' && "🔄 Modo: arrastra mesas"}
                {modoActivo === 'unir' && "🔗 Modo: selecciona mesas para unir"}
                {modoActivo === 'separar' && "✂️ Modo: selecciona mesas para separar"}
                {!modoActivo && "Selecciona un modo para comenzar"}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.configButton}
              onPress={() => setGestionModalVisible(true)}
            >
              <MaterialCommunityIcons name="cog-outline" size={20} color="#868e96" />
            </TouchableOpacity>
          </View>
          <View style={[styles.statsContainer, isCompact && styles.statsContainerCompact]}>
            <View style={styles.statItem}>
              <View style={[styles.statBadge, { backgroundColor: "#51cf66" }]}><Text style={styles.statNumber}>{stats.libres}</Text></View>
              <Text style={styles.statLabel}>Libres</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statBadge, { backgroundColor: "#ff6b6b" }]}><Text style={styles.statNumber}>{stats.ocupadas}</Text></View>
              <Text style={styles.statLabel}>Ocupadas</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statBadge, { backgroundColor: "#4a90e2" }]}><Text style={styles.statNumber}>{stats.total}</Text></View>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity style={[styles.toolButton, modoActivo === 'mover' && styles.toolButtonActive]} onPress={() => activarModo('mover')}>
            <MaterialCommunityIcons name="cursor-move" size={20} color={modoActivo === 'mover' ? "#fff" : "#4a4a4a"} />
            <Text style={[styles.toolButtonText, modoActivo === 'mover' && styles.toolButtonTextActive]}>Mover mesas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.toolButton, modoActivo === 'unir' && styles.toolButtonActive, { backgroundColor: modoActivo === 'unir' ? '#51cf66' : '#f5f5f5' }]} onPress={() => activarModo('unir')}>
            <MaterialCommunityIcons name="link-variant" size={20} color={modoActivo === 'unir' ? "#fff" : "#4a4a4a"} />
            <Text style={[styles.toolButtonText, modoActivo === 'unir' && styles.toolButtonTextActive]}>
              Unir mesas {modoActivo === 'unir' && `(${mesasSeleccionadas.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.toolButton, modoActivo === 'separar' && styles.toolButtonActive, { backgroundColor: modoActivo === 'separar' ? '#ffa94d' : '#f5f5f5' }]} onPress={() => activarModo('separar')}>
            <MaterialCommunityIcons name="link-variant-off" size={20} color={modoActivo === 'separar' ? "#fff" : "#4a4a4a"} />
            <Text style={[styles.toolButtonText, modoActivo === 'separar' && styles.toolButtonTextActive]}>
              Separar mesas {modoActivo === 'separar' && `(${mesasSeleccionadas.length})`}
            </Text>
          </TouchableOpacity>

          {modoActivo === 'unir' && mesasSeleccionadas.length >= 2 && (
            <TouchableOpacity style={[styles.toolButton, styles.confirmButton]} onPress={confirmarUnir}>
              <MaterialCommunityIcons name="check" size={20} color="#fff" />
              <Text style={[styles.toolButtonText, styles.toolButtonTextActive]}>Confirmar unión</Text>
            </TouchableOpacity>
          )}

          {modoActivo === 'separar' && mesasSeleccionadas.length >= 1 && (
            <TouchableOpacity style={[styles.toolButton, styles.confirmButton]} onPress={confirmarSeparar}>
              <MaterialCommunityIcons name="check" size={20} color="#fff" />
              <Text style={[styles.toolButtonText, styles.toolButtonTextActive]}>Confirmar separación</Text>
            </TouchableOpacity>
          )}

          {modoActivo && (
            <TouchableOpacity style={[styles.toolButton, styles.cancelButton]} onPress={() => { setModoActivo(null); setMesasSeleccionadas([]); }}>
              <MaterialCommunityIcons name="close" size={20} color="#ff6b6b" />
              <Text style={[styles.toolButtonText, { color: "#ff6b6b" }]}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Canvas */}
        <View 
          style={styles.salon}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setSalonDimensions({ width, height });
          }}
        >
          <GridBackground />
          
          {/* Indicador de zona segura (sutil) */}
          {salonDimensions.width > 0 && (
            <>
              <View style={[styles.zonaSeguridadVertical, { 
                right: 0, 
                width: MARGEN_SEGURIDAD,
                height: '100%'
              }]} />
              <View style={[styles.zonaSeguridadHorizontal, { 
                bottom: 0, 
                height: MARGEN_SEGURIDAD,
                width: '100%'
              }]} />
            </>
          )}

          {mesas.map(m => (
            <Mesa
              key={m.numero}
              numero={m.numero}
              estado={m.estado}
              posicion={m.posicion}
              unidaCon={m.unidaCon}
              onPosicionChange={handlePosicionChange}
              onPress={handleMesaPress}
              isSelected={mesasSeleccionadas.includes(m.numero)}
              draggable={modoActivo === 'mover'}
            />
          ))}
        </View>

        <MesaModal 
          visible={modalVisible} 
          onClose={() => setModalVisible(false)} 
          mesa={mesaSeleccionada} 
          onIniciarPedido={handleIniciarPedido}
          onLimpiarMesa={handleLimpiarMesa}
        />

        <GestionarMesasModal
          visible={gestionModalVisible}
          onClose={() => setGestionModalVisible(false)}
          mesas={mesas}
          onAgregarMesa={handleAgregarMesa}
          onEliminarMesa={handleEliminarMesa}
        />
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 40 
  },
  loadingText: { 
    marginTop: 16, 
    fontSize: 16, 
    color: '#666' 
  },
  header: { marginBottom: 20 },
  headerLeft: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  configButton: { 
    padding: 8, 
    backgroundColor: "#f8f9fa", 
    borderRadius: 8, 
    marginTop: 4,
    opacity: 0.6,
  },
  wsIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  wsConnected: {
    backgroundColor: '#d3f9d8',
    borderColor: '#51cf66',
  },
  wsDisconnected: {
    backgroundColor: '#ffe3e3',
    borderColor: '#ff6b6b',
  },
  wsIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pageTitle: { fontSize: 32, fontWeight: "700", color: "#1f1f1f", marginBottom: 8 },
  pageTitleCompact: { fontSize: 28 },
  pageSubtitle: { fontSize: 15, color: "#666", marginBottom: 16 },
  statsContainer: { flexDirection: "row", gap: 16, marginTop: 16 },
  statsContainerCompact: { flexWrap: "wrap" },
  statItem: { alignItems: "center", gap: 8 },
  statBadge: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "700", color: "#fff" },
  statLabel: { fontSize: 13, color: "#666", fontWeight: "500" },
  toolbar: { flexDirection: "row", gap: 12, marginBottom: 20, flexWrap: "wrap" },
  toolButton: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: "#f5f5f5", borderWidth: 1, borderColor: "#e0e0e0" },
  toolButtonActive: { backgroundColor: "#4a90e2", borderColor: "#4a90e2" },
  cancelButton: { backgroundColor: "#fff", borderColor: "#ff6b6b" },
  toolButtonText: { fontSize: 14, fontWeight: "600", color: "#4a4a4a" },
  toolButtonTextActive: { color: "#fff" },
  salon: { flex: 1, backgroundColor: "#f8f8f8", borderRadius: 12, borderWidth: 1, borderColor: "#d8d8d8", position: "relative", minHeight: 500, overflow: "hidden" },
  zonaSeguridadVertical: {
    position: "absolute",
    backgroundColor: "rgba(255, 107, 107, 0.05)",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255, 107, 107, 0.15)",
  },
  zonaSeguridadHorizontal: {
    position: "absolute",
    backgroundColor: "rgba(255, 107, 107, 0.05)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 107, 107, 0.15)",
  },
  confirmButton: { backgroundColor: "#37b24d" },
});
