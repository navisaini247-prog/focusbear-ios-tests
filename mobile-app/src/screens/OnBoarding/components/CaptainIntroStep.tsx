import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { HeadingXLargeText } from "@/components";
import { SpeechBubble } from "@/screens/BlockingPermissionIntro/components/SpeechBubble";
import CaptainBear from "@/assets/captain_bear/captain_bear.png";
import BearSurprise from "@/assets/captain_bear/bear_suprise.png";
import { styles } from "../CaptainBearIntro.styles";
import COLOR from "@/constants/color";
import { useTranslation } from "react-i18next";

export const CaptainIntroStep: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <HeadingXLargeText center style={styles.title} color={COLOR.WHITE}>
        {t("blockingPermissionIntro.holdOnTitle")}
      </HeadingXLargeText>

      <Image source={BearSurprise} style={styles.centerBear} resizeMode="contain" />

      <View style={styles.bottomSection}>
        <SpeechBubble text={t("blockingPermissionIntro.captainBearMessage")} style={stepStyles.bubble} />
        <View style={styles.bearWrapper}>
          <Image source={CaptainBear} style={styles.captainBear} resizeMode="contain" />
        </View>
      </View>
    </>
  );
};

const stepStyles = StyleSheet.create({
  bubble: {
    maxWidth: 240,
    marginBottom: 16,
    bottom: -32,
    paddingHorizontal: 12,
  },
});
