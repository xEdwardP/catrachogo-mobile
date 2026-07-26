import { apiClient } from '@/lib/api/client';
import type { TripDriverInfo } from '@/lib/api/trips';

export async function getDriverPublicProfile(driverId: string): Promise<TripDriverInfo> {
  const { data } = await apiClient.get<TripDriverInfo>(`/drivers/${driverId}`);
  return data;
}
