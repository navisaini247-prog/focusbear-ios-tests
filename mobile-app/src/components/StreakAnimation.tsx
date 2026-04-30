import React, { useEffect } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { HeadingLargeText, BodyMediumText, Modal, Card } from "@/components";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { triggerHaptics, HapticTypes } from "react-native-turbo-haptics";
import { hideStreakCelebrationModal } from "@/actions/ModalActions";
import { useDispatch, useSelector } from "react-redux";
import {
  isStreakCelebrationModalVisibleSelector,
  streakCelebrationCountSelector,
  streakCelebrationTypeSelector,
} from "@/selectors/ModalSelectors";
import { useStreakCelebration } from "@/hooks/use-streak-celebration";
import { useTheme } from "@react-navigation/native";

export const StreakAnimation = () => {
  const { t } = useTranslation();
  const { colors, shadowStyles } = useTheme();
  const dispatch = useDispatch();

  const isVisible = useSelector(isStreakCelebrationModalVisibleSelector);
  const streakType = useSelector(streakCelebrationTypeSelector);
  const streakCount = useSelector(streakCelebrationCountSelector);

  useStreakCelebration();

  const animation = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      triggerHaptics(HapticTypes.notificationSuccess);
      animation.value = withRepeat(withTiming(Math.PI * 2, { duration: 2000, easing: Easing.linear }), 0);
    }
  }, [isVisible]);

  const flameAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1.05 + Math.sin(animation.value) * 0.05 }],
  }));
  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.5 - Math.sin(animation.value) * 0.1,
  }));

  return (
    <Modal isVisible={isVisible} onCancel={() => dispatch(hideStreakCelebrationModal())}>
      <Card style={styles.container}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => dispatch(hideStreakCelebrationModal())}
          hitSlop={16}
          testID="test:id/streak-animation-close"
        >
          <Icon name="close" color={colors.subText} size={32} />
        </TouchableOpacity>

        <View>
          <View style={styles.glowContainer}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }, glowAnimatedStyle]} />

            <Animated.View style={flameAnimatedStyle}>
              <MaterialIcon name="whatshot" size={100} style={styles.icon} color={colors.primaryBorder} />
            </Animated.View>
          </View>

          <Card
            style={[
              styles.streakBadge,
              shadowStyles.bigShadow,
              { backgroundColor: colors.primary, borderColor: colors.primaryBorder },
            ]}
          >
            <HeadingLargeText color={colors.white} weight="700">{`${streakCount} `}</HeadingLargeText>
            <BodyMediumText color={colors.white}>
              {streakCount === 1 ? t("streakCelebration.day") : t("streakCelebration.days")}
            </BodyMediumText>
          </Card>
        </View>

        <HeadingLargeText center>
          {t("streakCelebration.title", { streakTypeName: t("streakCelebration." + streakType) })}
        </HeadingLargeText>

        <BodyMediumText center color={colors.subText}>
          {t("streakCelebration.message")}
        </BodyMediumText>
      </Card>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "90%",
    alignSelf: "center",
    borderRadius: 32,
    padding: 32,
    paddingVertical: 48,
    gap: 12,
    alignItems: "center",
  },
  glowContainer: {
    borderRadius: 100,
    overflow: "hidden",
  },
  icon: {
    padding: 24,
    textAlign: "center",
    textAlignVertical: "center",
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    alignSelf: "center",
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    top: -16,
  },
  closeButton: {
    position: "absolute",
    alignSelf: "flex-end",
    top: 16,
    right: 16,
  },
});
