import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { HeadingSmallText, Button, ButtonProps, ScalableIcon } from "@/components";
import { useTheme } from "@react-navigation/native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from "react-native-reanimated";

const PI2 = Math.PI * 2;
const SPARKLE_POSITIONS: ViewStyle[] = [
  { top: 10, left: 0 },
  { top: -4, left: 4 },
  { top: 5, left: 10 },
];

export interface AnimatedSparkleButtonProps extends ButtonProps {
  iconName: string;
  title?: string;
  hideTitle?: boolean;
  testID?: string;
  buttonStyle?: ViewStyle;
}

export const AnimatedSparkleButton: React.FC<AnimatedSparkleButtonProps> = ({
  iconName,
  title,
  hideTitle,
  testID,
  buttonStyle,
  style,
  ...props
}) => {
  const { colors, shadowStyles } = useTheme();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(PI2, { duration: 1500, easing: Easing.linear }), -1);
  }, [pulse]);

  const animatedSparkleStyles = [
    useAnimatedStyle(() => ({ transform: [{ scale: 0.5 + 0.5 * Math.cos(pulse.value) }] })),
    useAnimatedStyle(() => ({ transform: [{ scale: 0.5 + 0.5 * Math.cos(pulse.value + PI2 * 0.33) }] })),
    useAnimatedStyle(() => ({ transform: [{ scale: 0.5 + 0.5 * Math.cos(pulse.value + PI2 * 0.66) }] })),
  ];

  return (
    <View>
      <Button style={[styles.button, shadowStyles.bigShadow, buttonStyle, style]} testID={testID} {...props}>
        <View>
          <ScalableIcon name={iconName} size={18} color={colors.text} iconType="Ionicons" />
          {animatedSparkleStyles.map((animatedStyle, index) => (
            <Animated.View key={index} style={[styles.absolute, SPARKLE_POSITIONS[index], animatedStyle]}>
              <ScalableIcon name="medical" size={10} color={colors.primary} iconType="Ionicons" />
            </Animated.View>
          ))}
        </View>
        {!hideTitle && title && <HeadingSmallText>{title}</HeadingSmallText>}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  absolute: { position: "absolute" },
  button: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    paddingHorizontal: 16,
    borderRadius: 100,
    gap: 12,
  },
});
