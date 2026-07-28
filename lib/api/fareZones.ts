import { apiClient } from '@/lib/api/client';

export type FareZone = {
  id: string;
  zoneName: string;
  baseFare: number;
  farePerKm: number;
  centerLat: number;
  centerLng: number;
};

export type FareZonePayload = Omit<FareZone, 'id'>;

export async function getFareZones(): Promise<FareZone[]> {
  const { data } = await apiClient.get<FareZone[]>('/fare-zones');
  return data;
}

export async function createFareZone(payload: FareZonePayload): Promise<void> {
  await apiClient.post('/admin/fare-zones', payload);
}

export async function updateFareZone(id: string, payload: Partial<FareZonePayload>): Promise<void> {
  await apiClient.patch(`/admin/fare-zones/${id}`, payload);
}
