import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useTheme, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { styles as customStyles } from "./UserAchievementGoals.styles";
import { ConfirmationButton, HeadingWithInfo, TextField } from "@/components";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { addInfoLog, logAPIError } from "@/utils/FileLogger";
import { NAVIGATION } from "@/constants";
import { postHogCapture, posthogSetProperties } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES, POSTHOG_PERSON_PROPERTIES } from "@/utils/Enums";
import { useUpdateOnboardingProcess } from "@/hooks/use-update-onboarding-process";
import { OverlayModule } from "@/nativeModule";
import { checkIsIOS } from "@/utils/PlatformMethods";
import { useDispatch, useSelector } from "react-redux";
import { preLoadInstalledApps, updateOnboardingGoals } from "@/actions/GlobalActions";
import { updateLongTermGoals } from "@/actions/RoutineActions";
import { HeadingXLargeText } from "@/components/Text";
import { OptionContainer } from "./Goals";
import { userIdSelector } from "@/selectors/UserSelectors";
import { HabitImportButton } from "./components/HabitImportButton";
import { AddYourHabit } from "./AddYourHabit";
import { ProgressBar } from "@/screens/BlockingPermissionIntro/components/ProgressBar";

export function UserAchievementGoals({ navigation }) {
  const { colors } = useTheme();
  const route = useRoute();
  const habitImportTaskId = route?.params?.habitImportTaskId;
  const { t } = useTranslation();
  const styles = useMemo(() => customStyles(colors), [colors]);
  const [customGoal, setCustomGoal] = useState("");
  const [customGoalSelected, setCustomGoalSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddHabitList, setShowAddHabitList] = useState(!!route?.params?.startHabitImport);

  // Using stages prop instead of local interval
  const dispatch = useDispatch();
  const onboardingGoals = useSelector((state) => state.global.onboardingGoals ?? []);
  const userId = useSelector(userIdSelector);

  const onClickGoal = (value) => {
    const updatedGoals = onboardingGoals.includes(value)
      ? onboardingGoals.filter((goal) => goal !== value)
      : [...onboardingGoals, value];
    dispatch(updateOnboardingGoals(updatedGoals));
    postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_USER_ACHIEVEMENT_GOAL_SELECTED, {
      goal: value,
      isSelected: !onboardingGoals.includes(value),
    });
  };

  useUpdateOnboardingProcess(NAVIGATION.UserAchievement);

  useEffect(() => {
    postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_USER_ACHIEVEMENT_SCREEN_OPENED);
  }, []);

  useEffect(() => {
    if (checkIsIOS()) {
      return;
    }
    const fetchInstalledApps = async () => {
      const installedApps = await OverlayModule.getApps();

      // Remove the icon property from each appItem
      // We don't store the icon because it's very heavy
      const appsWithoutIcons = installedApps.map(({ icon: _icon, ...rest }) => rest);

      dispatch(preLoadInstalledApps(appsWithoutIcons));
    };
    fetchInstalledApps();
  }, []);

  const onConfirm = () => {
    postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_USER_ACHIEVEMENT_NEXT_CLICKED, {
      goalsCount: onboardingGoals.length + (customGoal ? 1 : 0),
      hasCustomGoal: !!customGoal,
    });
    dispatch(updateOnboardingGoals(onboardingGoals));
    setIsLoading(true);
    posthogSetProperties(userId, { [POSTHOG_PERSON_PROPERTIES.REASON_FOR_USING_FOCUSBEAR]: customGoal });

    const goals = [...onboardingGoals, customGoal].filter((goal) => goal && goal.trim() !== "");

    const formattedGoals = goals.map((goal) => ({
      goal: goal,
      isCustom: goal === customGoal && customGoal.trim() !== "",
    }));

    updateLongTermGoals({ goals: goals })
      .then(() => {
        postHogCapture(POSTHOG_EVENT_NAMES.CUSTOM_GOAL_SELECTED, { customGoal });
        navigation.replace(NAVIGATION.RoutineSuggestion, { userGoals: formattedGoals, habitImportTaskId });
        addInfoLog("Long Term Goals sent to API successfully");
      })
      .catch((error) => {
        logAPIError("Error sending long term goals: ", error);
      })
      .finally(() => setIsLoading(false));
  };

  // If the user has selected a custom goal and it's empty, disable the next button
  const isCustomGoalEmpty = customGoalSelected && !customGoal;

  // Custom goals from the prev screen
  const previousScreenGoals = [t("goals.help_me_develop"), t("goals.help_me_stay"), t("goals.organize_tasks_using_ai")];

  // Filter the empty arrays
  const validGoals = onboardingGoals.filter((goal) => goal && goal.trim() !== "");

  const hasOnlyPreviousScreenGoals = validGoals.every((goal) => previousScreenGoals.includes(goal));

  const shouldDisableNext = isCustomGoalEmpty || (hasOnlyPreviousScreenGoals && !customGoalSelected);

  return (
    <SafeAreaView edges={["top"]} style={styles.flex}>
      <ProgressBar currentStep={5} totalSteps={5} />
      {showAddHabitList ? (
        <AddYourHabit
          navigation={navigation}
          onboardingGoals={onboardingGoals}
          onGoBack={() => setShowAddHabitList(false)}
        />
      ) : (
        <>
          <KeyboardAwareScrollView contentContainerStyle={styles.container}>
            <View style={[styles.blurbTextContainer, styles.flex]}>
              <HeadingWithInfo
                center
                infoText={t("goals.achievementWithFocusBearDescTooltip")}
                infoTestID="test:id/goal-achievement-info"
              >
                <HeadingXLargeText center>{t("goals.achievementWithFocusBearDesc")}</HeadingXLargeText>
              </HeadingWithInfo>
            </View>
            <View style={styles.optionsContainer}>
              <OptionContainer
                onClickGoal={onClickGoal}
                title={t("goals.boostProductivity")}
                description={t("goals.boostProductivityDescription")}
                isSelected={onboardingGoals?.includes(t("goals.boostProductivity"))}
                testID="test:id/goal-boost-productivity"
              />
              <OptionContainer
                onClickGoal={onClickGoal}
                title={t("goals.improveMentalHealth")}
                description={t("goals.improveMentalHealthDescription")}
                isSelected={onboardingGoals?.includes(t("goals.improveMentalHealth"))}
                testID="test:id/goal-improve-mental-health"
              />
              <OptionContainer
                onClickGoal={onClickGoal}
                title={t("goals.improvePhysicalHealth")}
                description={t("goals.improvePhysicalHealthDescription")}
                isSelected={onboardingGoals?.includes(t("goals.improvePhysicalHealth"))}
                testID="test:id/goal-improve-physical-health"
              />
              <OptionContainer
                onClickGoal={onClickGoal}
                title={t("goals.manageTask")}
                description={t("goals.manageTaskDescription")}
                isSelected={onboardingGoals?.includes(t("goals.manageTask"))}
                testID="test:id/goal-manage-task"
              />
              <OptionContainer
                onClickGoal={onClickGoal}
                title={t("goals.strengthenRelationShip")}
                description={t("goals.strengthenRelationShipDescription")}
                isSelected={onboardingGoals?.includes(t("goals.strengthenRelationShip"))}
                testID="test:id/goal-strengthen-relationship"
              />
              <OptionContainer
                onClickGoal={() => {
                  const newValue = !customGoalSelected;
                  setCustomGoalSelected(newValue);
                  postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_USER_ACHIEVEMENT_CUSTOM_GOAL_TOGGLED, {
                    isSelected: newValue,
                  });
                }}
                title={t("goals.otherSpecify")}
                description={t("goals.otherSpecifyDescription")}
                isSelected={customGoalSelected}
                testID="test:id/goal-other-specify"
              />
              {customGoalSelected && (
                <TextField
                  multiline
                  value={customGoal}
                  onChangeText={(text) => setCustomGoal(text)}
                  placeholder={t("goals.achievement_placeholder")}
                  testID="test:id/goal-other-input"
                />
              )}
            </View>
          </KeyboardAwareScrollView>

          <HabitImportButton
            onPress={() => {
              postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_HABIT_IMPORT_OPENED);
              setShowAddHabitList(true);
            }}
          />
          <ConfirmationButton
            confirmTestID="test:id/handle-goals-submission"
            onConfirm={onConfirm}
            confirmTitle={t("common.next")}
            isLoading={isLoading}
            disabled={shouldDisableNext}
          />
        </>
      )}
    </SafeAreaView>
  );
}
