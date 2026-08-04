import { Ionicons } from '@expo/vector-icons';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

function loadGoogleSignIn(): GoogleSignInModule | null {
  if (IS_EXPO_GO) return null;
  try {
    const loaded: GoogleSignInModule = require('@react-native-google-signin/google-signin');
    if (WEB_CLIENT_ID) {
      loaded.GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
    }
    return loaded;
  } catch {
    return null;
  }
}

const googleSignIn = loadGoogleSignIn();

type Props = {
  onSuccess: (idToken: string) => void;
  onError: () => void;
};

export function GoogleSignInButton({ onSuccess, onError }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [isRequesting, setIsRequesting] = useState(false);

  if (!WEB_CLIENT_ID || !googleSignIn) {
    return null;
  }

  async function handlePress() {
    if (!googleSignIn) return;
    const { GoogleSignin, isErrorWithCode, statusCodes } = googleSignIn;
    setIsRequesting(true);
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut().catch(() => {});
      const response = await GoogleSignin.signIn();
      if (response.type === 'success' && response.data.idToken) {
        onSuccess(response.data.idToken);
      } else {
        onError();
      }
    } catch (error) {
      if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      onError();
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <Button variant="secondary" onPress={handlePress} loading={isRequesting} style={styles.button}>
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
