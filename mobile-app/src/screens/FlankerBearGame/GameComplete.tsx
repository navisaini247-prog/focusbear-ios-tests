import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HeadingLargeText, BodyMediumText, BodyLargeText } from "@/components";
import { useTranslation } from "react-i18next";
import { TrialResult } from "./types";
import { useTheme } from "@react-navigation/native";
import COLOR from "@/constants/color";

interface GameCompleteProps {
  results: TrialResult[];
  onComplete: (results: TrialResult[]) => void;
}

export const GameComplete: React.FC<GameCompleteProps> = ({ results, onComplete }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HeadingLargeText style={styles.heading}>{t("flankerGame.complete")}</HeadingLargeText>
        <BodyMediumText style={styles.subtext}>{t("flankerGame.completeMessage")}</BodyMediumText>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => onComplete(results)}
          testID="test:id/flanker-game-complete-continue-button"
        >
          <BodyLargeText style={styles.playButtonText}>{t("flankerGame.continue")}</BodyLargeText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    textAlign: "center",
  },
  playButton: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 40,
    backgroundColor: COLOR.AMBER[500],
  },
  playButtonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
