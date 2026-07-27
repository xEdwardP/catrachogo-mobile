import type { ReactNode } from 'react';
import { Modal, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
  cardStyle?: StyleProp<ViewStyle>;
};

export function ModalCard({ visible, onDismiss, children, cardStyle }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay} lightColor="rgba(0,0,0,0.4)" darkColor="rgba(0,0,0,0.6)">
        <View style={[styles.card, { backgroundColor: colors.background }, cardStyle]}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    padding: 20,
  },
});
