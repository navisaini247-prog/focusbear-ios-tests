import React, { useEffect } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@react-navigation/native";
import { BodyLargeText } from "@/components";
import COLOR from "@/constants/color";

const SPEECH_BUBBLE_TAIL_PATH =
  "M437.383 177.239C432.887 177.239 428.484 178.518 424.687 180.925L369.626 215.842C357.728 223.387 344.356 208.592 353.062 197.515C359.525 189.293 353.668 177.239 343.21 177.239H437.383Z";

interface SpeechBubbleProps {
  message?: string | null;
  style?: ViewStyle[] | ViewStyle;
  isPirate?: boolean;
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({ message, style, isPirate }) => {
  const { colors } = useTheme();
  const opacity = useSharedValue(0);
  const bubbleBackground = isPirate ? COLOR.PIRATE_BACKGROUND : colors.card;
  const tailFill = bubbleBackground;

  useEffect(() => {
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 400 });
  }, [message, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.speechBubbleContainer, isPirate && styles.speechBubblePirate, style, animatedStyle]}>
      <View style={styles.bubbleWrapper}>
        <View
          style={[
            styles.speechBubble,
            {
              backgroundColor: bubbleBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <BodyLargeText center style={styles.speechText} color={colors.text}>
            {message || ""}
          </BodyLargeText>
        </View>
        <Svg style={styles.speechBubbleTail} width={84} height={36} viewBox="343 177 95 40">
          <Path d={SPEECH_BUBBLE_TAIL_PATH} fill={tailFill} />
        </Svg>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  speechBubbleContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  speechBubblePirate: {
    marginTop: 30,
  },
  bubbleWrapper: {
    position: "relative",
    paddingBottom: 20,
  },
  speechBubble: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    maxWidth: "90%",
  },
  speechBubbleTail: {
    position: "absolute",
    right: 20,
    bottom: -5,
  },
  speechText: {
    lineHeight: 22,
  },
});
