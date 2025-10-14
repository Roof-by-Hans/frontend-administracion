import React from "react";
import { View, Text, StyleSheet, Pressable, Image, TouchableOpacity, useWindowDimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const mainMenuItems = [
  { icon: "table-furniture", label: "Gestionar Mesas" },
  { icon: "account-group-outline", label: "Gestionar Clientes" },
  { icon: "account-tie", label: "Gestionar Mozos" },
  { icon: "basket-outline", label: "Gestionar Productos" },
  { icon: "file-document-outline", label: "Facturas" },
  { icon: "cash-register", label: "Caja" },
];

const secondaryMenuItems = [
  { icon: "card-text-outline", label: "Emitir Tarjeta" },
  { icon: "cog-outline", label: "Ajustes generales" },
];

const MenuSection = ({ title, items, compact }) => (
  <View style={[styles.section, compact && styles.sectionCompact]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {items.map((item) => (
      <Pressable
        key={item.label}
        style={({ hovered }) => [styles.menuItem, hovered && styles.menuItemHovered]}
        android_ripple={{ color: "#e2e2e2" }}
      >
        <MaterialCommunityIcons
          name={item.icon}
          size={18}
          color="#3f3f3f"
          style={styles.menuIcon}
        />
        <Text style={styles.menuLabel}>{item.label}</Text>
      </Pressable>
    ))}
  </View>
);

export default function Sidebar({ showCloseButton = false, onClose = () => {}, onLogout = () => {} }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 900;

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      <View style={styles.topSection}>
        <View style={[styles.brandHeader, isCompact && styles.brandHeaderCompact]}>
          <View style={[styles.brandContainer, isCompact && styles.brandContainerCompact]}>
          <Image
            source={require("../../../assets/hans-logo.png")}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>Roof by Hans</Text>
        </View>
          {showCloseButton && (
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Cerrar menú"
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="close" size={22} color="#3f3f3f" />
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.menuWrapper, isCompact && styles.menuWrapperCompact]}>
          <MenuSection title="Menú principal" items={mainMenuItems} compact={isCompact} />
          <MenuSection title="Otras configuraciones" items={secondaryMenuItems} compact={isCompact} />
        </View>
      </View>

      <Pressable
        style={({ hovered }) => [styles.logout, hovered && styles.menuItemHovered]}
        android_ripple={{ color: "#e2e2e2" }}
        onPress={onLogout}
      >
        <MaterialCommunityIcons
          name="logout"
          size={18}
          color="#4a4a4a"
          style={styles.menuIcon}
        />
        <Text style={styles.menuLabel}>Cerrar Sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRightWidth: 1,
    borderRightColor: "#e1e1e1",
    justifyContent: "space-between",
  },
  containerCompact: {
    width: "100%",
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  topSection: {
    width: "100%",
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brandHeaderCompact: {
    alignItems: "flex-start",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  brandContainerCompact: {
    alignItems: "flex-start",
  },
  closeButton: {
    padding: 8,
    borderRadius: 18,
    backgroundColor: "#e8e8e8",
    marginBottom: 24,
  },
  brandLogo: {
    width: 48,
    height: 48,
    marginBottom: 12,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  menuWrapper: {
    gap: 32,
  },
  menuWrapperCompact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionCompact: {
    flex: 1,
    minWidth: 220,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f1f1f",
    marginBottom: 18,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
  menuItemHovered: {
    backgroundColor: "#e7e7e7",
  },
  menuIcon: {
    marginRight: 0,
  },
  menuLabel: {
    fontSize: 14,
    color: "#4a4a4a",
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
});
