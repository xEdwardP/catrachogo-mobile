import { forwardRef, useEffect, useRef } from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { PulsingMarker } from '@/components/PulsingMarker';

export type LatLng = { lat: number; lng: number };

export type TripMapMarker = {
  id?: string;
  position: LatLng;
  color?: string;
  pulse?: boolean;
};

type Props = {
  center: LatLng;
  markers?: TripMapMarker[];
  routePath?: LatLng[];
  routeColor?: string;
  style?: StyleProp<ViewStyle>;
};

const RECENTER_ZOOM_DELTA = 0.01;
const RECENTER_THRESHOLD_DEGREES = 0.001;

function mergeRefs<T>(...refs: (React.Ref<T> | null | undefined)[]) {
  return (value: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') ref(value);
      else (ref as React.MutableRefObject<T | null>).current = value;
    }
  };
}

export const TripMap = forwardRef<MapView, Props>(function TripMap(
  { center, markers = [], routePath = [], routeColor = '#E8532E', style },
  ref,
) {
  const internalRef = useRef<MapView>(null);
  const lastCenterRef = useRef(center);

  useEffect(() => {
    const last = lastCenterRef.current;
    lastCenterRef.current = center;
    const moved =
      Math.abs(center.lat - last.lat) > RECENTER_THRESHOLD_DEGREES ||
      Math.abs(center.lng - last.lng) > RECENTER_THRESHOLD_DEGREES;
    if (!moved) return;
    internalRef.current?.animateToRegion(
      {
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: RECENTER_ZOOM_DELTA,
        longitudeDelta: RECENTER_ZOOM_DELTA,
      },
      500,
    );
  }, [center]);

  return (
    <MapView
      ref={mergeRefs(ref, internalRef)}
      style={[styles.map, style]}
      initialRegion={{
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      {markers.map((marker, index) =>
        marker.pulse ? (
          <Marker
            key={marker.id ?? `pulse-${index}`}
            coordinate={{ latitude: marker.position.lat, longitude: marker.position.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges
            zIndex={2}
          >
            <PulsingMarker color={marker.color ?? routeColor} />
          </Marker>
        ) : (
          <Marker
            key={marker.id ?? `pin-${index}`}
            coordinate={{ latitude: marker.position.lat, longitude: marker.position.lng }}
            pinColor={marker.color}
            zIndex={1}
          />
        ),
      )}
      {routePath.length > 0 && (
        <Polyline
          coordinates={routePath.map((point) => ({ latitude: point.lat, longitude: point.lng }))}
          strokeColor={routeColor}
          strokeWidth={4}
        />
      )}
    </MapView>
  );
});

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
