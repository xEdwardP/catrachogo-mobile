import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type Props = {
  color: string;
};

const RING_SIZE = 44;
const DOT_SIZE = 14;
const RING_DURATION_MS = 2400;
const RING_STAGGER_MS = 900;

function createRingLoop(value: Animated.Value) {
  return Animated.loop(
    Animated.timing(value, {
      toValue: 1,
      duration: RING_DURATION_MS,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
  );
}

export function PulsingMarker({ color }: Props) {
  const ringA = useRef(new Animated.Value(0)).current;
  const ringB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopA = createRingLoop(ringA);
    const loopB = createRingLoop(ringB);
    loopA.start();
    const staggerTimeout = setTimeout(() => loopB.start(), RING_STAGGER_MS);
    return () => {
      loopA.stop();
      loopB.stop();
      clearTimeout(staggerTimeout);
    };
  }, [ringA, ringB]);

  return (
    <View style={styles.container}>
      {[ringA, ringB].map((value, index) => (
        <Animated.View
          key={index}
          style={[
            styles.ring,
            {
              borderColor: color,
              opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
              transform: [
                { scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
              ],
            },
          ]}
        />
      ))}
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
