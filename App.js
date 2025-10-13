import React from "react";
import { AuthProvider } from "./src/context/AuthContext";
import Login from "./src/components/Login";

export default function App() {
  return (
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
}


