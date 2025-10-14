import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { Picker } from "@react-native-picker/picker";
import DashboardLayout from "../components/layout/DashboardLayout";
import CardPreview from "../components/CardPreview";
import { useAuth } from "../context/AuthContext";

export default function EmitirTarjetaScreen({ onNavigate, currentScreen }) {
  const [selectedClient, setSelectedClient] = useState("");
  const [subscriptionType, setSubscriptionType] = useState("credito");
  const { user, logout } = useAuth();
  const displayName = user?.usuario || "Usuario";
  const { width } = useWindowDimensions();
  const isCompact = width < 768;
  const isMedium = width >= 768 && width < 1024;

  // Mock data de clientes
  const clients = [
    { id: "1", name: "Máximo Majorel" },
    { id: "2", name: "Laura Pérez" },
    { id: "3", name: "Juan Andrade" },
    { id: "4", name: "Aurelio Lazcano" },
  ];

  const getClientName = () => {
    if (!selectedClient) return "NOMBRE APELLIDO";
    const client = clients.find((c) => c.id === selectedClient);
    return client ? client.name : "NOMBRE APELLIDO";
  };

  const handleEmitir = () => {
    if (!selectedClient) {
      alert("Por favor selecciona un cliente");
      return;
    }
    // Aquí iría la lógica para emitir la tarjeta
    alert(`Tarjeta emitida para ${getClientName()} con tipo: ${subscriptionType}`);
  };

  return (
    <DashboardLayout userName={displayName} onLogout={logout} onNavigate={onNavigate} currentScreen={currentScreen}>
      <View style={styles.wrapper}>
        <Text style={[styles.pageTitle, isCompact && styles.pageTitleCompact]}>
          Emitir nueva tarjeta
        </Text>

        {/* Contenedor principal con card y formulario lado a lado */}
        <View style={[styles.mainContainer, isCompact && styles.mainContainerCompact]}>
          {/* Card Preview a la izquierda */}
          <View style={styles.cardSection}>
            <CardPreview 
              clientName={getClientName()}
              cardNumber="1234 5678 9012 3456"
              expiryDate="12/24"
            />
          </View>

          {/* Formulario a la derecha */}
          <View style={styles.formContainer}>
            {/* Cliente Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Cliente</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedClient}
                  onValueChange={(value) => setSelectedClient(value)}
                  style={styles.picker}
                  dropdownIconColor="#666"
                >
                  <Picker.Item label="Seleccionar cliente..." value="" />
                  {clients.map((client) => (
                    <Picker.Item key={client.id} label={client.name} value={client.id} />
                  ))}
                </Picker>
              </View>
            </View>

          {/* Tipo de Subscripción */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tipo de Subscripción</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setSubscriptionType("credito")}
                activeOpacity={0.7}
              >
                <View style={styles.radioCircle}>
                  {subscriptionType === "credito" && <View style={styles.radioSelected} />}
                </View>
                <Text style={styles.radioLabel}>Crédito</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setSubscriptionType("prepago")}
                activeOpacity={0.7}
              >
                <View style={styles.radioCircle}>
                  {subscriptionType === "prepago" && <View style={styles.radioSelected} />}
                </View>
                <Text style={styles.radioLabel}>Pre pago</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón Emitir */}
          <TouchableOpacity
            style={[styles.submitButton, !selectedClient && styles.submitButtonDisabled]}
            onPress={handleEmitir}
            disabled={!selectedClient}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>Emitir</Text>
          </TouchableOpacity>
          </View>
        </View>
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1f1f1f",
    marginBottom: 32,
  },
  pageTitleCompact: {
    fontSize: 28,
    marginBottom: 20,
  },
  mainContainer: {
    flexDirection: "row",
    gap: 48,
    alignItems: "flex-start",
  },
  mainContainerCompact: {
    flexDirection: "column",
    gap: 24,
  },
  cardSection: {
    flex: 0,
    minWidth: 380,
  },
  formContainer: {
    flex: 1,
    maxWidth: 600,
    gap: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2f2f2f",
    marginBottom: 12,
  },
  pickerWrapper: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    paddingHorizontal: 12,
    overflow: "hidden",
    outlineStyle: "none",
  },
  picker: {
    height: 50,
    fontSize: 15,
    color: "#2f2f2f",
    backgroundColor: "transparent",
    borderWidth: 0,
    outlineStyle: "none",
  },
  radioGroup: {
    gap: 16,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#4a4a4a",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4a4a4a",
  },
  radioLabel: {
    fontSize: 15,
    color: "#3f3f3f",
  },
  submitButton: {
    backgroundColor: "#000000",
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 24,
    alignSelf: "flex-start",
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#9a9a9a",
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
