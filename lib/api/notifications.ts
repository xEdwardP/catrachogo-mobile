import { apiClient } from '@/lib/api/client';
import type { PaginatedResult } from '@/lib/api/trips';

export type NotificationType =
  | 'trip_accepted'
  | 'trip_started'
  | 'trip_completed'
  | 'trip_cancelled'
  | 'withdrawal_resolved'
  | 'driver_verification_updated'
  | 'rating_received';

export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedTripId: string | null;
  read: boolean;
  createdAt: string;
};

export async function getNotifications(
  page: number,
  limit: number,
): Promise<PaginatedResult<AppNotification>> {
  const { data } = await apiClient.get<PaginatedResult<AppNotification>>('/notifications', {
    params: { page, limit },
  });
  return data;
}

export async function getUnreadNotificationsCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count');
  return data.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/notifications/read-all');
}
