import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

export default function MovimientoCajaModal({
  visible,
  onClose,
  onSave,
  movimiento = null,
  responsable = "Usuario",
}) {
  const [tipoTransaccion, setTipoTransaccion] = useState("Venta");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("Ingreso");
  const [monto, setMonto] = useState("");
  
  // Estados para los errores
  const [errores, setErrores] = useState({
    tipoTransaccion: "",
    descripcion: "",
    monto: "",
  });

  useEffect(() => {
    if (movimiento) {
      // Modo edición (aunque en caja normalmente no se editan movimientos)
      setTipoTransaccion(movimiento.tipoTransaccion || "Venta");
      setNumeroFactura(movimiento.numeroFactura || "");
      setDescripcion(movimiento.descripcion);
      setTipo(movimiento.tipo);
      setMonto(movimiento.monto.toString());
    } else {
      // Modo creación
      limpiarCampos();
    }
    // Limpiar errores al abrir/cerrar modal
    setErrores({ tipoTransaccion: "", descripcion: "", monto: "" });
  }, [movimiento, visible]);

  const limpiarCampos = () => {
    setTipoTransaccion("Venta");
    setNumeroFactura("");
    setDescripcion("");
    setTipo("Ingreso");
    setMonto("");
  };

  // Validación en tiempo real del tipo de transacción
  const handleTipoTransaccionChange = (text) => {
    setTipoTransaccion(text);
    if (text.trim() === "") {
      setErrores(prev => ({ ...prev, tipoTransaccion: "El tipo de transacción es obligatorio" }));
    } else {
      setErrores(prev => ({ ...prev, tipoTransaccion: "" }));
    }
  };

  // Validación en tiempo real de la descripción
  const handleDescripcionChange = (text) => {
    setDescripcion(text);
    if (text.trim() === "") {
      setErrores(prev => ({ ...prev, descripcion: "La descripción es obligatoria" }));
    } else {
      setErrores(prev => ({ ...prev, descripcion: "" }));
    }
  };

  // Validación en tiempo real del monto
  const handleMontoChange = (text) => {
    setMonto(text);
    if (text.trim() === "") {
      setErrores(prev => ({ ...prev, monto: "El monto es obligatorio" }));
    } else if (isNaN(parseFloat(text))) {
      setErrores(prev => ({ ...prev, monto: "El monto debe ser un número válido" }));
    } else if (parseFloat(text) <= 0) {
      setErrores(prev => ({ ...prev, monto: "El monto debe ser mayor a 0" }));
    } else {
      setErrores(prev => ({ ...prev, monto: "" }));
    }
  };

  const handleGuardar = () => {
    // Validar que no haya errores
    const hayErrores = Object.values(errores).some(error => error !== "");
    const camposVacios = !tipoTransaccion.trim() || !monto.trim();
    
    if (hayErrores || camposVacios) {
      // Marcar todos los campos vacíos como error
      if (!tipoTransaccion.trim()) setErrores(prev => ({ ...prev, tipoTransaccion: "El tipo de transacción es obligatorio" }));
      if (!monto.trim()) setErrores(prev => ({ ...prev, monto: "El monto es obligatorio" }));
      return;
    }

    const now = new Date();
    const fecha = now.toLocaleDateString('es-UY', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    }) + ' ' + now.toLocaleTimeString('es-UY', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Construir la descripción completa
    let descripcionCompleta = tipoTransaccion;
    if (numeroFactura.trim()) {
      descripcionCompleta += ` - Factura #${numeroFactura}`;
    }
    if (descripcion.trim()) {
      descripcionCompleta += ` - ${descripcion.trim()}`;
    }

    const movimientoData = {
      id: movimiento ? movimiento.id : Date.now(),
      tipoTransaccion: tipoTransaccion.trim(),
      numeroFactura: numeroFactura.trim(),
      descripcion: descripcionCompleta,
      tipo: tipo,
      monto: parseFloat(monto),
      fecha: fecha,
      responsable: responsable,
    };

    onSave(movimientoData);
    limpiarCampos();
    onClose();
  };

  const handleCancelar = () => {
    limpiarCampos();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancelar}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {movimiento ? "Editar Movimiento" : "Nuevo Movimiento"}
              </Text>
              <TouchableOpacity
                onPress={handleCancelar}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Tipo de Transacción *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={tipoTransaccion}
                    onValueChange={(itemValue) => handleTipoTransaccionChange(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Venta" value="Venta" />
                    <Picker.Item label="Compra" value="Compra" />
                    <Picker.Item label="Pago a Proveedor" value="Pago a Proveedor" />
                    <Picker.Item label="Pago de Servicio" value="Pago de Servicio" />
                    <Picker.Item label="Retiro de Efectivo" value="Retiro de Efectivo" />
                    <Picker.Item label="Depósito" value="Depósito" />
                    <Picker.Item label="Otro" value="Otro" />
                  </Picker>
                </View>
                {errores.tipoTransaccion ? (
                  <Text style={styles.errorText}>{errores.tipoTransaccion}</Text>
                ) : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Número de Factura</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 1234"
                  value={numeroFactura}
                  onChangeText={setNumeroFactura}
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>
                  Opcional - Se agregará automáticamente a la descripción
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Descripción Adicional</Text>
                <TextInput
                  style={[styles.input, errores.descripcion && styles.inputError]}
                  placeholder="Ej: Detalles adicionales del movimiento"
                  value={descripcion}
                  onChangeText={handleDescripcionChange}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={2}
                />
                {errores.descripcion ? (
                  <Text style={styles.errorText}>{errores.descripcion}</Text>
                ) : (
                  <Text style={styles.helperText}>
                    Opcional - Información extra sobre el movimiento
                  </Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tipo de Movimiento *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={tipo}
                    onValueChange={(itemValue) => setTipo(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Ingreso" value="Ingreso" />
                    <Picker.Item label="Egreso" value="Egreso" />
                    <Picker.Item label="Apertura" value="Apertura" />
                  </Picker>
                </View>
                <Text style={styles.helperText}>
                  {tipo === "Ingreso" && "💰 Se sumará al saldo actual"}
                  {tipo === "Egreso" && "💸 Se restará del saldo actual"}
                  {tipo === "Apertura" && "🔓 Movimiento de apertura de caja"}
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Monto *</Text>
                <View style={styles.montoContainer}>
                  <Text style={styles.montoSymbol}>$</Text>
                  <TextInput
                    style={[styles.montoInput, errores.monto && styles.inputError]}
                    placeholder="0.00"
                    value={monto}
                    onChangeText={handleMontoChange}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#999"
                  />
                </View>
                {errores.monto ? (
                  <Text style={styles.errorText}>{errores.monto}</Text>
                ) : null}
              </View>

              <View style={styles.infoBox}>
                <MaterialCommunityIcons name="information" size={20} color="#1976d2" />
                <Text style={styles.infoText}>
                  El movimiento se registrará con fecha y hora actual. Responsable: {responsable}
                </Text>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelar}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleGuardar}
              >
                <Text style={styles.saveButtonText}>
                  {movimiento ? "Actualizar" : "Guardar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    maxHeight: "90%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f1f1f",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f1f1f",
    outlineStyle: "none",
  },
  inputError: {
    borderColor: "#d32f2f",
    backgroundColor: "#ffebee",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 45,
    width: "100%",
    backgroundColor: "transparent",
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
  montoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  montoSymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginRight: 8,
  },
  montoInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f1f1f",
    outlineStyle: "none",
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#e3f2fd",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#1565c0",
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
