import { apiClient } from '@/lib/api/client';

export async function sendDriverLocation(lat: number, lng: number, tripId?: string): Promise<void> {
  await apiClient.post('/tracking/location', { lat, lng, tripId });
}
