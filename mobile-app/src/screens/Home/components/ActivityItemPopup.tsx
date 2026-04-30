import React, { useEffect, useState } from "react";
import { StyleSheet, Modal, View, TouchableWithoutFeedback, useWindowDimensions, TouchableOpacity } from "react-native";
import { BodyMediumText, Checkmark, Group, Button, ScalableIcon, Card, BodyXSmallText } from "@/components";
import { DeleteHabitConfirmationModal } from "./DeleteHabitConfirmationModal";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { CountdownCircleTimer, ColorFormat } from "react-native-countdown-circle-timer";
import { triggerHaptics, HapticTypes } from "react-native-turbo-haptics";
import { useTheme } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { onActivityStart, skipActivity } from "@/actions/ActivityActions";
import { setActivityAutostartEnabled } from "@/actions/UserActions";
import { activityAutostartEnabledSelector } from "@/selectors/UserSelectors";
import { showHabitLimitAlert } from "./RoutineActivities";
import { clampFontScale } from "@/utils/FontScaleUtils";
import { NAVIGATION } from "@/constants";
import { TAKE_LOGS } from "@/utils/Enums";
import { ACTIVITY_CARD_HEIGHT, ActivityItemCard, ActivityItemCardProps } from "./ActivityItem";
import type { TransformsStyle } from "react-native";
import { Activity } from "@/types/Routine";
import type { FormattedActivity } from "@/hooks/use-routine-data";
import type { ScreenNavigationProp } from "@/navigation/AppNavigator";

export type ItemLayout = { x?: number; y?: number; width?: number };

const CLOSE_ANIM_DURATION = 200;

interface ActivityPopupProps {
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
  activity: (Activity & Partial<FormattedActivity>) | null;
  itemLayout: SharedValue<ItemLayout>;
  onPressEdit?: (activity: Activity) => void;
  onPressDelete?: (activity: Activity) => void;
  enableQuickDelete?: boolean;
  itemProps?: Partial<ActivityItemCardProps>;
}

