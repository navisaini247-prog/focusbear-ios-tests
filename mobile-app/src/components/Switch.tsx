import React, { memo, useEffect } from "react";
import { ViewProps, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  interpolateColor,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";

const HEIGHT = 26; // Height of the switch
const WIDTH = 42; // Width of the switch
const THUMB = 14; // Diameter of the thumb

export const Switch = memo(function Switch({ value, style, ...props }: { value: boolean } & ViewProps) {
  const { colors } = useTheme();
  const colorAni = useSharedValue(value ? 1 : 0);
  const leftAni = useSharedValue(value ? 1 : 0);
  const rightAni = useSharedValue(value ? 0 : 1);

  useEffect(() => {
    colorAni.value = withSpring(value ? 1 : 0, { mass: 1 });
    leftAni.value = withSpring(value ? 1 : 0, { mass: value ? 2 : 0.1 });
    rightAni.value = withSpring(value ? 0 : 1, { mass: value ? 0.1 : 2 });
  }, [colorAni, leftAni, rightAni, value]);

  const trackAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(colorAni.value, [0, 1], [colors.secondary, colors.primary]),
    borderColor: interpolateColor(colorAni.value, [0, 1], [colors.border, colors.primaryBorder]),
  }));

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(colorAni.value, [0, 1], [colors.border, colors.white]),
    transform: [
      { translateX: interpolate(leftAni.value, [0, 1], [0, WIDTH - HEIGHT]) },
      { scaleX: interpolate(leftAni.value + rightAni.value, [0, 1], [(WIDTH - HEIGHT) / THUMB + 1, 1]) },
    ] as [{ translateX: number }, { scaleX: number }],
  }));

  return (
    <Animated.View style={[styles.track, trackAnimatedStyle, style]} {...props}>
      <Animated.View style={[styles.thumb, thumbAnimatedStyle]} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  track: {
    width: WIDTH,
    height: HEIGHT,
    borderWidth: 1,
    borderRadius: HEIGHT / 2,
  },
  thumb: {
    position: "absolute",
    height: THUMB,
    width: THUMB,
    top: (HEIGHT - THUMB) / 2 - 1,
    left: (HEIGHT - THUMB) / 2 - 1,
    borderRadius: THUMB / 2,
    transformOrigin: "left center",
  },
});
