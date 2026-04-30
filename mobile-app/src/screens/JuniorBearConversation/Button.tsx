import React, { useEffect } from "react";
import { StyleSheet, Pressable, ViewStyle, PressableStateCallbackType } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { HeadingMediumText } from "@/components";
import { useTheme } from "@react-navigation/native";
import COLOR from "@/constants/color";

export const BUTTON_VARIANT = {
  CUTE: "cute",
  PIRATE: "pirate",
  NEUTRAL: "neutral",
} as const;

type Variant = typeof BUTTON_VARIANT.CUTE | typeof BUTTON_VARIANT.PIRATE | typeof BUTTON_VARIANT.NEUTRAL;

interface ConversationButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: Variant;
  isSecondary?: boolean;
  testID?: string;
  disabled?: boolean;
}

export const ConversationButton: React.FC<ConversationButtonProps> = ({
  title,
  onPress,
  style,
  variant: _variant = BUTTON_VARIANT.CUTE,
  isSecondary = false,
  testID,
  disabled,
}) => {
  const { colors, dark } = useTheme();
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 300 });
  }, [title, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const buttonStyle: ViewStyle[] = [styles.button, styles.cuteButton, style];
  const isPrimaryTone = !isSecondary;
  const baseTextColor = isPrimaryTone ? COLOR.AMBER[500] : colors.text;
  const baseBorderColor = isPrimaryTone ? COLOR.AMBER[500] : colors.border;
  const baseBackgroundColor = isPrimaryTone ? undefined : colors.secondary;

  const textColor = dark ? COLOR.WHITE : baseTextColor;
  const borderColor = dark ? (isPrimaryTone ? colors.primary : colors.secondaryBorder) : baseBorderColor;
  const backgroundColor = dark ? (isPrimaryTone ? colors.primary : colors.secondary) : baseBackgroundColor;

  const getButtonStyle = (state: PressableStateCallbackType): ViewStyle[] => {
    return [
      ...buttonStyle,
      {
        borderColor,
        backgroundColor,
      },
      state.pressed && styles.pressed,
      disabled && styles.disabled,
    ];
  };

  const animatedButton = (
    <Animated.View style={[styles.animatedWrapper, animatedStyle]}>
      <Pressable onPress={onPress} disabled={disabled} testID={testID} style={getButtonStyle}>
        <HeadingMediumText center color={textColor} style={styles.buttonText}>
          {title}
        </HeadingMediumText>
      </Pressable>
    </Animated.View>
  );

  return animatedButton;
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  cuteButton: {
    backgroundColor: COLOR.AMBER[50],
  },
  buttonText: {
    zIndex: 1,
  },
  animatedWrapper: {
    width: "100%",
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
