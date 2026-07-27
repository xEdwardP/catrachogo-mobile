import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

type Props = {
  title: string;
  onMenuPress?: () => void;
};

export function ScreenHeader({ title, onMenuPress }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={styles.row}>
      {onMenuPress && (
        <Pressable
          style={[styles.menuButton, { backgroundColor: colors.surfaceHighlight }]}
          onPress={onMenuPress}
          hitSlop={6}
        >
          <Ionicons name="menu" size={20} color={colors.text} />
        </Pressable>
      )}
      <Text style={[Typography.h2, styles.title]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
});
