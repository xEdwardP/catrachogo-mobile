import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { ImageSourceActionSheet } from '@/components/ui/ImageSourceActionSheet';
import { uploadToCloudinary } from '@/lib/cloudinary/upload';
import { useToast } from '@/lib/toast/ToastContext';

export function useImageUpload(onUploaded: (url: string) => void) {
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [pickerTitle, setPickerTitle] = useState('');

  async function upload(uri: string) {
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(uri);
      onUploaded(url);
    } catch {
      showToast({ type: 'error', title: 'No se pudo subir la imagen', message: 'Intenta de nuevo.' });
    } finally {
      setIsUploading(false);
    }
  }

  async function pickFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      showToast({
        type: 'info',
        title: 'Permiso necesario',
        message: 'Activa el acceso a la cámara en los ajustes del teléfono.',
      });
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
      showToast({
        type: 'info',
        title: 'Permiso necesario',
        message: 'Activa el acceso a tus fotos en los ajustes del teléfono.',
      });
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
    setPickerTitle(title);
    setIsPickerVisible(true);
  }

  const picker = (
    <ImageSourceActionSheet
      visible={isPickerVisible}
      title={pickerTitle}
      onPickCamera={pickFromCamera}
      onPickLibrary={pickFromLibrary}
      onDismiss={() => setIsPickerVisible(false)}
    />
  );

  return { isUploading, promptForImage, picker };
}
