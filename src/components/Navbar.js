import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

export default function Navbar({ onOpenModal }) {
  return (
    <View style={styles.navbar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.navContent}
      >
        <Text style={styles.logo}>React App 🚀</Text>

        <View style={styles.navLinks}>
          <TouchableOpacity style={styles.navLink}>
            <Text style={styles.navLinkText}>Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navLink}>
            <Text style={styles.navLinkText}>Acerca</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navLink}>
            <Text style={styles.navLinkText}>Servicios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navLink, styles.modalButton]}
            onPress={onOpenModal}
          >
            <Text style={styles.modalButtonText}>Abrir Demo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#646cff",
  },
  navContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: "100%",
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#646cff",
    marginRight: 32,
  },
  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  navLink: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navLinkText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  modalButton: {
    backgroundColor: "#646cff",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
