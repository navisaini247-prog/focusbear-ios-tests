import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { BodyMediumText, Space, Card } from "@/components";
import { DurationInput } from "@/screens/HabitSettingScreen/components/DurationSetting";
import { MIN_GENTLE_BLOCK_UNLOCK_MINUTES, MAX_GENTLE_BLOCK_UNLOCK_MINUTES } from "@/constants/blockingSchedule";

export function CustomSoftBlocking({ minutes, setMinutes, seconds, setSeconds }) {
  const { t } = useTranslation();

  return (
    <View>
      <Card style={styles.card}>
        <View style={styles.row}>
          <DurationInput
            minutes={minutes}
            setMinutes={setMinutes}
            seconds={seconds}
            setSeconds={setSeconds}
            minMinutes={MIN_GENTLE_BLOCK_UNLOCK_MINUTES}
            maxMinutes={MAX_GENTLE_BLOCK_UNLOCK_MINUTES}
          />
        </View>
      </Card>
      <BodyMediumText style={styles.hint}>
        {t("customizeBlocking.customSoftBlocking.hint", {
          min: MIN_GENTLE_BLOCK_UNLOCK_MINUTES,
          max: MAX_GENTLE_BLOCK_UNLOCK_MINUTES,
        })}
      </BodyMediumText>
      <Space height={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    opacity: 0.6,
    fontStyle: "italic",
    marginTop: 6,
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
