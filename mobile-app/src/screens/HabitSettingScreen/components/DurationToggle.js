import React, { memo, useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  HeadingSmallText,
  TextField,
  Card,
  PressableWithFeedback,
  SheetModal,
  ModalHeader,
  Group,
  MenuItem,
  ScalableIcon,
} from "@/components";
import { DurationInput } from "./DurationSetting";
import { DropDownIcon } from "@/components/MenuItem";
import { useTranslation } from "react-i18next";
import { useFontScale } from "@/hooks/use-font-scale";
import { useTheme } from "@react-navigation/native";

export const DurationSettings = memo(function DurationSettings({
  durationSeconds,
  setDurationSeconds,
  isEnableTimer,
  setIsEnableTimer,
  completionRequirements,
  setCompletionRequirements,
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const { isLargeFontScale } = useFontScale();

  const [isModalVisible, setIsModalVisible] = useState(false);

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const setMinutes = (value) => setDurationSeconds(value * 60 + seconds);
  const setSeconds = (value) => setDurationSeconds(minutes * 60 + value);

  return (
    <>
      <Card style={styles.gap12}>
        <View style={[isLargeFontScale ? styles.column : styles.row, styles.alignStart, styles.gap12]}>
          <View style={[styles.alignStart, isLargeFontScale ? styles.fullWidth : styles.flex]}>
            <PressableWithFeedback
              onPress={() => setIsModalVisible(true)}
              style={[styles.pressable, styles.row, styles.gap12]}
              testID="duration-settings-toggle"
            >
              <ScalableIcon name={isEnableTimer ? "stopwatch" : "flag"} size={20} color={colors.subText} />
              <View style={[styles.row, styles.gap8]}>
                <HeadingSmallText>{isEnableTimer ? t("Timer") : t("Goal")}</HeadingSmallText>
                <DropDownIcon />
              </View>
            </PressableWithFeedback>
          </View>
          {isEnableTimer && (
            <DurationInput minutes={minutes} setMinutes={setMinutes} seconds={seconds} setSeconds={setSeconds} />
          )}
        </View>
        {!isEnableTimer && (
          <View style={[styles.row, styles.gap12]}>
            <ScalableIcon name="square" size={20} color={colors.transparent} />
            <TextField
              small
              placeholder={t("habitSetting.goalPlaceholder")}
              style={styles.flex}
              value={completionRequirements}
              onChangeText={setCompletionRequirements}
              testID="test:id/completion-requirement-input"
            />
          </View>
        )}
      </Card>

      <SheetModal
        isVisible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        HeaderComponent={<ModalHeader title={t("habitSetting.enableTimer")} />}
      >
        <Group style={styles.modalContent}>
          <MenuItem
            type="checkmark"
            icon="stopwatch"
            title={t("habitSetting.timer")}
            description={t("habitSetting.timerDescription")}
            isLargeFontScale={isLargeFontScale}
            onPress={() => {
              setIsEnableTimer(true);
              setIsModalVisible(false);
            }}
            isSelected={isEnableTimer}
            testID={"test:id/disable-timer-option"}
          />
          <MenuItem
            type="checkmark"
            icon="flag"
            title={t("habitSetting.goal")}
            description={t("habitSetting.goalDescription")}
            isLargeFontScale={isLargeFontScale}
            onPress={() => {
              setIsEnableTimer(false);
              setIsModalVisible(false);
            }}
            isSelected={!isEnableTimer}
            testID={"test:id/enable-timer-option"}
          />
        </Group>
      </SheetModal>
    </>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fullWidth: { width: "100%" },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  alignStart: { alignItems: "flex-start" },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  column: {
    flexDirection: "column",
  },
  pressable: {
    padding: 8,
    margin: -8,
  },
  modalContent: {
    padding: 16,
    paddingTop: 8,
  },
});
