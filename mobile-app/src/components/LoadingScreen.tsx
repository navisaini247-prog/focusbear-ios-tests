import React, { ReactNode, useEffect } from "react";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { useTheme } from "@react-navigation/native";
import { BearThinking } from "@/assets";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";

import { checkIsAndroid } from "@/utils/PlatformMethods";
import { BodyLargeText, DisplaySmallText } from "./Text";
import { useTranslation } from "react-i18next";

const OVERLAY_BG = "rgba(0,0,0,0.15)";
const PROGRESS_BAR_BG = "#F4A34022";

// Animation and logic constants
const DOT_ANIMATION_DURATION = 180;
const DOT_ANIMATION_DELAY = 120;
const DOT_ANIMATION_INTERVAL = 600;
const PROGRESS_BAR_ANIMATION_DURATION = 8000;
const PROGRESS_BAR_DETERMINATE_DURATION = 400;
const PROGRESS_BAR_BOTTOM = checkIsAndroid() ? 80 : 40;

export const LoadingDots = ({
  loadingText,
  size = "medium",
}: {
  loadingText?: string;
  size?: "small" | "medium" | "large" | number;
}) => {
  const { colors } = useTheme();

  const textSize = typeof size === "number" ? size : size === "small" ? 16 : size === "large" ? 32 : 24;
  const dotSize = textSize * 1.25;
  const jumpHeight = textSize / 3;

  // Animated jumping dots (hooks must be called in the same order)
  const dotAnim0 = useSharedValue(0);
  const dotAnim1 = useSharedValue(0);
  const dotAnim2 = useSharedValue(0);
  const dotStyle0 = useAnimatedStyle(() => ({ transform: [{ translateY: dotAnim0.value }] }));
  const dotStyle1 = useAnimatedStyle(() => ({ transform: [{ translateY: dotAnim1.value }] }));
  const dotStyle2 = useAnimatedStyle(() => ({ transform: [{ translateY: dotAnim2.value }] }));
  const dotStyles = [dotStyle0, dotStyle1, dotStyle2];

  const { t } = useTranslation();

  useEffect(() => {
    let isActive = true;

    const anims = [dotAnim0, dotAnim1, dotAnim2];
    if (isActive) {
      anims.forEach((anim, i) => {
        anim.value = withDelay(
          i * DOT_ANIMATION_DELAY,
          withRepeat(
            withSequence(
              withTiming(-jumpHeight, { duration: DOT_ANIMATION_DURATION, easing: Easing.out(Easing.ease) }),
              withTiming(0, { duration: DOT_ANIMATION_DURATION, easing: Easing.in(Easing.ease) }),
              withDelay(DOT_ANIMATION_INTERVAL - 2 * DOT_ANIMATION_DURATION, withTiming(0, { duration: 0 })),
            ),
            -1,
            false,
          ),
        );
      });
    }

    return () => {
      anims.forEach((anim) => (anim.value = 0));
      isActive = false;
    };
  }, []);

  return (
    <View style={styles.dotsColumn}>
      <DisplaySmallText center style={[styles.title, styles.loadingText]} color={colors.primary} size={textSize}>
        {loadingText || t("common.loadingWithoutDot")}
      </DisplaySmallText>
      <View style={styles.dotsRow}>
        <Animated.Text style={[styles.dot, { color: colors.primary, fontSize: dotSize }, dotStyles[0]]}>
          .
        </Animated.Text>
        <Animated.Text style={[styles.dot, { color: colors.primary, fontSize: dotSize }, dotStyles[1]]}>
          .
        </Animated.Text>
        <Animated.Text style={[styles.dot, { color: colors.primary, fontSize: dotSize }, dotStyles[2]]}>
          .
        </Animated.Text>
      </View>
    </View>
  );
};

export function LoadingProgressBar({ progress }: { progress?: number }) {
  const { colors } = useTheme();
  const progressValue = useSharedValue(0);

  useEffect(() => {
    let isActive = true;

    if (isActive) {
      if (typeof progress === "number") {
        progressValue.value = withTiming(progress, {
          duration: PROGRESS_BAR_DETERMINATE_DURATION,
          easing: Easing.inOut(Easing.ease),
        });
      } else {
        // Indeterminate: use withRepeat for infinite animation
        progressValue.value = 0;
        progressValue.value = withRepeat(
          withTiming(1, {
            duration: PROGRESS_BAR_ANIMATION_DURATION,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          false,
        );
      }
    }

    return () => {
      isActive = false;
    };
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    flex: Math.max(0, Math.min(progressValue.value, 1)),
    opacity: progressValue.value < 0.01 ? 0 : 1,
    backgroundColor: colors.primary,
    height: styles.progressBarBackground.height,
    borderRadius: 6,
  }));

  return (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarBackground, styles.progressBarRow, { backgroundColor: PROGRESS_BAR_BG }]}>
        <Animated.View style={animatedStyle} />
      </View>
    </View>
  );
}
export const BearLoading = ({
  visible,
  loadingText,
  loadingSubtitle,
  progress,
  children,
}: {
  visible?: boolean;
  progress?: number;
  loadingText?: string;
  loadingSubtitle?: string;
  onDone?: () => void;
  children?: ReactNode;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.overlay, { backgroundColor: OVERLAY_BG }]}>
      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        alwaysBounceVertical={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={BearThinking}
          style={styles.bear}
          resizeMode="contain"
          accessibilityLabel="Bear thinking animation"
        />
        <LoadingDots loadingText={loadingText || t("loading.loading")} />
        <BodyLargeText center style={styles.subtitle} color={colors.subText}>
          {loadingSubtitle || t("loading.breathingExercise")}
        </BodyLargeText>
        {children ? <View style={styles.extraContent}>{children}</View> : null}
      </ScrollView>
      <LoadingProgressBar progress={progress} />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    width: "100%",
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: PROGRESS_BAR_BOTTOM + 80,
  },
  bear: {
    width: 96,
    height: 96,
    marginBottom: 32,
  },
  title: {
    marginBottom: 0,
  },
  loadingText: {
    flexShrink: 1,
    width: "100%",
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.8,
    flexShrink: 1,
  },
  dot: {
    fontSize: 30,
    marginLeft: 2,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  dotsColumn: {
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
    paddingHorizontal: 16,
  },
  extraContent: {
    width: "100%",
    marginTop: 16,
    paddingHorizontal: 8,
  },
  progressBarContainer: {
    position: "absolute",
    bottom: PROGRESS_BAR_BOTTOM,
    left: 0,
    right: 0,
    alignItems: "center",
    marginBottom: 20,
  },
  progressBarBackground: {
    width: "90%",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarRow: {
    flexDirection: "row",
  },
});
