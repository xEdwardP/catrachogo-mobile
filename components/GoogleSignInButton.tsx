import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

// Google rechaza cualquier client ID tipo "Web application" (sin importar el
// response_type) para un redirect que no sea http(s) — confirmado en vivo
// probando en Expo Go ("Acceso bloqueado: Error de autorización", Error 400:
// invalid_request). Hace falta un client ID tipo Android/iOS por plataforma,
// que sí soportan el esquema custom nativo. En Android/iOS el botón no se
// renderiza hasta que exista el client ID específico de esa plataforma —
// mostrarlo con el client ID "web" solo repetiría el mismo error.
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

const GOOGLE_CLIENT_ID = Platform.select({
  android: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
  ios: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
  default: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
});
const REDIRECT_URI = AuthSession.makeRedirectUri({ scheme: 'catrachogomobile' });

type Props = {
  onSuccess: (idToken: string) => void;
  onError: () => void;
};

export function GoogleSignInButton({ onSuccess, onError }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [isRequesting, setIsRequesting] = useState(false);

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID ?? '',
      redirectUri: REDIRECT_URI,
      responseType: AuthSession.ResponseType.Code,
      scopes: ['openid', 'profile', 'email'],
      usePKCE: true,
    },
    discovery,
  );

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  async function handlePress() {
    setIsRequesting(true);
    try {
      const result = await promptAsync();
      if (result.type !== 'success') {
        if (result.type === 'error') onError();
        return;
      }

      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId: GOOGLE_CLIENT_ID ?? '',
          code: result.params.code,
          redirectUri: REDIRECT_URI,
          extraParams: { code_verifier: request?.codeVerifier ?? '' },
        },
        discovery,
      );

      if (tokenResult.idToken) {
        onSuccess(tokenResult.idToken);
      } else {
        onError();
      }
    } catch {
      onError();
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <Button
      variant="secondary"
      onPress={handlePress}
      loading={isRequesting}
      disabled={!request}
      style={styles.button}
    >
      <View style={styles.content}>
        <Ionicons name="logo-google" size={18} color={colors.text} />
        <Text style={{ color: colors.text }}>Continuar con Google</Text>
      </View>
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
});
