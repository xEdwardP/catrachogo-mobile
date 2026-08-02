import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { CloudinaryImagePicker } from '@/components/CloudinaryImagePicker';
import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  VEHICLE_TYPE_ICONS,
  VEHICLE_TYPE_LABELS,
  VEHICLE_TYPE_OPTIONS,
} from '@/constants/VehicleTypeLabels';
import { getApiErrorMessage } from '@/lib/api/errors';
import { completeDriverProfile, type VehicleType } from '@/lib/api/drivers';
import { useToast } from '@/lib/toast/ToastContext';

export default function DriverCompleteProfileScreen() {
  const { showToast } = useToast();
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
      showToast({
        type: 'error',
        title: 'No se pudo completar tu perfil',
        message: getApiErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.surfaceHighlight }]}>
        <Ionicons name="car-sport-outline" size={26} color={colors.tint} />
      </View>
      <Text style={styles.title}>Completa tu perfil de conductor</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Necesitamos estos datos y documentos para verificar tu cuenta antes de que puedas recibir
        viajes.
      </Text>

      <View style={[styles.sectionHeader, styles.transparentBackground]}>
        <Ionicons name="car-outline" size={14} color={colors.textSecondary} />
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          DATOS DEL VEHÍCULO
        </Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.vehicleTypeRow}>
          {VEHICLE_TYPE_OPTIONS.map((option) => {
            const selected = option === vehicleType;
            return (
              <Pressable
                key={option}
                style={[
                  styles.vehicleTypeChip,
                  { borderColor: colors.tint },
                  selected && { backgroundColor: colors.tint },
                ]}
                onPress={() => setVehicleType(option)}
              >
                <Ionicons
                  name={VEHICLE_TYPE_ICONS[option]}
                  size={16}
                  color={selected ? '#fff' : colors.tint}
                />
                <Text style={selected ? styles.vehicleTypeTextSelected : { color: colors.tint }}>
                  {VEHICLE_TYPE_LABELS[option]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextField
          style={styles.fieldSpaced}
          placeholder="Número de licencia"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
        />
        <View style={[styles.row, styles.fieldSpaced]}>
          <TextField
            style={styles.flex1}
            placeholder="Marca"
            value={brand}
            onChangeText={setBrand}
          />
          <TextField
            style={styles.flex1}
            placeholder="Modelo"
            value={model}
            onChangeText={setModel}
          />
        </View>
        <View style={[styles.row, styles.fieldSpaced]}>
          <TextField
            style={styles.flex1}
            placeholder="Año"
            keyboardType="number-pad"
            value={year}
            onChangeText={setYear}
          />
          <TextField
            style={styles.flex1}
            placeholder="Color"
            value={color}
            onChangeText={setColor}
          />
          <TextField
            style={styles.flex1}
            placeholder="Placa"
            value={plate}
            onChangeText={setPlate}
          />
        </View>
      </Card>

      <View style={[styles.sectionHeader, styles.transparentBackground]}>
        <Ionicons name="cloud-upload-outline" size={14} color={colors.textSecondary} />
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          DOCUMENTOS Y FOTO
        </Text>
      </View>
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

      <Button
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={!canSubmit}
        style={styles.submitButton}
      >
        <View style={[styles.buttonContent, styles.transparentBackground]}>
          <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
          <Text style={styles.submitButtonText}>Enviar para revisión</Text>
        </View>
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleTypeChip: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  vehicleTypeTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  fieldSpaced: {
    marginTop: 10,
  },
  documentsList: {
    gap: 10,
  },
  submitButton: {
    marginTop: 12,
    marginBottom: 32,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
