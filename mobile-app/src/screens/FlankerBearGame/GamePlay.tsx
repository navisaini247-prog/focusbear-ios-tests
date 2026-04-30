import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { HeadingLargeText, BodyLargeText, BodyMediumText } from "@/components";
import { useTranslation } from "react-i18next";
import { Direction, StimulusType } from "./types";
import COLOR from "@/constants/color";
import Animated, { useAnimatedStyle, interpolateColor } from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";

interface GamePlayProps {
  isPractice: boolean;
  currentTrial: number;
  totalTrials: number;
  showOk: boolean;
  feedback: "correct" | "incorrect" | null;
  isTimeout: boolean;
  feedbackOpacity: Animated.SharedValue<number>;
  currentTrialData: {
    stimulusType: StimulusType;
    correctDirection: Direction;
  };
  onResponse: (direction: Direction) => void;
}

export const GamePlay: React.FC<GamePlayProps> = ({
  isPractice,
  currentTrial,
  totalTrials,
  showOk,
  feedback,
  isTimeout,
  feedbackOpacity,
  currentTrialData,
  onResponse,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: feedbackOpacity.value,
      borderColor: feedback === "correct" ? COLOR.GREEN[500] : COLOR.RED[500],
      backgroundColor: feedback === "correct" ? `${COLOR.GREEN[500]}20` : `${COLOR.RED[500]}20`,
    };
  });

  const leftButtonStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      feedbackOpacity.value,
      [0, 1],
      [COLOR.GRAY[200], feedback === "correct" ? COLOR.GREEN[500] : COLOR.RED[500]],
    );
    return {
      backgroundColor,
    };
  });

  const rightButtonStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      feedbackOpacity.value,
      [0, 1],
      [COLOR.GRAY[200], feedback === "correct" ? COLOR.GREEN[500] : COLOR.RED[500]],
    );
    return {
      backgroundColor,
    };
  });

  const iconColor = showOk ? COLOR.WHITE : COLOR.GRAY[900];

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.topContainer}>
          <View style={styles.testIndexContainer}>
            <BodyMediumText style={styles.testIndex}>
              {t("flankerGame.testProgress", { current: currentTrial + 1, total: totalTrials })}
            </BodyMediumText>
          </View>

          {isPractice && currentTrial === 0 && (
            <BodyLargeText style={styles.instructions}>{t("flankerGame.practiceStart")}</BodyLargeText>
          )}

          {!isPractice && <BodyLargeText style={styles.instructions}>{t("flankerGame.mainStart")}</BodyLargeText>}
        </View>

        <View style={styles.gameArea}>
          {showOk ? (
            <View style={styles.feedbackContainer}>
              <HeadingLargeText style={styles.okText}>
                {isTimeout ? t("flankerGame.timeout") : feedback === "correct" ? "😊" : "😢"}
              </HeadingLargeText>
            </View>
          ) : (
            <View style={styles.bearContainer}>
              {[0, 1, 2, 3, 4].map((position) => {
                const isTarget = position === 2;
                const direction = isTarget
                  ? currentTrialData?.correctDirection
                  : currentTrialData?.stimulusType === "congruent"
                    ? currentTrialData?.correctDirection
                    : currentTrialData?.correctDirection === "left"
                      ? "right"
                      : "left";

                return (
                  <Icon
                    key={position}
                    name={direction === "left" ? "arrow-left" : "arrow-right"}
                    size={32}
                    color={isTarget && !showOk && isPractice ? COLOR.GREEN[500] : colors.subText}
                    style={styles.bear}
                  />
                );
              })}
            </View>
          )}

          <Animated.View style={[styles.feedbackBorder, animatedStyle]} />
        </View>

        <View style={styles.buttonContainer}>
          <Animated.View style={[styles.button, leftButtonStyle]}>
            <TouchableOpacity
              style={styles.buttonTouchable}
              onPress={() => onResponse("left")}
              disabled={showOk}
              testID="test:id/flanker-game-left-button"
            >
              <Icon name="arrow-left" size={32} color={iconColor} />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.button, rightButtonStyle]}>
            <TouchableOpacity
              style={styles.buttonTouchable}
              onPress={() => onResponse("right")}
              disabled={showOk}
              testID="test:id/flanker-game-right-button"
            >
              <Icon name="arrow-right" size={32} color={iconColor} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
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
  instructions: {
    fontSize: 18,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  gameArea: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  feedbackContainer: {
    width: 300,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  bearContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 300,
    height: 120,
  },
  bear: {
    width: 40,
    height: 40,
    marginHorizontal: 8,
  },
  feedbackBorder: {
    position: "absolute",
    borderWidth: 4,
    borderRadius: 10,
    width: "100%",
    height: 120,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  button: {
    borderRadius: 10,
    width: 80,
    height: 80,
    overflow: "hidden",
  },
  buttonTouchable: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  okText: {
    fontSize: 72,
    color: COLOR.GRAY[900],
    fontWeight: "bold",
  },
  testIndexContainer: {
    backgroundColor: COLOR.GRAY[200],
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginTop: 20,
  },
  testIndex: {
    color: COLOR.GRAY[900],
    fontSize: 14,
  },
  topContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: 20,
    gap: 20,
  },
});
