import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";


export default function RfidScanModal({
  visible,
  status = "scanning",
  uid,
  errorMessage,
  onClose,
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && status === "scanning") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else if (visible && (status === "success" || status === "error")) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
      scaleAnim.setValue(0);
    }
  }, [visible, status]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

    const getConfig = () => {
    switch (status) {
      case "success":
        return {
          icon: "check-circle",
          iconColor: "#4CAF50",
          title: "¡Tarjeta detectada!",
          message: uid ? `UID: ${uid}` : "Tarjeta leída exitosamente",
          showButton: true,
        };
      case "error":
        return {
          icon: "alert-circle",
          iconColor: "#f44336",
          title: "Error de lectura",
          message:
            errorMessage ||
            "No se pudo leer la tarjeta. Por favor, intente nuevamente.",
          showButton: true,
        };
      default: 
        return {
          icon: "contactless-payment",
          iconColor: "#4CAF50",
          title: "Esperando tarjeta",
          message: "Por favor, apoye la tarjeta en el lector",
          showButton: false,
        };
    }
  };

  const config = getConfig();

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          
          {status === "scanning" ? (
            <>
              
              <View style={styles.iconContainer}>
                
                <Animated.View
                  style={[
                    styles.wave,
                    styles.waveOuter,
                    { transform: [{ rotate: spin }] },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.wave,
                    styles.waveMiddle,
                    { transform: [{ rotate: spin }] },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.wave,
                    styles.waveInner,
                    { transform: [{ rotate: spin }] },
                  ]}
                />

                
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <MaterialCommunityIcons
                    name={config.icon}
                    size={80}
                    color={config.iconColor}
                  />
                </Animated.View>
              </View>

               
              <Text style={styles.title}>{config.title}</Text>

              
              <Text style={styles.message}>{config.message}</Text>

              
              <View style={styles.dotsContainer}>
                <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
                <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
                <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
              </View>
            </>
          ) : (
            <>
              
              <Animated.View
                style={[
                  styles.resultIconContainer,
                  { transform: [{ scale: scaleAnim }] },
                ]}
              >
                <MaterialCommunityIcons
                  name={config.icon}
                  size={100}
                  color={config.iconColor}
                />
              </Animated.View>

               
              <Text style={styles.title}>{config.title}</Text>

              
              <Text style={styles.message}>{config.message}</Text>

               
              {config.showButton && (
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    status === "error" && styles.closeButtonError,
                  ]}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeButtonText}>
                    {status === "success" ? "Continuar" : "Cerrar"}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    maxWidth: 420,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    position: "relative",
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  wave: {
    position: "absolute",
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  waveOuter: {
    width: 160,
    height: 160,
    opacity: 0.2,
  },
  waveMiddle: {
    width: 120,
    height: 120,
    opacity: 0.3,
  },
  waveInner: {
    width: 80,
    height: 80,
    opacity: 0.4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  resultIconContainer: {
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 24,
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButtonError: {
    backgroundColor: "#f44336",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
