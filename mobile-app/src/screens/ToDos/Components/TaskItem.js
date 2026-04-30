import React, { memo, useState, useMemo, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Button, BodySmallText, HeadingMediumText, BodyXSmallText, Card } from "@/components";
import { TaskCheckbox } from "./TaskCheckbox";
import { Badge } from "./EditTaskComponents";
import Icon from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { triggerHaptics, HapticTypes } from "react-native-turbo-haptics";
import { useTheme } from "@react-navigation/native";
import { TASK_STATUS, getTOPScore } from "@/utils/toDos";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { useDispatch } from "react-redux";
import { tasksSelector } from "@/selectors/UserSelectors";
import { store } from "@/store";
import { showTaskModal } from "@/actions/ModalActions";
import { formatDateFromNow } from "@/utils/TimeMethods";
import { updateTask } from "@/actions/UserActions";
import { addInfoLog } from "@/utils/FileLogger";
import { postHogCapture } from "@/utils/Posthog";
import { runOnJS } from "react-native-worklets";
import { useTranslation } from "react-i18next";

const { NOT_STARTED, IN_PROGRESS, COMPLETED, DRAFT } = TASK_STATUS;
const SWIPE_ACTION_THRESHOLD = 100;
const LEFT = "LEFT";
const RIGHT = "RIGHT";

const getTaskIndex = (taskId) => tasksSelector(store.getState()).findIndex((task) => task.id === taskId);

