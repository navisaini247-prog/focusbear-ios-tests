import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { DurationInput } from "../HabitSettingScreen/components/DurationSetting";
import { NameAndEmojiInput } from "../HabitSettingScreen/components/HabitNameInput";
import { useEditQuickBreaks } from "./context/context";
import { BigAppHeader, HeadingSmallText, FloatingButton, Card, Checkmark } from "@/components";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "@react-navigation/native";
import { HabitVideoSetting } from "../HabitSettingScreen/components/HabitVideoSetting";

export const EditQuickBreaksScreen = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const { isUpdating, handleAddQuickBreak, quickBreakInfo, setQuickBreakInfo } = useEditQuickBreaks();
  const saveDisabled = !quickBreakInfo.name.trim();

  const setName = useCallback((name) => setQuickBreakInfo((prev) => ({ ...prev, name })), []);
  const setEmoji = useCallback((emoji) => setQuickBreakInfo((prev) => ({ ...prev, emoji })), []);
  const setMinutes = useCallback((minutes) => setQuickBreakInfo((prev) => ({ ...prev, minutes })), []);
  const setSeconds = useCallback((seconds) => setQuickBreakInfo((prev) => ({ ...prev, seconds })), []);
  const setVideoUrl = useCallback((videoUrl) => setQuickBreakInfo((prev) => ({ ...prev, videoUrl })), []);

  return (
    <View style={styles.flex}>
      <BigAppHeader />
      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={[styles.container, styles.gap24]}
        bottomOffset={100}
      >
        <NameAndEmojiInput
          name={quickBreakInfo.name}
          setName={setName}
          emoji={quickBreakInfo.emoji}
          setEmoji={setEmoji}
          placeholder={t("quickBreak.quickBreakName")}
          maxLength={30}
        />

        <View style={styles.gap12}>
          <Card>
            <View style={[styles.row, styles.alignStart]}>
              <View style={[styles.flex, styles.row, styles.gap12]}>
                <Icon name="stopwatch" size={20} color={colors.subText} />
                <HeadingSmallText>{t("habitSetting.timer")}</HeadingSmallText>
              </View>
              <DurationInput
                minutes={Math.floor(quickBreakInfo.minutes)}
                setMinutes={setMinutes}
                seconds={quickBreakInfo.seconds}
                setSeconds={setSeconds}
              />
            </View>
          </Card>

          <HabitVideoSetting videoUrl={quickBreakInfo.videoUrl} setVideoUrl={setVideoUrl} />
        </View>
      </KeyboardAwareScrollView>

      <FloatingButton
        primary
        title={t("common.save")}
        renderLeftIcon={<Checkmark value={true} color={saveDisabled ? colors.text : colors.white} />}
        onPress={handleAddQuickBreak}
        isLoading={isUpdating}
        disabled={saveDisabled}
        testID="test:id/confirm-edit-quick-break"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap12: { gap: 12 },
  gap24: { gap: 24 },
  alignStart: { alignItems: "flex-start" },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  container: {
    padding: 16,
  },
});
