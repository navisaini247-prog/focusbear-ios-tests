import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { HeadingXLargeText, BodyLargeText, Card } from "@/components";
import { SpeechBubble } from "@/screens/BlockingPermissionIntro/components/SpeechBubble";
import CaptainBear from "@/assets/captain_bear/captain_bear.png";
import ExercisingBear from "@/assets/bears/excercising_bear.png";
import SleepingBear from "@/assets/bears/sleeping_bear.png";
import MeditatingBear from "@/assets/bears/meditating_bear.png";
import { styles } from "../CaptainBearIntro.styles";
import COLOR from "@/constants/color";
import { useTranslation } from "react-i18next";

const HABIT_CARDS = [
  { key: "sleep", titleKey: "onboarding.habits.sleep", image: SleepingBear },
  { key: "meditate", titleKey: "onboarding.habits.meditate", image: MeditatingBear },
  { key: "exercise", titleKey: "onboarding.habits.exercise", image: ExercisingBear },
];

export const CaptainHabitsStep: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <HeadingXLargeText center style={styles.title} color={COLOR.WHITE}>
        {t("onboarding.setupHabitsTitle")}
      </HeadingXLargeText>

      <View style={styles.cardsRow}>
        {HABIT_CARDS.map((card) => (
          <Card noPadding key={card.key} style={styles.card}>
            <BodyLargeText center color={COLOR.WHITE} style={styles.cardLabel}>
              {t(card.titleKey)}
            </BodyLargeText>
            <View style={styles.cardImageWrapper}>
              <Image source={card.image} style={styles.cardImage} resizeMode="cover" />
            </View>
          </Card>
        ))}
      </View>

      <View style={styles.bottomSection}>
        <SpeechBubble text={t("onboarding.habitsPirateCopy")} style={stepStyles.bubble} />
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
    paddingHorizontal: 12,
    bottom: -32,
  },
});
