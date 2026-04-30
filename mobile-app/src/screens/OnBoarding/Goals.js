import React, { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { styles } from "./Goals.styles";
import { NAVIGATION } from "@/constants";
import Toast from "react-native-toast-message";
import {
  MenuItem,
  ConfirmationButton,
  ConfirmationModal,
  HeadingSmallText,
  HeadingMediumText,
  HeadingXLargeText,
  PressableWithFeedback,
  SheetModal,
  ModalHeader,
  TextField,
  Button,
} from "@/components";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { useDispatch, useSelector } from "react-redux";
import { updateOnboardingGoals, updateFocusOnlyGoal } from "@/actions/GlobalActions";
import { saveInstalledApps } from "@/utils/NativeModuleMethods";
import { signup, putUserSettings, storeHabitPack } from "@/actions/UserActions";
import { GUEST_PASSWORD } from "@/hooks/useIsGuestAccount";
import { setIsOnboardingStatus } from "@/actions/GlobalActions";
import { BearLoading } from "@/components/LoadingScreen";
import { BLANK_HABITS_FOR_FOCUS_ONLY } from "@/constants/activity";
import Icon from "react-native-vector-icons/Ionicons";
import { CAROUSEL_VARIANTS } from "./HowFocusBearWorkScreen";
import { createGuestEmail } from "@/hooks/useIsGuestAccount";

export function Goals({ navigation }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showSomethingElseModal, setShowSomethingElseModal] = useState(false);
  const [showSetupHabitsNowModal, setShowSetupHabitsNowModal] = useState(false);
  const dispatch = useDispatch();
  const onboardingGoals = useSelector((state) => state.global.onboardingGoals ?? []);
  const guestEmail = createGuestEmail();

  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  useEffect(() => {
    saveInstalledApps(); //Cache Installed apps in Android Native side
  }, []);

  const onClickGoal = (value) => {
    const updatedGoals = onboardingGoals.includes(value)
      ? onboardingGoals.filter((goal) => goal !== value)
      : [...onboardingGoals, value];
    dispatch(updateOnboardingGoals(updatedGoals));
  };

  const handleOnPress = async () => {
    setIsLoading(true);

    const staySelected = onboardingGoals.includes(t("goals.help_me_stay"));
    const developSelected = onboardingGoals.includes(t("goals.help_me_develop"));
    const organizeSelected = onboardingGoals.includes(t("goals.organize_tasks_using_ai"));

    const focusFeaturesWithoutHabitsSelected = !developSelected && (staySelected || organizeSelected);

    if (focusFeaturesWithoutHabitsSelected) {
      setShowGuestPrompt(true);
      setIsLoading(false);
      dispatch(updateFocusOnlyGoal(true));
      return;
    }

    setShowSetupHabitsNowModal(true);
    setIsLoading(false);
  };

  const checkBoxColor = checkBoxColor;
  const isValidGoalSelection =
    onboardingGoals.includes(t("goals.help_me_develop")) ||
    onboardingGoals.includes(t("goals.help_me_stay")) ||
    onboardingGoals.includes(t("goals.organize_tasks_using_ai"));

  return (
    <SafeAreaView edges={["top"]} style={styles.flex}>
      <ScrollView contentContainerStyle={[styles.container, styles.flex]}>
        <View style={[styles.blurbTextContainer, styles.flex]}>
          <HeadingXLargeText center>{t("goals.enableFeatures")}</HeadingXLargeText>
        </View>
        <View style={styles.gap16}>
          <OptionContainer
            title={t("goals.organize_tasks_using_ai")}
            description={t("goals.organize_tasks_using_ai_tooltip")}
            onClickGoal={onClickGoal}
            isSelected={onboardingGoals?.includes(t("goals.organize_tasks_using_ai"))}
            testID="test:id/goal-organize-tasks-using-ai"
          />
          <OptionContainer
            title={t("goals.help_me_develop")}
            description={t("goals.help_me_develop_tooltip")}
            onClickGoal={onClickGoal}
            isSelected={onboardingGoals?.includes(t("goals.help_me_develop"))}
            testID="test:id/goal-help-me-develop"
          />
          <OptionContainer
            title={t("goals.help_me_stay")}
            description={t("goals.help_me_stay_focused_tooltip")}
            onClickGoal={onClickGoal}
            isSelected={onboardingGoals?.includes(t("goals.help_me_stay"))}
            testID="test:id/goal-help-me-stay"
          />
          <PressableWithFeedback
            onPress={() => setShowSomethingElseModal(true)}
            testID="test:id/continue-or-do-it-later"
            style={styles.linkButton}
          >
            <HeadingSmallText underline color={colors.subText}>{`${t("common.somethingElse")}...`}</HeadingSmallText>
          </PressableWithFeedback>
          <PressableWithFeedback
            onPress={() => navigation.navigate(NAVIGATION.HowFocusBearWork, { variant: CAROUSEL_VARIANTS.FEATURES })}
            style={styles.carrouselButton}
            testID="test:id/learn-about-features"
          >
            <Icon name="information-circle-outline" size={25} color={colors.primaryBorder} />
            <HeadingSmallText underline color={colors.subText}>
              {t("onboarding.learnAboutFeatures")}
            </HeadingSmallText>
          </PressableWithFeedback>
        </View>
      </ScrollView>
      {isLoading && <BearLoading visible={isLoading} />}
      <ConfirmationModal
        isVisible={showGuestPrompt}
        onCancel={async () => {
          // User chose "No" -> sign up as a guest and skip onboarding
          setShowGuestPrompt(false);
          setIsLoading(true);
          postHogCapture(POSTHOG_EVENT_NAMES.SIGNIN_AS_GUEST);
          dispatch(
            signup(guestEmail, GUEST_PASSWORD, async () => {
              try {
                await dispatch(putUserSettings(BLANK_HABITS_FOR_FOCUS_ONLY, true));
                dispatch(storeHabitPack(BLANK_HABITS_FOR_FOCUS_ONLY));
              } catch (error) {
                console.error("Error installing blank habits:", error);
              }
              setIsLoading(false);
              dispatch(setIsOnboardingStatus(true));
            }),
          );
        }}
        onConfirm={() => {
          setShowGuestPrompt(false);
          dispatch(updateFocusOnlyGoal(true));
          navigation.replace(NAVIGATION.PrivacyConsent, { signUp: true, installBlankHabits: true });
        }}
        cancelTitle={t("common.no")}
        confirmTitle={t("common.yes")}
        title={t("goals.blockComputerTitle")}
        text={t("goals.blockComputerQuestion")}
      />
      <ConfirmationButton
        confirmTestID="test:id/handle-goals-submission"
        onConfirm={handleOnPress}
        confirmTitle={t("common.next")}
        disabled={!isValidGoalSelection || isLoading}
        isLoading={isLoading}
      />
      <SomethingElseModal isVisible={showSomethingElseModal} setIsVisible={setShowSomethingElseModal} />
      <SetupHabitsNowModal
        isVisible={showSetupHabitsNowModal}
        handleCancel={() => {
          dispatch(setIsOnboardingStatus(true));
          navigation.replace(NAVIGATION.PrivacyConsent);
        }}
        handleConfirm={() => {
          dispatch(setIsOnboardingStatus(false));
          navigation.replace(NAVIGATION.PrivacyConsent);
        }}
      />
    </SafeAreaView>
  );
}

