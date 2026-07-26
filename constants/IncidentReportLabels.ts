import type { IncidentReportCategory } from '@/lib/api/incidentReports';

export const INCIDENT_REPORT_CATEGORY_LABELS: Record<IncidentReportCategory, string> = {
  safety: 'Seguridad',
  driver_behavior: 'Comportamiento del conductor',
  vehicle_condition: 'Estado del vehículo',
  payment: 'Cobro incorrecto',
  other: 'Otro',
};

export const INCIDENT_REPORT_CATEGORY_OPTIONS: IncidentReportCategory[] = [
  'safety',
  'driver_behavior',
  'vehicle_condition',
  'payment',
  'other',
];

export const INCIDENT_DESCRIPTION_MIN_LENGTH = 10;
export const INCIDENT_DESCRIPTION_MAX_LENGTH = 1000;
