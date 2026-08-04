const PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

export type PlaceAutocompletePrediction = {
  placeId: string;
  description: string;
};

export type PlaceDetails = {
  address: string;
  lat: number;
  lng: number;
};

type AutocompleteResponse = {
  suggestions?: {
    placePrediction?: { placeId: string; text?: { text: string } };
  }[];
  error?: { message: string };
};

type PlaceDetailsResponse = {
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  error?: { message: string };
};

export async function autocompletePlaces(
  input: string,
  locationBias: { lat: number; lng: number },
): Promise<PlaceAutocompletePrediction[]> {
  if (!input.trim()) return [];

  const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': PLACES_API_KEY ?? '',
      'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text',
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: ['hn'],
      languageCode: 'es',
      locationRestriction: {
        circle: {
          center: { latitude: locationBias.lat, longitude: locationBias.lng },
          radius: 50000,
        },
      },
    }),
  });
  const data: AutocompleteResponse = await response.json();

  if (data.error) {
    throw new Error(`Places Autocomplete: ${data.error.message}`);
  }

  return (data.suggestions ?? [])
    .filter((s) => s.placePrediction)
    .map((s) => ({
      placeId: s.placePrediction!.placeId,
      description: s.placePrediction!.text?.text ?? '',
    }));
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': PLACES_API_KEY ?? '',
      'X-Goog-FieldMask': 'formattedAddress,location',
    },
  });
  const data: PlaceDetailsResponse = await response.json();

  if (data.error || !data.location || !data.formattedAddress) {
    throw new Error(`Place Details: ${data.error?.message ?? 'respuesta inválida'}`);
  }

  return {
    address: data.formattedAddress,
    lat: data.location.latitude,
    lng: data.location.longitude,
  };
}
