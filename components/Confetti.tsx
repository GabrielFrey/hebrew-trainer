import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/lib/motion';

const COLORS = ['#58CC02', '#FFC800', '#FF4B4B', '#1CB0F6', '#CE82FF', '#FF9600'];

export function Confetti({ play }: { play: boolean }) {
  const reduce = useReduceMotion();
  if (!play || reduce) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {COLORS.concat(COLORS).map((color, index) => (
        <Piece key={`${color}-${index}`} color={color} index={index} />
      ))}
    </View>
  );
}

function Piece({ color, index }: { color: string; index: number }) {
  const y = useSharedValue(-20);
  const rotate = useSharedValue(0);
  const left = 12 + ((index * 31) % 88);

  useEffect(() => {
    y.value = withDelay(
      index * 40,
      withTiming(520, { duration: 1400 + (index % 5) * 120, easing: Easing.in(Easing.quad) })
    );
    rotate.value = withTiming(180 + index * 20, { duration: 1400 });
  }, [index, rotate, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        style,
        { backgroundColor: color, left: `${left}%`, width: 8 + (index % 3) * 3 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  piece: {
    borderRadius: 2,
    height: 12,
    position: 'absolute',
    top: 0,
  },
});
