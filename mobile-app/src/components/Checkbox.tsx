import React, { memo, useEffect } from "react";
import { View, ViewProps, StyleSheet, useWindowDimensions } from "react-native";
import Animated, { useSharedValue, withSpring, interpolateColor, useAnimatedStyle } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@react-navigation/native";
import { clampFontScale, scaleByFontScale } from "@/utils/FontScaleUtils";

const STROKE_PROPS = { strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;
const NORMAL_SIZE = 26; // Width and height of the checkbox
const SMALL_SIZE = 22;
const D1_RATIO = 0.3; // Length of the ✔️'s shorter segment
const D2_RATIO = 0.7; // Length of the ✔️'s longer segment

interface CheckboxProps extends ViewProps {
  value: boolean;
  small?: boolean;
  indeterminate?: boolean;
}

export const Checkbox = memo(function Checkbox({ value, small, indeterminate, style, ...props }: CheckboxProps) {
  const { colors } = useTheme();
  const animation = useSharedValue(value ? 1 : 0);

  const { fontScale } = useWindowDimensions();
  const baseSize = small ? SMALL_SIZE : NORMAL_SIZE;
  const size = scaleByFontScale(baseSize, fontScale, { round: false });

  useEffect(() => {
    animation.value = withSpring(value ? 1 : 0, { mass: 1 });
  }, [value, animation]);

  const checkboxAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(animation.value, [0, 1], [colors.secondary, colors.primary]),
    borderColor: interpolateColor(animation.value, [0, 1], [colors.border, colors.primaryBorder]),
  }));

  const checkmarkAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: animation.value }] }));

  return (
    <Animated.View style={[styles.checkbox, { width: size, height: size }, checkboxAnimatedStyle, style]} {...props}>
      {!indeterminate ? (
        <Animated.View style={checkmarkAnimatedStyle}>
          <Checkmark value={value} size={Math.round(size * 0.55)} color={colors.white} />
        </Animated.View>
      ) : (
        // Indeterminate (horizontal line)
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Path d={`M${size / 3} ${size / 2} l${size / 3} 0`} stroke={colors.border} {...STROKE_PROPS} />
        </Svg>
      )}
    </Animated.View>
  );
});

interface CheckmarkProps extends ViewProps {
  value: boolean;
  color: string;
  size?: number;
}

export const Checkmark = memo(function Checkmark({ value, size = 16, color, style, ...props }: CheckmarkProps) {
  const { fontScale } = useWindowDimensions();
  size *= clampFontScale(fontScale);

  const strokeWidth = Math.max(2, size / 8);
  const d1 = size * D1_RATIO - strokeWidth / 2;
  const d2 = size * D2_RATIO - strokeWidth / 2;

  return (
    <View style={[{ width: size, height: size }, style]} {...props}>
      {value && (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Path
            d={`M${(size + d1 + d2) / 2} ${(size - d2) / 2} l${-d2} ${d2} ${-d1} ${-d1}`}
            stroke={color}
            {...STROKE_PROPS}
            strokeWidth={strokeWidth}
          />
        </Svg>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  checkbox: {
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
