import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
} from "react-native";

export default function DemoModal({ visible, onClose }) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Demo Modal 🎉</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalText}>
              ¡Este es un popup de demostración!
            </Text>
            <Text style={styles.modalDescription}>
              Puedes cerrar este modal haciendo clic en el botón de cerrar,
              presionando el botón de abajo, o tocando fuera del modal.
            </Text>

            <View style={styles.demoContent}>
              <Text style={styles.demoEmoji}>✨</Text>
              <Text style={styles.demoText}>
                Contenido de ejemplo para tu modal
              </Text>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.actionButton} onPress={onClose}>
              <Text style={styles.actionButtonText}>Cerrar Modal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
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
  modalContent: {
    backgroundColor: "#242424",
    borderRadius: 12,
    width: "90%",
    maxWidth: 500,
    borderWidth: 1,
    borderColor: "#646cff",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalBody: {
    padding: 24,
  },
  modalText: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 12,
    fontWeight: "600",
  },
  modalDescription: {
    fontSize: 14,
    color: "#aaa",
    lineHeight: 20,
    marginBottom: 20,
  },
  demoContent: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  demoEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  demoText: {
    color: "#646cff",
    fontSize: 16,
    textAlign: "center",
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  actionButton: {
    backgroundColor: "#646cff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
