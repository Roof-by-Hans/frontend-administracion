import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import transaccionesService from "../services/transaccionesService";
import pedidosService from "../services/pedidosService";
import clienteService from "../services/clienteService";
import cardService from "../services/cardService";
import tarjetaService from "../services/tarjetaService";
import RfidScanModal from "./RfidScanModal";
import SuccessModal from "./SuccessModal";

/**
 * Modal para procesar el pago de pedidos
 * Genera la factura al momento de cobrar
 */
export default function PagoFacturaModal({
  visible,
  onClose,
  pedidos = [],
  mesa,
  grupo,
  onPagoExitoso,
}) {
  const [loading, setLoading] = useState(false);
  
  // Estados para el flujo de pago con tarjeta
  const [scanStatus, setScanStatus] = useState(""); // 'scanning', 'error', 'success'
  const [errorMessage, setErrorMessage] = useState("");
  const [clienteData, setClienteData] = useState(null);
  
  // Estados para modales internos
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Calcular total de todos los pedidos
  const totalPedidos = useMemo(() => {
    return pedidosService.calcularTotal(pedidos);
  }, [pedidos]);

  // Obtener primer cliente de los pedidos
  const primerClienteId = pedidos[0]?.idCliente;

  // Resetear estados al abrir/cerrar
  useEffect(() => {
    if (visible) {
      setScanStatus("");
      setErrorMessage("");
      setClienteData(null);
      setShowSuccessModal(false);
      
      // Cargar datos del cliente si existe
      if (primerClienteId) {
        cargarDatosCliente(primerClienteId);
      }
    }
  }, [visible, primerClienteId]);

  const cargarDatosCliente = async (id) => {
    try {
      const cliente = await clienteService.getClientePorId(id);
      console.log("👤 Datos del cliente cargados:", cliente);
      setClienteData(cliente);
    } catch (error) {
      console.error("Error al cargar cliente:", error);
      setErrorMessage("No se pudo cargar la información del cliente");
    }
  };

  const handleIniciarCobro = () => {
    // Validaciones básicas
    if (!pedidos || pedidos.length === 0) {
      setErrorMessage("No hay pedidos para cobrar");
      return;
    }

    // Si hay un cliente asociado, ir directo al escaneo de tarjeta
    if (primerClienteId && clienteData) {
      iniciarEscaneoTarjeta();
    } else {
      // Si es un pedido anónimo (sin cliente), proceder al pago directo
      procesarPago();
    }
  };



  const iniciarEscaneoTarjeta = async () => {
    setScanStatus("scanning");
    setErrorMessage("");

    try {
      // 1. Escanear tarjeta
      const response = await cardService.scanRFID();
      const uidEscaneado = response.uid;
      console.log("📡 Tarjeta escaneada - UID:", uidEscaneado);
      
      // 2. Verificar a qué cliente pertenece esta tarjeta usando el backend
      const verificacion = await tarjetaService.verificarUid(uidEscaneado);
      console.log("🔍 Verificación de tarjeta:", verificacion);
      
      // 3. Validar que la tarjeta pertenezca al cliente del pedido
      // verificacion.data debería contener información sobre el cliente asociado
      const clienteIdTarjeta = verificacion.data?.cliente?.id || verificacion.data?.idCliente;
      
      if (!clienteIdTarjeta) {
        throw new Error("La tarjeta escaneada no está asociada a ningún cliente.");
      }
      
      if (clienteIdTarjeta !== primerClienteId) {
        const nombreClienteTarjeta = verificacion.data?.cliente?.nombre || "otro cliente";
        throw new Error(`La tarjeta pertenece a ${nombreClienteTarjeta}, no al cliente del pedido.`);
      }
      
      // 4. Si coincide, procesar el pago
      console.log("✅ Tarjeta validada correctamente para el cliente");
      setScanStatus("success");
      setTimeout(() => {
        setScanStatus("");
        procesarPago();
      }, 1000);
      
    } catch (error) {
      console.error("❌ Error en validación de tarjeta:", error);
      setScanStatus("error");
      setErrorMessage(error.response?.data?.message || error.message || "Error al validar la tarjeta");
    }
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
        idCliente: primerClienteId || 1, // Cliente genérico si no hay cliente guardado
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

      setSuccessMessage(`Factura #${facturaGenerada.factura.id} cobrada: $${totalPedidos.toFixed(2)}`);
      setShowSuccessModal(true);
      
      // Notificar éxito al padre después de cerrar el modal de éxito
      // (Se maneja en handleCloseSuccessModal)
      
    } catch (error) {
      console.error("Error al procesar pago:", error);
      const mensaje = error.response?.data?.message || error.message || "No se pudo procesar el pago";
      setErrorMessage(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    // Notificar al componente padre que el pago fue exitoso
    // Pasamos un objeto factura simulado o real si lo tenemos guardado
    onPagoExitoso?.({}); 
    onClose();
  };

  const handleCloseScanModal = () => {
    setScanStatus("");
    setErrorMessage("");
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
            {/* Mensaje de error general */}
            {errorMessage && !scanStatus && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#D32F2F" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

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
              onPress={handleIniciarCobro}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="credit-card-wireless" size={20} color="#fff" />
                  <Text style={styles.buttonPrimaryText}>Cobrar con Tarjeta</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modales Auxiliares */}
      
      {/* Modal de Escaneo RFID */}
      <RfidScanModal
        visible={scanStatus !== ""}
        status={scanStatus}
        errorMessage={errorMessage}
        onClose={handleCloseScanModal}
        title="Acerque la tarjeta del cliente"
        instructions={`Por favor, solicite al cliente ${pedidos[0]?.nombreCliente || ''} que acerque su tarjeta al lector para validar el pago.`}
      />



      {/* Modal de Éxito */}
      <SuccessModal
        visible={showSuccessModal}
        title="¡Cobro Exitoso!"
        message={successMessage}
        onClose={handleCloseSuccessModal}
        autoCloseDelay={3000}
      />
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
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    flex: 1,
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
