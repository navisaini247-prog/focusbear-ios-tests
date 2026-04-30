import React, { memo, useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, { useSharedValue, withSpring, interpolateColor, useAnimatedStyle } from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";
import COLOR from "@/constants/color";

const NORMAL_SIZE = 26;
const SMALL_SIZE = 20;
const POINT_RATIO = 0.4;

export const Radio = memo(function Radio({ value, small }: { value: boolean; small: boolean }) {
  const { colors } = useTheme();
  const animation = useSharedValue(value ? 1 : 0);

  const size = small ? SMALL_SIZE : NORMAL_SIZE;
  const point = size * POINT_RATIO; // Radius of the radio button's centre point

  useEffect(() => {
    animation.value = withSpring(value ? 1 : 0, { mass: 1 });
  }, [animation, value]);

  const radioAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(animation.value, [0, 1], [colors.secondary, colors.primary]),
    borderColor: interpolateColor(animation.value, [0, 1], [colors.border, colors.primaryBorder]),
  }));

  const pointAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: animation.value }] }));

  return (
    <Animated.View style={[styles.radio, { width: size, height: size }, radioAnimatedStyle]}>
      <Animated.View style={[styles.point, { width: point, height: point }, pointAnimatedStyle]} />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  radio: {
    borderWidth: 1,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  point: {
    borderRadius: 100,
    backgroundColor: COLOR.WHITE,
  },
});
