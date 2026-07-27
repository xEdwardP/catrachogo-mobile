import { apiClient } from '@/lib/api/client';
import type { VehicleType } from '@/lib/api/drivers';
import type { TripStatus } from '@/lib/api/trips';

type AdminDashboardStatsResponse = {
  tripsByStatus: Record<TripStatus, number>;
  revenueToday: number;
  tripsCompletedToday: number;
  availableDrivers: number;
  pendingDrivers: number;
  pendingWithdrawals: number;
  dailyCompleted: { date: string; tripsCompleted: number; revenue: number }[];
};

export type DailyCompletedPoint = {
  date: string;
  label: string;
  count: number;
};

export type AdminStats = {
  activeTrips: number;
  pendingTrips: number;
  acceptedTrips: number;
  inProgressTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalTrips: number;
  tripsCompletedToday: number;
  revenueToday: number;
  availableDrivers: number;
  pendingDrivers: number;
  pendingWithdrawals: number;
  dailyCompleted: DailyCompletedPoint[];
};

function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminDashboardStatsResponse>('/admin/stats');
  const { pending, accepted, in_progress: inProgress, completed, cancelled } = data.tripsByStatus;

  return {
    activeTrips: pending + accepted + inProgress,
    pendingTrips: pending,
    acceptedTrips: accepted,
    inProgressTrips: inProgress,
    completedTrips: completed,
    cancelledTrips: cancelled,
    totalTrips: pending + accepted + inProgress + completed + cancelled,
    tripsCompletedToday: data.tripsCompletedToday,
    revenueToday: data.revenueToday,
    availableDrivers: data.availableDrivers,
    pendingDrivers: data.pendingDrivers,
    pendingWithdrawals: data.pendingWithdrawals,
    dailyCompleted: data.dailyCompleted.map((point) => ({
      date: point.date,
      label: parseDateOnly(point.date).toLocaleDateString('es-HN', {
        day: 'numeric',
        month: 'short',
      }),
      count: point.tripsCompleted,
    })),
  };
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type AdminDriverRow = {
  id: string;
  userId: string;
  vehicleType: VehicleType;
  licenseNumber: string;
  verificationStatus: VerificationStatus;
  averageRating: number | null;
  available: boolean;
  approvedAt: string | null;
  idFrontUrl: string;
  idBackUrl: string;
  vehicleRegistrationUrl: string;
  selfieWithIdUrl: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    profilePhotoUrl: string | null;
    createdAt: string;
  };
  vehicles: {
    id: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    plate: string;
  }[];
};

export async function getAdminDrivers(status: VerificationStatus): Promise<AdminDriverRow[]> {
  const { data } = await apiClient.get<AdminDriverRow[]>('/admin/drivers', { params: { status } });
  return data;
}

export async function updateDriverVerification(
  driverId: string,
  verificationStatus: 'approved' | 'rejected',
): Promise<void> {
  await apiClient.patch(`/admin/drivers/${driverId}/verification`, { verificationStatus });
}
