import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { ModalCard } from '@/components/ui/ModalCard';
import { TextField } from '@/components/ui/TextField';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { getApiErrorMessage } from '@/lib/api/errors';
import { createFareZone, updateFareZone, type FareZone } from '@/lib/api/fareZones';

type Props = {
  visible: boolean;
  zone: FareZone | null;
  onDismiss: () => void;
  onSuccess: () => void;
};

function toFieldValue(value: number | undefined): string {
  return value === undefined ? '' : String(value);
}

export function FareZoneModal({ visible, zone, onDismiss, onSuccess }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [zoneName, setZoneName] = useState('');
  const [baseFare, setBaseFare] = useState('');
  const [farePerKm, setFarePerKm] = useState('');
  const [centerLat, setCenterLat] = useState('');
  const [centerLng, setCenterLng] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setZoneName(zone?.zoneName ?? '');
    setBaseFare(toFieldValue(zone?.baseFare));
    setFarePerKm(toFieldValue(zone?.farePerKm));
    setCenterLat(toFieldValue(zone?.centerLat));
    setCenterLng(toFieldValue(zone?.centerLng));
    setError(null);
  }, [visible, zone]);

  function handleDismiss() {
    if (isSubmitting) return;
    onDismiss();
  }

  async function handleSubmit() {
    const trimmedName = zoneName.trim();
    const parsedBaseFare = Number(baseFare);
    const parsedFarePerKm = Number(farePerKm);
    const parsedCenterLat = Number(centerLat);
    const parsedCenterLng = Number(centerLng);

    if (!trimmedName) {
      setError('Ingresa un nombre para la zona.');
      return;
    }
    if (
      !Number.isFinite(parsedBaseFare) ||
      !Number.isFinite(parsedFarePerKm) ||
      parsedBaseFare < 0 ||
      parsedFarePerKm < 0
    ) {
      setError('La tarifa base y la tarifa por km deben ser números válidos.');
      return;
    }
    if (!Number.isFinite(parsedCenterLat) || !Number.isFinite(parsedCenterLng)) {
      setError('El centro de la zona debe tener latitud y longitud válidas.');
      return;
    }

    const payload = {
      zoneName: trimmedName,
      baseFare: parsedBaseFare,
      farePerKm: parsedFarePerKm,
      centerLat: parsedCenterLat,
      centerLng: parsedCenterLng,
    };

    setError(null);
    setIsSubmitting(true);
    try {
      if (zone) {
        await updateFareZone(zone.id, payload);
      } else {
        await createFareZone(payload);
      }
      onSuccess();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ModalCard visible={visible} onDismiss={handleDismiss}>
      <View style={[styles.titleRow, styles.transparentBackground]}>
        <View style={[styles.iconCircle, { backgroundColor: colors.surfaceHighlight }]}>
          <Ionicons name="map-outline" size={18} color={colors.tint} />
        </View>
        <Text style={styles.title}>{zone ? 'Editar zona' : 'Nueva zona'}</Text>
      </View>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        La tarifa aplicable a un viaje se calcula con la zona más cercana al punto de origen.
      </Text>

      <Text style={[Typography.label, styles.fieldLabel, { color: colors.textSecondary }]}>
        NOMBRE DE LA ZONA
      </Text>
      <TextField
        placeholder="Ej. Centro de Tegucigalpa"
        value={zoneName}
        onChangeText={setZoneName}
        editable={!isSubmitting}
        style={styles.field}
      />
      <View style={styles.row}>
        <View style={[styles.flex1, styles.transparentBackground]}>
          <Text style={[Typography.label, styles.fieldLabel, { color: colors.textSecondary }]}>
            TARIFA BASE (L.)
          </Text>
          <TextField
            placeholder="Ej. 30"
            keyboardType="decimal-pad"
            value={baseFare}
            onChangeText={setBaseFare}
            editable={!isSubmitting}
            style={styles.field}
          />
        </View>
        <View style={[styles.flex1, styles.transparentBackground]}>
          <Text style={[Typography.label, styles.fieldLabel, { color: colors.textSecondary }]}>
            TARIFA POR KM (L.)
          </Text>
          <TextField
            placeholder="Ej. 5"
            keyboardType="decimal-pad"
            value={farePerKm}
            onChangeText={setFarePerKm}
            editable={!isSubmitting}
            style={styles.field}
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={[styles.flex1, styles.transparentBackground]}>
          <Text style={[Typography.label, styles.fieldLabel, { color: colors.textSecondary }]}>
            CENTRO (LATITUD)
          </Text>
          <TextField
            placeholder="Ej. 14.0723"
            value={centerLat}
            onChangeText={setCenterLat}
            editable={!isSubmitting}
            style={styles.field}
          />
        </View>
        <View style={[styles.flex1, styles.transparentBackground]}>
          <Text style={[Typography.label, styles.fieldLabel, { color: colors.textSecondary }]}>
            CENTRO (LONGITUD)
          </Text>
          <TextField
            placeholder="Ej. -87.1921"
            value={centerLng}
            onChangeText={setCenterLng}
            editable={!isSubmitting}
            style={styles.field}
          />
        </View>
      </View>

      {error && (
        <View style={[styles.noticeRow, styles.transparentBackground]}>
          <Ionicons name="alert-circle" size={14} color="#C0392B" />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <Button
          variant="secondary"
          onPress={handleDismiss}
          disabled={isSubmitting}
          style={styles.button}
        >
          <View style={[styles.buttonContent, styles.transparentBackground]}>
            <Ionicons name="close-outline" size={16} color={colors.text} />
            <Text style={{ color: colors.text, fontWeight: '600' }}>Cancelar</Text>
          </View>
        </Button>
        <Button onPress={handleSubmit} loading={isSubmitting} style={styles.button}>
          <View style={[styles.buttonContent, styles.transparentBackground]}>
            <Ionicons name="checkmark-done-outline" size={16} color="#fff" />
            <Text style={styles.confirmButtonText}>Guardar</Text>
          </View>
        </Button>
      </View>
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  field: {
    marginBottom: 10,
  },
  fieldLabel: {
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  error: {
    color: '#C0392B',
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
