import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Alert, ActivityIndicator } from "react-native";
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
      console.log('🔄 Solicitud de recarga de mesas desde WebSocket...');
      await cargarMesas();
    },
    onNotification: (notification) => {
      // Mostrar notificación al usuario con formato mejorado
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
      console.log('🔄 Cargando mesas desde API REST...');
      
      const mesasData = await mesasService.getMesas();
      console.log('✅ Mesas cargadas desde API:', mesasData.length);
      console.log('📋 Datos crudos de mesas:', mesasData);
      
      // Intentar cargar grupos existentes (sin bloquear si falla)
      let gruposData = [];
      try {
        gruposData = await mesasService.getGrupos();
        console.log('✅ Grupos cargados desde API:', gruposData.length);
        console.log('📋 Datos crudos de grupos:', gruposData);
      } catch (grupoError) {
        console.warn('⚠️ No se pudieron cargar grupos (continuando sin grupos):', grupoError.message);
        // Si el endpoint no existe (404), simplemente continuar sin grupos
        // Los grupos se sincronizarán cuando se creen mediante WebSocket
      }
      
      // Crear un mapa de grupos para acceso rápido
      const gruposMap = {};
      if (gruposData && gruposData.length > 0) {
        gruposData.forEach(grupo => {
          const mesasIds = grupo.mesas?.map(m => m.id || m.idMesa) || [];
          
          console.log(`📊 Procesando grupo "${grupo.nombre}" (ID: ${grupo.id}):`, mesasIds);
          
          mesasIds.forEach(idMesa => {
            gruposMap[idMesa] = {
              idGrupo: grupo.id,
              nombreGrupo: grupo.nombre,
              mesasDelGrupo: mesasIds
            };
          });
        });
      }
      
      console.log('📊 Mapa de grupos:', gruposMap);
      
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
                // Encontrar el número local de esta mesa
                const mesaEncontrada = mesasData.find(m => m.idMesa === id);
                return mesaEncontrada ? mesaEncontrada.idMesa : id;
              })
          : [];

        const mesaTransformada = {
          numero: mesa.idMesa,
          nombre: mesa.nombreMesa,
          estado: estadoLocal,
          posicion: { 
            x: 50 + (index % 5) * 130, 
            y: 50 + Math.floor(index / 5) * 130 
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
        
        if (grupoInfo) {
          console.log(`� Mesa ${mesa.idMesa} en grupo "${grupoInfo.nombreGrupo}":`, {
            unidaCon,
            grupo: grupoInfo.idGrupo
          });
        }
        
        return mesaTransformada;
      });
      
      console.log('📊 Mesas transformadas:', mesasTransformadas.length);
      console.log('📊 Mesas en grupos:', mesasTransformadas.filter(m => m.grupo).length);
      setMesas(mesasTransformadas);
      
      console.log('✅ Carga de mesas completada');
    } catch (error) {
      console.error('❌ Error al cargar mesas:', error);
      console.error('❌ Stack:', error.stack);
      Alert.alert('Error', `No se pudieron cargar las mesas: ${error.message}`);
      setMesas([]); // Mantener vacío en caso de error
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

  const handlePosicionChange = useCallback((numero, nuevaPosicion) => {
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
  }, [salonDimensions, mesas]);

  const handleMesaPress = useCallback((numero) => {
    console.log('═══════════════════════════════════════');
    console.log('🖱️ handleMesaPress INICIO');
    console.log('   Mesa presionada:', numero);
    console.log('   Modo activo actual:', modoActivo);
    console.log('   Tipo de modoActivo:', typeof modoActivo);
    console.log('   modoActivo === "unir":', modoActivo === 'unir');
    console.log('   modoActivo === "separar":', modoActivo === 'separar');
    console.log('═══════════════════════════════════════');
    
    if (modoActivo === 'unir' || modoActivo === 'separar') {
      console.log('✅ Modo de selección activo, alternando selección');
      setMesasSeleccionadas(prev => {
        const yaSeleccionada = prev.includes(numero);
        const nuevaSeleccion = yaSeleccionada 
          ? prev.filter(n => n !== numero) 
          : [...prev, numero];
        console.log('📋 Mesas seleccionadas:', nuevaSeleccion);
        return nuevaSeleccion;
      });
      return;
    }
    
    if (!modoActivo) {
      console.log('📝 Abriendo modal de pedido para mesa', numero);
      const mesa = mesas.find(m => m.numero === numero);
      setMesaSeleccionada(mesa);
      setModalVisible(true);
    } else {
      console.log('⚠️ Modo activo pero no reconocido:', modoActivo);
    }
  }, [modoActivo, mesas]);

  const activarModo = (modo) => {
    const nuevoModo = modoActivo === modo ? null : modo;
    console.log('🔧 Activar modo:', modo, '-> Nuevo modo:', nuevoModo);
    console.log('📋 Mesas seleccionadas al cambiar modo:', mesasSeleccionadas);
    
    setModoActivo(nuevoModo);
    setMesasSeleccionadas([]);
  };

  // Log cuando cambia modoActivo para debugging
  useEffect(() => {
    console.log('🔄 Estado modoActivo actualizado a:', modoActivo);
  }, [modoActivo]);

  const unirMesas = async (numeros) => {
    if (numeros.length < 2) {
      Alert.alert('Error', 'Selecciona al menos 2 mesas para unir');
      return;
    }

    console.log('🔗 unirMesas llamado con:', numeros);

    // Generar nombre por defecto
    const nombreDefault = `Grupo ${new Date().getTime() % 1000}`;
    
    // Mostrar un prompt simple - en web funciona, en móvil usamos nombre default
    const nombre = typeof prompt !== 'undefined' 
      ? prompt('Ingresa un nombre para el grupo de mesas:', nombreDefault)
      : nombreDefault;

    if (!nombre || nombre.trim() === '') {
      Alert.alert('Error', 'Debes ingresar un nombre para el grupo');
      return;
    }

    console.log('📝 Nombre del grupo:', nombre);

    try {
      // Obtener los IDs reales de las mesas
      const mesasIds = numeros.map(num => {
        const mesa = mesas.find(m => m.numero === num);
        console.log(`   Mesa ${num} -> ID: ${mesa?.idMesa}`);
        return mesa?.idMesa || num;
      });

      console.log('📊 IDs de mesas para el backend:', mesasIds);

      // 1. ACTUALIZACIÓN OPTIMISTA - Actualizar UI inmediatamente
      const ordenadas = [...numeros].sort((a, b) => a - b);
      setMesas(prev => {
        const base = prev.find(m => m.numero === ordenadas[0]);
        let basePos = base?.posicion || { x: 50, y: 50 };
        const ancho = TAMANO_MESA, espacio = 10;
        
        // Calcular posiciones para visualización
        const nuevasPosiciones = ordenadas.map((numero, index) => ({
          numero,
          posicion: { 
            x: basePos.x + index * (ancho + espacio), 
            y: basePos.y 
          }
        }));

        // Actualizar mesas con el grupo
        return prev.map(m => {
          const mesaPos = nuevasPosiciones.find(np => np.numero === m.numero);
          if (!mesaPos) return m;
          
          const nuevasUniones = ordenadas.filter(n => n !== m.numero);
          return {
            ...m,
            posicion: mesaPos.posicion,
            unidaCon: nuevasUniones,
            nombreGrupo: nombre
          };
        });
      });

      console.log('📡 Enviando petición al backend...');
      
      // 2. SINCRONIZAR CON BACKEND
      const resultado = await mesasService.createGrupo(nombre, mesasIds);
      
      console.log('✅ Respuesta del backend:', resultado);
      
      // El evento 'grupo:creado' se recibirá automáticamente por WebSocket
      // y confirmará/actualizará el estado

      Alert.alert('✅ Éxito', `Grupo "${nombre}" creado correctamente`);
      setModoActivo(null);
      setMesasSeleccionadas([]);
      
    } catch (error) {
      console.error('❌ Error al crear grupo:', error);
      console.error('❌ Stack:', error.stack);
      
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
  };

  const confirmarUnir = () => {
    console.log('🔗 Confirmar unir - Mesas seleccionadas:', mesasSeleccionadas);
    
    if (mesasSeleccionadas.length < 2) {
      console.warn('⚠️ Menos de 2 mesas seleccionadas');
      return Alert.alert("Error", "Selecciona al menos 2 mesas");
    }
    
    console.log('✅ Procediendo a unir mesas:', mesasSeleccionadas);
    unirMesas(mesasSeleccionadas);
    setModoActivo(null);
    setMesasSeleccionadas([]);
  };

  const confirmarSeparar = async () => {
    console.log('🔵 confirmarSeparar llamado');
    console.log('  Mesas seleccionadas:', mesasSeleccionadas);
    console.log('  Total mesas:', mesas.length);
    
    if (!mesasSeleccionadas.length)
      return Alert.alert("Error", "Selecciona al menos 1 mesa");

    try {
      // Encontrar el grupo al que pertenecen las mesas seleccionadas
      const mesasConGrupo = mesas.filter(m => 
        mesasSeleccionadas.includes(m.numero) && m.grupo
      );

      console.log('  Mesas con grupo encontradas:', mesasConGrupo.length);
      console.log('  Detalles:', mesasConGrupo.map(m => ({ numero: m.numero, idMesa: m.idMesa, grupo: m.grupo })));

      if (mesasConGrupo.length === 0) {
        return Alert.alert("Error", "Las mesas seleccionadas no pertenecen a ningún grupo");
      }

      // Obtener el ID del grupo (asumiendo que todas están en el mismo grupo)
      const grupoId = mesasConGrupo[0].grupo;
      const nombreGrupo = mesasConGrupo[0].nombreGrupo || `Grupo ${grupoId}`;
      
      console.log('  Grupo ID:', grupoId);
      console.log('  Nombre grupo:', nombreGrupo);
      
      // Obtener todas las mesas del grupo (usando idMesa)
      const todasLasMesasDelGrupo = mesas
        .filter(m => m.grupo === grupoId)
        .map(m => m.idMesa);
      
      console.log('  Todas las mesas del grupo (idMesas):', todasLasMesasDelGrupo);
      
      // Obtener los IDs de las mesas seleccionadas (usando idMesa)
      const mesasIdsARemover = mesasConGrupo.map(m => m.idMesa);
      
      console.log('  IDs a remover:', mesasIdsARemover);
      
      const mesasRestantes = todasLasMesasDelGrupo.length - mesasIdsARemover.length;
      
      console.log('  Mesas restantes después de remover:', mesasRestantes);
      
      // Determinar el mensaje según cuántas mesas quedarán
      let mensaje;
      if (mesasRestantes < 2) {
        mensaje = `Esto disolverá el grupo completo "${nombreGrupo}". ¿Continuar?`;
      } else {
        mensaje = `¿Separar ${mesasIdsARemover.length} mesa(s) del grupo "${nombreGrupo}"? Quedarán ${mesasRestantes} mesa(s) en el grupo.`;
      }

      // Usar window.confirm en web
      const confirmar = window.confirm(`Separar Mesas\n\n${mensaje}`);
      
      if (!confirmar) {
        console.log('❌ Usuario canceló la separación');
        return;
      }

      try {
        console.log('🟢 Usuario confirmó separación');
        
        // 1. ACTUALIZACIÓN OPTIMISTA
        setMesas(prev => prev.map(m => {
          if (mesasSeleccionadas.includes(m.numero)) {
            // Remover esta mesa del grupo
            return {
              ...m,
              unidaCon: [],
              grupo: null,
              nombreGrupo: null
            };
          } else if (m.grupo === grupoId) {
            // Actualizar unidaCon de las otras mesas del grupo
            return {
              ...m,
              unidaCon: m.unidaCon.filter(n => !mesasSeleccionadas.includes(n))
            };
          }
          return m;
        }));

        console.log('📤 Llamando a mesasService.removerMesasDeGrupo...');
        
        // 2. SINCRONIZAR CON BACKEND
        await mesasService.removerMesasDeGrupo(
          grupoId,
          mesasIdsARemover,
          todasLasMesasDelGrupo,
          nombreGrupo
        );

        console.log('✅ Backend respondió exitosamente');

        // El evento WebSocket se recibirá automáticamente

        const mensajeExito = mesasRestantes < 2 
          ? `Grupo "${nombreGrupo}" disuelto correctamente`
          : `Mesa(s) separada(s) del grupo "${nombreGrupo}"`;
          
        Alert.alert("✅ Éxito", mensajeExito);
        setModoActivo(null);
        setMesasSeleccionadas([]);

      } catch (error) {
        console.error('❌ Error al separar mesas:', error);
        console.error('❌ Stack:', error.stack);
        
        // 3. REVERTIR CAMBIOS SI FALLA
        await cargarMesas();
        
        Alert.alert('Error', 'No se pudo separar las mesas. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('❌ Error en confirmarSeparar:', error);
      console.error('❌ Stack:', error.stack);
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
      console.error('❌ Error al liberar mesa:', error);
      
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
    console.log('🗑️ handleEliminarMesa llamado con numero:', numero);
    
    // Verificar que la mesa esté libre y sin uniones
    const mesa = mesas.find(m => m.numero === numero);
    
    if (!mesa) {
      console.log('❌ Mesa no encontrada:', numero);
      return;
    }
    
    console.log('📋 Mesa encontrada:', { numero: mesa.numero, estado: mesa.estado, unidaCon: mesa.unidaCon });
    
    if (mesa.estado === "ocupada") {
      window.alert("❌ Error: No puedes eliminar una mesa ocupada");
      return;
    }
    
    if (mesa.unidaCon.length > 0) {
      window.alert("❌ Error: No puedes eliminar una mesa que está unida. Sepárala primero.");
      return;
    }
    
    try {
      console.log('🔥 Intentando eliminar mesa del backend:', numero);
      
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
      
      window.alert('✅ Éxito: Mesa eliminada correctamente');
    } catch (error) {
      console.error('❌ Error al eliminar mesa:', error);
      window.alert('❌ Error: No se pudo eliminar la mesa del servidor');
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

  // Log para debugging
  console.log('🎨 RENDER - Total de mesas en estado:', mesas.length);
  console.log('🎨 RENDER - Loading:', loading);

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

          {mesas.map(m => (
            <Mesa
              key={m.numero}
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
