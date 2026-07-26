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