export const TaskItem = memo(function TaskItem({
  showTags,
  showStatus,
  enableSwipe,
  expandedSectionsRef,
  openRescheduleModal,
  ...task
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();

  const { id, title, status, due_date, subtasks, tags } = task;

  const [isChecked, setIsChecked] = useState(status === COMPLETED);
  const index = useMemo(() => getTaskIndex(id), [id]); // index is used for testIDs
  const isDraft = status === DRAFT;
  const roundedTopScore = Math.round(getTOPScore(task));

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const actionThresholdMet = useSharedValue(false);

  useEffect(() => {
    setIsChecked(status === COMPLETED);
  }, [status]);

  const subtaskText = useMemo(() => {
    if (!subtasks || subtasks.length === 0) {
      return null;
    }
    const completedSubtasks = subtasks.filter((subtask) => subtask.is_completed);
    return `${completedSubtasks.length}/${subtasks.length}`;
  }, [subtasks]);

  const statusText = {
    [NOT_STARTED]: t("toDos.notStarted"),
    [IN_PROGRESS]: t("toDos.inProgress"),
  }[status];

  const toggleTask = () => {
    const newStatus = isChecked ? NOT_STARTED : COMPLETED;
    const isCompleted = newStatus === COMPLETED;
    triggerHaptics(HapticTypes.impactMedium);

    if (isCompleted) postHogCapture(POSTHOG_EVENT_NAMES.TODOS_COMPLETE_TASK);

    // Update the item internal state (checkbox/strikethrough)
    setIsChecked(isCompleted);

    // Update list state
    const delay = isCompleted ? 150 : 0; // delay for tick-off animation
    setTimeout(() => {
      try {
        // Animated fade-out if item will no longer be rendered (i.e. if destination section is collapsed)
        if (!expandedSectionsRef || !expandedSectionsRef.current.includes(newStatus)) {
          opacity.value = withTiming(0, { duration: 200 });
          setTimeout(() => dispatch(updateTask({ ...task, status: newStatus })), 150); // delay for fade-out animation
        } else {
          dispatch(updateTask({ ...task, status: newStatus }));
        }
      } catch (error) {
        addInfoLog(`Toggle task error: ${error}`);
      }
    }, delay);
  };

  const swipeActions = useMemo(
    () => ({
      [RIGHT]: {
        title: t("toDos.reschedule"),
        icon: "calendar",
        onPress: () => openRescheduleModal(task.id),
      },
      [LEFT]: {
        title: status === IN_PROGRESS ? t("toDos.notStarted") : t("toDos.inProgress"),
        icon: `arrow-${status === IN_PROGRESS ? "down" : "up"}-circle`,
        onPress: () => {
          const newStatus = status === IN_PROGRESS ? NOT_STARTED : IN_PROGRESS;
          dispatch(updateTask({ ...task, status: newStatus }));
          Toast.show({
            text1: t("toDos.taskMovedToast", {
              status: (newStatus === IN_PROGRESS ? t("toDos.inProgress") : t("toDos.notStarted")).toLowerCase(),
            }),
            type: "info",
          });
        },
      },
    }),
    [dispatch, status, task, openRescheduleModal, t],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(Boolean(enableSwipe))
        .activeOffsetX([-10, 10])
        .failOffsetY([-5, 5])
        .onUpdate((event) => {
          // Swipe animation
          const dxUnderThreshold = Math.min(Math.abs(event.translationX), SWIPE_ACTION_THRESHOLD);
          const dxOverThreshold = Math.max(Math.abs(event.translationX) - SWIPE_ACTION_THRESHOLD, 0);
          translateX.value =
            Math.sign(event.translationX) * (dxUnderThreshold + (dxOverThreshold * 20) / (dxOverThreshold + 20));

          // Haptics
          const thresholdMet = Math.abs(event.translationX) > SWIPE_ACTION_THRESHOLD;
          const prevThresholdMet = actionThresholdMet.value;

          if (thresholdMet && !prevThresholdMet) triggerHaptics(HapticTypes.impactMedium);
          actionThresholdMet.value = thresholdMet;
        })
        .onEnd((event) => {
          if (actionThresholdMet.value) {
            const swipeAction = swipeActions[event.translationX < 0 ? LEFT : RIGHT];
            runOnJS(swipeAction.onPress)();
          }
          translateX.value = withSpring(0);
          actionThresholdMet.value = false;
        }),
    [actionThresholdMet, enableSwipe, swipeActions, translateX],
  );

  const itemAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.itemContainer, { backgroundColor: colors.separator }]}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={itemAnimatedStyle}>
          {enableSwipe && (
            <View style={styles.swipeUnderlay}>
              {Object.values(swipeActions).map(({ icon, title: actionTitle }, actionIndex) => (
                <View key={actionIndex} style={styles.swipeIcon}>
                  <Icon name={icon} size={20} color={colors.text} />
                  <BodyXSmallText>{actionTitle}</BodyXSmallText>
                </View>
              ))}
            </View>
          )}

          <Button
            subtle
            onPress={() => dispatch(showTaskModal({ taskId: id }))}
            style={[styles.row, styles.gap12, styles.item]}
            testID={`test:id/task-item-${index}`}
          >
            <Pressable disabled={isDraft} onPress={toggleTask} hitSlop={12} testID={`test:id/task-checkbox-${index}`}>
              <TaskCheckbox small value={isChecked} />
            </Pressable>

            <View style={[styles.gap4, styles.flex]}>
              <View style={[styles.row, styles.gap4]}>
                <View style={styles.flex}>
                  <HeadingMediumText size={15} style={isChecked && styles.strikeThrough}>
                    {title}
                  </HeadingMediumText>
                </View>

                {status !== COMPLETED && <Badge value={roundedTopScore} style={styles.TOPBadge} />}
              </View>

              <View style={[styles.row, styles.gap4]}>
                <View style={[styles.row, styles.flex, styles.gap12]}>
                  {due_date && <BodySmallText color={colors.subText}>{formatDateFromNow(due_date)}</BodySmallText>}

                  {subtaskText && (
                    <View style={[styles.row, styles.gap2]}>
                      <Icon name="checkmark" size={12} color={colors.border} />
                      <BodySmallText color={colors.subText}>{subtaskText}</BodySmallText>
                    </View>
                  )}

                  {showTags && Boolean(tags?.length) && (
                    <View style={[styles.row, styles.flexShrink, styles.gap4]}>
                      <Card noPadding style={styles.tag}>
                        <BodyXSmallText numberOfLines={1} color={colors.subText}>
                          {tags[0].text}
                        </BodyXSmallText>
                      </Card>
                      {tags.length > 1 && <BodySmallText color={colors.subText}>{`+${tags.length - 1}`}</BodySmallText>}
                    </View>
                  )}
                </View>

                {showStatus && <BodySmallText color={colors.subText}>{statusText}</BodySmallText>}
              </View>
            </View>
          </Button>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  gap2: { gap: 2 },
  gap4: { gap: 4 },
  gap12: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemContainer: {
    marginHorizontal: 16,
    overflow: "hidden",
    borderRadius: 16,
  },
  item: {
    paddingVertical: 10,
  },
  tag: {
    paddingHorizontal: 6,
    borderRadius: 100,
  },
  strikeThrough: {
    textDecorationLine: "line-through",
  },
  swipeUnderlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: -SWIPE_ACTION_THRESHOLD,
  },
  swipeIcon: {
    alignItems: "center",
    minWidth: SWIPE_ACTION_THRESHOLD,
    gap: 4,
  },
});
