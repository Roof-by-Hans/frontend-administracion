import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import Login from "./src/screens/Login";
import InvoicesScreen from "./src/screens/InvoicesScreen";
import EmitirTarjetaScreen from "./src/screens/EmitirTarjetaScreen";
import MesasScreen from "./src/screens/MesasScreen";
import ProductosScreen from "./src/screens/ProductosScreen";

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentScreen, setCurrentScreen] = useState("facturas"); // Pantalla inicial

  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  // Renderizar la pantalla según el estado actual
  switch (currentScreen) {
    case "mesas":
      return (
        <MesasScreen
          onNavigate={handleNavigate}
          currentScreen={currentScreen}
        />
      );
    case "productos":
      return (
        <ProductosScreen
          onNavigate={handleNavigate}
          currentScreen={currentScreen}
        />
      );
    case "emitir-tarjeta":
      return (
        <EmitirTarjetaScreen
          onNavigate={handleNavigate}
          currentScreen={currentScreen}
        />
      );
    case "facturas":
    default:
      return (
        <InvoicesScreen
          onNavigate={handleNavigate}
          currentScreen={currentScreen}
        />
      );
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
