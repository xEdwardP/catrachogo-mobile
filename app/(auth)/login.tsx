import { Link } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { Text, View } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/lib/auth/AuthContext';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSuccess(idToken: string) {
    setError(null);
    try {
      await loginWithGoogle(idToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    }
  }

  function handleGoogleError() {
    setError('No se pudo iniciar sesión con Google. Intenta de nuevo.');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Image
          source={require('@/assets/logo/logo_with_text.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[Typography.body, styles.subtitle, { color: colors.textSecondary }]}>
          Inicia sesión para continuar
        </Text>

        <TextField
          placeholder="Correo electrónico"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          placeholder="Contraseña"
          isPassword
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          title="Iniciar sesión"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={!email || !password}
          style={styles.button}
        />

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.textSecondary }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>o</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.textSecondary }]} />
        </View>

        <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

        <Link href="/(auth)/register" style={styles.link}>
          <Text style={{ color: colors.tint }}>¿No tienes cuenta? Regístrate</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  logo: {
    width: '100%',
    height: 140,
    alignSelf: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dividerText: {
    fontSize: 12,
  },
  error: {
    color: '#C0392B',
    fontSize: 13,
  },
  button: {
    marginTop: 8,
  },
  link: {
    alignSelf: 'center',
    marginTop: 16,
  },
});
