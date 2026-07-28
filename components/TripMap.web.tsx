import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Text, View } from '@/components/Themed';

type Props = {
  style?: StyleProp<ViewStyle>;
};

export function TripMap({ style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>El mapa solo está disponible en la app móvil (iOS/Android).</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  text: {
    textAlign: 'center',
  },
});
