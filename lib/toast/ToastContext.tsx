import { Ionicons } from '@expo/vector-icons';
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

type ToastType = 'success' | 'error' | 'info';

type ToastOptions = {
  type?: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
};

type ToastState = ToastOptions & { id: number };

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

const DEFAULT_DURATION_MS = 3200;
const HIDDEN_OFFSET = -140;

export function ToastProvider({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [toast, setToast] = useState<ToastState | null>(null);
  const translateY = useRef(new Animated.Value(HIDDEN_OFFSET)).current;
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const hide = useCallback(() => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    Animated.timing(translateY, {
      toValue: HIDDEN_OFFSET,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [translateY]);

  const showToast = useCallback(
    (options: ToastOptions) => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      idRef.current += 1;
      setToast({ ...options, id: idRef.current });
      translateY.setValue(HIDDEN_OFFSET);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 9,
        tension: 60,
      }).start();
      dismissTimerRef.current = setTimeout(hide, options.durationMs ?? DEFAULT_DURATION_MS);
    },
    [hide, translateY],
  );

  const type = toast?.type ?? 'info';
  const accentColor = type === 'error' ? '#C0392B' : type === 'success' ? colors.success : colors.tint;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.background,
              borderLeftColor: accentColor,
              transform: [{ translateY }],
            },
          ]}
        >
          <Pressable style={styles.content} onPress={hide}>
            <Ionicons name={ICONS[type]} size={20} color={accentColor} />
            <View style={styles.textColumn}>
              {toast.title && <Text style={styles.title}>{toast.title}</Text>}
              <Text style={[styles.message, { color: colors.textSecondary }]}>{toast.message}</Text>
            </View>
          </Pressable>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>');
  }
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 52,
    left: 16,
    right: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  textColumn: {
    flex: 1,
    backgroundColor: 'transparent',
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
});
