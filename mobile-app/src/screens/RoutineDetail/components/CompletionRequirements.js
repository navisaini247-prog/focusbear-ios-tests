import React from "react";
import { View, StyleSheet } from "react-native";
import { HeadingMediumText, BodySmallText, Card, ConfirmationButton } from "@/components";
import { useRoutineDetailContext } from "../context/context";
import { useTranslation } from "react-i18next";
import { useFontScale } from "@/hooks/use-font-scale";
import { FocusMusicButton } from "@/screens/FocusMode/FocusMusicButton";

export const CompletionRequirements = () => {
  const { t } = useTranslation();
  const {
    activityInfo: { completionRequirements },
    finishActivity,
  } = useRoutineDetailContext();

  const { isLargeFontScale } = useFontScale();

  return (
    <>
      <View style={styles.container}>
        <Card style={styles.completionRequirementsCard}>
          <BodySmallText>{t("habitSetting.requirement")}</BodySmallText>
          <HeadingMediumText>{completionRequirements}</HeadingMediumText>
        </Card>
      </View>
      <FocusMusicButton
        containerStyle={isLargeFontScale ? styles.musicButtonContainerScaled : styles.musicButtonContainer}
      />
      <ConfirmationButton
        confirmTestID="test:id/finish-activity"
        onConfirm={() => finishActivity(false)}
        confirmTitle={t("routineDetail.done")}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  completionRequirementsCard: {
    gap: 8,
  },
  musicButtonContainer: {
    position: "absolute",
    bottom: "25%",
    right: 0,
    zIndex: 10,
  },
  musicButtonContainerScaled: {
    position: "relative",
    alignSelf: "flex-end",
    marginHorizontal: 16,
    marginBottom: 16,
    zIndex: 10,
  },
});
