import React from "react";
import { HeadingMediumText } from "@/components";
import { CountdownCircleTimer, Props, ColorFormat } from "react-native-countdown-circle-timer";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

const CountDown: React.FC<Props> = ({ ...props }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <CountdownCircleTimer
      isPlaying
      colors={colors.primary as ColorFormat}
      trailStrokeWidth={12}
      strokeWidth={8}
      size={64}
      trailColor={colors.separator as ColorFormat}
      {...props}
    >
      {({ remainingTime }) => (
        <HeadingMediumText>{t("focusMode.secondsWithValue", { value: remainingTime })}</HeadingMediumText>
      )}
    </CountdownCircleTimer>
  );
};

export default CountDown;
