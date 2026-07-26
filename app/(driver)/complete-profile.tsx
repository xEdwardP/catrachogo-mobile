import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';

import { CloudinaryImagePicker } from '@/components/CloudinaryImagePicker';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getApiErrorMessage } from '@/lib/api/errors';
import { completeDriverProfile, type VehicleType } from '@/lib/api/drivers';

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: 'car', label: 'Carro' },
  { value: 'motorcycle', label: 'Motocicleta' },
];

export default function DriverCompleteProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [plate, setPlate] = useState('');

  const [idFrontUrl, setIdFrontUrl] = useState<string | null>(null);
  const [idBackUrl, setIdBackUrl] = useState<string | null>(null);
  const [vehicleRegistrationUrl, setVehicleRegistrationUrl] = useState<string | null>(null);
  const [selfieWithIdUrl, setSelfieWithIdUrl] = useState<string | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const allDocumentsUploaded = Boolean(
    idFrontUrl && idBackUrl && vehicleRegistrationUrl && selfieWithIdUrl && profilePhotoUrl,
  );
  const canSubmit =
    allDocumentsUploaded && licenseNumber && brand && model && year && color && plate;

  async function handleSubmit() {
    if (
      !canSubmit ||
      !idFrontUrl ||
      !idBackUrl ||
      !vehicleRegistrationUrl ||
      !selfieWithIdUrl ||
      !profilePhotoUrl
    ) {
      return;
    }
    setIsSubmitting(true);
    try {
      await completeDriverProfile({
        vehicleType,
        licenseNumber,
        vehicle: { brand, model, year: Number(year), color, plate },
        idFrontUrl,
        idBackUrl,
        vehicleRegistrationUrl,
        selfieWithIdUrl,
        profilePhotoUrl,
      });
      router.replace('/(driver)/(tabs)');
    } catch (error) {
      Alert.alert('No se pudo completar tu perfil', getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Completa tu perfil de conductor</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Necesitamos estos datos y documentos para verificar tu cuenta antes de que puedas recibir
        viajes.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DATOS DEL VEHÍCULO</Text>

      <View style={styles.vehicleTypeRow}>
        {VEHICLE_TYPES.map((option) => {
          const selected = option.value === vehicleType;
          return (
            <Pressable
              key={option.value}
              style={[
                styles.vehicleTypeChip,
                { borderColor: colors.tint },
                selected && { backgroundColor: colors.tint },
              ]}
              onPress={() => setVehicleType(option.value)}
            >
              <Text style={selected ? styles.vehicleTypeTextSelected : { color: colors.tint }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        style={[styles.input, { borderColor: colors.textSecondary, color: colors.text }]}
        placeholder="Número de licencia"
        placeholderTextColor={colors.textSecondary}
        value={licenseNumber}
        onChangeText={setLicenseNumber}
      />
      <View style={styles.row}>
        <TextInput
          style={[
            styles.input,
            styles.flex1,
            { borderColor: colors.textSecondary, color: colors.text },
          ]}
          placeholder="Marca"
          placeholderTextColor={colors.textSecondary}
          value={brand}
          onChangeText={setBrand}
        />
        <TextInput
          style={[
            styles.input,
            styles.flex1,
            { borderColor: colors.textSecondary, color: colors.text },
          ]}
          placeholder="Modelo"
          placeholderTextColor={colors.textSecondary}
          value={model}
          onChangeText={setModel}
        />
      </View>
      <View style={styles.row}>
        <TextInput
          style={[
            styles.input,
            styles.flex1,
            { borderColor: colors.textSecondary, color: colors.text },
          ]}
          placeholder="Año"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          value={year}
          onChangeText={setYear}
        />
        <TextInput
          style={[
            styles.input,
            styles.flex1,
            { borderColor: colors.textSecondary, color: colors.text },
          ]}
          placeholder="Color"
          placeholderTextColor={colors.textSecondary}
          value={color}
          onChangeText={setColor}
        />
        <TextInput
          style={[
            styles.input,
            styles.flex1,
            { borderColor: colors.textSecondary, color: colors.text },
          ]}
          placeholder="Placa"
          placeholderTextColor={colors.textSecondary}
          value={plate}
          onChangeText={setPlate}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DOCUMENTOS Y FOTO</Text>
      <View style={styles.documentsList}>
        <CloudinaryImagePicker
          label="Identidad (frente)"
          value={idFrontUrl}
          onUploaded={setIdFrontUrl}
        />
        <CloudinaryImagePicker
          label="Identidad (reverso)"
          value={idBackUrl}
          onUploaded={setIdBackUrl}
        />
        <CloudinaryImagePicker
          label="Tarjeta de circulación"
          value={vehicleRegistrationUrl}
          onUploaded={setVehicleRegistrationUrl}
        />
        <CloudinaryImagePicker
          label="Selfie con tu identidad"
          value={selfieWithIdUrl}
          onUploaded={setSelfieWithIdUrl}
        />
        <CloudinaryImagePicker
          label="Foto de perfil"
          value={profilePhotoUrl}
          onUploaded={setProfilePhotoUrl}
        />
      </View>

      <Pressable
        style={[
          styles.submitButton,
          { backgroundColor: colors.tint },
          (!canSubmit || isSubmitting) && styles.disabled,
        ]}
        onPress={handleSubmit}
        disabled={!canSubmit || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Enviar para revisión</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleTypeChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  vehicleTypeTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  documentsList: {
    gap: 10,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  disabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
