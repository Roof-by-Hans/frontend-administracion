import React from "react";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import Login from "./src/screens/Login";
import InvoicesScreen from "./src/screens/InvoicesScreen";

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <InvoicesScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}


