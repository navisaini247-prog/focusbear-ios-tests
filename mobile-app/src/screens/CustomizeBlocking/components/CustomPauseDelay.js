import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";

import { BodyMediumText, BodySmallText, HeadingXLargeText, Space, Card } from "@/components";
import { TextField } from "@/components";
import {
  MIN_PAUSE_BASE_DELAY_SECONDS,
  MAX_PAUSE_BASE_DELAY_SECONDS,
  generatePauseDelays,
} from "@/constants/blockingSchedule";

/**
 * Formats a seconds value into a human-readable string.
 * e.g. 65 → "1m 5s", 10 → "10s"
 */
function formatDelay(totalSeconds) {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function CustomPauseDelay({ baseDelay, setBaseDelay }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [localValue, setLocalValue] = useState(String(baseDelay));

  useEffect(() => {
    setLocalValue(String(baseDelay));
  }, [baseDelay]);

  const onChangeText = (text) => {
    // Allow only digits while typing
    if (/^\d*$/.test(text)) setLocalValue(text);
  };

  const onBlur = () => {
    const parsed = parseInt(localValue, 10);
    const clamped = isNaN(parsed)
      ? MIN_PAUSE_BASE_DELAY_SECONDS
      : Math.max(MIN_PAUSE_BASE_DELAY_SECONDS, Math.min(MAX_PAUSE_BASE_DELAY_SECONDS, parsed));
    setBaseDelay(clamped);
    setLocalValue(String(clamped));
  };

  const delaySequence = generatePauseDelays(baseDelay);
  const sequenceLabel = delaySequence.map(formatDelay).join(" → ");

  return (
    <View>
      <Card style={styles.card}>
        <View style={styles.row}>
          <TextField
            type="numeric"
            selectTextOnFocus
            style={styles.textField}
            inputStyle={styles.input}
            value={localValue}
            onChangeText={onChangeText}
            onBlur={onBlur}
            testID="test:id/pause-base-delay-input"
          />
          <HeadingXLargeText weight="700" style={styles.unit}>
            {t("home.secs")}
          </HeadingXLargeText>
        </View>
      </Card>

      <BodyMediumText style={styles.hint}>
        {t("customizeBlocking.customPauseDelay.hint", {
          min: MIN_PAUSE_BASE_DELAY_SECONDS,
          max: MAX_PAUSE_BASE_DELAY_SECONDS,
          defaultValue: `Choose between ${MIN_PAUSE_BASE_DELAY_SECONDS}s and ${MAX_PAUSE_BASE_DELAY_SECONDS}s.`,
        })}
      </BodyMediumText>

      <Space height={10} />

      <Card style={styles.sequenceCard}>
        <BodySmallText style={[styles.sequenceLabel, { color: colors.subText }]}>
          {t("customizeBlocking.customPauseDelay.sequenceLabel", {
            defaultValue: "Your wait times",
          })}
        </BodySmallText>
        <Space height={4} />
        <BodyMediumText style={styles.sequence}>{sequenceLabel}</BodyMediumText>
      </Card>

      <Space height={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  textField: {
    minWidth: 80,
  },
  input: {
    fontSize: 20,
    textAlign: "center",
    paddingVertical: 8,
    minHeight: 0,
  },
  unit: {
    lineHeight: undefined,
  },
  hint: {
    opacity: 0.6,
    fontStyle: "italic",
    marginTop: 6,
    fontSize: 13,
  },
  sequenceCard: {
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  sequenceLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  sequence: {
    letterSpacing: 0.3,
  },
});
