import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

type Props = TextInputProps & {
  // Cuando es true, ignora `secureTextEntry` y maneja el ocultamiento
  // internamente para poder mostrar el botón de mostrar/ocultar contraseña.
  isPassword?: boolean;
};

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { style, isPassword, secureTextEntry, ...props },
  ref,
) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [isHidden, setIsHidden] = useState(true);

  if (!isPassword) {
    return (
      <TextInput
        ref={ref}
        style={[styles.input, { borderColor: colors.textSecondary, color: colors.text }, style]}
        placeholderTextColor={colors.textSecondary}
        secureTextEntry={secureTextEntry}
        {...props}
      />
    );
  }

  return (
    <View style={styles.passwordWrapper}>
      <TextInput
        ref={ref}
        style={[
          styles.input,
          styles.passwordInput,
          { borderColor: colors.textSecondary, color: colors.text },
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
        secureTextEntry={isHidden}
        {...props}
      />
      <Pressable
        style={styles.eyeButton}
        onPress={() => setIsHidden((current) => !current)}
        hitSlop={8}
      >
        <Ionicons name={isHidden ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordWrapper: {
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
  },
});
