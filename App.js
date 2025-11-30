import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { SocketProvider } from "./src/context/SocketContext";
import Login from "./src/screens/Login";
import FacturasScreen from "./src/screens/FacturasScreen";
import EmitirTarjetaScreen from "./src/screens/EmitirTarjetaScreen";
import CargarSaldoScreen from "./src/screens/CargarSaldoScreen";
import MesasScreen from "./src/screens/MesasScreen";
import ClientesScreen from "./src/screens/ClientesScreen";
import AjustesScreen from "./src/screens/AjustesScreen";
import MozosScreen from "./src/screens/MozosScreen";
import GestionUsuariosScreen from "./src/screens/GestionUsuariosScreen";
import ProductosScreen from "./src/screens/ProductosScreen";
import CajaScreen from "./src/screens/CajaScreen";
import CategoriasScreen from "./src/screens/CategoriasScreen";

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentScreen, setCurrentScreen] = useState("mesas"); // Pantalla inicial

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
    case "clientes":
      return (
        <ClientesScreen
          onNavigate={handleNavigate}
          currentScreen={currentScreen}
        />
      );
    case "mozos":
      return (
        <MozosScreen
          onNavigate={handleNavigate}
          currentScreen={currentScreen}
        />
      );
    case "gestion-usuarios":
      return (
        <GestionUsuariosScreen
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
    case "caja":
      return (
        <CajaScreen
          onNavigate={handleNavigate}
          currentScreen={currentScreen}
        />
      );
    case "categorias":
      return (
        <CategoriasScreen
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
    case "cargar-saldo":
      return (
        <CargarSaldoScreen
          onNavigate={handleNavigate}
          currentScreen={currentScreen}
        />
      );
    case "ajustes":
      return (
        <AjustesScreen
          onNavigate={handleNavigate}
          currentScreen={currentScreen}
        />
      );
    case "facturas":
    default:
      return (
        <FacturasScreen
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
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
