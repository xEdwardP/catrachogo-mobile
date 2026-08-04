import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Catracho Go',
  slug: 'catracho-go',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/logo/logo_without_text.png',
  scheme: 'catrachogomobile',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.catrachogo.mobile',
    supportsTablet: true,
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'CatrachoGo usa tu ubicación para mostrar conductores cercanos y calcular la tarifa de tu viaje.',
    },
  },
  android: {
    package: 'com.catrachogo.mobile',
    adaptiveIcon: {
      backgroundColor: '#F6F1EC',
      foregroundImage: './assets/logo/logo_without_text.png',
    },
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID,
      },
    },
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/logo/logo_without_text.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/logo/logo_with_text.png',
        resizeMode: 'contain',
        backgroundColor: '#F6F1EC',
        dark: {
          image: './assets/logo/logo_with_text.png',
          backgroundColor: '#1C1917',
        },
      },
    ],
    'expo-secure-store',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'CatrachoGo usa tu ubicación para mostrar conductores cercanos y calcular la tarifa de tu viaje.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/logo/logo_without_text.png',
        color: '#E8532E',
      },
    ],
    '@react-native-google-signin/google-signin',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: 'e7ce830b-7a19-4195-94a9-54f21c0ee3a5',
    },
  },
  owner: 'xedwardps-team',
};

export default config;
