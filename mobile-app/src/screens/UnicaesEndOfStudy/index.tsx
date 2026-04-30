import React, { useMemo } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, DisplaySmallText, Space, AppHeader } from "@/components";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { NAVIGATION } from "@/constants";
import { OptionContainer } from "../OnBoarding/Goals";
import { useTranslation } from "react-i18next";
import { navigationReplace } from "@/navigation/root.navigator";
import { styles } from "./UnicaesEndOfStudy";
import { hasCompletedAfterStudyFlankerSelector, hasCompletedEoSQuestionnaireSelector } from "@/selectors/UserSelectors";
import { AFTER_STUDY_QUESTIONNAIRE_URL } from "../Questionnaire";
import { useOnBoardingStatus } from "@/hooks/use-onboarding-status";
import { onBoardingProcessSelector } from "@/selectors/GlobalSelectors";

export function UnicaesEndOfStudy() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isOnBoardingStatus = useOnBoardingStatus();
  const onBoardingProcessNav = useSelector(onBoardingProcessSelector);

  const hasCompletedFlanker = useSelector(hasCompletedAfterStudyFlankerSelector);
  const hasCompletedEoSQuestionnaire = useSelector(hasCompletedEoSQuestionnaireSelector);

  const isAllDone = useMemo(() => {
    return hasCompletedFlanker && hasCompletedEoSQuestionnaire;
  }, [hasCompletedFlanker, hasCompletedEoSQuestionnaire]);

  const toFlankerGame = () => {
    navigation.navigate(NAVIGATION.FlankerBearGame, { isAfterStudy: true });
  };

  const toQuestionnaire = () => {
    navigation.navigate(NAVIGATION.Questionnaire, { url: AFTER_STUDY_QUESTIONNAIRE_URL });
  };

  const handleContinue = () => {
    if (isOnBoardingStatus) {
      navigationReplace(NAVIGATION.TabNavigator);
    } else {
      navigationReplace(onBoardingProcessNav);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.flex}>
      <AppHeader title={t("participantCode.unicasStudy")} hideBackButton={true} />
      <View style={[styles.container, styles.flex]}>
        <View style={styles.contentContainer}>
          <View style={styles.checkboxesContainer}>
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
              isSelected={hasCompletedEoSQuestionnaire}
              onClickGoal={toQuestionnaire}
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
    </SafeAreaView>
  );
}
