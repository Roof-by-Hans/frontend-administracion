import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Image, Modal, Pressable, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Topbar({
  userName = "Usuario",
  userPhoto = null,
  onLogout = () => {},
  onPhotoChange = () => {},
  showMenuButton = false,
  onMenuPress = () => {},
}) {
  const { width } = useWindowDimensions();
  const isCompact = width < 768;
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [tempPhoto, setTempPhoto] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [zoomInput, setZoomInput] = useState("100");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  
  // Refs para mantener valores actualizados en callbacks asíncronos
  const zoomRef = useRef(zoom);
  const positionRef = useRef(position);

  const handleSelectPhoto = () => {
    // Crear input file temporal
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target.result;
          
          // Crear un elemento img temporal para obtener dimensiones
          const img = document.createElement('img');
          img.onload = () => {
            // Calcular zoom inicial para que la imagen completa quepa en el círculo
            const containerSize = 200; // Tamaño del círculo
            const scale = Math.min(
              containerSize / img.width,
              containerSize / img.height
            );
            
            setImageSize({ width: img.width, height: img.height });
            setTempPhoto(imageUrl);
            setZoom(scale);
            zoomRef.current = scale;
            setZoomInput(Math.round(scale * 100).toString());
            setPosition({ x: 0, y: 0 });
            positionRef.current = { x: 0, y: 0 };
            setShowPhotoModal(false);
            setShowPreviewModal(true);
          };
          img.onerror = () => {
            console.error('Error al cargar la imagen');
            alert('Error al cargar la imagen. Por favor, intenta con otra.');
          };
          img.src = imageUrl;
        };
        reader.onerror = () => {
          console.error('Error al leer el archivo');
          alert('Error al leer el archivo. Por favor, intenta nuevamente.');
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const handleConfirmPhoto = () => {
    if (!tempPhoto) return;
    
    // Usar refs para obtener valores actualizados
    const capturedZoom = zoomRef.current;
    const capturedPosition = { x: positionRef.current.x || 0, y: positionRef.current.y || 0 };
    
    // Crear canvas para el recorte
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 200;
    
    canvas.width = size;
    canvas.height = size;
    
    // Cargar imagen original
    const img = document.createElement('img');
    
    img.onload = () => {
      try {
        const finalSize = 200;
        const containerSize = 200;
        
        // En el modal:
        // - Contenedor: 200x200px con display:flex, alignItems:center, justifyContent:center
        // - Imagen: width/height = tamaño REAL (ej: 4000x6000), position:absolute
        // - Por CSS, la imagen position:absolute en un contenedor flex centrado SÍ se centra
        // - Transform: scale(zoom) se aplica desde el centro de la imagen (transform-origin: center)
        // - Transform: translate(x, y) mueve la imagen ya escalada
        
        // Tamaño de la región visible en la imagen ORIGINAL
        const viewportWidth = containerSize / capturedZoom;
        const viewportHeight = containerSize / capturedZoom;
        
        // Centro de la imagen original
        const centerX = img.width / 2;
        const centerY = img.height / 2;
        
        // El translate en React Native se aplica en coordenadas independientes del scale
        // position ya está en las coordenadas correctas, solo invertimos la dirección
        const offsetX = -capturedPosition.x;
        const offsetY = -capturedPosition.y;
        
        // Región a extraer (centrada + offset)
        let sourceX = centerX - viewportWidth / 2 + offsetX;
        let sourceY = centerY - viewportHeight / 2 + offsetY;
        
        // Clamp para mantener dentro de la imagen
        sourceX = Math.max(0, Math.min(img.width - viewportWidth, sourceX));
        sourceY = Math.max(0, Math.min(img.height - viewportHeight, sourceY));
        
        // Fondo blanco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, finalSize, finalSize);
        
        // Dibujar la región extraída escalada al tamaño final
        ctx.drawImage(
          img,
          sourceX, sourceY, viewportWidth, viewportHeight,  // fuente
          0, 0, finalSize, finalSize  // destino
        );
        
        // Convertir a JPEG y guardar
        const croppedImage = canvas.toDataURL('image/jpeg', 0.92);
        onPhotoChange(croppedImage);
        
        // Limpiar estados
        setTempPhoto(null);
        setZoom(1);
        setZoomInput("100");
        setPosition({ x: 0, y: 0 });
        setImageSize({ width: 0, height: 0 });
        setShowPreviewModal(false);
      } catch (error) {
        console.error('❌ Error al recortar:', error);
        alert('Error al procesar la foto: ' + error.message);
      }
    };
    
    img.onerror = () => {
      console.error('❌ Error al cargar imagen');
      alert('Error al cargar la imagen');
    };
    
    img.src = tempPhoto;
  };

  const handleCancelPreview = () => {
    setTempPhoto(null);
    setZoom(1);
    setZoomInput("100");
    setPosition({ x: 0, y: 0 });
    setImageSize({ width: 0, height: 0 });
    setShowPreviewModal(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => {
      const newZoom = Math.min(prev + 0.05, 1.0); // Máximo 100%
      zoomRef.current = newZoom;
      setZoomInput(Math.round(newZoom * 100).toString());
      return newZoom;
    });
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.05, 0);
      zoomRef.current = newZoom;
      const percentage = Math.round(newZoom * 100);
      setZoomInput(percentage.toString());
      return newZoom;
    });
  };

  const handleZoomInputChange = (text) => {
    // Solo permitir números
    const numericValue = text.replace(/[^0-9]/g, '');
    setZoomInput(numericValue);
  };

  const handleZoomInputSubmit = () => {
    const value = parseInt(zoomInput) || 0;
    const clampedValue = Math.max(0, Math.min(100, value)); // Entre 0% y 100%
    const newZoom = clampedValue / 100;
    setZoom(newZoom);
    zoomRef.current = newZoom;
    setZoomInput(clampedValue.toString());
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - (position.x / 2), 
      y: e.clientY - (position.y / 2) 
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = (e.clientX - dragStart.x) * 2;
      const newY = (e.clientY - dragStart.y) * 2;
      
      // Límite muy amplio - los clamps en el canvas evitan salirse de la imagen
      const maxOffset = 2000;
      const limitedX = Math.max(-maxOffset, Math.min(maxOffset, newX));
      const limitedY = Math.max(-maxOffset, Math.min(maxOffset, newY));
      
      setPosition({ x: limitedX, y: limitedY });
      positionRef.current = { x: limitedX, y: limitedY };
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ 
      x: touch.clientX - (position.x / 2), 
      y: touch.clientY - (position.y / 2) 
    });
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches[0]) {
      const touch = e.touches[0];
      const newX = (touch.clientX - dragStart.x) * 2;
      const newY = (touch.clientY - dragStart.y) * 2;
      
      const maxOffset = 2000;
      const limitedX = Math.max(-maxOffset, Math.min(maxOffset, newX));
      const limitedY = Math.max(-maxOffset, Math.min(maxOffset, newY));
      
      setPosition({ x: limitedX, y: limitedY });
      positionRef.current = { x: limitedX, y: limitedY };
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleRemovePhoto = () => {
    onPhotoChange(null);
    setShowPhotoModal(false);
  };

  return (
    <>
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      <View style={[styles.leftBlock, isCompact && styles.leftBlockCompact]}>
        {showMenuButton && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={onMenuPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Abrir menú de navegación"
          >
            <MaterialCommunityIcons name="menu" size={24} color="#333" />
          </TouchableOpacity>
        )}
        <Text style={[styles.greetingText, isCompact && styles.greetingTextCompact]} numberOfLines={1}>
          ¡Hola <Text style={styles.userName}>{userName}</Text>!
        </Text>
      </View>

      <View style={[styles.rightBlock, isCompact && styles.rightBlockCompact]}>
        {!isCompact && (
          <View style={styles.userActions}>
            <TouchableOpacity 
              onPress={() => setShowPhotoModal(true)}
              activeOpacity={0.8}
              accessibilityLabel="Cambiar foto de perfil"
            >
              {userPhoto ? (
                <img 
                  src={userPhoto} 
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    objectFit: 'cover',
                    display: 'block',
                    border: '2px solid #ddd'
                  }}
                  alt="Foto de perfil"
                  onError={(e) => console.error('✗ Error cargando imagen:', e)}
                />
              ) : (
                <View style={styles.defaultPhotoContainer}>
                  <MaterialCommunityIcons name="account-circle" size={36} color="#4a4a4a" />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.7}
              onPress={onLogout}
              accessibilityLabel="Cerrar sesión"
            >
              <MaterialCommunityIcons name="logout" size={18} color="#2f2f2f" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>

    {/* Modal para cambiar foto */}
    <Modal
      transparent
      visible={showPhotoModal}
      onRequestClose={() => setShowPhotoModal(false)}
      animationType="fade"
    >
      <Pressable style={styles.modalOverlay} onPress={() => setShowPhotoModal(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Foto de perfil</Text>
          
          <TouchableOpacity
            style={styles.modalOption}
            onPress={handleSelectPhoto}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="image-plus" size={24} color="#4a4a4a" />
            <Text style={styles.modalOptionText}>Cambiar foto</Text>
          </TouchableOpacity>

          {userPhoto && (
            <TouchableOpacity
              style={[styles.modalOption, styles.modalOptionDanger]}
              onPress={handleRemovePhoto}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="delete" size={24} color="#d32f2f" />
              <Text style={[styles.modalOptionText, styles.modalOptionTextDanger]}>Eliminar foto</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowPhotoModal(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.modalCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>

    {/* Modal de preview de foto */}
    <Modal
      transparent
      visible={showPreviewModal}
      onRequestClose={handleCancelPreview}
      animationType="fade"
    >
      <View style={styles.previewOverlay}>
        <View style={styles.previewContent}>
          <Text style={styles.previewTitle}>Ajusta tu foto de perfil</Text>
          
          {tempPhoto && (
            <>
              <View style={styles.previewImageContainer}>
                <View style={styles.previewCircleMask}>
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      position: 'relative',
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <Image 
                      source={{ uri: tempPhoto }} 
                      style={{
                        width: imageSize.width || 200,
                        height: imageSize.height || 200,
                        position: 'absolute',
                        transform: [
                          { scale: zoom },
                          { translateX: position.x },
                          { translateY: position.y },
                        ],
                      }}
                      resizeMode="cover"
                    />
                  </div>
                </View>
              </View>

              <View style={styles.zoomControls}>
                <TouchableOpacity
                  style={styles.zoomButton}
                  onPress={handleZoomOut}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="minus" size={20} color="#4a4a4a" />
                </TouchableOpacity>
                
                <View style={styles.zoomIndicator}>
                  <TextInput
                    style={styles.zoomInput}
                    value={zoomInput}
                    onChangeText={handleZoomInputChange}
                    onSubmitEditing={handleZoomInputSubmit}
                    onBlur={handleZoomInputSubmit}
                    keyboardType="numeric"
                    maxLength={3}
                    selectTextOnFocus
                  />
                  <Text style={styles.zoomPercent}>%</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.zoomButton}
                  onPress={handleZoomIn}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="plus" size={20} color="#4a4a4a" />
                </TouchableOpacity>
              </View>
            </>
          )}

          <Text style={styles.previewHint}>
            Arrastra la imagen para posicionarla y usa los botones +/- para hacer zoom
          </Text>

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.previewCancelButton}
              onPress={handleCancelPreview}
              activeOpacity={0.7}
            >
              <Text style={styles.previewCancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewConfirmButton}
              onPress={handleConfirmPhoto}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="check" size={20} color="#fff" />
              <Text style={styles.previewConfirmText}>Confirmar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.previewChangeButton}
            onPress={() => {
              setShowPreviewModal(false);
              setTimeout(handleSelectPhoto, 100);
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="image-edit" size={18} color="#2196F3" />
            <Text style={styles.previewChangeText}>Elegir otra foto</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  paddingHorizontal: 32,
  paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
    backgroundColor: "#f5f5f5",
    gap: 24,
  },
  greetingText: {
    flex: 1,
    fontSize: 26,
    color: "#2d2d2d",
    fontWeight: "600",
  },
  userName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f1f1f",
  },
  leftBlock: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 16,
    minWidth: 0,
  },
  leftBlockCompact: {
    width: "100%",
    marginBottom: 4,
  },
  rightBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginLeft: "auto",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "#e9e9e9",
    borderWidth: 1,
    borderColor: "#d2d2d2",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2f2f2f",
  },
  containerCompact: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  greetingTextCompact: {
    width: "100%",
    fontSize: 24,
  },
  rightBlockCompact: {
    marginLeft: 0,
    alignSelf: "flex-end",
  },
  userActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  menuButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#e8e8e8",
  },
  profilePhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0e0e0",
  },
  defaultPhotoContainer: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2f2f2f",
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    marginBottom: 10,
  },
  modalOptionDanger: {
    backgroundColor: "#ffebee",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#4a4a4a",
    marginLeft: 12,
    fontWeight: "500",
  },
  modalOptionTextDanger: {
    color: "#d32f2f",
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginTop: 6,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    color: "#757575",
    fontWeight: "500",
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  previewContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 420,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2f2f2f",
    marginBottom: 20,
    textAlign: "center",
  },
  previewImageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
  },
  previewCircleMask: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#e0e0e0",
    backgroundColor: "#f5f5f5",
  },
  previewImageWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    position: "absolute",
  },
  zoomControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  zoomIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    minWidth: 55,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  zoomInput: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4a4a4a",
    textAlign: "right",
    width: 28,
    padding: 0,
    margin: 0,
    outline: "none",
  },
  zoomPercent: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a4a4a",
    marginLeft: 2,
  },
  zoomText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a4a4a",
  },
  previewHint: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  previewActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  previewCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d0d0d0",
    alignItems: "center",
  },
  previewCancelText: {
    fontSize: 16,
    color: "#757575",
    fontWeight: "600",
  },
  previewConfirmButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  previewConfirmText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  previewChangeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
  },
  previewChangeText: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "500",
  },
});
