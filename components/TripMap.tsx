import MapView, { Marker, Polyline } from 'react-native-maps';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

export type LatLng = { lat: number; lng: number };

export type TripMapMarker = {
  position: LatLng;
  color?: string;
};

type Props = {
  center: LatLng;
  markers?: TripMapMarker[];
  routePath?: LatLng[];
  routeColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function TripMap({
  center,
  markers = [],
  routePath = [],
  routeColor = '#E8532E',
  style,
}: Props) {
  return (
    <MapView
      style={[styles.map, style]}
      initialRegion={{
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      {markers.map((marker, index) => (
        <Marker
          key={index}
          coordinate={{ latitude: marker.position.lat, longitude: marker.position.lng }}
          pinColor={marker.color}
        />
      ))}
      {routePath.length > 0 && (
        <Polyline
          coordinates={routePath.map((point) => ({ latitude: point.lat, longitude: point.lng }))}
          strokeColor={routeColor}
          strokeWidth={4}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
