import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Button, DisplaySmallText, Space, AppHeader } from "@/components";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { NAVIGATION } from "@/constants";
import { OptionContainer } from "../OnBoarding/Goals";
import { useTranslation } from "react-i18next";
import { useHomeContext } from "../Home/context";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { navigationReplace } from "@/navigation/root.navigator";
import { styles } from "./UnicaesStudyOnboarding.styles";
import {
  hasCompletedFlankerSelector,
  hasCompletedQuestionnaireSelector,
  hasCompletedConsentFormSelector,
} from "@/selectors/UserSelectors";
import { AppActivationStatus, useParticipantCode } from "@/hooks/useParticipantCode";
import { BEFORE_STUDY_QUESTIONNAIRE_URL, CONFIRMATION_URL } from "../Questionnaire";
import { useOnBoardingStatus } from "@/hooks/use-onboarding-status";

export function UnicaesStudyOnboarding() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isOnboardingDone = useOnBoardingStatus();

  const {
    isUsagePermissionGranted,
    isScreenTimePermissionGranted,
    isHealthPermissionGranted,
    isPhysicalPermissionGranted,
  } = useHomeContext();
  const { getCodeActivationStatus } = useParticipantCode();
  const [activationStatus, setActivationStatus] = useState<AppActivationStatus | null>(null);

  useEffect(() => {
    getCodeActivationStatus().then((data) => {
      setActivationStatus(data);
    });
  }, []);

  const hasCompletedFlanker = useSelector(hasCompletedFlankerSelector);
  const hasCompletedQuestionnaire = useSelector(hasCompletedQuestionnaireSelector);
  const hasCompletedConsentForm = useSelector(hasCompletedConsentFormSelector);

  const isAllDone = useMemo(() => {
    const isPermissionsCompleted = checkIsAndroid()
      ? isUsagePermissionGranted && isHealthPermissionGranted && isPhysicalPermissionGranted
      : isScreenTimePermissionGranted && isHealthPermissionGranted;

    return isPermissionsCompleted && hasCompletedFlanker && hasCompletedQuestionnaire && hasCompletedConsentForm;
  }, [
    isUsagePermissionGranted,
    isHealthPermissionGranted,
    isPhysicalPermissionGranted,
    isScreenTimePermissionGranted,
    hasCompletedFlanker,
    hasCompletedQuestionnaire,
    hasCompletedConsentForm,
  ]);

  const toFlankerGame = () => {
    navigation.navigate(NAVIGATION.FlankerBearGame);
  };

  const toQuestionnaire = () => {
    navigation.navigate(NAVIGATION.Questionnaire, { url: BEFORE_STUDY_QUESTIONNAIRE_URL });
  };

  const toConfirmation = () => {
    navigation.navigate(NAVIGATION.Questionnaire, { url: CONFIRMATION_URL });
  };

  const handleContinue = () => {
    if (!isOnboardingDone && activationStatus !== AppActivationStatus.DATA_COLLECTION_MODE) {
      navigation.reset({
        index: 0,
        routes: [{ name: NAVIGATION.PushNotificationScreen }],
      });
    } else {
      navigationReplace(
        activationStatus === AppActivationStatus.DATA_COLLECTION_MODE
          ? NAVIGATION.DataCollectionOnly
          : NAVIGATION.TabNavigator,
      );
    }
  };

  const setupPermissions = () => {
    navigation.navigate(NAVIGATION.PermissionRequest, { fromUnicaesOnboarding: true });
  };

  const isPermissionsCompleted = checkIsAndroid()
    ? isUsagePermissionGranted && isHealthPermissionGranted && isPhysicalPermissionGranted
    : isScreenTimePermissionGranted && isHealthPermissionGranted;

  return (
    <View style={styles.flex}>
      <AppHeader title={t("participantCode.unicasStudy")} hideBackButton={true} />
      <View style={[styles.container, styles.flex]}>
        <View style={styles.contentContainer}>
          <View style={styles.checkboxesContainer}>
            <DisplaySmallText>{t("participantCode.setupPermissions")}</DisplaySmallText>
            <Space height={16} />
            <OptionContainer
              title={t("participantCode.setupPermissionsTitle")}
              description={t("participantCode.setupPermissionsDesc")}
              isSelected={isPermissionsCompleted}
              onClickGoal={setupPermissions}
              testID="test:id/setup-permissions"
            />
            <Space height={24} />
            <DisplaySmallText>{t("participantCode.studyTasks")}</DisplaySmallText>
            <Space height={16} />
            <OptionContainer
              title={t("participantCode.flankerTaskTitle")}
              description={t("participantCode.flankerTaskDesc")}
              isSelected={hasCompletedFlanker}
              onClickGoal={toFlankerGame}
              testID="test:id/start-flanker-game"
            />
            <Space height={16} />
            <OptionContainer
              title={t("participantCode.questionnaireTitle")}
              description={t("participantCode.questionnaireDesc")}
              isSelected={hasCompletedQuestionnaire}
              onClickGoal={toQuestionnaire}
              testID="test:id/start-questionnaire"
            />
            <Space height={16} />
            <OptionContainer
              title={t("participantCode.consentFormTitle")}
              description={t("participantCode.consentFormDesc")}
              isSelected={hasCompletedConsentForm}
              onClickGoal={toConfirmation}
              testID="test:id/start-questionnaire"
            />
          </View>
        </View>
      </View>
      <View style={[styles.buttonContainer, { backgroundColor: colors.card, borderTopColor: colors.separator }]}>
        <Button
          primary
          onPress={handleContinue}
          disabled={!isAllDone}
          testID="test:id/continue-button"
          title={t("common.continue")}
        />
      </View>
    </View>
  );
}
