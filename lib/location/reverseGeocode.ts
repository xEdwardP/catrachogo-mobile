import * as Location from 'expo-location';

import type { LatLng } from './useCurrentLocation';

function formatAddress(address: Location.LocationGeocodedAddress): string | null {
  const streetLine = [address.street, address.streetNumber].filter(Boolean).join(' ');
  const locality = address.city || address.district || address.subregion;
  const parts = [streetLine || address.name, locality].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

export async function reverseGeocodeAddress(location: LatLng): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: location.lat,
      longitude: location.lng,
    });
    const [first] = results;
    return first ? formatAddress(first) : null;
  } catch {
    return null;
  }
}
