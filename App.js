import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import Login from "./src/screens/Login";
import InvoicesScreen from "./src/screens/InvoicesScreen";
import EmitirTarjetaScreen from "./src/screens/EmitirTarjetaScreen";

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
  if (currentScreen === "emitir-tarjeta") {
    return <EmitirTarjetaScreen onNavigate={handleNavigate} currentScreen={currentScreen} />;
  }

  // Por defecto, mostrar facturas
  return <InvoicesScreen onNavigate={handleNavigate} currentScreen={currentScreen} />;
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


