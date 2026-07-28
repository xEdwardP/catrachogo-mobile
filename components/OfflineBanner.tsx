import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsOnline } from '@/lib/network/useIsOnline';

export function OfflineBanner() {
  const isOnline = useIsOnline();
  const insets = useSafeAreaInsets();

  if (isOnline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 8 }]}>
      <Ionicons name="cloud-offline-outline" size={15} color="#fff" />
      <Text style={styles.text}>Sin conexión a internet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 8,
    backgroundColor: '#211D1B',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
