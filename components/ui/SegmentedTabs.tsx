import {
  StyleSheet,
  View as RNView,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

type Tab<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  tabs: Tab<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedTabs<T extends string>({ tabs, value, onChange, style }: Props<T>) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <RNView style={[styles.row, style]}>
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            style={[
              styles.tab,
              { borderColor: isActive ? colors.tint : colors.textSecondary },
              isActive && { backgroundColor: colors.tint },
            ]}
            onPress={() => onChange(tab.value)}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </RNView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
});
