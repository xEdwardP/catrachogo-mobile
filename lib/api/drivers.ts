import { apiClient } from '@/lib/api/client';
import type { DriverVehicle, TripDriverInfo } from '@/lib/api/trips';

export async function getDriverPublicProfile(driverId: string): Promise<TripDriverInfo> {
  const { data } = await apiClient.get<TripDriverInfo>(`/drivers/${driverId}`);
  return data;
}

export type VehicleType = 'car' | 'motorcycle';

export type CompleteDriverProfilePayload = {
  vehicleType: VehicleType;
  licenseNumber: string;
  vehicle: Pick<DriverVehicle, 'brand' | 'model' | 'year' | 'color' | 'plate'>;
  idFrontUrl: string;
  idBackUrl: string;
  vehicleRegistrationUrl: string;
  selfieWithIdUrl: string;
  profilePhotoUrl: string;
};

export async function completeDriverProfile(payload: CompleteDriverProfilePayload): Promise<void> {
  await apiClient.post('/drivers/complete-profile', payload);
}

export type DriverSummary = {
  earningsToday: number;
  tripsToday: number;
  averageRating: number;
  available: boolean;
};

export async function getDriverSummary(): Promise<DriverSummary> {
  const { data } = await apiClient.get<DriverSummary>('/drivers/summary');
  return data;
}
