import { apiClient } from '@/lib/api/client';

export type IncidentReportCategory =
  'safety' | 'driver_behavior' | 'vehicle_condition' | 'payment' | 'other';

export type CreateIncidentReportPayload = {
  tripId: string;
  category: IncidentReportCategory;
  description: string;
};

export async function createIncidentReport(
  payload: CreateIncidentReportPayload,
): Promise<{ id: string }> {
  const { data } = await apiClient.post<{ id: string }>('/incident-reports', payload);
  return data;
}
