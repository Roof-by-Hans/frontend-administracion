import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useResponsive } from "../../utils/responsiveUtils";

export default function Topbar({
  userName = "Usuario",
  onLogout = () => {},
  showMenuButton = false,
  onMenuPress = () => {},
}) {
  const responsive = useResponsive();
  const { isMobile, isTablet } = responsive;


  return (
    <View style={[styles.container, isMobile && styles.containerCompact]}>
      <View style={[styles.leftBlock, isMobile && styles.leftBlockCompact]}>
        {showMenuButton && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={onMenuPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Abrir menú de navegación"
          >
            <MaterialCommunityIcons name="menu" size={24} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={[styles.greetingText, isMobile && styles.greetingTextCompact]} numberOfLines={1}>
          ¡Hola <Text style={styles.userName}>{userName}</Text>!
        </Text>
      </View>

      <View style={[styles.rightBlock, isMobile && styles.rightBlockCompact]}>
        {!isMobile && (
          <View style={styles.userActions}>
            <MaterialCommunityIcons name="account-circle" size={28} color="#4a4a4a" />
            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.7}
              onPress={onLogout}
              accessibilityLabel="Cerrar sesión"
            >
              <MaterialCommunityIcons name="logout" size={18} color="#2f2f2f" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  paddingHorizontal: 32,
  paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
    backgroundColor: "#f5f5f5",
    gap: 24,
  },
  greetingText: {
    flex: 1,
    fontSize: 26,
    color: "#2d2d2d",
    fontWeight: "600",
  },
  userName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  leftBlock: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 16,
    minWidth: 0,
  },
  leftBlockCompact: {
    width: "100%",
    marginBottom: 4,
  },
  rightBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginLeft: "auto",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#e9e9e9",
    borderWidth: 1,
    borderColor: "#d2d2d2",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2f2f2f",
  },
  containerCompact: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  greetingTextCompact: {
    width: "100%",
    fontSize: 24,
  },
  rightBlockCompact: {
    marginLeft: 0,
    alignSelf: "flex-end",
  },
  userActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  menuButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#e8e8e8",
    marginRight: 4,
  },
});
