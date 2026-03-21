import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  PanResponder,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CIRCLE_SIZE = Math.min(SCREEN_WIDTH * 0.7, 400);

export default function RecortarImagenModal({ visible, onClose, onConfirm, imageUri, loading }) {
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const hasInitialized = useRef(false);  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    if (visible && imageUri && !hasInitialized.current) {
      setPosition({ x: 0, y: 0 });
      offsetRef.current = { x: 0, y: 0 };
      positionRef.current = { x: 0, y: 0 };
      
      Image.getSize(
        imageUri,
        (width, height) => {
          setImageDimensions({ width, height });          const scaleToFill = Math.max(CIRCLE_SIZE / width, CIRCLE_SIZE / height);
          setMinZoom(scaleToFill);
          setZoom(scaleToFill);
          hasInitialized.current = true;
        },
        (error) => {
          console.error("Error al cargar imagen:", error);
          setMinZoom(1);
          setZoom(1);
          hasInitialized.current = true;
        }
      );
    }
    
        if (!visible) {
      hasInitialized.current = false;
    }
  }, [visible, imageUri]);

  const maxOffset = CIRCLE_SIZE * 0.8;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !loading,
      onMoveShouldSetPanResponder: () => !loading,
      onPanResponderGrant: () => {        offsetRef.current = { x: positionRef.current.x, y: positionRef.current.y };
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(-maxOffset, Math.min(maxOffset, offsetRef.current.x + gestureState.dx));
        const newY = Math.max(-maxOffset, Math.min(maxOffset, offsetRef.current.y + gestureState.dy));
        setPosition({ x: newX, y: newY });
      },
    })
  ).current;

  const handleConfirmar = () => {
    onConfirm({
      zoom: zoom,
      position: position,
      imageWidth: imageDimensions.width,
      imageHeight: imageDimensions.height,
      circleSize: CIRCLE_SIZE,
    });
  };

  const handleCerrar = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    positionRef.current = { x: 0, y: 0 };
    hasInitialized.current = false;
    onClose();
  };

  const handleReset = () => {
    if (imageDimensions.width && imageDimensions.height) {
      const scaleToFill = Math.max(CIRCLE_SIZE / imageDimensions.width, CIRCLE_SIZE / imageDimensions.height);
      setZoom(scaleToFill);
      setMinZoom(scaleToFill);
    }
    setPosition({ x: 0, y: 0 });
    offsetRef.current = { x: 0, y: 0 };
    positionRef.current = { x: 0, y: 0 };
  };

  if (!imageUri) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCerrar}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.titulo}>Ajustar foto de perfil</Text>
            <TouchableOpacity onPress={handleCerrar} disabled={loading}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

           de recorte */}
          <View style={styles.previewContainer}>
            <View style={styles.circleClip}>
              <View
                style={styles.imageContainer}
                {...panResponder.panHandlers}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    width: imageDimensions.width * zoom,
                    height: imageDimensions.height * zoom,
                    transform: [
                      { translateX: position.x },
                      { translateY: position.y },
                    ],
                  }}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>

          {/* Instrucciones */}
          <View style={styles.instruccionesContainer}>
            <Text style={styles.instrucciones}>
              • Arrastra la imagen para posicionarla{"\n"}
              • Usa el deslizador para hacer zoom
            </Text>
          </View>

          {/* Controles de zoom */}
          <View style={styles.zoomContainer}>
            <MaterialCommunityIcons name="magnify-minus" size={24} color="#666" />
            <Slider
              style={styles.slider}
              minimumValue={minZoom}
              maximumValue={minZoom * 3}
              value={zoom}
              onValueChange={setZoom}
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#ddd"
              thumbTintColor="#4CAF50"
            />
            <MaterialCommunityIcons name="magnify-plus" size={24} color="#666" />
          </View>

          {/* es */}
          <View style={styles.botonesContainer}>
            <TouchableOpacity
              style={[styles.boton, styles.botonSecundario]}
              onPress={handleReset}
              disabled={loading}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#666" />
              <Text style={[styles.botonTexto, { marginLeft: 5 }]}>Reiniciar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.boton, styles.botonCancelar]}
              onPress={handleCerrar}
              disabled={loading}
            >
              <Text style={styles.botonTexto}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.boton, styles.botonConfirmar, loading && styles.botonDisabled]}
              onPress={handleConfirmar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.botonTexto, styles.botonConfirmarTexto]}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    maxWidth: 600,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  previewContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 20,
  },
  circleClip: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  imageContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  instruccionesContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  instrucciones: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  zoomContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 15,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  botonesContainer: {
    flexDirection: "row",
    marginTop: 20,
    gap: 10,
  },
  boton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  botonSecundario: {
    backgroundColor: "#f0f0f0",
  },
  botonCancelar: {
    backgroundColor: "#e0e0e0",
  },
  botonConfirmar: {
    backgroundColor: "#4CAF50",
  },
  botonDisabled: {
    backgroundColor: "#ccc",
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  botonConfirmarTexto: {
    color: "#fff",
  },
});
