import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import {
  autocompletePlaces,
  getPlaceDetails,
  type PlaceAutocompletePrediction,
} from '@/lib/places/client';

export type PlaceSelection = {
  address: string;
  lat: number;
  lng: number;
};

type Props = {
  placeholder: string;
  value: string;
  onChangeValue: (value: string) => void;
  locationBias: { lat: number; lng: number };
  onSelect: (place: PlaceSelection) => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

const DEBOUNCE_MS = 300;

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

export function PlaceAutocompleteInput({
  placeholder,
  value,
  onChangeValue,
  locationBias,
  onSelect,
  icon,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [predictions, setPredictions] = useState<PlaceAutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSearchRef = useRef(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      setIsSearching(false);
      return;
    }

    if (!value.trim()) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      autocompletePlaces(value, locationBias)
        .then(setPredictions)
        .catch(() => setPredictions([]))
        .finally(() => setIsSearching(false));
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  async function handleSelect(prediction: PlaceAutocompletePrediction) {
    setPredictions([]);
    try {
      const details = await getPlaceDetails(prediction.placeId);
      skipNextSearchRef.current = true;
      onChangeValue(details.address);
      onSelect(details);
    } catch {}
  }

  function handleClear() {
    onChangeValue('');
    setPredictions([]);
  }

  return (
    <View style={styles.transparentBackground}>
      <View style={[styles.inputRow, { backgroundColor: colors.surfaceHighlight }, CARD_SHADOW]}>
        {icon && <Ionicons name={icon} size={19} color={colors.textSecondary} />}
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeValue}
        />
        {isSearching ? (
          <ActivityIndicator size="small" color={colors.tint} />
        ) : (
          value.length > 0 && (
            <Pressable onPress={handleClear} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )
        )}
      </View>

      {predictions.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: colors.surfaceHighlight }, CARD_SHADOW]}>
          {predictions.map((prediction, index) => (
            <Pressable
              key={prediction.placeId}
              style={[
                styles.predictionRow,
                index < predictions.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.background,
                },
              ]}
              onPress={() => handleSelect(prediction)}
            >
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.predictionText} numberOfLines={1}>
                {prediction.description}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 16,
  },
  dropdown: {
    borderRadius: 14,
    marginTop: 8,
    overflow: 'hidden',
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  predictionText: {
    flex: 1,
    fontSize: 14,
  },
});
