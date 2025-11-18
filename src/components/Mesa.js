import React, { useRef, useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Animated, PanResponder } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Componente memorizado para evitar re-renders innecesarios
const Mesa = React.memo(({ 
  numero, 
  estado = "libre",
  posicion = { x: 0, y: 0 },
  onPosicionChange,
  onPress,
  unidaCon = [],
  isSelected = false,
  draggable = false,
  nombreGrupo = null, // Nombre del grupo (si está en uno)
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragging, setIsDragging] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(posicion);

  // Sincronizar posición cuando cambie externamente (solo si no estamos arrastrando)
  useEffect(() => {
    if (!isDragging) {
      setCurrentPosition(posicion);
      pan.setValue(posicion);
    }
  }, [posicion.x, posicion.y, isDragging]);

  // Log cuando cambia isSelected para debugging
  useEffect(() => {
    console.log(`🎨 Mesa ${numero} - isSelected cambió a:`, isSelected);
  }, [isSelected, numero]);

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => draggable,
      onMoveShouldSetPanResponder: () => draggable,
      onPanResponderTerminationRequest: () => false,
      
      onPanResponderGrant: () => {
        if (!draggable) return;
        setIsDragging(true);
        // Iniciar desde la posición actual
        pan.setOffset({
          x: currentPosition.x,
          y: currentPosition.y,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      
      onPanResponderRelease: () => {
        // Al liberar, aplanamos offset y guardamos la posición final
        pan.flattenOffset();

        // Obtener valores actuales de pan (movimiento + offset ya aplanado)
        const newX = Math.max(0, pan.x._value || 0);
        const newY = Math.max(0, pan.y._value || 0);
        
        setIsDragging(false);
        setCurrentPosition({ x: newX, y: newY });
        
        if (onPosicionChange) {
          onPosicionChange(numero, { x: newX, y: newY });
        }

        // también fijar el valor del animated para mantener consistencia visual
        pan.setValue({ x: newX, y: newY });
      },
    }),
    [draggable, pan, numero, onPosicionChange, currentPosition]
  );

  const handlePress = () => {
    // Si no se está arrastrando: disparar onPress
    console.log('🎯 Mesa.handlePress llamado');
    console.log('   - Mesa:', numero);
    console.log('   - Draggable:', draggable);
    console.log('   - IsDragging:', isDragging);
    console.log('   - IsSelected:', isSelected);
    
    if (!isDragging && onPress) {
      console.log('✅ Ejecutando onPress para mesa', numero);
      onPress(numero);
    } else {
      console.log('⚠️ No se ejecutó onPress - isDragging:', isDragging, 'onPress existe:', !!onPress);
    }
  };

  // Determinar colores según estado y grupo
  const tieneGrupo = unidaCon.length > 0 || nombreGrupo !== null;
  
  const backgroundColor = estado === "ocupada" 
    ? "#ff6b6b" 
    : tieneGrupo 
      ? "#339af0" // Azul para mesas en grupo
      : "#51cf66"; // Verde para mesas libres individuales

  const borderColor = isSelected 
    ? "#ffd43b" 
    : estado === "ocupada" 
      ? "#fa5252" 
      : tieneGrupo
        ? "#228be6" // Borde azul más oscuro para grupos
        : "#37b24d";

  const borderWidth = isSelected ? 5 : tieneGrupo ? 4 : 3;

  const mesaStyle = [
    styles.mesa,
    { backgroundColor, borderColor, borderWidth },
    isSelected && styles.mesaSelected,
    draggable && styles.mesaDraggable,
    tieneGrupo && styles.mesaEnGrupo,
  ];

  return (
    <Animated.View
      style={[
        styles.mesaContainer,
        {
          left: isDragging ? undefined : currentPosition.x,
          top: isDragging ? undefined : currentPosition.y,
          transform: isDragging 
            ? [{ translateX: pan.x }, { translateY: pan.y }] 
            : [{ translateX: 0 }, { translateY: 0 }],
        },
      ]}
      {...(draggable ? panResponder.panHandlers : {})}
    >
      <Pressable
        onPress={handlePress}
        style={mesaStyle}
        android_ripple={{ color: "rgba(255,255,255,0.3)" }}
        pointerEvents="auto"
        disabled={false}
      >
        {/* Número de mesa */}
        <Text style={styles.numeroMesa}>{numero}</Text>
        
        {/* Icono de estado */}
        <View style={styles.iconoEstado}>
          <MaterialCommunityIcons 
            name={estado === "ocupada" ? "account-multiple" : "check-circle"} 
            size={16} 
            color="#fff" 
          />
        </View>

        {/* Badge de grupo (superior izquierdo) */}
        {tieneGrupo && (
          <View style={styles.grupoBadge}>
            <MaterialCommunityIcons name="link-variant" size={12} color="#fff" />
          </View>
        )}

        {/* Indicador de cantidad de mesas en el grupo */}
        {unidaCon.length > 0 && (
          <View style={styles.cantidadBadge}>
            <Text style={styles.cantidadTexto}>+{unidaCon.length}</Text>
          </View>
        )}

        {/* Nombre del grupo (tooltip en la parte inferior) */}
        {nombreGrupo && (
          <View style={styles.nombreGrupoContainer}>
            <Text style={styles.nombreGrupoTexto} numberOfLines={1}>
              {nombreGrupo}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

// Agregar displayName para debugging
Mesa.displayName = 'Mesa';

export default Mesa;

const styles = StyleSheet.create({
  mesaContainer: {
    position: "absolute",
    zIndex: 10,
  },
  mesa: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    position: "relative",
  },
  mesaSelected: {
    shadowColor: "#ffd43b",
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
    transform: [{ scale: 1.08 }],
  },
  mesaDraggable: {
    opacity: 0.9,
    transform: [{ scale: 1.05 }],
  },
  mesaEnGrupo: {
    shadowColor: "#228be6",
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  numeroMesa: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  iconoEstado: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    padding: 2,
  },
  grupoBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    padding: 3,
  },
  cantidadBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "#FF9500",
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cantidadTexto: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  nombreGrupoContainer: {
    position: "absolute",
    bottom: -18,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  nombreGrupoTexto: {
    fontSize: 9,
    fontWeight: "600",
    color: "#fff",
    textAlign: 'center',
  },
});
