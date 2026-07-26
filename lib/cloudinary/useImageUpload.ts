import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert } from 'react-native';

import { uploadToCloudinary } from '@/lib/cloudinary/upload';

export function useImageUpload(onUploaded: (url: string) => void) {
  const [isUploading, setIsUploading] = useState(false);

  async function upload(uri: string) {
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(uri);
      onUploaded(url);
    } catch {
      Alert.alert('No se pudo subir la imagen', 'Intenta de nuevo.');
    } finally {
      setIsUploading(false);
    }
  }

  async function pickFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permiso necesario', 'Activa el acceso a la cámara en los ajustes del teléfono.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) {
      upload(result.assets[0].uri);
    }
  }

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permiso necesario', 'Activa el acceso a tus fotos en los ajustes del teléfono.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) {
      upload(result.assets[0].uri);
    }
  }

  function promptForImage(title: string) {
    Alert.alert(title, 'Elige una opción', [
      { text: 'Tomar foto', onPress: pickFromCamera },
      { text: 'Elegir de galería', onPress: pickFromLibrary },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return { isUploading, promptForImage };
}
