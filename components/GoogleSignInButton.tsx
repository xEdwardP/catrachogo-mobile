import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';
import { Button } from '@/components/ui/Button';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

if (WEB_CLIENT_ID) {
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
}

type Props = {
  onSuccess: (idToken: string) => void;
  onError: () => void;
};

export function GoogleSignInButton({ onSuccess, onError }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const [isRequesting, setIsRequesting] = useState(false);

  if (!WEB_CLIENT_ID) {
    return null;
  }

  async function handlePress() {
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
