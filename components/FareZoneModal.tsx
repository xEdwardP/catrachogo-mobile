import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.overlay} lightColor="rgba(0,0,0,0.4)" darkColor="rgba(0,0,0,0.6)">
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <Text style={styles.title}>{zone ? 'Editar zona' : 'Nueva zona'}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            La tarifa aplicable a un viaje se calcula con la zona más cercana al punto de origen.
          </Text>

          <TextInput
            style={[styles.input, { borderColor: colors.textSecondary, color: colors.text }]}
            placeholder="Nombre de la zona"
            placeholderTextColor={colors.textSecondary}
            value={zoneName}
            onChangeText={setZoneName}
            editable={!isSubmitting}
          />
          <View style={styles.row}>
            <TextInput
              style={[
                styles.input,
                styles.flex1,
                { borderColor: colors.textSecondary, color: colors.text },
              ]}
              placeholder="Tarifa base (L.)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={baseFare}
              onChangeText={setBaseFare}
              editable={!isSubmitting}
            />
            <TextInput
              style={[
                styles.input,
                styles.flex1,
                { borderColor: colors.textSecondary, color: colors.text },
              ]}
              placeholder="Tarifa por km (L.)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={farePerKm}
              onChangeText={setFarePerKm}
              editable={!isSubmitting}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[
                styles.input,
                styles.flex1,
                { borderColor: colors.textSecondary, color: colors.text },
              ]}
              placeholder="Centro (lat)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="default"
              value={centerLat}
              onChangeText={setCenterLat}
              editable={!isSubmitting}
            />
            <TextInput
              style={[
                styles.input,
                styles.flex1,
                { borderColor: colors.textSecondary, color: colors.text },
              ]}
              placeholder="Centro (lng)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="default"
              value={centerLng}
              onChangeText={setCenterLng}
              editable={!isSubmitting}
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.secondaryButton, { borderColor: colors.textSecondary }]}
              onPress={handleDismiss}
              disabled={isSubmitting}
            >
              <Text>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                { backgroundColor: colors.tint },
                isSubmitting && styles.disabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Guardar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  error: {
    color: '#C0392B',
    fontSize: 13,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
