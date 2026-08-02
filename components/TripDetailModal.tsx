import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { ModalCard } from '@/components/ui/ModalCard';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getCancellationReasonLabel } from '@/constants/CancellationReasons';
import { TRIP_STATUS_BADGE_COLORS, TRIP_STATUS_LABELS } from '@/constants/TripStatusLabels';
import type { Trip } from '@/lib/api/trips';

type Props = {
  trip: Trip | null;
  onDismiss: () => void;
};

export function TripDetailModal({ trip, onDismiss }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <ModalCard visible={trip !== null} onDismiss={onDismiss}>
      {trip && (
        <>
          <View style={[styles.headerRow, styles.transparentBackground]}>
            <View
              style={[
                styles.badge,
                { backgroundColor: TRIP_STATUS_BADGE_COLORS[trip.status].background },
              ]}
            >
              <Text style={[styles.badgeText, { color: TRIP_STATUS_BADGE_COLORS[trip.status].text }]}>
                {TRIP_STATUS_LABELS[trip.status]}
              </Text>
            </View>
            <Pressable onPress={onDismiss} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={[styles.row, styles.transparentBackground]}>
            <Ionicons name="navigate-outline" size={14} color={colors.textSecondary} />
            <View style={styles.rowText}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>ORIGEN</Text>
              <Text style={styles.value}>{trip.originAddress || '—'}</Text>
            </View>
          </View>

          <View style={[styles.row, styles.transparentBackground]}>
            <Ionicons name="flag-outline" size={14} color={colors.textSecondary} />
            <View style={styles.rowText}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>DESTINO</Text>
              <Text style={styles.value}>{trip.destinationAddress || '—'}</Text>
            </View>
          </View>

          <View style={[styles.fareRow, styles.transparentBackground]}>
            <View style={[styles.rowText, styles.transparentBackground]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>TARIFA</Text>
              <Text style={[styles.value, { color: colors.success, fontWeight: '700' }]}>
                L. {trip.fare.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.rowText, styles.transparentBackground]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>DISTANCIA</Text>
              <Text style={styles.value}>{trip.distanceKm.toFixed(1)} km</Text>
            </View>
          </View>

          {trip.requestedAt && (
            <View style={[styles.row, styles.transparentBackground]}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <View style={styles.rowText}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>SOLICITADO</Text>
                <Text style={styles.value}>
                  {new Date(trip.requestedAt).toLocaleString('es-HN')}
                </Text>
              </View>
            </View>
          )}

          {trip.status === 'cancelled' && trip.cancelReason && (
            <View style={[styles.row, styles.transparentBackground]}>
              <Ionicons name="close-circle-outline" size={14} color={colors.textSecondary} />
              <View style={styles.rowText}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>MOTIVO</Text>
                <Text style={styles.value}>{getCancellationReasonLabel(trip.cancelReason)}</Text>
              </View>
            </View>
          )}
        </>
      )}
    </ModalCard>
  );
}

const styles = StyleSheet.create({
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  rowText: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fareRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
  },
});
