import type { VehicleType } from '@/lib/api/drivers';

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  car: 'Carro',
  motorcycle: 'Motocicleta',
};

export const VEHICLE_TYPE_OPTIONS: VehicleType[] = ['car', 'motorcycle'];
