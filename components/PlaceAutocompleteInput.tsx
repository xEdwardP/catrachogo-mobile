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
};

const DEBOUNCE_MS = 300;

export function PlaceAutocompleteInput({
  placeholder,
  value,
  onChangeValue,
  locationBias,
  onSelect,
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

  return (
    <View>
      <View style={[styles.inputRow, { borderColor: colors.textSecondary }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeValue}
        />
        {isSearching && <ActivityIndicator size="small" color={colors.tint} />}
      </View>

      {predictions.length > 0 && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: colors.background, borderColor: colors.textSecondary },
          ]}
        >
          {predictions.map((prediction) => (
            <Pressable
              key={prediction.placeId}
              style={styles.predictionRow}
              onPress={() => handleSelect(prediction)}
            >
              <Text numberOfLines={1}>{prediction.description}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
  },
  predictionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
