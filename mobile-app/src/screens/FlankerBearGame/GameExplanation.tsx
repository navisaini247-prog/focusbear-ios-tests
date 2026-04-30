import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HeadingLargeText, BodyLargeText, BodyMediumText } from "@/components";
import { useTranslation } from "react-i18next";
import COLOR from "@/constants/color";
import { useTheme } from "@react-navigation/native";

interface GameExplanationProps {
  onStartGame: () => void;
}

export const GameExplanation: React.FC<GameExplanationProps> = ({ onStartGame }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HeadingLargeText style={styles.heading}>{t("flankerGame.title")}</HeadingLargeText>
        <View style={styles.explanationContainer}>
          <BodyLargeText style={styles.instructions}>{t("flankerGame.welcome")}</BodyLargeText>
          <BodyMediumText style={styles.instructionStep}>{t("flankerGame.instruction1")}</BodyMediumText>
          <BodyMediumText style={styles.instructionStep}>{t("flankerGame.instruction2")}</BodyMediumText>
          <BodyMediumText style={styles.instructionStep}>{t("flankerGame.instruction3")}</BodyMediumText>
          <BodyMediumText style={styles.instructionStep}>{t("flankerGame.instruction4")}</BodyMediumText>
        </View>
        <TouchableOpacity
          style={styles.playButton}
          onPress={onStartGame}
          testID="test:id/flanker-game-explanation-play-button"
        >
          <BodyLargeText style={styles.playButtonText}>{t("flankerGame.play")}</BodyLargeText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLOR.WHITE,
  },
  container: {
    flex: 1,
    backgroundColor: COLOR.WHITE,
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  instructions: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
  },
  explanationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  instructionStep: {
    fontSize: 16,
    marginVertical: 8,
    textAlign: "center",
  },
  playButton: {
    backgroundColor: COLOR.AMBER[500],
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 40,
  },
  playButtonText: {
    color: COLOR.WHITE,
    fontSize: 20,
    fontWeight: "bold",
  },
});
