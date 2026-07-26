import type { TripStatus } from '@/lib/api/trips';

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptado',
  in_progress: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export const TRIP_STATUS_BADGE_COLORS: Record<TripStatus, { background: string; text: string }> = {
  pending: { background: '#FEF3C7', text: '#92400E' },
  accepted: { background: '#DBEAFE', text: '#1E40AF' },
  in_progress: { background: '#DBEAFE', text: '#1E40AF' },
  completed: { background: '#D1FAE5', text: '#158059' },
  cancelled: { background: '#E5E7EB', text: '#4B5563' },
};
