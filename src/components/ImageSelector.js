import React, { useState } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

/**
 * Componente reutilizable para seleccionar y previsualizar imágenes
 * Funciona en Web, iOS y Android
 * 
 * @param {Object} props
 * @param {Function} props.onImageSelected - Callback cuando se selecciona una imagen
 * @param {string} props.initialImageUrl - URL de imagen inicial (opcional)
 * @param {Object} props.imagePickerOptions - Opciones adicionales para ImagePicker
 */
const ImageSelector = ({ 
  onImageSelected, 
  initialImageUrl = null,
  imagePickerOptions = {} 
}) => {
  const [imageUri, setImageUri] = useState(initialImageUrl);
  const [loading, setLoading] = useState(false);

  // Opciones por defecto del selector de imágenes
  const defaultOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
    ...imagePickerOptions,
  };

  /**
   * Seleccionar imagen desde la galería
   */
  const pickImageFromGallery = async () => {
    try {
      setLoading(true);

      // Solicitar permisos en iOS
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permisos requeridos',
          'Necesitas conceder permisos para acceder a la galería de imágenes.'
        );
        return;
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync(defaultOptions);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Preparar objeto de imagen
        const imageData = {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
          width: asset.width,
          height: asset.height,
        };
        
        setImageUri(asset.uri);
        
        // Notificar al componente padre
        if (onImageSelected) {
          onImageSelected(imageData);
        }
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Tomar foto con la cámara
   */
  const takePhoto = async () => {
    try {
      setLoading(true);

      // Solicitar permisos de cámara
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permisos requeridos',
          'Necesitas conceder permisos para usar la cámara.'
        );
        return;
      }

      // Abrir cámara
      const result = await ImagePicker.launchCameraAsync({
        ...defaultOptions,
        // La cámara no soporta aspect ratio en algunos dispositivos
        aspect: undefined,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        const imageData = {
          uri: asset.uri,
          type: 'image/jpeg',
          name: `photo_${Date.now()}.jpg`,
          width: asset.width,
          height: asset.height,
        };
        
        setImageUri(asset.uri);
        
        if (onImageSelected) {
          onImageSelected(imageData);
        }
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mostrar opciones de selección
   */
  const showImageOptions = () => {
    if (Platform.OS === 'web') {
      // En web, solo galería
      pickImageFromGallery();
    } else {
      // En móvil, mostrar opciones
      Alert.alert(
        'Seleccionar imagen',
        '¿De dónde quieres obtener la imagen?',
        [
          {
            text: 'Galería',
            onPress: pickImageFromGallery,
          },
          {
            text: 'Cámara',
            onPress: takePhoto,
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    }
  };

  /**
   * Remover imagen seleccionada
   */
  const removeImage = () => {
    setImageUri(null);
    if (onImageSelected) {
      onImageSelected(null);
    }
  };

  return (
    <View style={styles.container}>
      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={removeImage}
          >
            <MaterialCommunityIcons name="close-circle" size={28} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.placeholderContainer}
          onPress={showImageOptions}
          disabled={loading}
        >
          <MaterialCommunityIcons 
            name="image-plus" 
            size={48} 
            color="#999" 
          />
          <Text style={styles.placeholderText}>
            {loading ? 'Cargando...' : 'Seleccionar imagen'}
          </Text>
        </TouchableOpacity>
      )}
      
      {imageUri && (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.changeButton}
            onPress={showImageOptions}
            disabled={loading}
          >
            <MaterialCommunityIcons name="image-edit" size={20} color="#4CAF50" />
            <Text style={styles.changeButtonText}>Cambiar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  placeholderContainer: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  buttonsContainer: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f8f4',
    borderWidth: 1,
    borderColor: '#4CAF50',
    gap: 6,
  },
  changeButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default ImageSelector;
