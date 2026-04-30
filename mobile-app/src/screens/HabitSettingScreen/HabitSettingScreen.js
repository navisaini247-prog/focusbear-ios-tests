import React, { useState, useCallback, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { FloatingButton, Group, BodySmallText, BigAppHeader, Checkmark } from "@/components";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { DurationSettings } from "./components/DurationToggle";
import { DayOfWeekSelector } from "../BlockingSchedule/components/DayOfWeekSelector";
import { NameAndEmojiInput } from "./components/HabitNameInput";
import { useHabitSetting } from "./context/context";
import { RoutineSelection } from "./components/RoutineSelection";
import { HabitVideoSetting } from "./components/HabitVideoSetting";
import { ChooseAppsButton } from "../BlockingSchedule/components/ChooseAppsButton";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { isEmpty } from "lodash";
import { NAVIGATION } from "@/constants";
import { ACTIVITY_TYPE } from "@/constants/routines";
import { ALL } from "@/constants/activity";

export const DEFAULT_HABIT_INFO = {
  id: "",
  name: "",
  habit_icon: "",
  duration_seconds: 5 * 60,
  video_urls: [],
  days_of_week: [ALL],
  completion_requirements: null,
  allowed_mobile_apps: [],
};

export const HabitSettingScreen = ({ route }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { params = {} } = route;
  const selectedActivity = useRef(params.activity).current;

  const [activity, setActivity] = useState(() => ({
    ...DEFAULT_HABIT_INFO,
    activity_type: params.activityType || ACTIVITY_TYPE.MORNING,
    activity_sequence_id: params.activitySequenceId,
    ...selectedActivity,
  }));
  const [isEnableTimer, setIsEnableTimer] = useState(Boolean(!selectedActivity?.completion_requirements));

  const { isLoading, handleConfirmEditHabit } = useHabitSetting({ activity, selectedActivity, isEnableTimer });

  const isAddingNewHabit = isEmpty(selectedActivity);
  const saveDisabled = !activity.name.trim() || !activity.activity_type;

  const setName = useCallback((name) => setActivity((prev) => ({ ...prev, name })), []);
  const setEmoji = useCallback((habit_icon) => setActivity((prev) => ({ ...prev, habit_icon })), []);
  const setDaysOfWeek = useCallback((days_of_week) => setActivity((prev) => ({ ...prev, days_of_week })), []);
  const setDurationSeconds = useCallback((duration_seconds) => {
    setActivity((prev) => ({ ...prev, duration_seconds }));
  }, []);
  const setCompletionRequirements = useCallback((completion_requirements) => {
    setActivity((prev) => ({ ...prev, completion_requirements }));
  }, []);
  const setVideoUrl = useCallback((url) => setActivity((prev) => ({ ...prev, video_urls: [url] })), []);
  const setAllowedApps = useCallback(
    (allowed_mobile_apps) => setActivity((prev) => ({ ...prev, allowed_mobile_apps })),
    [],
  );
  const setActivityTypeAndSequenceId = useCallback((type, sequenceId) => {
    setActivity((prev) => ({ ...prev, activity_type: type, activity_sequence_id: sequenceId }));
  }, []);

  return (
    <View style={styles.flex}>
      <BigAppHeader />
      <KeyboardAwareScrollView bottomOffset={100} contentContainerStyle={[styles.container, styles.gap24]}>
        <NameAndEmojiInput
          name={activity.name}
          setName={setName}
          emoji={activity.habit_icon}
          setEmoji={setEmoji}
          placeholder={isAddingNewHabit ? t("home.newHabit") : t("home.habitName")}
          autoFocus={!activity.name}
        />

        <View style={styles.gap12}>
          <Group>
            {!params.hideRoutineSelection && (
              <RoutineSelection
                activitySequenceId={activity.activity_sequence_id}
                activityType={activity.activity_type}
                setActivityTypeAndSequenceId={setActivityTypeAndSequenceId}
              />
            )}

            <DayOfWeekSelector selectedDays={activity.days_of_week} setSelectedDays={setDaysOfWeek} />
          </Group>

          <DurationSettings
            durationSeconds={activity.duration_seconds}
            setDurationSeconds={setDurationSeconds}
            isEnableTimer={isEnableTimer}
            setIsEnableTimer={setIsEnableTimer}
            completionRequirements={activity.completion_requirements}
            setCompletionRequirements={setCompletionRequirements}
          />
        </View>

        <View style={styles.gap8}>
          <BodySmallText style={styles.sectionLabel} color={colors.subText}>
            {t("habitSetting.extras")}
          </BodySmallText>

          <HabitVideoSetting
            videoUrl={activity.video_urls?.[0]}
            setVideoUrl={setVideoUrl}
            description={t("habitSetting.youtubeVideoDescription")}
          />

          {checkIsAndroid() && (
            <ChooseAppsButton
              hidePrompt
              selectedApps={activity.allowed_mobile_apps}
              title={t("habitSetting.allowedApps")}
              description={t("habitSetting.allowedAppsDescription")}
              onPress={() =>
                navigation.navigate(NAVIGATION.AppsBlockList, {
                  isHabitAllowedApps: true,
                  selectedApps: activity.allowed_mobile_apps,
                  onSave: setAllowedApps,
                })
              }
            />
          )}
        </View>
      </KeyboardAwareScrollView>

      {/* Save button */}
      <FloatingButton
        primary
        title={t("common.save")}
        renderLeftIcon={<Checkmark value={true} color={saveDisabled ? colors.text : colors.white} />}
        onPress={handleConfirmEditHabit}
        isLoading={isLoading}
        disabled={saveDisabled}
        testID="test:id/confirm-edit-habit"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  gap24: { gap: 24 },
  container: {
    padding: 16,
  },
  sectionLabel: {
    fontWeight: "700",
    paddingHorizontal: 12,
  },
});
