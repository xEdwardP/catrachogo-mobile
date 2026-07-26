import { router } from 'expo-router';
import { useState } from 'react';

import { ReportIncidentModal } from '@/components/ReportIncidentModal';
import { TripHistoryList } from '@/components/TripHistoryList';
import { getApiErrorMessage } from '@/lib/api/errors';
import { createIncidentReport, type IncidentReportCategory } from '@/lib/api/incidentReports';
import type { Trip } from '@/lib/api/trips';

function isTrackable(trip: Trip) {
  return trip.status === 'pending' || trip.status === 'accepted' || trip.status === 'in_progress';
}

function canReportTrip(trip: Trip) {
  return Boolean(trip.driverId);
}

export default function PassengerActivityScreen() {
  const [reportingTripId, setReportingTripId] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  function handlePressTrip(trip: Trip) {
    if (!isTrackable(trip)) return;
    router.push({
      pathname: '/(passenger)/trip/[tripId]',
      params: { tripId: trip.id, destinationAddress: trip.destinationAddress ?? '' },
    });
  }

  async function handleSubmitReport(payload: {
    category: IncidentReportCategory;
    description: string;
  }) {
    if (!reportingTripId) return;
    setReportError(null);
    setIsSubmittingReport(true);
    try {
      await createIncidentReport({ tripId: reportingTripId, ...payload });
      setReportingTripId(null);
    } catch (error) {
      setReportError(getApiErrorMessage(error));
    } finally {
      setIsSubmittingReport(false);
    }
  }

  return (
    <>
      <TripHistoryList
        title="Actividad"
        isTrackable={isTrackable}
        onPressTrip={handlePressTrip}
        canReportTrip={canReportTrip}
        onReportTrip={(trip) => setReportingTripId(trip.id)}
      />

      <ReportIncidentModal
        visible={reportingTripId !== null}
        isSubmitting={isSubmittingReport}
        error={reportError}
        onSubmit={handleSubmitReport}
        onDismiss={() => {
          setReportError(null);
          setReportingTripId(null);
        }}
      />
    </>
  );
}
