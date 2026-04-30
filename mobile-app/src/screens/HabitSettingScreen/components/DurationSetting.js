import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { HeadingXLargeText, BodySmallText, TextField } from "@/components";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { MAXIMUM_ALLOWED_MINUTES as MAX_MINUTES } from "@/constants/activity";
import { useFontScale } from "@/hooks/use-font-scale";

export const DurationInput = ({
  minutes,
  setMinutes,
  seconds,
  setSeconds,
  minMinutes = 0,
  maxMinutes = MAX_MINUTES,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { isLargeFontScale } = useFontScale();

  const [localMinutes, setLocalMinutes] = useState(String(minutes).padStart(2, "0"));
  const [localSeconds, setLocalSeconds] = useState(String(seconds).padStart(2, "0"));

  useEffect(() => {
    setLocalMinutes(String(minutes).padStart(2, "0"));
  }, [minutes]);

  useEffect(() => {
    setLocalSeconds(String(seconds).padStart(2, "0"));
  }, [seconds]);

  const onMinutesChange = (text) => {
    if (text.length <= String(maxMinutes).length) setLocalMinutes(text);
  };

  const onMinutesBlur = () => {
    const clamped = Math.max(minMinutes, Math.min(maxMinutes, parseInt(localMinutes) || 0));
    setMinutes(clamped);
    setLocalMinutes(String(clamped).padStart(2, "0"));

    if (clamped === maxMinutes && seconds > 0) {
      setSeconds(0);
      setLocalSeconds("00");
    }
  };

  const onSecondsChange = (text) => {
    if (text.length <= 2) setLocalSeconds(text);
  };

  const onSecondsBlur = () => {
    const clampedSeconds = minutes === maxMinutes ? 0 : Math.max(0, Math.min(59, parseInt(localSeconds) || 0));
    setSeconds(clampedSeconds);
    setLocalSeconds(String(clampedSeconds).padStart(2, "0"));
  };

  return (
    <View
      style={[
        styles.durationFieldRow,
        isLargeFontScale && styles.durationFieldRowScaled,
        isLargeFontScale ? styles.gap12 : styles.gap8,
      ]}
    >
      <View style={styles.gap2}>
        <TextField
          type="numeric"
          selectTextOnFocus
          style={isLargeFontScale ? styles.textFieldScaled : styles.textField}
          inputStyle={isLargeFontScale ? styles.inputScaled : styles.input}
          value={localMinutes}
          onChangeText={onMinutesChange}
          onBlur={onMinutesBlur}
          testID="test:id/duration-minutes"
        />
        <BodySmallText center color={colors.subText}>
          {t("home.mins")}
        </BodySmallText>
      </View>
      <View style={styles.gap2}>
        <HeadingXLargeText weight="700">{":"}</HeadingXLargeText>
        <BodySmallText />
      </View>
      <View style={styles.gap2}>
        <TextField
          type="numeric"
          selectTextOnFocus
          style={isLargeFontScale ? styles.textFieldScaled : styles.textField}
          inputStyle={isLargeFontScale ? styles.inputScaled : styles.input}
          value={localSeconds}
          onChangeText={onSecondsChange}
          onBlur={onSecondsBlur}
          testID="test:id/duration-seconds"
        />
        <BodySmallText center color={colors.subText}>
          {t("home.secs")}
        </BodySmallText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gap2: { gap: 2 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  durationFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  durationFieldRowScaled: {
    justifyContent: "flex-start",
    alignSelf: "flex-start",
  },
  textField: {
    minWidth: 80,
  },
  textFieldScaled: {
    minWidth: 100,
  },
  input: {
    fontSize: 20,
    textAlign: "center",
    paddingVertical: 8,
    minHeight: 0,
  },
  inputScaled: {
    fontSize: 24,
    textAlign: "center",
    paddingVertical: 12,
    minHeight: 0,
  },
});
