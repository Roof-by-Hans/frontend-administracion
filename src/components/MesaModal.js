import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TouchableOpacity, useWindowDimensions, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Alert from "@blazejkustra/react-native-alert";
import pedidosService from "../services/pedidosService";

export default function MesaModal({ 
  visible, 
  onClose, 
  mesa,
  grupo,
  onUnirMesas,
  onSepararMesas,
  onLimpiarMesa,
  onIniciarPedido,
  onNuevoPedido,
  onPagarCuenta,
  onEditarPedido,
  onEliminarPedido,
  tienePedido = false,
}) {
  const [pedidosActivos, setPedidosActivos] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

    useEffect(() => {
    if (!visible || (!mesa && !grupo)) return;

    const cargarPedidos = async () => {
      try {
        setLoadingPedidos(true);
        let pedidos = [];
        
        if (grupo) {
          pedidos = await pedidosService.getPedidosGrupo(grupo.id);
        } else if (mesa) {
          pedidos = await pedidosService.getPedidosMesa(mesa.idMesa || mesa.id);
        }
        setPedidosActivos(pedidos);
      } catch (error) {
        console.error('Error al cargar pedidos:', error);
      } finally {
        setLoadingPedidos(false);
      }
    };

    cargarPedidos();
  }, [visible, mesa, grupo]);  if (!mesa && !grupo) return null;

  const numero = mesa?.numero || grupo?.nombre;
  const estado = mesa?.estado || (grupo?.mesas?.some(m => m.estado === 'ocupada') ? 'ocupada' : 'libre');
  const pedido = mesa?.pedido;
  const unidaCon = mesa?.unidaCon;

  const calcularTotal = () => {
    if (!pedido || !pedido.items) return 0;
    return pedido.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  };

  const formatearPrecio = (precio) => {
    return `$${precio.toFixed(2)}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable 
          style={[
            styles.modalContainer,
            isTablet && styles.modalContainerTablet,
            isLargeTablet && styles.modalContainerLarge
          ]} 
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[
                styles.estadoBadge, 
                { backgroundColor: estado === "ocupada" ? "#ff6b6b" : "#51cf66" }
              ]}>
                <Text style={styles.estadoTexto}>
                  {estado === "ocupada" ? "OCUPADA" : "LIBRE"}
                </Text>
              </View>
              <Text style={[styles.titulo, isTablet && styles.tituloTablet]}>Mesa {numero}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={isTablet ? 32 : 24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Mesas unidas */}
          {unidaCon && unidaCon.length > 0 && (
            <View style={styles.unidaSection}>
              <MaterialCommunityIcons name="link-variant" size={isTablet ? 24 : 20} color="#4a4a4a" />
              <Text style={[styles.unidaInfo, isTablet && styles.unidaInfoTablet]}>
                Unida con: {unidaCon.map(m => `Mesa ${m}`).join(", ")}
              </Text>
            </View>
          )}

          {/* Contenido */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loadingPedidos ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={[styles.emptySubtitle, isTablet && styles.emptySubtitleTablet]}>
                  Cargando pedidos...
                </Text>
              </View>
            ) : pedidosActivos.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons 
                  name="receipt-text-outline" 
                  size={isTablet ? 80 : 64} 
                  color="#ccc" 
                />
                <Text style={[styles.emptyTitle, isTablet && styles.emptyTitleTablet]}>
                  Sin pedidos activos
                </Text>
                <Text style={[styles.emptySubtitle, isTablet && styles.emptySubtitleTablet]}>
                  Presione "Nuevo Pedido" para comenzar
                </Text>
              </View>
            ) : (
              <>
                {/* Lista de pedidos activos */}
                <Text style={styles.sectionTitle}>
                  Pedidos Activos ({pedidosActivos.length})
                </Text>
                {pedidosActivos.map((pedido, pedidoIndex) => {
                  const total = pedido.productos.reduce(
                    (sum, p) => sum + (p.cantidad * p.precioUnitario), 
                    0
                  );
                  
                  return (
                    <View key={pedido.id} style={styles.pedidoCard}>
                      {/* Header del pedido con acciones */}
                      <View style={styles.pedidoHeader}>
                        <View style={styles.pedidoHeaderLeft}>
                          <MaterialCommunityIcons 
                            name="account" 
                            size={isTablet ? 20 : 16} 
                            color="#666" 
                          />
                          <Text style={[styles.pedidoCliente, isTablet && styles.pedidoClienteTablet]}>
                            {pedido.nombreCliente}
                          </Text>
                        </View>
                        <View style={styles.pedidoHeaderRight}>
                          <Text style={[styles.pedidoFecha, isTablet && styles.pedidoFechaTablet]}>
                            {new Date(pedido.fecha).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                          <TouchableOpacity 
                            onPress={() => {                              if (onEditarPedido) {
                                onEditarPedido(pedido);
                              }
                            }}
                            style={styles.pedidoActionBtn}
                          >
                            <MaterialCommunityIcons name="pencil-outline" size={18} color="#007AFF" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={() => {
                              Alert.alert(
                                'Eliminar pedido',
                                '\u00bfEst\u00e1 seguro de eliminar este pedido?',
                                [
                                  { text: 'Cancelar', style: 'cancel' },
                          { 
                            text: 'Eliminar', 
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                const clave = grupo ? `grupo-${grupo.id}` : `mesa-${mesa.idMesa || mesa.id}`;
                                await pedidosService.eliminarPedido(pedido.id, clave);                                const pedidosActualizados = await (grupo 
                                  ? pedidosService.getPedidosGrupo(grupo.id)
                                  : pedidosService.getPedidosMesa(mesa.idMesa || mesa.id));
                                setPedidosActivos(pedidosActualizados);                                if (onEliminarPedido) {
                                  onEliminarPedido(pedido.id, mesa?.idMesa, grupo?.id);
                                }
                              } catch (error) {
                                console.error('Error al eliminar pedido:', error);
                                Alert.alert('Error', 'No se pudo eliminar el pedido');
                              }
                            }
                          },
                                ]
                              );
                            }}
                            style={styles.pedidoActionBtn}
                          >
                            <MaterialCommunityIcons name="delete-outline" size={18} color="#ff3b30" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Productos del pedido */}
                      <View style={styles.pedidoProductos}>
                        {pedido.productos.map((producto, idx) => (
                          <View key={idx} style={styles.productoRow}>
                            <Text style={[styles.productoCantidad, isTablet && styles.productoCantidadTablet]}>
                              {producto.cantidad}x
                            </Text>
                            <Text style={[styles.productoNombre, isTablet && styles.productoNombreTablet]}>
                              {producto.nombre}
                            </Text>
                            <Text style={[styles.productoPrecio, isTablet && styles.productoPrecioTablet]}>
                              ${(producto.cantidad * producto.precioUnitario).toFixed(2)}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Observaciones */}
                      {pedido.observaciones && (
                        <View style={styles.pedidoObservaciones}>
                          <MaterialCommunityIcons 
                            name="note-text" 
                            size={isTablet ? 16 : 14} 
                            color="#888" 
                          />
                          <Text style={[styles.observacionesText, isTablet && styles.observacionesTextTablet]}>
                            {pedido.observaciones}
                          </Text>
                        </View>
                      )}

                      {/* Total del pedido */}
                      <View style={styles.pedidoTotal}>
                        <Text style={[styles.pedidoTotalLabel, isTablet && styles.pedidoTotalLabelTablet]}>
                          Subtotal:
                        </Text>
                        <Text style={[styles.pedidoTotalValue, isTablet && styles.pedidoTotalValueTablet]}>
                          ${total.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {/* Total general */}
                <View style={styles.totalGeneralCard}>
                  <Text style={[styles.totalGeneralLabel, isTablet && styles.totalGeneralLabelTablet]}>
                    Total a cobrar:
                  </Text>
                  <Text style={[styles.totalGeneralValue, isTablet && styles.totalGeneralValueTablet]}>
                    ${pedidosService.calcularTotal(pedidosActivos).toFixed(2)}
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          {/* Acciones */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.startButton, isTablet && styles.actionButtonTablet]}
              onPress={() => {
                onNuevoPedido && onNuevoPedido();
              }}
            >
              <MaterialCommunityIcons name="plus-circle" size={isTablet ? 26 : 20} color="#fff" />
              <Text style={[styles.actionButtonText, isTablet && styles.actionButtonTextTablet]}>Nuevo Pedido</Text>
            </TouchableOpacity>

            {(() => {
              return pedidosActivos.length > 0;
            })() && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.payButton, isTablet && styles.actionButtonTablet]}
                onPress={() => {
                  onPagarCuenta && onPagarCuenta();
                }}
              >
                <MaterialCommunityIcons name="cash-register" size={isTablet ? 26 : 20} color="#fff" />
                <Text style={[styles.actionButtonText, isTablet && styles.actionButtonTextTablet]}>Cobrar Mesa</Text>
              </TouchableOpacity>
            )}

            {estado === "ocupada" && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.clearButton, isTablet && styles.actionButtonTablet]}
                onPress={() => {
                  onLimpiarMesa && onLimpiarMesa(numero);
                  onClose();
                }}
              >
                <MaterialCommunityIcons name="broom" size={isTablet ? 26 : 20} color="#fff" />
                <Text style={[styles.actionButtonText, isTablet && styles.actionButtonTextTablet]}>Limpiar Mesa</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Pressable>
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
    width: "90%",
    maxWidth: 500,
    minHeight: 400,
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalContainerTablet: {
    width: "70%",
    maxWidth: 650,
    minHeight: 500,
    maxHeight: "85%",
  },
  modalContainerLarge: {
    width: "60%",
    maxWidth: 750,
    minHeight: 550,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  estadoTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  tituloTablet: {
    fontSize: 32,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  unidaSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff3cd",
    borderBottomWidth: 1,
    borderBottomColor: "#ffeaa7",
  },
  unidaInfo: {
    fontSize: 14,
    color: "#856404",
  },
  unidaInfoTablet: {
    fontSize: 18,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: 20,
    minHeight: 200,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2f2f2f",
    marginTop: 16,
  },
  emptyTitleTablet: {
    fontSize: 28,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
  },
  emptySubtitleTablet: {
    fontSize: 18,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: "#1f1f1f",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f1f1f",
    marginTop: 20,
    marginBottom: 12,
  },
  pedidoCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  pedidoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  pedidoHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  pedidoHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pedidoActionBtn: {
    padding: 4,
  },
  pedidoCliente: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2f2f2f",
  },
  pedidoClienteTablet: {
    fontSize: 20,
  },
  pedidoFecha: {
    fontSize: 13,
    color: "#868e96",
  },
  pedidoFechaTablet: {
    fontSize: 16,
  },
  pedidoProductos: {
    marginBottom: 12,
  },
  productoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 8,
  },
  productoCantidad: {
    fontSize: 14,
    fontWeight: "700",
    color: "#228be6",
    minWidth: 30,
  },
  productoCantidadTablet: {
    fontSize: 17,
  },
  productoNombre: {
    fontSize: 14,
    color: "#495057",
    flex: 1,
  },
  productoNombreTablet: {
    fontSize: 17,
  },
  productoPrecio: {
    fontSize: 14,
    fontWeight: "600",
    color: "#37b24d",
  },
  productoPrecioTablet: {
    fontSize: 17,
  },
  pedidoObservaciones: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  observacionesText: {
    fontSize: 13,
    color: "#888",
    fontStyle: "italic",
    flex: 1,
  },
  observacionesTextTablet: {
    fontSize: 16,
  },
  pedidoTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#dee2e6",
  },
  pedidoTotalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#495057",
  },
  pedidoTotalLabelTablet: {
    fontSize: 18,
  },
  pedidoTotalValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#37b24d",
  },
  pedidoTotalValueTablet: {
    fontSize: 20,
  },
  totalGeneralCard: {
    backgroundColor: "#e7f5ff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    borderWidth: 2,
    borderColor: "#339af0",
  },
  totalGeneralLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1864ab",
  },
  totalGeneralLabelTablet: {
    fontSize: 22,
  },
  totalGeneralValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1864ab",
  },
  totalGeneralValueTablet: {
    fontSize: 28,
  },
  itemsScrollView: {
    marginBottom: 16,
  },
  itemsScrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  itemCard: {
    width: 140,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  itemCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemCardCantidad: {
    fontSize: 16,
    fontWeight: "700",
    color: "#228be6",
    backgroundColor: "#e7f5ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemCardNombre: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2f2f2f",
    marginBottom: 8,
    minHeight: 36,
  },
  itemCardPrecio: {
    fontSize: 16,
    fontWeight: "700",
    color: "#37b24d",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  itemCantidad: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4a4a4a",
    minWidth: 30,
  },
  itemNombre: {
    fontSize: 15,
    color: "#2f2f2f",
    flex: 1,
  },
  itemPrecio: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f1f1f",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: "#e0e0e0",
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2f2f2f",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
  },
  actionButton: {
    flex: 1,
    minWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  actionButtonTablet: {
    paddingVertical: 18,
    gap: 12,
  },
  clearButton: {
    backgroundColor: "#ff6b6b",
  },
  startButton: {
    backgroundColor: "#51cf66",
  },
  payButton: {
    backgroundColor: "#FF9500",
  },
  linkButton: {
    backgroundColor: "#4a90e2",
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  actionButtonTextTablet: {
    fontSize: 19,
  },
});
