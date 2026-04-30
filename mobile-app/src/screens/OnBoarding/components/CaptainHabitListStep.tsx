import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { HeadingXLargeText } from "@/components";
import Paper from "@/assets/bears/paper.png";
import CaptainBearSmirk from "@/assets/captain_bear/captain_bear_smirk.png";
import { SpeechBubble } from "@/screens/BlockingPermissionIntro/components/SpeechBubble";
import { styles } from "../CaptainBearIntro.styles";
import COLOR from "@/constants/color";
import { useTranslation } from "react-i18next";

export const CaptainHabitListStep: React.FC = () => {
  const { t } = useTranslation();

  return (
    <View style={stepStyles.container}>
      <HeadingXLargeText center style={styles.title} color={COLOR.WHITE}>
        {t("goals.addHabitList.haveHabitListQuestion")}
      </HeadingXLargeText>

      <View style={stepStyles.paperWrapper}>
        <Image source={Paper} style={stepStyles.paperImage} resizeMode="contain" />
      </View>

      <View style={stepStyles.bottomSection}>
        <SpeechBubble text={t("onboarding.habitImportPirateCopy")} style={styles.bubble} />
        <View style={stepStyles.bearWrapper}>
          <Image source={CaptainBearSmirk} style={stepStyles.pirateBear} resizeMode="contain" />
        </View>
      </View>
    </View>
  );
};

const stepStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  paperWrapper: {
    marginTop: 24,
    paddingHorizontal: 24,
    flex: 1,
  },
  paperImage: {
    width: 300,
    height: "100%",
  },
  bottomSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 24,
    paddingHorizontal: 24,
  },
  bearWrapper: {
    bottom: -20,
    right: 13,
  },
  pirateBear: {
    width: 180,
    height: 180,
  },
});
