import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput } from 'react-native';

import { PlaceAutocompleteInput, type PlaceSelection } from '@/components/PlaceAutocompleteInput';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SAVED_ADDRESS_LABEL_OPTIONS, SAVED_ADDRESS_LABELS } from '@/constants/SavedAddressLabels';
import type { CreateSavedAddressPayload, SavedAddressLabel } from '@/lib/api/savedAddresses';

const CUSTOM_LABEL_MAX_LENGTH = 40;

type Props = {
  visible: boolean;
  isSubmitting: boolean;
  locationBias: { lat: number; lng: number };
  error: string | null;
  onSave: (payload: CreateSavedAddressPayload) => void;
  onDismiss: () => void;
};

export function SaveFavoriteAddressModal({
  visible,
  isSubmitting,
  locationBias,
  error,
  onSave,
  onDismiss,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [addressText, setAddressText] = useState('');
  const [place, setPlace] = useState<PlaceSelection | null>(null);
  const [label, setLabel] = useState<SavedAddressLabel>('home');
  const [customLabel, setCustomLabel] = useState('');

  const canSave = Boolean(place) && (label !== 'other' || customLabel.trim().length > 0);

  function resetForm() {
    setAddressText('');
    setPlace(null);
    setLabel('home');
    setCustomLabel('');
  }

  function handleDismiss() {
    if (isSubmitting) return;
    resetForm();
    onDismiss();
  }

  function handleSelectPlace(selection: PlaceSelection) {
    setPlace(selection);
    setAddressText(selection.address);
  }

  function handleChangeAddressText(value: string) {
    setAddressText(value);
    if (place && value !== place.address) {
      setPlace(null);
    }
  }

  function handleSave() {
    if (!place || !canSave) return;
    onSave({
      label,
      customLabel: label === 'other' ? customLabel.trim() : undefined,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
    });
    resetForm();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.overlay} lightColor="rgba(0,0,0,0.4)" darkColor="rgba(0,0,0,0.6)">
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <Text style={styles.title}>Guardar dirección favorita</Text>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>DIRECCIÓN</Text>
          <PlaceAutocompleteInput
            placeholder="Busca una dirección"
            value={addressText}
            onChangeValue={handleChangeAddressText}
            locationBias={locationBias}
            onSelect={handleSelectPlace}
          />

          <Text
            style={[styles.fieldLabel, styles.fieldLabelSpaced, { color: colors.textSecondary }]}
          >
            ETIQUETA
          </Text>
          <View style={styles.labelRow}>
            {SAVED_ADDRESS_LABEL_OPTIONS.map((option) => {
              const isSelected = label === option;
              return (
                <Pressable
                  key={option}
                  style={[
                    styles.labelChip,
                    { borderColor: isSelected ? colors.tint : colors.textSecondary },
                    isSelected && { backgroundColor: colors.surfaceHighlight },
                  ]}
                  onPress={() => setLabel(option)}
                  disabled={isSubmitting}
                >
                  <Text style={isSelected ? { color: colors.tint, fontWeight: '600' } : undefined}>
                    {SAVED_ADDRESS_LABELS[option]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {label === 'other' && (
            <TextInput
              style={[
                styles.input,
                styles.customLabelInput,
                { borderColor: colors.textSecondary, color: colors.text },
              ]}
              placeholder="Nombre (ej. Gimnasio)"
              placeholderTextColor={colors.textSecondary}
              value={customLabel}
              onChangeText={setCustomLabel}
              maxLength={CUSTOM_LABEL_MAX_LENGTH}
              editable={!isSubmitting}
            />
          )}

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
                (!canSave || isSubmitting) && styles.disabled,
              ]}
              onPress={handleSave}
              disabled={!canSave || isSubmitting}
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
    maxWidth: 380,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  fieldLabelSpaced: {
    marginTop: 16,
  },
  labelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  labelChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  customLabelInput: {
    marginTop: 10,
  },
  error: {
    color: '#C0392B',
    fontSize: 13,
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
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
