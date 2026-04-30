import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "@react-navigation/native";
import COLOR from "@/constants/color";
import { BodyMediumText, HeadingLargeText } from "./Text";
import { formatTime } from "@/utils/TimeMethods";
import { FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";
interface CircularProgressProps {
  used: number; // in minutes
  limit: number; // in minutes
  label?: string;
}

const CIRCLE_SIZE = 160;
const STROKE_WIDTH = 10;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const CircularProgress: React.FC<CircularProgressProps> = ({ used, limit, label = "Screen Time" }) => {
  const { colors } = useTheme();
  const progress = used === limit ? 1 : Math.min((used % limit) / limit, 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const exceeded = used > limit;
  const progressColor = exceeded ? COLOR.NEGATIVE : colors.primary;
  const underColor = exceeded ? colors.primary : colors.border;
  const textColor = exceeded ? colors.danger : colors.success;

  return (
    <View style={styles.centered}>
      <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
        {/* Background circle */}
        <Circle
          cx={CIRCLE_SIZE / 2}
          cy={CIRCLE_SIZE / 2}
          r={RADIUS}
          stroke={underColor}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={CIRCLE_SIZE / 2}
          cy={CIRCLE_SIZE / 2}
          r={RADIUS}
          stroke={progressColor}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE}, ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
        />
        {/* Progress dot */}
        {progress > 0 && progress < 1 && (
          <Circle
            cx={CIRCLE_SIZE / 2 + RADIUS * Math.cos(2 * Math.PI * progress - Math.PI / 2)}
            cy={CIRCLE_SIZE / 2 + RADIUS * Math.sin(2 * Math.PI * progress - Math.PI / 2)}
            r={STROKE_WIDTH * 0.6}
            fill={progressColor}
            opacity={progress > 0 ? 1 : 0}
          />
        )}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
        <BodyMediumText maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI} style={{ color: colors.subText }}>
          {label}
        </BodyMediumText>
        <HeadingLargeText
          maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI}
          style={[styles.totalTime, { color: textColor }]}
        >
          {formatTime(used)}
        </HeadingLargeText>
        <BodyMediumText maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI} style={{ color: colors.subText }}>
          / {formatTime(limit)}
        </BodyMediumText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    justifyContent: "center",
    alignItems: "center",
  },
  totalTime: {
    paddingVertical: 8,
  },
});
