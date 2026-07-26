import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { uploadToCloudinary } from '@/lib/cloudinary/upload';

type Props = {
  label: string;
  value: string | null;
  onUploaded: (url: string) => void;
};

export function CloudinaryImagePicker({ label, value, onUploaded }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
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

  function handlePress() {
    Alert.alert(label, 'Elige una opción', [
      { text: 'Tomar foto', onPress: pickFromCamera },
      { text: 'Elegir de galería', onPress: pickFromLibrary },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <Pressable
      style={[styles.container, { borderColor: value ? colors.tint : colors.textSecondary }]}
      onPress={handlePress}
      disabled={isUploading}
    >
      {value ? (
        <Image source={{ uri: value }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: colors.surfaceHighlight }]}>
          <Text style={{ color: colors.textSecondary }}>+</Text>
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.status, { color: value ? colors.success : colors.textSecondary }]}>
          {isUploading ? 'Subiendo...' : value ? 'Subido' : 'Toca para subir'}
        </Text>
      </View>
      {isUploading && <ActivityIndicator color={colors.tint} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  placeholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  status: {
    fontSize: 12,
    marginTop: 2,
  },
});
