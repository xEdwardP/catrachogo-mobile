import { decode } from '@googlemaps/polyline-codec';

const DIRECTIONS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

export type LatLng = { lat: number; lng: number };

export type DirectionsRoute = {
  path: LatLng[];
  durationText: string | null;
};

type DirectionsResponse = {
  status: string;
  error_message?: string;
  routes?: {
    overview_polyline: { points: string };
    legs?: { duration?: { text: string } }[];
  }[];
};

export async function getDirectionsRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<DirectionsRoute | null> {
  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    key: DIRECTIONS_API_KEY ?? '',
    language: 'es',
  });

  const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params}`);
  const data: DirectionsResponse = await response.json();

  const route = data.routes?.[0];
  if (data.status !== 'OK' || !route) return null;

  const points = decode(route.overview_polyline.points, 5);
  return {
    path: points.map(([lat, lng]) => ({ lat, lng })),
    durationText: route.legs?.[0]?.duration?.text ?? null,
  };
}
