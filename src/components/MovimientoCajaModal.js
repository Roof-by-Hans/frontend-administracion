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
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import mediosPagoService from "../services/mediosPagoService";

const CONCEPTOS_INGRESO = [
  "Ingreso de efectivo",
  "Cobro de deuda externa",
  "Ajuste de caja",
  "Otro",
];

const CONCEPTOS_EGRESO = [
  "Compra de insumos",
  "Pago a proveedor",
  "Retiro de efectivo",
  "Pago de servicios",
  "Devolución a cliente",
  "Otro",
];

const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function MovimientoCajaModal({
  visible,
  onClose,
  onSave,
  loading,
}) {
  const [tipo, setTipo] = useState("INGRESO");
  const [conceptoSeleccionado, setConceptoSeleccionado] = useState(CONCEPTOS_INGRESO[0]);
  const [conceptoPersonalizado, setConceptoPersonalizado] = useState("");
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState("");
  const [mediosPagoList, setMediosPagoList] = useState([]);
  
  const [errores, setErrores] = useState({
    concepto: "",
    monto: "",
  });

  useEffect(() => {
    if (visible) {
      cargarMediosPago();
      limpiarCampos();
    }
  }, [visible]);

  const cargarMediosPago = async () => {
    try {
      const medios = await mediosPagoService.obtenerTodos();
      setMediosPagoList(medios);
      // Seleccionar el primero por defecto si no hay nada seleccionado
      if (medios.length > 0 && !metodoPago) {
        setMetodoPago(medios[0].nombre);
      } else if (medios.length > 0) {
        // Verificar que el seleccionado aun exista
        const existe = medios.find(m => m.nombre === metodoPago);
        if (!existe) setMetodoPago(medios[0].nombre);
      }
    } catch (error) {
      console.error("Error al cargar medios de pago:", error);
    }
  };

  // Actualizar lista de conceptos cuando cambia el tipo
  useEffect(() => {
    const conceptos = tipo === "INGRESO" ? CONCEPTOS_INGRESO : CONCEPTOS_EGRESO;
    setConceptoSeleccionado(conceptos[0]);
    setConceptoPersonalizado("");
    setErrores((prev) => ({ ...prev, concepto: "" }));
  }, [tipo]);

  const limpiarCampos = () => {
    setTipo("INGRESO");
    setConceptoSeleccionado(CONCEPTOS_INGRESO[0]);
    setConceptoPersonalizado("");
    setMonto("");
    if (mediosPagoList.length > 0) {
        setMetodoPago(mediosPagoList[0].nombre);
    }
    setErrores({ concepto: "", monto: "" });
  };

  const handleMontoChange = (text) => {
    setMonto(text);
    if (text.trim() === "") {
      setErrores(prev => ({ ...prev, monto: "El monto es obligatorio" }));
    } else if (isNaN(parseFloat(text))) {
      setErrores(prev => ({ ...prev, monto: "Ingrese un número válido" }));
    } else if (parseFloat(text) <= 0) {
      setErrores(prev => ({ ...prev, monto: "El monto debe ser mayor a 0" }));
    } else {
      setErrores(prev => ({ ...prev, monto: "" }));
    }
  };

  const handleConceptoPersonalizadoChange = (text) => {
    setConceptoPersonalizado(text);
    if (!text.trim()) {
      setErrores(prev => ({ ...prev, concepto: "La descripción es obligatoria" }));
    } else {
      setErrores(prev => ({ ...prev, concepto: "" }));
    }
  };

  const handleGuardar = () => {
    const montoNum = parseFloat(monto);
    let conceptoFinal = conceptoSeleccionado;
    
    if (conceptoSeleccionado === "Otro") {
      conceptoFinal = conceptoPersonalizado.trim();
    }

    if ((conceptoSeleccionado === "Otro" && !conceptoFinal) || isNaN(montoNum) || montoNum <= 0 || !metodoPago) {
      if (conceptoSeleccionado === "Otro" && !conceptoFinal) {
        setErrores(prev => ({ ...prev, concepto: "La descripción es obligatoria" }));
      }
      if (isNaN(montoNum) || montoNum <= 0) {
        setErrores(prev => ({ ...prev, monto: "Monto inválido" }));
      }
      if (!metodoPago) {
         // Podríamos mostrar un error general o un toast, pero por ahora validamos que no se envíe
         console.warn("Falta seleccionar método de pago");
      }
      return;
    }

    const movimientoData = {
      tipo, // INGRESO o EGRESO
      monto: montoNum,
      concepto: conceptoFinal,
      metodoPago, // EFECTIVO o TARJETA
    };

    onSave(movimientoData);
  };

  const conceptosDisponibles = tipo === "INGRESO" ? CONCEPTOS_INGRESO : CONCEPTOS_EGRESO;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={[styles.iconBadge, { backgroundColor: tipo === 'INGRESO' ? '#e8f5e9' : '#ffebee' }]}>
                 <MaterialCommunityIcons 
                    name={tipo === 'INGRESO' ? "arrow-down-bold" : "arrow-up-bold"} 
                    size={24} 
                    color={tipo === 'INGRESO' ? "#2e7d32" : "#c62828"} 
                 />
              </View>
              <Text style={styles.modalTitle}>Nuevo Movimiento</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              
              {/* Selector Tipo */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Tipo de Movimiento</Text>
                <View style={styles.segmentedControl}>
                  <TouchableOpacity 
                    style={[styles.segment, tipo === 'INGRESO' && styles.segmentActiveIngreso]}
                    onPress={() => setTipo('INGRESO')}
                  >
                    <Text style={[styles.segmentText, tipo === 'INGRESO' && styles.segmentTextActive]}>INGRESO</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.segment, tipo === 'EGRESO' && styles.segmentActiveEgreso]}
                    onPress={() => setTipo('EGRESO')}
                  >
                    <Text style={[styles.segmentText, tipo === 'EGRESO' && styles.segmentTextActive]}>EGRESO</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Monto */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Monto</Text>
                <View style={[styles.inputContainer, errores.monto && styles.inputError]}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={monto}
                    onChangeText={handleMontoChange}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#999"
                  />
                </View>
                {errores.monto ? <Text style={styles.errorText}>{errores.monto}</Text> : null}
              </View>

              {/* Concepto (Picker) */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Concepto</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={conceptoSeleccionado}
                    onValueChange={(itemValue) => setConceptoSeleccionado(itemValue)}
                    style={styles.picker}
                  >
                    {conceptosDisponibles.map((c) => (
                      <Picker.Item key={c} label={c} value={c} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Concepto Personalizado (si es "Otro") */}
              {conceptoSeleccionado === "Otro" && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Descripción</Text>
                  <TextInput
                    style={[styles.inputBox, errores.concepto && styles.inputError]}
                    placeholder="Especifique el motivo..."
                    value={conceptoPersonalizado}
                    onChangeText={handleConceptoPersonalizadoChange}
                    placeholderTextColor="#999"
                  />
                  {errores.concepto ? <Text style={styles.errorText}>{errores.concepto}</Text> : null}
                </View>
              )}

              {/* Método de Pago */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Medio de Pago</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={metodoPago}
                    onValueChange={(itemValue) => setMetodoPago(itemValue)}
                    style={styles.picker}
                  >
                    {mediosPagoList.length === 0 ? (
                       <Picker.Item label="Cargando..." value="" />
                    ) : (
                      mediosPagoList.map((medio) => (
                        <Picker.Item 
                          key={medio.id_medio_pago} 
                          label={capitalize(medio.nombre)} 
                          value={medio.nombre} 
                        />
                      ))
                    )}
                  </Picker>
                </View>
              </View>

            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: tipo === 'INGRESO' ? "#2e7d32" : "#c62828" }]}
                onPress={handleGuardar}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar Movimiento</Text>
                )}
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
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f1f1f",
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#37474f",
    marginBottom: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActiveIngreso: {
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32'
  },
  segmentActiveEgreso: {
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#c62828'
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
  },
  segmentTextActive: {
    color: '#1f1f1f',
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  inputBox: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1f1f1f",
    outlineStyle: "none",
  },
  currencySymbol: {
    fontSize: 18,
    color: "#666",
    marginRight: 8,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
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
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  picker: {
    height: 45,
    width: "100%",
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fafafa",
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
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
