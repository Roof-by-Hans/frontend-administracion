import React, { useRef, useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Animated, PanResponder } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Mesa({ 
  numero, 
  estado = "libre",
  posicion = { x: 0, y: 0 },
  onPosicionChange,
  onPress,
  unidaCon = [],
  isSelected = false,
  draggable = false,
}) {
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
    if (onPress) {
      onPress(numero);
    }
  };

  const backgroundColor = estado === "ocupada" 
    ? "#ff6b6b" 
    : "#51cf66";

  const borderColor = isSelected 
    ? "#ffd43b" 
    : estado === "ocupada" 
      ? "#fa5252" 
      : "#37b24d";

  const borderWidth = isSelected ? 5 : 3;

  const mesaStyle = [
    styles.mesa,
    { backgroundColor, borderColor, borderWidth },
    isSelected && styles.mesaSelected,
    draggable && styles.mesaDraggable,
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
      {...panResponder.panHandlers}
    >
      <Pressable
        onPress={handlePress}
        style={mesaStyle}
        android_ripple={{ color: "rgba(255,255,255,0.3)" }}
        // permitir eventos de puntero para todos los modos; la lógica de "draggable" la manejamos desde el padre
        pointerEvents="auto"
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

        {/* Indicador de mesas unidas */}
        {unidaCon.length > 0 && (
          <View style={styles.unidaIndicador}>
            <MaterialCommunityIcons name="link-variant" size={14} color="#fff" />
            <Text style={styles.unidaTexto}>+{unidaCon.length}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

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
  unidaIndicador: {
    position: "absolute",
    bottom: 4,
    right: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  unidaTexto: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
});
