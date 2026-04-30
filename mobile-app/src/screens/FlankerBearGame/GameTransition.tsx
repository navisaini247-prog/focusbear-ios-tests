import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HeadingLargeText, BodyLargeText } from "@/components";
import { useTranslation } from "react-i18next";
import COLOR from "@/constants/color";
import { useTheme } from "@react-navigation/native";

interface GameTransitionProps {
  onStartMainTrials: () => void;
}

export const GameTransition: React.FC<GameTransitionProps> = ({ onStartMainTrials }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HeadingLargeText style={styles.heading}>{t("flankerGame.practiceComplete")}</HeadingLargeText>
        <View style={styles.explanationContainer}>
          <BodyLargeText style={styles.instructions}>{t("flankerGame.mainInstructions")}</BodyLargeText>
        </View>
        <TouchableOpacity
          style={styles.playButton}
          onPress={onStartMainTrials}
          testID="test:id/flanker-game-start-main-button"
        >
          <BodyLargeText style={styles.playButtonText}>{t("flankerGame.startMain")}</BodyLargeText>
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
