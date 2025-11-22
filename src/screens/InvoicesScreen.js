import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useResponsive } from "../utils/responsiveUtils";

export default function InvoicesScreen({ onNavigate, currentScreen }) {
  const [selectedClient, setSelectedClient] = useState("maximo");
  const { user, logout } = useAuth();
  const displayName = user?.usuario || "Usuario";
  const responsive = useResponsive();
  const { isMobile, isTablet } = responsive;


  return (
    <DashboardLayout userName={displayName} onLogout={logout} onNavigate={onNavigate} currentScreen={currentScreen}>
      <View style={styles.wrapper}>
        <Text
          style={[styles.pageTitle, isMobile && styles.pageTitleCompact]}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          Facturas
        </Text>
        <Text style={[styles.pageSubtitle, isMobile && styles.pageSubtitleCompact]}>
          Gestiona y revisa las facturas generadas para tus clientes.
        </Text>

        <View style={[styles.filterRow, isMobile && styles.filterRowCompact]}>
          <Text style={[styles.filterLabel, isMobile && styles.filterLabelMobile]}>Seleccione un cliente:</Text>
          <View style={[styles.pickerWrapper, isMobile && styles.pickerWrapperCompact]}>
            <Picker
              selectedValue={selectedClient}
              onValueChange={(value) => setSelectedClient(value)}
              dropdownIconColor="#2e2e2e"
            >
              <Picker.Item label="Máximo Majorel" value="maximo" />
              <Picker.Item label="Laura Pérez" value="laura" />
              <Picker.Item label="Juan Andrade" value="juan" />
            </Picker>
          </View>
        </View>

        <View style={[styles.placeholderCard, isMobile && styles.placeholderCardCompact]}>
          <Text style={[styles.placeholderTitle, isMobile && styles.placeholderTitleMobile]}>Facturas del cliente</Text>
          <Text style={[styles.placeholderText, isMobile && styles.placeholderTextMobile]}>
            Aquí se listarán las facturas correspondientes a {selectedClient === "maximo" ? "Máximo Majorel" : selectedClient === "laura" ? "Laura Pérez" : "Juan Andrade"}.
          </Text>
        </View>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingTop: 16,
  },
  pageTitle: {
    fontSize: 40,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  pageTitleCompact: {
    fontSize: 32,
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#6b6b6b",
    marginTop: 8,
    marginBottom: 24,
  },
  pageSubtitleCompact: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 12,
  },
  filterRowCompact: {
    alignItems: "flex-start",
  },
  filterLabel: {
    fontSize: 16,
    color: "#333",
  },
  filterLabelMobile: {
    fontSize: 15,
    marginBottom: 8,
  },
  pickerWrapper: {
    width: 220,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d0d0d0",
  },
  pickerWrapperCompact: {
    width: "100%",
  },
  placeholderCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  placeholderCardCompact: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2f2f2f",
  },
  placeholderTitleMobile: {
    fontSize: 17,
  },
  placeholderText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  placeholderTextMobile: {
    fontSize: 15,
  },
});
