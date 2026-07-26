import { apiClient } from '@/lib/api/client';

export type FareEstimate = {
  distanceKm: number;
  fare: number;
};

export type EstimateFareInput = {
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
};

export async function estimateFare(input: EstimateFareInput): Promise<FareEstimate> {
  const { data } = await apiClient.post<FareEstimate>('/trips/estimate', input);
  return data;
}

export type CreateTripInput = {
  originLat: number;
  originLng: number;
  originAddress: string;
  destinationLat: number;
  destinationLng: number;
  destinationAddress: string;
};

export type TripStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export type Trip = {
  id: string;
  passengerId: string;
  driverId: string | null;
  originLat: number;
  originLng: number;
  originAddress: string;
  destinationLat: number;
  destinationLng: number;
  destinationAddress: string;
  status: TripStatus;
  distanceKm: number;
  fare: number;
  requestedAt: string;
  arrivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const { data } = await apiClient.post<Trip>('/trips', input);
  return data;
}

export type CancellationReason = 'changed_plans' | 'found_other_ride' | 'took_too_long' | 'other';

export type DriverVehicle = {
  id: string;
  driverId: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  plate: string;
};

export type TripDriverInfo = {
  id: string;
  userId: string;
  name: string;
  profilePhotoUrl: string | null;
  averageRating: number;
  vehicle: DriverVehicle | null;
};

export type TripDetail = {
  id: string;
  status: TripStatus;
  fare: number;
  distanceKm: number;
  originAddress: string;
  originLat: number;
  originLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  driverId: string | null;
  ratedByMe: boolean;
  arrivedAt?: string | null;
  driverPhone?: string | null;
  passengerPhone?: string | null;
  driver?: TripDriverInfo;
};

export type DriverLocation = {
  lat: number;
  lng: number;
  recordedAt: string;
};

export async function getTripDetail(tripId: string): Promise<TripDetail> {
  const { data } = await apiClient.get<TripDetail>(`/trips/${tripId}`);
  return data;
}

export async function cancelTrip(tripId: string, reason: CancellationReason): Promise<Trip> {
  const { data } = await apiClient.patch<Trip>(`/trips/${tripId}/cancel`, { reason });
  return data;
}

export async function endTripEarly(tripId: string): Promise<Trip> {
  const { data } = await apiClient.patch<Trip>(`/trips/${tripId}/complete-early`);
  return data;
}

export async function getDriverLocation(tripId: string): Promise<DriverLocation | null> {
  const { data } = await apiClient.get<DriverLocation | null>(`/trips/${tripId}/driver-location`);
  return data ?? null;
}

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export async function getTripHistory(page: number, limit: number): Promise<PaginatedResult<Trip>> {
  const { data } = await apiClient.get<PaginatedResult<Trip>>('/trips/history', {
    params: { page, limit },
  });
  return data;
}

export async function acceptTrip(tripId: string): Promise<Trip> {
  const { data } = await apiClient.patch<Trip>(`/trips/${tripId}/accept`);
  return data;
}

export async function rejectTrip(tripId: string): Promise<void> {
  await apiClient.patch(`/trips/${tripId}/reject`);
}
