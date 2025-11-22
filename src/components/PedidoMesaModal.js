import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert as RNAlert,
} from "react-native";
import Alert from "@blazejkustra/react-native-alert";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getProductos } from "../services/productosService";
import clientesService from "../services/clientesService";
import pedidosService from "../services/pedidosService";

/**
 * Modal para crear/editar pedidos en mesas o grupos de mesas
 * NOTA: Los pedidos se guardan temporalmente, la factura se genera al cobrar
 */
export default function PedidoMesaModal({ visible, onClose, mesa, grupo, onPedidoCreado, pedidoEnEdicion = null }) {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [busquedaProducto, setBusquedaProducto] = useState("");

  // Cargar datos iniciales
  useEffect(() => {
    if (visible) {
      cargarDatos();
    }
  }, [visible]);

  // Cargar datos del pedido en edición cuando estén listos los clientes
  useEffect(() => {
    if (visible && pedidoEnEdicion && clientes.length > 0) {
      console.log('📝 Cargando pedido en edición:', pedidoEnEdicion);
      const cliente = clientes.find(c => c.id === pedidoEnEdicion.idCliente);
      setClienteSeleccionado(cliente || null);
      setProductosSeleccionados(pedidoEnEdicion.productos || []);
      setObservaciones(pedidoEnEdicion.observaciones || "");
    } else if (visible && !pedidoEnEdicion) {
      // Limpiar formulario si no hay pedido en edición
      setClienteSeleccionado(null);
      setProductosSeleccionados([]);
      setObservaciones("");
    }
  }, [visible, pedidoEnEdicion, clientes]);

  const cargarDatos = async () => {
    try {
      setLoadingData(true);
      const [clientesData, productosData] = await Promise.all([
        clientesService.getClientes(),
        getProductos(),
      ]);

      setClientes(clientesData.data || clientesData || []);
      setProductos(productosData.data || productosData || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      Alert.alert("Error", "No se pudieron cargar los datos necesarios");
    } finally {
      setLoadingData(false);
    }
  };

  const clientesFiltrados = clientes.filter((cliente) => {
    const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`.toLowerCase();
    return nombreCompleto.includes(busquedaCliente.toLowerCase());
  });

  const productosFiltrados = productos.filter((producto) =>
    producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())
  );

  const agregarProducto = (producto) => {
    const existe = productosSeleccionados.find((p) => p.idProducto === producto.id);
    
    if (existe) {
      setProductosSeleccionados(
        productosSeleccionados.map((p) =>
          p.idProducto === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        )
      );
    } else {
      setProductosSeleccionados([
        ...productosSeleccionados,
        {
          idProducto: producto.id,
          nombre: producto.nombre,
          cantidad: 1,
          precioUnitario: parseFloat(producto.precio_unitario || producto.precioUnitario || 0),
        },
      ]);
    }
  };

  const actualizarCantidad = (idProducto, cantidad) => {
    if (cantidad <= 0) {
      setProductosSeleccionados(productosSeleccionados.filter((p) => p.idProducto !== idProducto));
    } else {
      setProductosSeleccionados(
        productosSeleccionados.map((p) =>
          p.idProducto === idProducto ? { ...p, cantidad } : p
        )
      );
    }
  };

  const calcularTotal = () => {
    return productosSeleccionados.reduce(
      (total, p) => total + p.cantidad * p.precioUnitario,
      0
    );
  };

  const handleCrearPedido = async () => {
    // Validaciones
    if (!clienteSeleccionado) {
      Alert.alert("Error", "Debe seleccionar un cliente");
      return;
    }

    if (productosSeleccionados.length === 0) {
      Alert.alert("Error", "Debe agregar al menos un producto");
      return;
    }

    try {
      setLoading(true);

      const datos = {
        idCliente: clienteSeleccionado.id,
        nombreCliente: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`,
        productos: productosSeleccionados.map((p) => ({
          idProducto: p.idProducto,
          nombre: p.nombre,
          cantidad: p.cantidad,
          precioUnitario: p.precioUnitario,
        })),
        observaciones: observaciones.trim() || undefined,
      };

      // Agregar idMesa o idGrupo según corresponda
      if (grupo) {
        datos.idGrupo = grupo.id;
        datos.nombreGrupo = grupo.nombre;
        console.log('🔵 Creando pedido para GRUPO:', grupo.id);
      } else if (mesa) {
        datos.idMesa = mesa.idMesa || mesa.id;
        datos.numeroMesa = mesa.numero;
        console.log('🔵 Creando pedido para MESA:', datos.idMesa);
      }

      console.log('🔵 Datos del pedido:', datos);

      // Si es edición, eliminar el pedido viejo primero
      if (pedidoEnEdicion) {
        const clave = grupo ? `grupo-${grupo.id}` : `mesa-${datos.idMesa}`;
        await pedidosService.eliminarPedido(pedidoEnEdicion.id, clave);
      }

      // Guardar pedido temporalmente (NO genera factura aún)
      const pedido = await pedidosService.crearPedido(datos);

      // Notificar éxito y cerrar sin alerta
      onPedidoCreado?.(pedido);
      resetearFormulario();
      onClose();
    } catch (error) {
      console.error("Error al crear pedido:", error);
      const mensaje = error.response?.data?.message || error.message || "No se pudo crear el pedido";
      Alert.alert("Error", mensaje);
    } finally {
      setLoading(false);
    }
  };

  const resetearFormulario = () => {
    setClienteSeleccionado(null);
    setProductosSeleccionados([]);
    setObservaciones("");
    setBusquedaCliente("");
    setBusquedaProducto("");
  };

  const handleClose = () => {
    if (productosSeleccionados.length > 0 || clienteSeleccionado) {
      Alert.alert(
        "¿Cancelar pedido?",
        "Se perderán los datos ingresados",
        [
          { text: "No", style: "cancel" },
          {
            text: "Sí",
            onPress: () => {
              resetearFormulario();
              onClose();
            },
          },
        ]
      );
    } else {
      resetearFormulario();
      onClose();
    }
  };

  const nombreMesaGrupo = grupo 
    ? `Grupo: ${grupo.nombre}`
    : mesa 
    ? `Mesa ${mesa.numero}`
    : "Pedido";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{pedidoEnEdicion ? 'Editar Pedido' : 'Nuevo Pedido'}</Text>
              <Text style={styles.subtitle}>{nombreMesaGrupo}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {loadingData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Cargando datos...</Text>
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Selección de Cliente */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cliente *</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar cliente..."
                  value={busquedaCliente}
                  onChangeText={setBusquedaCliente}
                  placeholderTextColor="#999"
                />
                
                {clienteSeleccionado ? (
                  <View style={styles.clienteSeleccionado}>
                    <View style={styles.clienteInfo}>
                      <MaterialCommunityIcons name="account" size={24} color="#007AFF" />
                      <View style={styles.clienteTexto}>
                        <Text style={styles.clienteNombre}>
                          {clienteSeleccionado.nombre} {clienteSeleccionado.apellido}
                        </Text>
                        <Text style={styles.clienteEmail}>{clienteSeleccionado.email}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setClienteSeleccionado(null)}>
                      <MaterialCommunityIcons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView style={styles.clientesList} nestedScrollEnabled>
                    {clientesFiltrados.length === 0 ? (
                      <Text style={styles.emptyText}>No se encontraron clientes</Text>
                    ) : (
                      clientesFiltrados.map((cliente) => (
                        <TouchableOpacity
                          key={cliente.id}
                          style={styles.clienteItem}
                          onPress={() => setClienteSeleccionado(cliente)}
                        >
                          <MaterialCommunityIcons name="account-outline" size={20} color="#666" />
                          <Text style={styles.clienteItemText}>
                            {cliente.nombre} {cliente.apellido}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                )}
              </View>

              {/* Selección de Productos */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Productos *</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar producto..."
                  value={busquedaProducto}
                  onChangeText={setBusquedaProducto}
                  placeholderTextColor="#999"
                />

                {/* Productos Seleccionados */}
                {productosSeleccionados.length > 0 && (
                  <View style={styles.productosSeleccionados}>
                    {productosSeleccionados.map((producto) => (
                      <View key={producto.idProducto} style={styles.productoSeleccionado}>
                        <View style={styles.productoInfo}>
                          <Text style={styles.productoNombre}>{producto.nombre}</Text>
                          <Text style={styles.productoPrecio}>
                            ${producto.precioUnitario.toFixed(2)} c/u
                          </Text>
                        </View>
                        <View style={styles.cantidadControl}>
                          <TouchableOpacity
                            onPress={() => actualizarCantidad(producto.idProducto, producto.cantidad - 1)}
                            style={styles.cantidadBtn}
                          >
                            <MaterialCommunityIcons name="minus" size={18} color="#007AFF" />
                          </TouchableOpacity>
                          <Text style={styles.cantidadText}>{producto.cantidad}</Text>
                          <TouchableOpacity
                            onPress={() => actualizarCantidad(producto.idProducto, producto.cantidad + 1)}
                            style={styles.cantidadBtn}
                          >
                            <MaterialCommunityIcons name="plus" size={18} color="#007AFF" />
                          </TouchableOpacity>
                          <Text style={styles.subtotal}>
                            ${(producto.cantidad * producto.precioUnitario).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Lista de Productos Disponibles */}
                <ScrollView style={styles.productosList} nestedScrollEnabled>
                  {productosFiltrados.length === 0 ? (
                    <Text style={styles.emptyText}>No se encontraron productos</Text>
                  ) : (
                    productosFiltrados.map((producto) => (
                      <TouchableOpacity
                        key={producto.id}
                        style={styles.productoItem}
                        onPress={() => agregarProducto(producto)}
                      >
                        <View style={styles.productoItemInfo}>
                          <Text style={styles.productoItemNombre}>{producto.nombre}</Text>
                          <Text style={styles.productoItemCategoria}>
                            {producto.categoria?.nombre || producto.categoriaProducto?.nombre || "Sin categoría"}
                          </Text>
                        </View>
                        <View style={styles.productoItemAccion}>
                          <Text style={styles.productoItemPrecio}>
                            ${parseFloat(producto.precio_unitario || producto.precioUnitario || 0).toFixed(2)}
                          </Text>
                          <MaterialCommunityIcons name="plus-circle" size={24} color="#34C759" />
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>

              {/* Observaciones */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Observaciones (opcional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Agregar notas sobre el pedido..."
                  value={observaciones}
                  onChangeText={setObservaciones}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                />
              </View>

              {/* Total */}
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalMonto}>${calcularTotal().toFixed(2)}</Text>
              </View>
            </ScrollView>
          )}

          {/* Footer con Botones */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.buttonSecondaryText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
              onPress={handleCrearPedido}
              disabled={loading || loadingData}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color="#fff" />
                  <Text style={styles.buttonPrimaryText}>{pedidoEnEdicion ? 'Actualizar' : 'Crear Pedido'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    maxWidth: 600,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f1f1f",
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  clientesList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
  },
  clienteItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 12,
  },
  clienteItemText: {
    fontSize: 14,
    color: "#333",
  },
  clienteSeleccionado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  clienteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  clienteTexto: {
    flex: 1,
  },
  clienteNombre: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f1f1f",
  },
  clienteEmail: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  productosList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
  },
  productoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  productoItemInfo: {
    flex: 1,
  },
  productoItemNombre: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  productoItemCategoria: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  productoItemAccion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  productoItemPrecio: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  productosSeleccionados: {
    marginBottom: 12,
    gap: 8,
  },
  productoSeleccionado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f1f1f",
  },
  productoPrecio: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  cantidadControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cantidadBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  cantidadText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f1f1f",
    minWidth: 30,
    textAlign: "center",
  },
  subtotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#007AFF",
    minWidth: 70,
    textAlign: "right",
  },
  textArea: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    textAlignVertical: "top",
    minHeight: 80,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f1f1f",
  },
  totalMonto: {
    fontSize: 24,
    fontWeight: "700",
    color: "#007AFF",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonSecondary: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  buttonPrimary: {
    backgroundColor: "#007AFF",
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  emptyText: {
    padding: 20,
    textAlign: "center",
    color: "#999",
    fontSize: 14,
  },
});
