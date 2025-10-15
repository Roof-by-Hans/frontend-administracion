import React from "react";
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TouchableOpacity, useWindowDimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function MesaModal({ 
  visible, 
  onClose, 
  mesa,
  onUnirMesas,
  onSepararMesas,
  onLimpiarMesa,
  onIniciarPedido,
}) {
  if (!mesa) return null;

  const { numero, estado, pedido, unidaCon } = mesa;
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

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
            {estado === "libre" ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="check-circle-outline" size={isTablet ? 80 : 64} color="#51cf66" />
                <Text style={[styles.emptyTitle, isTablet && styles.emptyTitleTablet]}>Mesa disponible</Text>
                <Text style={[styles.emptySubtitle, isTablet && styles.emptySubtitleTablet]}>
                  Esta mesa está lista para recibir clientes
                </Text>
              </View>
            ) : (
              <>
                {/* Información del pedido */}
                {pedido && (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Mozo:</Text>
                      <Text style={styles.infoValue}>{pedido.mozo || "No asignado"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Hora inicio:</Text>
                      <Text style={styles.infoValue}>{pedido.horaInicio || "--:--"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Comensales:</Text>
                      <Text style={styles.infoValue}>{pedido.comensales || 0}</Text>
                    </View>

                    {/* Items del pedido */}
                    {pedido.items && pedido.items.length > 0 && (
                      <>
                        <Text style={styles.sectionTitle}>Pedido</Text>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={true}
                          style={styles.itemsScrollView}
                          contentContainerStyle={styles.itemsScrollContent}
                        >
                          {pedido.items.map((item, index) => (
                            <View key={index} style={styles.itemCard}>
                              <View style={styles.itemCardHeader}>
                                <Text style={styles.itemCardCantidad}>{item.cantidad}x</Text>
                              </View>
                              <Text style={styles.itemCardNombre} numberOfLines={2}>
                                {item.nombre}
                              </Text>
                              <Text style={styles.itemCardPrecio}>
                                {formatearPrecio(item.precio * item.cantidad)}
                              </Text>
                            </View>
                          ))}
                        </ScrollView>

                        {/* Total */}
                        <View style={styles.totalRow}>
                          <Text style={styles.totalLabel}>Total:</Text>
                          <Text style={styles.totalValue}>
                            {formatearPrecio(calcularTotal())}
                          </Text>
                        </View>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </ScrollView>

          {/* Acciones */}
          <View style={styles.actions}>
            {estado === "libre" ? (
              <TouchableOpacity 
                style={[styles.actionButton, styles.startButton, isTablet && styles.actionButtonTablet]}
                onPress={() => {
                  onIniciarPedido && onIniciarPedido(numero);
                  onClose();
                }}
              >
                <MaterialCommunityIcons name="plus-circle" size={isTablet ? 26 : 20} color="#fff" />
                <Text style={[styles.actionButtonText, isTablet && styles.actionButtonTextTablet]}>Iniciar pedido</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.actionButton, styles.clearButton, isTablet && styles.actionButtonTablet]}
                onPress={() => {
                  onLimpiarMesa && onLimpiarMesa(numero);
                  onClose();
                }}
              >
                <MaterialCommunityIcons name="broom" size={isTablet ? 26 : 20} color="#fff" />
                <Text style={[styles.actionButtonText, isTablet && styles.actionButtonTextTablet]}>Limpiar mesa</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.linkButton, isTablet && styles.actionButtonTablet]}
              onPress={() => {
                onUnirMesas && onUnirMesas(numero);
                onClose();
              }}
            >
              <MaterialCommunityIcons name="link-variant" size={isTablet ? 26 : 20} color="#fff" />
              <Text style={[styles.actionButtonText, isTablet && styles.actionButtonTextTablet]}>Unir mesas</Text>
            </TouchableOpacity>
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
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
  },
  actionButton: {
    flex: 1,
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