export const OptionContainer = ({ onClickGoal, title, isSelected, ...props }) => {
  const { colors } = useTheme();

  return (
    <MenuItem
      style={isSelected && { borderColor: colors.primary }}
      title={title}
      type="checkbox"
      onPress={() => onClickGoal(title)}
      isSelected={isSelected}
      {...props}
    />
  );
};

const SomethingElseModal = ({ isVisible, setIsVisible }) => {
  const { t } = useTranslation();
  const [somethingElse, setSomethingElse] = useState("");

  const handleSave = () => {
    setSomethingElse("");
    setIsVisible(false);
    Toast.show({
      type: "success",
      text1: t("common.Success"),
      text2: t("goals.featureRequestReceived"),
    });
  };

  return (
    <SheetModal
      isVisible={isVisible}
      onCancel={() => setIsVisible(false)}
      HeaderComponent={<ModalHeader title={t("goals.what_are_you_hoping_focus_bear_can_do")} />}
    >
      <View style={[styles.modalContainer, styles.gap16]}>
        <TextField
          autoFocus
          placeholder={t("goals.what_are_you_hoping_focus_bear_can_do_placeholder")}
          value={somethingElse}
          onChangeText={setSomethingElse}
          multiline
        />

        <Button
          style={styles.flex}
          title={t("common.submit")}
          onPress={handleSave}
          testID="test:id/save-goals-something-else"
          disabled={somethingElse.trim().length === 0}
        />
      </View>
    </SheetModal>
  );
};

const SetupHabitsNowModal = ({ isVisible, handleCancel, handleConfirm }) => {
  const { t } = useTranslation();

  return (
    <ConfirmationModal
      isVisible={isVisible}
      onCancel={handleCancel}
      confirmTitle={t("goals.setup_habits")}
      onConfirm={handleConfirm}
      cancelTitle={t("goals.explore_the_app_first")}
      actionRequired={true}
    >
      <HeadingMediumText>{t("goals.setup_habits_question")}</HeadingMediumText>
    </ConfirmationModal>
  );
};
