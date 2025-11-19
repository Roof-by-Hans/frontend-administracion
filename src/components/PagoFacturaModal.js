import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import Alert from "@blazejkustra/react-native-alert";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import transaccionesService from "../services/transaccionesService";
import pedidosService from "../services/pedidosService";

/**
 * Modal para procesar el pago de pedidos
 * Genera la factura al momento de cobrar
 */
export default function PagoFacturaModal({ visible, onClose, pedidos = [], mesa, grupo, onPagoExitoso }) {
  const [loading, setLoading] = useState(false);

  // Calcular total de todos los pedidos
  const totalPedidos = useMemo(() => {
    return pedidosService.calcularTotal(pedidos);
  }, [pedidos]);

  // Obtener primer cliente de los pedidos
  const primerCliente = pedidos[0]?.idCliente;

  const handleCobrar = async () => {
    // Validaciones
    if (!pedidos || pedidos.length === 0) {
      Alert.alert("Error", "No hay pedidos para cobrar");
      return;
    }

    Alert.alert(
      "Confirmar cobro",
      `¿Cobrar $${totalPedidos.toFixed(2)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cobrar", onPress: () => procesarPago() },
      ]
    );
  };

  const procesarPago = async () => {
    try {
      setLoading(true);

      // Paso 1: Consolidar todos los productos de todos los pedidos
      const todosLosProductos = [];
      let observaciones = [];

      pedidos.forEach(pedido => {
        pedido.productos.forEach(prod => {
          const producto = {
            idProducto: prod.idProducto,
            cantidad: prod.cantidad,
          };
          
          // Solo incluir precioUnitario si está definido
          if (prod.precioUnitario !== undefined && prod.precioUnitario !== null) {
            producto.precioUnitario = prod.precioUnitario;
          }
          
          todosLosProductos.push(producto);
        });
        
        if (pedido.observaciones) {
          observaciones.push(pedido.observaciones);
        }
      });

      // Paso 2: Crear consumo (genera la factura automáticamente en el backend)
      const datosConsumo = {
        idCliente: primerCliente || 1, // Cliente genérico si no hay cliente guardado
        productos: todosLosProductos,
      };
      
      // Solo agregar observaciones si hay alguna
      if (observaciones.length > 0) {
        datosConsumo.observaciones = observaciones.join(' | ');
      }

      // Agregar idMesa o idGrupo
      if (grupo) {
        datosConsumo.idGrupo = grupo.id;
      } else if (mesa) {
        datosConsumo.idMesa = mesa.idMesa || mesa.id;
      }

      console.log('🔵 Datos enviados a registrarConsumo:', JSON.stringify(datosConsumo, null, 2));

      const respuestaConsumo = await transaccionesService.registrarConsumo(datosConsumo);
      const facturaGenerada = respuestaConsumo.data || respuestaConsumo;

      console.log('🔵 Factura generada:', facturaGenerada);

      Alert.alert(
        "Cobro exitoso",
        `Factura #${facturaGenerada.id} cobrada: $${totalPedidos.toFixed(2)}`,
        [
          {
            text: "OK",
            onPress: () => {
              onPagoExitoso?.(facturaGenerada);
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error al procesar pago:", error);
      const mensaje = error.response?.data?.message || error.message || "No se pudo procesar el pago";
      Alert.alert("Error", mensaje);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!pedidos || pedidos.length === 0) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Cobrar Mesa</Text>
              <Text style={styles.subtitle}>
                {mesa ? `Mesa ${mesa.numero}` : grupo ? `Grupo ${grupo.nombre}` : 'Pedido'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Información de los Pedidos */}
            <View style={styles.facturaInfo}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="receipt-text" size={20} color="#666" />
                <Text style={styles.infoText}>
                  {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'} activo(s)
                </Text>
              </View>

              {pedidos[0]?.nombreCliente && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="account" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    {pedidos[0].nombreCliente}
                  </Text>
                </View>
              )}

              {mesa && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="table-chair" size={20} color="#666" />
                  <Text style={styles.infoText}>Mesa {mesa.numero}</Text>
                </View>
              )}

              {grupo && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="table-furniture" size={20} color="#666" />
                  <Text style={styles.infoText}>Grupo: {grupo.nombre}</Text>
                </View>
              )}
            </View>

            {/* Detalles de Pedidos */}
            <View style={styles.detallesSection}>
              <Text style={styles.sectionTitle}>Detalle de pedidos</Text>
              <View style={styles.detallesContainer}>
                {pedidos.map((pedido, pedidoIdx) => (
                  <View key={pedido.id} style={styles.pedidoGroup}>
                    <Text style={styles.pedidoHeader}>
                      Pedido #{pedidoIdx + 1} - {new Date(pedido.fecha).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                    {pedido.productos.map((prod, idx) => (
                      <View key={idx} style={styles.detalleItem}>
                        <View style={styles.detalleInfo}>
                          <Text style={styles.detalleNombre}>
                            {prod.nombre}
                          </Text>
                          <Text style={styles.detalleCantidad}>
                            {prod.cantidad} x ${parseFloat(prod.precioUnitario).toFixed(2)}
                          </Text>
                        </View>
                        <Text style={styles.detalleSubtotal}>
                          ${(prod.cantidad * parseFloat(prod.precioUnitario)).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>

            {/* Total */}
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total a Cobrar:</Text>
              <Text style={styles.totalMonto}>${totalPedidos.toFixed(2)}</Text>
            </View>
          </ScrollView>

          {/* Footer con Botón de Cobrar */}
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
              onPress={handleCobrar}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="cash-register" size={20} color="#fff" />
                  <Text style={styles.buttonPrimaryText}>Cobrar ${totalPedidos.toFixed(2)}</Text>
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
    maxWidth: 500,
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
  content: {
    padding: 20,
  },
  facturaInfo: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
  },
  detallesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f1f1f",
    marginBottom: 12,
  },
  detallesContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    overflow: "hidden",
  },
  pedidoGroup: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  pedidoHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  detalleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detalleInfo: {
    flex: 1,
  },
  detalleNombre: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  detalleCantidad: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  detalleSubtotal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f1f1f",
  },
  totalMonto: {
    fontSize: 28,
    fontWeight: "700",
    color: "#007AFF",
  },
  section: {
    marginBottom: 20,
  },
  metodosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metodoBtn: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  metodoBtnActivo: {
    backgroundColor: "#E3F2FD",
    borderColor: "#007AFF",
  },
  metodoText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  metodoTextActivo: {
    color: "#007AFF",
    fontWeight: "600",
  },
  montoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  montoCompletoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#E3F2FD",
    borderRadius: 6,
  },
  montoCompletoText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
  },
  montoInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#007AFF",
    paddingHorizontal: 16,
  },
  montoPrefix: {
    fontSize: 24,
    fontWeight: "600",
    color: "#666",
    marginRight: 8,
  },
  montoInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "600",
    color: "#1f1f1f",
    paddingVertical: 16,
  },
  calculoContainer: {
    marginTop: 12,
  },
  vueltoInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
  },
  vueltoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#34C759",
  },
  pendienteInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
  },
  pendienteText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF9500",
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
    backgroundColor: "#34C759",
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
