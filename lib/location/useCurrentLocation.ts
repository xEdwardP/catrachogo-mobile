import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export type LatLng = { lat: number; lng: number };

type LocationState = {
  location: LatLng | null;
  isLoading: boolean;
  error: string | null;
};

export function useCurrentLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    location: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!cancelled) {
          setState({
            location: null,
            isLoading: false,
            error: 'Necesitamos acceso a tu ubicación. Actívalo en los ajustes del teléfono.',
          });
        }
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        if (!cancelled) {
          setState({
            location: null,
            isLoading: false,
            error: 'Activa el GPS/ubicación de tu teléfono para ver tu posición en el mapa.',
          });
        }
        return;
      }

      try {
        const position = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
        ]);

        const resolved = position ?? (await Location.getLastKnownPositionAsync());

        if (!cancelled) {
          if (resolved) {
            setState({
              location: { lat: resolved.coords.latitude, lng: resolved.coords.longitude },
              isLoading: false,
              error: null,
            });
          } else {
            setState({
              location: null,
              isLoading: false,
              error:
                'No se pudo obtener tu ubicación. Intenta salir a un lugar con mejor señal GPS.',
            });
          }
        }
      } catch {
        if (!cancelled) {
          setState({ location: null, isLoading: false, error: 'No se pudo obtener tu ubicación.' });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