export const ActivityItemPopup = React.memo(function ActivityItemPopup({
  isVisible,
  setIsVisible,
  activity,
  itemLayout,
  onPressEdit,
  onPressDelete,
  enableQuickDelete,
  itemProps,
}: ActivityPopupProps) {
  const { colors, shadowStyles } = useTheme();
  const { height: screenHeight, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation<ScreenNavigationProp>();
  const dispatch = useDispatch();
  const activityItemHeight = ACTIVITY_CARD_HEIGHT * clampFontScale(fontScale) + 8;

  const animation = useSharedValue(0);
  const deleteAnimation = useSharedValue(0);
  const menuHeight = useSharedValue(250);

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  // These properties won't exist if passed a plain Activity object (i.e. from an edit routine screen)
  // `canStartActivity` should be false in that case.
  const { isLocked, isAvailable, isRoutineAvailable, isCompleted } = activity || {};
  const canStartActivity = !isCompleted && isAvailable && isRoutineAvailable;

  useEffect(() => {
    if (isVisible) {
      animation.value = withSpring(1, { mass: 1 });
      deleteAnimation.value = 0;
    } else if (!isVisible) {
      animation.value = 0;
    }
  }, [isVisible, animation, deleteAnimation]);

  const closeModal = () => {
    // Closes the modal with animation
    // If navigating, just call setIsVisible(false) instead to hide the modal immediately
    animation.value = withSpring(0, { duration: CLOSE_ANIM_DURATION });
    setTimeout(() => setIsVisible(false), CLOSE_ANIM_DURATION);
  };

  const closeModalWithDeletion = () => {
    animation.value = withSpring(0, { duration: CLOSE_ANIM_DURATION }, () => {
      deleteAnimation.value = withSpring(1, { duration: CLOSE_ANIM_DURATION });
    });
    setTimeout(() => {
      setIsVisible(false);
      onPressDelete?.(activity);
    }, CLOSE_ANIM_DURATION * 2);
  };

  const onPressStart = async () => {
    if (isLocked) return showHabitLimitAlert(navigation);

    setIsVisible(false);
    navigation.navigate(NAVIGATION.RoutineDetail, { item: activity } as any);
    onActivityStart(activity);
  };

  const onPressSkip = async (didAlready: boolean) => {
    if (isLocked) return showHabitLimitAlert();

    triggerHaptics(HapticTypes.impactMedium);

    dispatch(skipActivity(activity, didAlready));

    // If item has note taking or log quantity enabled, navigate to CompleteScreen
    const hasNotesOrLogQuanity = Boolean(activity?.take_notes === TAKE_LOGS.END_OF_ACTIVITY || activity?.log_quantity);

    if (didAlready && hasNotesOrLogQuanity) {
      setIsVisible(false);
      navigation.replace(NAVIGATION.CompleteScreen, { item: activity, didAlready } as any);
    } else {
      closeModal();
    }
  };

  const backdropAnimatedStyle = useAnimatedStyle(() => ({ opacity: animation.value }));

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const { x = 16, y = screenHeight / 2, width = 350 } = itemLayout.value;
    const clampedTranslateY = Math.min(y, screenHeight - activityItemHeight - menuHeight.value - insets.bottom);
    return {
      width,
      transform: [
        { translateX: x },
        { translateY: interpolate(animation.value, [0, 1], [y, clampedTranslateY]) },
      ] as TransformsStyle["transform"],
      opacity: 1 - deleteAnimation.value,
    };
  });

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.8 + 0.2 * animation.value }],
    opacity: interpolate(animation.value, [0.2, 0.8], [0, 1]),
  }));

  return (
    <Modal visible={isVisible} transparent statusBarTranslucent onRequestClose={closeModal}>
      <TouchableWithoutFeedback onPress={closeModal}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, backdropAnimatedStyle]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.container, containerAnimatedStyle]} pointerEvents="box-none">
        <View pointerEvents="none">
          <ActivityItemCard {...itemProps} {...activity} />
        </View>

        <Animated.View
          style={[styles.menuContainer, styles.gap8, menuAnimatedStyle]}
          onLayout={(event) => menuHeight.set(event.nativeEvent.layout.height)}
        >
          <Group>
            {canStartActivity && (
              <Group>
                <Card
                  style={[
                    styles.startButtonContainer,
                    { backgroundColor: colors.secondary, borderColor: colors.secondaryBorder },
                  ]}
                >
                  <Button
                    primary
                    title={t("common.start")}
                    style={[styles.startButton, shadowStyles.shadow]}
                    renderLeftIcon={<ScalableIcon name="play" color={colors.white} size={20} />}
                    onPress={onPressStart}
                    testID="test:id/start-activity"
                  />

                  {canStartActivity && (
                    <ActivityAutoStart onPressStart={onPressStart} isDeleteModalVisible={isDeleteModalVisible} />
                  )}
                </Card>

                <Button style={styles.menuItem} onPress={() => onPressSkip(true)} testID="test:id/skip-activity-done">
                  <View style={styles.checkmarkContainer}>
                    <Checkmark color={colors.subText} value={true} />
                  </View>
                  <BodyMediumText>{t("common.done")}</BodyMediumText>
                </Button>

                <Button style={styles.menuItem} onPress={() => onPressSkip(false)} testID="test:id/skip-activity">
                  <ScalableIcon name="play-skip-forward" color={colors.subText} size={20} />
                  <BodyMediumText>{t("common.skip")}</BodyMediumText>
                </Button>
              </Group>
            )}

            <Button
              style={styles.menuItem}
              onPress={() => {
                setIsVisible(false);
                onPressEdit ? onPressEdit(activity) : navigation.navigate(NAVIGATION.HabitSetting, { activity } as any);
              }}
              testID="test:id/edit-activity"
            >
              <ScalableIcon name="edit" iconType="MaterialIcons" color={colors.subText} size={20} />
              <BodyMediumText>{t("common.edit")}</BodyMediumText>
            </Button>

            <Button
              style={styles.menuItem}
              onPress={() => (enableQuickDelete ? closeModalWithDeletion() : setIsDeleteModalVisible(true))}
              testID="test:id/delete-activity"
            >
              <BodyMediumText color={colors.danger}>{t("common.delete")}</BodyMediumText>
            </Button>
          </Group>
        </Animated.View>
      </Animated.View>

      <DeleteHabitConfirmationModal
        visible={isDeleteModalVisible}
        setIsVisible={setIsDeleteModalVisible}
        activity={activity}
        // avoid closing 2 modals simultaneously
        onConfirm={onPressDelete && (() => setTimeout(closeModalWithDeletion, 100))}
        onDeleteSuccess={() => setTimeout(closeModal, 100)}
      />
    </Modal>
  );
});

const ActivityAutoStart = ({
  onPressStart,
  isDeleteModalVisible,
}: {
  onPressStart: () => void;
  isDeleteModalVisible: boolean;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [countdown, setCountdown] = useState(5);

  const isEnabled = useSelector(activityAutostartEnabledSelector);

  return (
    <TouchableOpacity
      onPress={() => dispatch(setActivityAutostartEnabled(!isEnabled))}
      style={[styles.autostartContainer, styles.row, styles.gap8]}
      hitSlop={4}
      testID="test:id/toggle-habit-autostart"
    >
      {isEnabled && !isDeleteModalVisible && (
        <CountdownCircleTimer
          duration={5}
          isPlaying
          onUpdate={(value) => setCountdown(value)}
          onComplete={onPressStart}
          colors={colors.text as ColorFormat}
          trailColor={colors.border as ColorFormat}
          trailStrokeWidth={3}
          strokeWidth={3}
          size={12}
          updateInterval={0.2}
        />
      )}

      <BodyXSmallText style={styles.flex} color={isEnabled ? colors.text : colors.subText}>
        {isEnabled ? t("habit.habitAutoStart", { countdown }) : t("habit.autostart")}
      </BodyXSmallText>

      <View style={{ transform: [{ rotate: isEnabled ? "0deg" : "180deg" }] }}>
        <ScalableIcon name="toggle" size={22} color={isEnabled ? colors.text : colors.subText} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap8: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  container: {
    gap: 8,
    paddingBottom: 12,
  },
  menuContainer: {
    alignSelf: "flex-start",
    minWidth: "55%",
    transformOrigin: "top left",
    borderRadius: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
  },
  startButtonContainer: {
    padding: 4,
  },
  startButton: {
    borderRadius: 12,
  },
  checkmarkContainer: {
    padding: 1.5,
  },
  autostartContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingVertical: 4,
  },
});
