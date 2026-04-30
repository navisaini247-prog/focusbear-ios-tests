import React, { useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { HeadingSmallText, ScalableIcon } from "@/components";

const RIPPLE_DURATION_MS = 2000;
const GLOW_INNER = "rgba(255, 176, 59, 0.32)";
const GLOW_MID = "rgba(255, 176, 59, 0.18)";
const GLOW_OUTER = "rgba(255, 176, 59, 0.08)";
const GLOW_SOFT = "rgba(255, 176, 59, 0.03)";

type StartFocusButtonProps = {
  onPress: () => void;
};

export const StartFocusButton = ({ onPress }: StartFocusButtonProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const pulseProgress = useSharedValue(0);

  useEffect(() => {
    pulseProgress.value = withRepeat(
      withTiming(1, {
        duration: RIPPLE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      }),
      -1,
      false,
    );
    return () => cancelAnimation(pulseProgress);
  }, [pulseProgress]);

  const innerGlowStyle = useAnimatedStyle(() => {
    const p = pulseProgress.value;
    return {
      transform: [{ scale: 1 + p * 0.12 }],
      opacity: 0.7 * (1 - p),
    };
  });

  const midGlowStyle = useAnimatedStyle(() => {
    const p = pulseProgress.value;
    return {
      transform: [{ scale: 1 + p * 0.2 }],
      opacity: 0.35 * (1 - p * p),
    };
  });

  const outerGlowStyle = useAnimatedStyle(() => {
    const p = pulseProgress.value;
    return {
      transform: [{ scale: 1 + p * 0.28 }],
      opacity: 0.15 * (1 - p * p * p),
    };
  });

  const softGlowStyle = useAnimatedStyle(() => {
    const p = pulseProgress.value;
    return {
      transform: [{ scale: 1 + p * 0.35 }],
      opacity: 0.06 * Math.pow(1 - p, 4),
    };
  });

  const buttonScaleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale:
          pulseProgress.value <= 0.6
            ? 1 + (pulseProgress.value / 0.6) * 0.06
            : 1 + ((1 - pulseProgress.value) / 0.4) * 0.06,
      },
    ],
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View pointerEvents="none" style={[styles.glowSoft, softGlowStyle]}>
        <View style={[styles.fill, styles.softFill]} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.glowOuter, outerGlowStyle]}>
        <View style={[styles.fill, styles.outerFill]} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.glowMid, midGlowStyle]}>
        <View style={[styles.fill, styles.midFill]} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.glowInner, innerGlowStyle]}>
        <View style={[styles.fill, styles.innerFill]} />
      </Animated.View>

      <Animated.View style={buttonScaleStyle}>
        <TouchableOpacity
          hitSlop={12}
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onPress}
          testID="test:id/focus-mode-card-new-session"
        >
          <ScalableIcon name="play" size={20} color={colors.white} />
          <HeadingSmallText color={colors.white} weight="700">
            {t("focusMode.startFocusSession")}
          </HeadingSmallText>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: "66%",
    alignSelf: "center",
  },
  button: {
    minHeight: 56,
    minWidth: "100%",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  glowInner: {
    position: "absolute",
    left: -4,
    right: -4,
    top: -4,
    bottom: -4,
    borderRadius: 32,
    overflow: "hidden",
  },
  innerFill: {
    backgroundColor: GLOW_INNER,
    borderRadius: 32,
  },
  glowMid: {
    position: "absolute",
    left: -14,
    right: -14,
    top: -14,
    bottom: -14,
    borderRadius: 42,
    overflow: "hidden",
  },
  midFill: {
    backgroundColor: GLOW_MID,
    borderRadius: 42,
  },
  glowOuter: {
    position: "absolute",
    left: -28,
    right: -28,
    top: -28,
    bottom: -28,
    borderRadius: 56,
    overflow: "hidden",
  },
  outerFill: {
    backgroundColor: GLOW_OUTER,
    borderRadius: 56,
  },
  glowSoft: {
    position: "absolute",
    left: -44,
    right: -44,
    top: -44,
    bottom: -44,
    borderRadius: 72,
    overflow: "hidden",
  },
  softFill: {
    backgroundColor: GLOW_SOFT,
    borderRadius: 72,
  },
});
