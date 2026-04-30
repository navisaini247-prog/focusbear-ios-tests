import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { DisplayXLargeText } from "./Text";
import { ScalableIcon } from "./ScalableIcon";
import { FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";

const padValue = (value: number): string => String(value).padStart(2, "0");

export type TimeCountDownProps = {
  time: number;
  callback?: () => void;
  onEditDurationPress?: () => void;
  size?: number;
};

export function TimeCountDown({
  time,
  callback,
  onEditDurationPress,
  size = 40,
}: TimeCountDownProps) {
  const { colors } = useTheme();
  const [timeLeft, setTimeLeft] = useState<Date>(new Date(Math.max(time * 1000 - Date.now(), 0)));
  const [timerRunning, setTimerRunning] = useState<boolean>(true);

  useEffect(() => {
    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      const timeLeftMs = time * 1000 - Date.now();
      setTimeLeft(new Date(Math.max(timeLeftMs, 0)));
      if (timeLeftMs < 1000) {
        setTimerRunning(false);
        callback?.();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [time, callback]);

  const [h, m, s] = [timeLeft.getUTCHours(), timeLeft.getUTCMinutes(), timeLeft.getUTCSeconds()];
  const formattedCountDownTime = (h > 0 ? [h, m, s] : [m, s]).map(padValue).join(":");

  return (
    <View style={styles.container}>
      {timerRunning && onEditDurationPress && (
        <ScalableIcon
          testID="test:id/edit-focus-duration"
          name="pencil-alt"
          size={24}
          color={colors.primary}
          onPress={onEditDurationPress}
          iconType="FontAwesome5"
        />
      )}

      <View style={{ minWidth: size * 3.5 }}>
        <DisplayXLargeText
          color={!timerRunning && colors.success}
          size={size}
          maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI}
        >
          {formattedCountDownTime}
        </DisplayXLargeText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
});
