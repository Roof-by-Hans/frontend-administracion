import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

/**
 * Verifica si el usuario tiene únicamente el rol "Mozo"
 * @param {Array} roles - Array de roles del usuario
 * @returns {boolean} - true si solo tiene rol Mozo, false en caso contrario
 */
const isOnlyMozo = (roles) => {
  if (!roles || !Array.isArray(roles) || roles.length === 0) return false;
  return roles.length === 1 && roles[0] === "Mozo";
};

const mainMenuItems = [
  { icon: "table-furniture", label: "Gestionar Mesas", screen: "mesas" },
  {
    icon: "account-group-outline",
    label: "Gestionar Clientes",
    screen: "clientes",
  },
  { icon: "account-tie", label: "Gestionar Mozos", screen: "mozos" },
  { icon: "basket-outline", label: "Gestionar Productos", screen: "productos" },
  {
    icon: "shape-outline",
    label: "Gestionar Categorías",
    screen: "categorias",
  },
  { 
    icon: "file-document-outline", 
    label: "Facturas", 
    screen: "facturas",
    restrictedForOnlyMozo: true // Ocultar para usuarios solo con rol Mozo
  },
  { 
    icon: "cash-register", 
    label: "Caja", 
    screen: "caja",
    restrictedForOnlyMozo: true // Ocultar para usuarios solo con rol Mozo
  },
];

const secondaryMenuItems = [
  {
    icon: "card-text-outline",
    label: "Emitir Tarjeta",
    screen: "emitir-tarjeta",
    restrictedForOnlyMozo: true // Ocultar para usuarios solo con rol Mozo
  },
  { 
    icon: "cash-plus", 
    label: "Cargar Saldo", 
    screen: "cargar-saldo",
    restrictedForOnlyMozo: true // Ocultar para usuarios solo con rol Mozo
  },
  {
    icon: "account-cog-outline",
    label: "Gestión de Usuarios",
    screen: "gestion-usuarios",
    restrictedForOnlyMozo: true // Ocultar para usuarios solo con rol Mozo
  },
  { 
    icon: "cog-outline", 
    label: "Ajustes generales", 
    screen: "ajustes",
    restrictedForOnlyMozo: true // Ocultar para usuarios solo con rol Mozo
  },
];

const MenuSection = ({ title, items, compact, onNavigate, currentScreen }) => (
  <View style={[styles.section, compact && styles.sectionCompact]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {items.map((item) => (
      <Pressable
        key={item.label}
        style={({ hovered }) => [
          styles.menuItem,
          hovered && styles.menuItemHovered,
          currentScreen === item.screen && styles.menuItemActive,
        ]}
        android_ripple={{ color: "#e2e2e2" }}
        onPress={(e) => {
          e.preventDefault();
          onNavigate(item.screen);
        }}
      >
        <MaterialCommunityIcons
          name={item.icon}
          size={18}
          color={currentScreen === item.screen ? "#1f1f1f" : "#3f3f3f"}
          style={styles.menuIcon}
        />
        <Text
          style={[
            styles.menuLabel,
            currentScreen === item.screen && styles.menuLabelActive,
          ]}
        >
          {item.label}
        </Text>
      </Pressable>
    ))}
  </View>
);

export default function Sidebar({
  showCloseButton = false,
  onClose = () => {},
  onLogout = () => {},
  onNavigate = () => {},
  currentScreen = "",
}) {
  const { width } = useWindowDimensions();
  const isCompact = width < 900;
  const { user } = useAuth();
  
  // Determinar si el usuario tiene únicamente el rol "Mozo"
  const userIsOnlyMozo = user?.roles ? isOnlyMozo(user.roles) : false;
  
  // Filtrar ítems del menú según los roles del usuario
  const filteredMainMenuItems = mainMenuItems.filter(
    (item) => !(userIsOnlyMozo && item.restrictedForOnlyMozo)
  );
  
  const filteredSecondaryMenuItems = secondaryMenuItems.filter(
    (item) => !(userIsOnlyMozo && item.restrictedForOnlyMozo)
  );

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      {/* Header fijo */}
      <View
        style={[styles.brandHeader, isCompact && styles.brandHeaderCompact]}
      >
        <View
          style={[
            styles.brandContainer,
            isCompact && styles.brandContainerCompact,
          ]}
        >
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

      {/* Contenido scrolleable */}
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        <View
          style={[styles.menuWrapper, isCompact && styles.menuWrapperCompact]}
        >
          <MenuSection
            title="Menú principal"
            items={filteredMainMenuItems}
            compact={isCompact}
            onNavigate={onNavigate}
            currentScreen={currentScreen}
          />
          {filteredSecondaryMenuItems.length > 0 && (
            <MenuSection
              title="Otras configuraciones"
              items={filteredSecondaryMenuItems}
              compact={isCompact}
              onNavigate={onNavigate}
              currentScreen={currentScreen}
            />
          )}
        </View>
      </ScrollView>

      {/* Footer fijo */}
      <Pressable
        style={({ hovered }) => [
          styles.logout,
          hovered && styles.menuItemHovered,
        ]}
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
    height: "100%",
    backgroundColor: "#f1f1f1",
    borderRightWidth: 1,
    borderRightColor: "#e1e1e1",
    flexDirection: "column",
    ...(typeof window !== "undefined" && {
      position: "sticky",
      top: 0,
      alignSelf: "flex-start",
    }),
  },
  containerCompact: {
    width: "100%",
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  brandHeaderCompact: {
    paddingHorizontal: 20,
    paddingTop: 18,
    alignItems: "flex-start",
  },
  brandContainer: {
    alignItems: "center",
  },
  brandContainerCompact: {
    alignItems: "flex-start",
  },
  closeButton: {
    padding: 8,
    borderRadius: 18,
    backgroundColor: "#e8e8e8",
  },
  brandLogo: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    flexGrow: 1,
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
  menuItemActive: {
    backgroundColor: "#d8d8d8",
  },
  menuIcon: {
    marginRight: 0,
  },
  menuLabel: {
    fontSize: 14,
    color: "#4a4a4a",
  },
  menuLabelActive: {
    fontWeight: "600",
    color: "#1f1f1f",
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 36,
    borderRadius: 10,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e1e1e1",
    paddingTop: 18,
    paddingBottom: 18,
    marginTop: 8,
  },
});
