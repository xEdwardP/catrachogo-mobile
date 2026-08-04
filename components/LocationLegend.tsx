import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

type Props = {
  color: string;
  style?: StyleProp<ViewStyle>;
};

export function LocationLegend({ color, style }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      <View style={[styles.dot, styles.transparentBackground, { backgroundColor: color }]} />
      <Text style={styles.text}>Ubicación actual</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
