import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import type { DailyCompletedPoint } from '@/lib/api/admin';

const CHART_HEIGHT = 140;

type Props = {
  points: DailyCompletedPoint[];
};

export function CompletedTripsChart({ points }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const maxCount = points.length > 0 ? Math.max(...points.map((point) => point.count)) : 0;
  const hasData = maxCount > 0;
  const scaleMax = hasData ? maxCount : 1;

  return (
    <View style={styles.container}>
      {!hasData && (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Aún no hay viajes completados en los últimos 14 días.
        </Text>
      )}

      <View style={styles.chartRow}>
        <View style={styles.axis}>
          <Text style={[styles.axisLabel, { color: colors.textSecondary }]}>{scaleMax}</Text>
          <Text style={[styles.axisLabel, { color: colors.textSecondary }]}>0</Text>
        </View>

        <View style={styles.bars}>
          {points.map((point) => (
            <View key={point.date} style={styles.barSlot}>
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: colors.tint,
                    height: `${Math.max((point.count / scaleMax) * 100, 2)}%`,
                    opacity: point.count > 0 ? 1 : 0.2,
                  },
                ]}
              />
            </View>
          ))}
        </View>
      </View>

      {points.length > 0 && (
        <View style={styles.labelsRow}>
          <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{points[0].label}</Text>
          <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
            {points[Math.floor(points.length / 2)].label}
          </Text>
          <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
            {points[points.length - 1].label}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  emptyText: {
    fontSize: 12,
    marginBottom: 10,
  },
  chartRow: {
    flexDirection: 'row',
    height: CHART_HEIGHT,
    backgroundColor: 'transparent',
  },
  axis: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 6,
    backgroundColor: 'transparent',
  },
  axisLabel: {
    fontSize: 10,
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    backgroundColor: 'transparent',
  },
  barSlot: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingLeft: 24,
    backgroundColor: 'transparent',
  },
  dayLabel: {
    fontSize: 10,
  },
});
