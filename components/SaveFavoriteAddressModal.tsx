import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { PlaceAutocompleteInput, type PlaceSelection } from '@/components/PlaceAutocompleteInput';
import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { ModalCard } from '@/components/ui/ModalCard';
import { TextField } from '@/components/ui/TextField';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  SAVED_ADDRESS_ICONS,
  SAVED_ADDRESS_LABEL_OPTIONS,
  SAVED_ADDRESS_LABELS,
} from '@/constants/SavedAddressLabels';
import { Typography } from '@/constants/Typography';
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
    <ModalCard visible={visible} onDismiss={handleDismiss}>
      <Text style={[Typography.h3, styles.title]}>Guardar dirección favorita</Text>

      <Text style={[Typography.label, styles.fieldLabel, { color: colors.textSecondary }]}>
        DIRECCIÓN
      </Text>
      <PlaceAutocompleteInput
        placeholder="Busca una dirección"
        icon="search-outline"
        value={addressText}
        onChangeValue={handleChangeAddressText}
        locationBias={locationBias}
        onSelect={handleSelectPlace}
      />

      <Text
        style={[
          Typography.label,
          styles.fieldLabel,
          styles.fieldLabelSpaced,
          { color: colors.textSecondary },
        ]}
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
              <Ionicons
                name={SAVED_ADDRESS_ICONS[option]}
                size={16}
                color={isSelected ? colors.tint : colors.textSecondary}
              />
              <Text style={isSelected ? { color: colors.tint, fontWeight: '600' } : undefined}>
                {SAVED_ADDRESS_LABELS[option]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {label === 'other' && (
        <TextField
          style={styles.customLabelInput}
          placeholder="Nombre (ej. Gimnasio)"
          value={customLabel}
          onChangeText={setCustomLabel}
          maxLength={CUSTOM_LABEL_MAX_LENGTH}
          editable={!isSubmitting}
        />
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.buttonRow}>
        <Button
          title="Cancelar"
          variant="secondary"
          onPress={handleDismiss}
          disabled={isSubmitting}
          style={styles.button}
        />
        <Button
          title="Guardar"
          onPress={handleSave}
          loading={isSubmitting}
          disabled={!canSave}
          style={styles.button}
        />
      </View>
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 16,
  },
  fieldLabel: {
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
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
    paddingVertical: 12,
  },
});
