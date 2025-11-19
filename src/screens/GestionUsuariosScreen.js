import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DashboardLayout from "../components/layout/DashboardLayout";
import UsuarioModal from "../components/UsuarioModal";
import {
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from "../services/usuarioService";
import { useAuth } from "../context/AuthContext";

export default function GestionUsuariosScreen({ onNavigate, currentScreen }) {
  const { user, logout } = useAuth();
  const displayName = user?.usuario || "Usuario";
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [modalEliminarVisible, setModalEliminarVisible] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err) {
      setError(err.message);
      console.error("Error al cargar usuarios:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const nombreUsuario = usuario.nombreUsuario?.toLowerCase() || "";
    const roles = usuario.roles?.join(" ").toLowerCase() || "";
    return (
      nombreUsuario.includes(busqueda.toLowerCase()) ||
      roles.includes(busqueda.toLowerCase())
    );
  });

  const handleAgregarUsuario = () => {
    setUsuarioEditando(null);
    setModalVisible(true);
  };

  const handleEditarUsuario = (usuario) => {
    setUsuarioEditando(usuario);
    setModalVisible(true);
  };

  const handleGuardarUsuario = async (datosUsuario) => {
    try {
      setGuardando(true);

      if (usuarioEditando) {
        // Actualizar usuario existente
        await actualizarUsuario(usuarioEditando.id, datosUsuario);
        Alert.alert("Éxito", "Usuario actualizado correctamente");
      } else {
        // Crear nuevo usuario
        await crearUsuario(datosUsuario);
        Alert.alert("Éxito", "Usuario creado correctamente");
      }

      setModalVisible(false);
      setUsuarioEditando(null);
      await cargarUsuarios();
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar el usuario");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarUsuario = (id, nombreUsuario) => {
    setUsuarioAEliminar({ id, nombreUsuario });
    setModalEliminarVisible(true);
  };

  const eliminarUsuarioConfirmado = async () => {
    console.log("🚀 eliminarUsuarioConfirmado llamado");
    console.log("Usuario a eliminar:", usuarioAEliminar);

    if (!usuarioAEliminar) {
      console.log("❌ No hay usuario a eliminar");
      return;
    }

    try {
      setEliminando(true);
      console.log("🗑️ Eliminando usuario ID:", usuarioAEliminar.id);
      const resultado = await eliminarUsuario(usuarioAEliminar.id);
      console.log("✅ Usuario eliminado, resultado:", resultado);
      Alert.alert("Éxito", "Usuario eliminado correctamente");
      setModalEliminarVisible(false);
      setUsuarioAEliminar(null);
      await cargarUsuarios(); // Recargar lista
    } catch (err) {
      console.error("❌ Error al eliminar:", err);
      Alert.alert("Error", err.message || "No se pudo eliminar el usuario");
      setModalEliminarVisible(false);
      setUsuarioAEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <DashboardLayout
      userName={displayName}
      onLogout={logout}
      onNavigate={onNavigate}
      currentScreen={currentScreen}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.titulo}>Gestión de Usuarios</Text>
          <TouchableOpacity
            style={styles.botonAgregar}
            onPress={handleAgregarUsuario}
          >
            <MaterialCommunityIcons
              name="plus-circle"
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.textoBotonAgregar}>Nuevo Usuario</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de Usuario */}
        <UsuarioModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setUsuarioEditando(null);
          }}
          onSave={handleGuardarUsuario}
          usuario={usuarioEditando}
          loading={guardando}
        />

        {/* Barra de búsqueda */}
        <View style={styles.barraBusqueda}>
          <MaterialCommunityIcons
            name="magnify"
            size={24}
            color="#666"
            style={styles.iconoBusqueda}
          />
          <TextInput
            style={styles.inputBusqueda}
            placeholder="Buscar por nombre o rol..."
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.centrado}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.textoLoading}>Cargando usuarios...</Text>
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={styles.centrado}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={48}
              color="#EF4444"
            />
            <Text style={styles.textoError}>{error}</Text>
            <TouchableOpacity
              style={styles.botonReintentar}
              onPress={cargarUsuarios}
            >
              <Text style={styles.textoBotonReintentar}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lista de usuarios */}
        {!loading && !error && (
          <ScrollView style={styles.listaUsuarios}>
            {usuariosFiltrados.length === 0 ? (
              <View style={styles.centrado}>
                <MaterialCommunityIcons
                  name="account-off"
                  size={48}
                  color="#9CA3AF"
                />
                <Text style={styles.textoVacio}>
                  {busqueda
                    ? "No se encontraron usuarios"
                    : "No hay usuarios registrados"}
                </Text>
              </View>
            ) : (
              usuariosFiltrados.map((usuario) => (
                <View key={usuario.id} style={styles.tarjetaUsuario}>
                  <View style={styles.infoUsuario}>
                    <View style={styles.headerUsuario}>
                      <Text style={styles.nombreUsuario}>
                        {usuario.nombreUsuario}
                      </Text>
                      <View
                        style={[
                          styles.estadoBadge,
                          usuario.activo
                            ? styles.estadoActivo
                            : styles.estadoInactivo,
                        ]}
                      >
                        <Text style={styles.textoEstado}>
                          {usuario.activo ? "Activo" : "Inactivo"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.rolesContainer}>
                      {usuario.roles && usuario.roles.length > 0 ? (
                        usuario.roles.map((rol, index) => (
                          <View key={index} style={styles.rolBadge}>
                            <Text style={styles.textoRol}>{rol}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.textoSinRoles}>
                          Sin roles asignados
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.acciones}>
                    <TouchableOpacity
                      style={styles.botonAccion}
                      onPress={() => handleEditarUsuario(usuario)}
                    >
                      <MaterialCommunityIcons
                        name="pencil"
                        size={20}
                        color="#3B82F6"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.botonAccion}
                      onPress={() =>
                        handleEliminarUsuario(usuario.id, usuario.nombreUsuario)
                      }
                    >
                      <MaterialCommunityIcons
                        name="delete"
                        size={20}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Modal de Confirmación para Eliminar */}
      <Modal
        visible={modalEliminarVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalEliminarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalEliminar}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={48}
              color="#EF4444"
              style={{ alignSelf: "center", marginBottom: 16 }}
            />
            <Text style={styles.modalEliminarTitulo}>Eliminar Usuario</Text>
            <Text style={styles.modalEliminarTexto}>
              ¿Estás seguro de que deseas eliminar el usuario{" "}
              <Text style={styles.modalEliminarNombre}>
                "{usuarioAEliminar?.nombreUsuario}"
              </Text>
              ?
            </Text>
            <Text style={styles.modalEliminarAdvertencia}>
              Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalEliminarBotones}>
              <TouchableOpacity
                style={styles.botonCancelar}
                onPress={() => {
                  setModalEliminarVisible(false);
                  setUsuarioAEliminar(null);
                }}
                disabled={eliminando}
              >
                <Text style={styles.textoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botonEliminar, eliminando && { opacity: 0.6 }]}
                onPress={eliminarUsuarioConfirmado}
                disabled={eliminando}
              >
                {eliminando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.textoEliminar}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
  },
  botonAgregar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  textoBotonAgregar: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  barraBusqueda: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  iconoBusqueda: {
    marginRight: 8,
  },
  inputBusqueda: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  textoLoading: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  textoError: {
    marginTop: 12,
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
  },
  botonReintentar: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#3B82F6",
    borderRadius: 8,
  },
  textoBotonReintentar: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  textoVacio: {
    marginTop: 12,
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
  },
  listaUsuarios: {
    flex: 1,
  },
  tarjetaUsuario: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoUsuario: {
    flex: 1,
  },
  headerUsuario: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  nombreUsuario: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  estadoBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  estadoActivo: {
    backgroundColor: "#D1FAE5",
  },
  estadoInactivo: {
    backgroundColor: "#FEE2E2",
  },
  textoEstado: {
    fontSize: 12,
    fontWeight: "600",
  },
  rolesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  rolBadge: {
    backgroundColor: "#DBEAFE",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  textoRol: {
    fontSize: 14,
    color: "#1E40AF",
    fontWeight: "500",
  },
  textoSinRoles: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  acciones: {
    flexDirection: "row",
    gap: 8,
  },
  botonAccion: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalEliminar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalEliminarTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  modalEliminarTexto: {
    fontSize: 16,
    color: "#4B5563",
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 24,
  },
  modalEliminarNombre: {
    fontWeight: "bold",
    color: "#1F2937",
  },
  modalEliminarAdvertencia: {
    fontSize: 14,
    color: "#EF4444",
    marginBottom: 24,
    textAlign: "center",
    fontStyle: "italic",
  },
  modalEliminarBotones: {
    flexDirection: "row",
    gap: 12,
  },
  botonCancelar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  textoCancelar: {
    color: "#4B5563",
    fontSize: 16,
    fontWeight: "600",
  },
  botonEliminar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  textoEliminar: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
