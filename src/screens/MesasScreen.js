import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ActivityIndicator } from "react-native";
import Alert from "@blazejkustra/react-native-alert";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Defs, Pattern, Rect, Line } from "react-native-svg";
import DashboardLayout from "../components/layout/DashboardLayout";
import Mesa from "../components/Mesa";
import MesaModal from "../components/MesaModal";
import GestionarMesasModal from "../components/GestionarMesasModal";
import { useAuth } from "../context/AuthContext";
import mesasService from "../services/mesasService";
import { useMesasSocket } from "../hooks/useMesasSocket";

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
  const [modalVisible, setModalVisible] = useState(false);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [modoActivo, setModoActivo] = useState(null);
  const [mesasSeleccionadas, setMesasSeleccionadas] = useState([]);
  const [gestionModalVisible, setGestionModalVisible] = useState(false);
  const [salonDimensions, setSalonDimensions] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  
  const { user, logout } = useAuth();
  const displayName = user?.usuario || "Usuario";
  const { width } = useWindowDimensions();
  const isCompact = width < 768;

  // Hook personalizado de WebSocket para mesas
  const { 
    isConnected: wsConnected, 
    mesas, 
    setMesas,
    joinMesa,
    leaveMesa 
  } = useMesasSocket({
    onRefreshRequest: async () => {
      // NO recargar automáticamente - confiar en eventos específicos de WebSocket
      // que ya actualizan el estado sin tocar las posiciones
    },
    onNotification: (notification) => {
      const title = notification.title || 
                    (notification.type === 'error' ? '❌ Error' : 
                     notification.type === 'warning' ? '⚠️ Atención' : 
                     notification.type === 'success' ? '✅ Éxito' : 
                     'ℹ️ Información');
      
      Alert.alert(title, notification.message);
    }
  });

  // Cargar mesas desde el backend (API REST)
  // Esta función se usa solo en carga inicial o cuando el WebSocket lo solicita
  const cargarMesas = useCallback(async () => {
    try {
      setLoading(true);
      const mesasData = await mesasService.getMesas();
      
      // Intentar cargar grupos existentes (sin bloquear si falla)
      let gruposData = [];
      try {
        gruposData = await mesasService.getGrupos();
      } catch (grupoError) {
        console.warn('No se pudieron cargar grupos:', grupoError.message);
      }
      
      // Crear un mapa de grupos para acceso rápido
      const gruposMap = {};
      if (gruposData && gruposData.length > 0) {
        gruposData.forEach(grupo => {
          const mesasIds = grupo.mesas?.map(m => m.id || m.idMesa) || [];
          mesasIds.forEach(idMesa => {
            gruposMap[idMesa] = {
              idGrupo: grupo.id,
              nombreGrupo: grupo.nombre,
              mesasDelGrupo: mesasIds
            };
          });
        });
      }
      
      // Transformar datos del backend al formato local
      const mesasTransformadas = mesasData.map((mesa, index) => {
        // Mapear estados del backend a estados locales
        let estadoLocal = "libre";
        if (mesa.estado) {
          const estadoMap = {
            'DISPONIBLE': 'libre',
            'OCUPADA': 'ocupada',
            'RESERVADA': 'reservada',
            'FUERA_DE_SERVICIO': 'fuera_servicio'
          };
          estadoLocal = estadoMap[mesa.estado] || "libre";
        }

        // Verificar si la mesa pertenece a un grupo
        const grupoInfo = gruposMap[mesa.idMesa];
        
        // Calcular unidaCon con números locales
        const unidaCon = grupoInfo 
          ? grupoInfo.mesasDelGrupo
              .filter(id => id !== mesa.idMesa)
              .map(id => {
                const mesaEncontrada = mesasData.find(m => m.idMesa === id);
                return mesaEncontrada ? mesaEncontrada.idMesa : id;
              })
          : [];

        return {
          numero: mesa.idMesa,
          nombre: mesa.nombreMesa,
          estado: estadoLocal,
          posicion: { 
            x: mesa.posX !== null && mesa.posX !== undefined ? mesa.posX : 50 + (index % 5) * 130, 
            y: mesa.posY !== null && mesa.posY !== undefined ? mesa.posY : 50 + Math.floor(index / 5) * 130 
          },
          unidaCon: unidaCon,
          pedido: estadoLocal === "ocupada" ? {
            mozo: "Sistema",
            horaInicio: "Cargado",
            comensales: 0,
            items: []
          } : null,
          grupo: grupoInfo?.idGrupo || null,
          nombreGrupo: grupoInfo?.nombreGrupo || null,
          idMesa: mesa.idMesa,
          nombreMesa: mesa.nombreMesa
        };
      });
      
      setMesas(mesasTransformadas);
    } catch (error) {
      console.error('Error al cargar mesas:', error);
      Alert.alert('Error', `No se pudieron cargar las mesas: ${error.message}`);
      setMesas([]);
    } finally {
      setLoading(false);
    }
  }, [setMesas, wsConnected]);

  // Cargar mesas iniciales al montar el componente
  useEffect(() => {
    cargarMesas();
  }, [cargarMesas]);

  // Recargar mesas cuando la pantalla vuelve a estar activa
  useEffect(() => {
    if (currentScreen === 'mesas') {
      cargarMesas();
    }
  }, [currentScreen, cargarMesas]);

  // Actualizar mesaSeleccionada cuando cambie el estado de las mesas
  useEffect(() => {
    if (mesaSeleccionada && modalVisible) {
      const mesaActualizada = mesas.find(m => m.numero === mesaSeleccionada.numero);
      if (mesaActualizada) {
        // Siempre actualizar con la versión más reciente
        setMesaSeleccionada(mesaActualizada);
      }
    }
  }, [mesas, modalVisible]);

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

  const handlePosicionChange = useCallback(async (numero, nuevaPosicion) => {
    console.log('🎯 handlePosicionChange llamado:', { numero, nuevaPosicion });
    
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
      // Actualizar localmente de inmediato (optimistic update)
      setMesas(prev => prev.map(m => m.numero === numero ? { ...m, posicion: posicionLimitada } : m));
      
      // Guardar en el backend
      try {
        await mesasService.actualizarPosicionMesa(numero, posicionLimitada.x, posicionLimitada.y);
      } catch (error) {
        console.error('Error al guardar posición:', error);
      }
    }
  }, [salonDimensions, mesas]);

  const handleMesaPress = useCallback((numero) => {
    if (modoActivo === 'unir' || modoActivo === 'separar') {
      setMesasSeleccionadas(prev => {
        const yaSeleccionada = prev.includes(numero);
        return yaSeleccionada 
          ? prev.filter(n => n !== numero) 
          : [...prev, numero];
      });
      return;
    }
    
    if (!modoActivo) {
      const mesa = mesas.find(m => m.numero === numero);
      setMesaSeleccionada(mesa);
      setModalVisible(true);
    }
  }, [modoActivo, mesas]);

  const activarModo = (modo) => {
    const nuevoModo = modoActivo === modo ? null : modo;
    
    setModoActivo(nuevoModo);
    setMesasSeleccionadas([]);
  };

  const unirMesas = (numeros) => {
    if (numeros.length < 2) {
      Alert.alert('Error', 'Selecciona al menos 2 mesas para unir');
      return;
    }

    // Generar nombre por defecto
    const nombreDefault = `Grupo ${new Date().getTime() % 1000}`;
    
    // Usar Alert.prompt para pedir el nombre del grupo
    Alert.prompt(
      'Nombre del grupo',
      'Ingresa un nombre para el grupo de mesas:',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Crear',
          onPress: async (nombre) => {
            if (!nombre || nombre.trim() === '') {
              Alert.alert('Error', 'Debes ingresar un nombre para el grupo');
              return;
            }

            try {
              // Obtener los IDs reales de las mesas
              const mesasIds = numeros.map(num => {
                const mesa = mesas.find(m => m.numero === num);
                return mesa?.idMesa || num;
              });

              // 1. ACTUALIZACIÓN OPTIMISTA - Actualizar UI inmediatamente
              const ordenadas = [...numeros].sort((a, b) => a - b);
              setMesas(prev => {
                // Actualizar mesas con el grupo PERO MANTENER SUS POSICIONES ACTUALES
                return prev.map(m => {
                  if (numeros.includes(m.numero)) {
                    const nuevasUniones = ordenadas.filter(n => n !== m.numero);
                    return {
                      ...m,
                      // NO cambiar la posición - mantener posicion actual
                      unidaCon: nuevasUniones,
                      nombreGrupo: nombre
                    };
                  }
                  return m;
                });
              });

              
              // 2. SINCRONIZAR CON BACKEND
              const resultado = await mesasService.createGrupo(nombre, mesasIds);
              
              // El evento 'grupo:creado' se recibirá automáticamente por WebSocket
              // y confirmará/actualizará el estado

              Alert.alert('✅ Éxito', `Grupo "${nombre}" creado correctamente`);
              setModoActivo(null);
              setMesasSeleccionadas([]);
              
            } catch (error) {
              console.error('Error al crear grupo:', error);
              
              // 3. REVERTIR CAMBIOS SI FALLA
              setMesas(prev =>
                prev.map(mesa => {
                  if (numeros.includes(mesa.numero)) {
                    return {
                      ...mesa,
                      unidaCon: [],
                      nombreGrupo: null
                    };
                  }
                  return mesa;
                })
              );
              
              Alert.alert('Error', `No se pudo crear el grupo: ${error.message}`);
            }
          }
        }
      ],
      'plain-text',
      nombreDefault
    );
  };

  const confirmarUnir = () => {
    if (mesasSeleccionadas.length < 2) {
      return Alert.alert("Error", "Selecciona al menos 2 mesas");
    }
    
    unirMesas(mesasSeleccionadas);
    setModoActivo(null);
    setMesasSeleccionadas([]);
  };

  const confirmarSeparar = async () => {
    if (!mesasSeleccionadas.length)
      return Alert.alert("Error", "Selecciona al menos 1 mesa");

    try {
      // Encontrar el grupo al que pertenecen las mesas seleccionadas
      const mesasConGrupo = mesas.filter(m => 
        mesasSeleccionadas.includes(m.numero) && m.grupo
      );

      if (mesasConGrupo.length === 0) {
        return Alert.alert("Error", "Las mesas seleccionadas no pertenecen a ningún grupo");
      }

      // Obtener el ID del grupo
      const grupoId = mesasConGrupo[0].grupo;
      const nombreGrupo = mesasConGrupo[0].nombreGrupo || `Grupo ${grupoId}`;
      
      // Obtener todas las mesas del grupo
      const todasLasMesasDelGrupo = mesas
        .filter(m => m.grupo === grupoId)
        .map(m => m.idMesa);
      
      // Obtener los IDs de las mesas seleccionadas
      const mesasIdsARemover = mesasConGrupo.map(m => m.idMesa);
      const mesasRestantes = todasLasMesasDelGrupo.length - mesasIdsARemover.length;
      
      // Determinar el mensaje según cuántas mesas quedarán
      let mensaje;
      if (mesasRestantes < 2) {
        mensaje = `Esto disolverá el grupo completo "${nombreGrupo}". ¿Continuar?`;
      } else {
        mensaje = `¿Separar ${mesasIdsARemover.length} mesa(s) del grupo "${nombreGrupo}"? Quedarán ${mesasRestantes} mesa(s) en el grupo.`;
      }

      // Mostrar confirmación
      Alert.alert(
        "Separar Mesas",
        mensaje,
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "Confirmar",
            onPress: async () => {
              try {
                // 1. ACTUALIZACIÓN OPTIMISTA
                setMesas(prev => prev.map(m => {
                  if (mesasSeleccionadas.includes(m.numero)) {
                    return {
                      ...m,
                      unidaCon: [],
                      grupo: null,
                      nombreGrupo: null
                    };
                  } else if (m.grupo === grupoId) {
                    return {
                      ...m,
                      unidaCon: m.unidaCon.filter(n => !mesasSeleccionadas.includes(n))
                    };
                  }
                  return m;
                }));

                // 2. SINCRONIZAR CON BACKEND
                await mesasService.removerMesasDeGrupo(
                  grupoId,
                  mesasIdsARemover,
                  todasLasMesasDelGrupo,
                  nombreGrupo
                );

                const mensajeExito = mesasRestantes < 2 
                  ? `Grupo "${nombreGrupo}" disuelto correctamente`
                  : `Mesa(s) separada(s) del grupo "${nombreGrupo}"`;
                  
                Alert.alert("✅ Éxito", mensajeExito);
                setModoActivo(null);
                setMesasSeleccionadas([]);

              } catch (error) {
                console.error('Error al separar mesas:', error);
                await cargarMesas();
                Alert.alert('Error', 'No se pudo separar las mesas. Intenta de nuevo.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error en confirmarSeparar:', error);
      Alert.alert('Error', 'Ocurrió un error al procesar la solicitud');
    }
  };

  const handleIniciarPedido = async (numero) => {
    // Encontrar la mesa actual
    const mesaActual = mesas.find(m => m.numero === numero);
    if (!mesaActual) {
      Alert.alert('Error', 'Mesa no encontrada');
      return;
    }

    // 1. ACTUALIZACIÓN OPTIMISTA - Actualizar UI inmediatamente
    const mesasDelGrupo = [numero, ...(mesaActual.unidaCon || [])];
    const pedidoCompartido = {
      mozo: displayName,
      horaInicio: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      comensales: 0,
      items: []
    };
    
    // Actualizar estado local inmediatamente para respuesta rápida
    setMesas(prevMesas => 
      prevMesas.map(mesa => 
        mesasDelGrupo.includes(mesa.numero)
          ? { ...mesa, estado: "ocupada", pedido: pedidoCompartido }
          : mesa
      )
    );

    // 2. SINCRONIZAR CON BACKEND
    try {
      // Ocupar la mesa en el backend (esto emitirá el evento WebSocket)
      const response = await mesasService.ocuparMesa(mesaActual.idMesa);
      
      const cantidadMesas = 1 + (mesaActual.unidaCon?.length || 0);
      
      // Mostrar confirmación sin bloquear
      setTimeout(() => {
        Alert.alert(
          "✅ Pedido iniciado", 
          cantidadMesas > 1 
            ? `Pedido iniciado para ${cantidadMesas} mesas unidas`
            : `Mesa ${mesaActual.nombre || numero} ahora está ocupada`
        );
      }, 100);
      
    } catch (error) {
      console.error('❌ Error al ocupar mesa:', error);
      
      // 3. REVERTIR CAMBIOS SI FALLA
      setMesas(prevMesas => 
        prevMesas.map(mesa => 
          mesasDelGrupo.includes(mesa.numero)
            ? { ...mesa, estado: "libre", pedido: null }
            : mesa
        )
      );
      
      Alert.alert(
        'Error', 
        'No se pudo ocupar la mesa. El cambio se ha revertido.'
      );
    }
  };

  const handleLimpiarMesa = async (numero) => {
    // Encontrar la mesa actual
    const mesaActual = mesas.find(m => m.numero === numero);
    if (!mesaActual) {
      Alert.alert('Error', 'Mesa no encontrada');
      return;
    }

    // 1. ACTUALIZACIÓN OPTIMISTA - Actualizar UI inmediatamente
    const mesasDelGrupo = [numero, ...(mesaActual.unidaCon || [])];
    
    // Actualizar estado local inmediatamente
    setMesas(prevMesas => {
      return prevMesas.map(mesa => {
        if (mesasDelGrupo.includes(mesa.numero)) {
          return {
            ...mesa,
            estado: "libre",
            pedido: null,
            unidaCon: []
          };
        }
        // Limpiar referencias en otras mesas
        if (mesa.unidaCon.some(n => mesasDelGrupo.includes(n))) {
          return {
            ...mesa,
            unidaCon: mesa.unidaCon.filter(n => !mesasDelGrupo.includes(n))
          };
        }
        return mesa;
      });
    });

    // 2. SINCRONIZAR CON BACKEND
    try {
      // Liberar la mesa en el backend (esto emitirá el evento WebSocket)
      const response = await mesasService.liberarMesa(mesaActual.idMesa);
      
      const cantidadMesas = 1 + (mesaActual.unidaCon?.length || 0);
      
      // Mostrar confirmación sin bloquear
      setTimeout(() => {
        Alert.alert(
          "✅ Mesa limpiada", 
          cantidadMesas > 1 
            ? `Se liberaron ${cantidadMesas} mesas y se separaron`
            : `Mesa ${mesaActual.nombre || numero} ahora está libre`
        );
      }, 100);
      
    } catch (error) {
      console.error('Error al liberar mesa:', error);
      
      // 3. REVERTIR CAMBIOS SI FALLA
      setMesas(prevMesas => 
        prevMesas.map(mesa => 
          mesasDelGrupo.includes(mesa.numero)
            ? { ...mesa, estado: "ocupada", pedido: mesaActual.pedido }
            : mesa
        )
      );
      
      Alert.alert(
        'Error', 
        'No se pudo liberar la mesa. El cambio se ha revertido.'
      );
    }
  };

  const handleAgregarMesa = async (nombreMesa) => {
    try {
      // Crear mesa en el backend
      const mesaCreada = await mesasService.createMesa(nombreMesa);
      
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
      
      // Guardar la posición en la base de datos
      try {
        await mesasService.actualizarPosicionMesa(
          mesaCreada.idMesa, 
          posicionEncontrada.x, 
          posicionEncontrada.y
        );
      } catch (errorPos) {
        console.warn('No se pudo guardar la posición inicial:', errorPos);
      }
      
      const nuevaMesa = {
        numero: mesaCreada.idMesa,
        nombre: mesaCreada.nombreMesa,
        estado: "libre",
        posicion: posicionEncontrada,
        unidaCon: [],
        pedido: null,
        grupo: null,
        idMesa: mesaCreada.idMesa,
        nombreMesa: mesaCreada.nombreMesa
      };
      
      // Agregar localmente SOLO si no existe (evitar duplicados)
      setMesas(prev => {
        const existe = prev.some(m => m.idMesa === mesaCreada.idMesa || m.numero === mesaCreada.idMesa);
        if (existe) {
          return prev;
        }
        return [...prev, nuevaMesa];
      });
      Alert.alert('✅ Éxito', `Mesa "${nombreMesa}" creada correctamente`);
    } catch (error) {
      console.error('Error al crear mesa:', error);
      Alert.alert('Error', 'No se pudo crear la mesa en el servidor');
    }
  };

  const handleEliminarMesa = async (numero) => {
    // Verificar que la mesa esté libre y sin uniones
    const mesa = mesas.find(m => m.numero === numero);
    
    if (!mesa) {
      return;
    }
    
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
      console.error('Error al eliminar mesa:', error);
      Alert.alert('❌ Error', 'No se pudo eliminar la mesa del servidor');
    }
  };

  // Calcular estadísticas de manera reactiva
  const stats = useMemo(() => {
    return {
      ocupadas: mesas.filter(m => m.estado === "ocupada").length,
      libres: mesas.filter(m => m.estado === "libre").length,
      total: mesas.length
    };
  }, [mesas]);

  // Calcular información de grupos de manera optimizada
  const gruposInfo = useMemo(() => {
    const grupos = {};
    const mesasEnGrupos = new Set();
    
    mesas.forEach(mesa => {
      if (mesa.grupo) {
        mesasEnGrupos.add(mesa.numero);
        
        if (!grupos[mesa.grupo]) {
          grupos[mesa.grupo] = {
            id: mesa.grupo,
            nombre: mesa.nombreGrupo,
            mesas: [],
            cantidadMesas: 0
          };
        }
        
        grupos[mesa.grupo].mesas.push(mesa.numero);
        grupos[mesa.grupo].cantidadMesas++;
      }
    });
    
    return {
      grupos: Object.values(grupos),
      cantidadGrupos: Object.keys(grupos).length,
      mesasEnGrupos: mesasEnGrupos.size,
      mesasIndividuales: mesas.length - mesasEnGrupos.size
    };
  }, [mesas]);

  // Log de información de grupos (útil para debugging)
  useEffect(() => {
    if (gruposInfo.cantidadGrupos > 0) {
      console.log('📊 Información de grupos:', {
        cantidadGrupos: gruposInfo.cantidadGrupos,
        mesasEnGrupos: gruposInfo.mesasEnGrupos,
        mesasIndividuales: gruposInfo.mesasIndividuales,
        grupos: gruposInfo.grupos
      });
    }
  }, [gruposInfo]);

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

          {/* Mensaje si no hay mesas */}
          {mesas.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay mesas disponibles</Text>
              <Text style={styles.emptySubtext}>Presiona el botón "Gestionar Mesas" para agregar una</Text>
            </View>
          )}

          {/* Filtrar duplicados antes de renderizar */}
          {Array.from(new Map(mesas.map(m => [m.idMesa || m.numero, m])).values()).map(m => (
            <Mesa
              key={`mesa-${m.idMesa || m.numero}`}
              numero={m.numero}
              estado={m.estado}
              posicion={m.posicion}
              unidaCon={m.unidaCon}
              nombreGrupo={m.nombreGrupo}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  confirmButton: { backgroundColor: "#37b24d" },
});
