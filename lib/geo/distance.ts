type LatLng = { lat: number; lng: number };

export function distanceMeters(a: LatLng, b: LatLng): number {
  const earthRadiusMeters = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(h));
}

export const ARRIVAL_RADIUS_METERS = 150;

export function isPlausibleMovement(
  previous: LatLng & { timestampMs: number },
  next: LatLng & { timestampMs: number },
  maxSpeedKmh = 140,
): boolean {
  const elapsedHours = (next.timestampMs - previous.timestampMs) / 3_600_000;
  if (elapsedHours <= 0) return true;
  const impliedSpeedKmh = distanceMeters(previous, next) / 1000 / elapsedHours;
  return impliedSpeedKmh <= maxSpeedKmh;
}
