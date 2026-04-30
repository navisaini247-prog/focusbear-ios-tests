import React, { memo, useCallback, useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { BodySmallText, BodyXSmallText, HeadingSmallText, ScalableIcon, Tooltip } from "@/components";
import Animated, { SharedValue, useAnimatedStyle } from "react-native-reanimated";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { Screens as RoutineInfoScreens } from "./RoutineInfoModal";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useRoutineTheme } from "../hooks/use-routine-theme";
import { getSplitDateTime, isBetweenDates } from "@/utils/TimeMethods";
import { clampFontScale } from "@/utils/FontScaleUtils";
import moment from "moment";
import { NAVIGATION } from "@/constants";
import type { ActivityType } from "@/types/Routine";
import type { FormattedActivity, FormattedRoutine } from "@/hooks/use-routine-data";
import type { ScreenNavigationProp } from "@/navigation/AppNavigator";
import { ACTIVITY_TYPE } from "@/constants/routines";
import { useDispatch, useSelector } from "react-redux";
import { setRoutineOptionsToolTip } from "@/actions/GlobalActions";
import { showRoutineOptionsToolTipSelector } from "@/selectors/GlobalSelectors";
import { useIsHabitsTabFocused } from "./HomeTabContext";

const ROUTINE_PILL_HEIGHT = 26;

interface RoutineSectionHeaderProps extends FormattedRoutine {
  animation: SharedValue<number>;
  appearsExpanded: boolean;
  visibleActivities: FormattedActivity[];
  completedCount: number;
  onPress: () => void;
  openRoutineInfoModal: (id: string, screen: RoutineInfoScreens) => void;
  disabled: boolean;
}

export const RoutineSectionHeader = memo(function RoutineSectionHeader({
  animation,
  appearsExpanded,
  visibleActivities,
  completedCount,
  onPress,
  openRoutineInfoModal,
  disabled,
  ...routine
}: RoutineSectionHeaderProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { id, name, activities, start_time, end_time, activity_sequence_id } = routine;
  const { isCompleted, isAvailable, type } = routine;

  const isEmpty = activities.length === 0;
  const isCustomRoutine = type === ACTIVITY_TYPE.STANDALONE;

  const scheduleStatusText = (() => {
    if (isCompleted) return null;
    if (!start_time || !end_time) return null;
    const startTime = getSplitDateTime(start_time);
    const endTime = getSplitDateTime(end_time);
    const now = Date.now();

    const isScheduledNow = isBetweenDates(startTime, endTime);
    const isBeforeStartTime = startTime.getTime() > now;
    const isAfterEndTime = endTime.getTime() < now;

    if (isScheduledNow) {
      if (!isAvailable) return t("home.unavailable");
      return t("home.inProgress");
    }
    if (isBeforeStartTime) return t("home.startsAt", { time: moment(startTime).format("LT") });
    if (isAfterEndTime) return t("home.passed");
  })();

  const activitiesStatusText = (() => {
    if (isCompleted) return t("overview.routineCompletedShort");
    if (completedCount > 0) return t("home.completedWithCount", { count: completedCount });
    if (!isAvailable) return null;
    if (isEmpty) return t("common.empty");
    if (visibleActivities.length === 0) return null;
    return t("home.habitsCount", { count: visibleActivities.length });
  })();

  const leftAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - animation.value) * 8 }],
  }));

  const rightAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - animation.value) * -8 }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.5}
      hitSlop={8}
      testID={`test:id/routine-${isCustomRoutine ? `custom-${routine.name}` : routine.type}`}
    >
      <View style={[styles.container, styles.gap6]}>
        <View style={[styles.row, appearsExpanded ? styles.gap8 : styles.gap24]}>
          {/* Left side */}
          <Animated.View style={[styles.flex, styles.row, styles.gap4, leftAnimatedStyle]}>
            <RoutinePill type={type} name={name} isAvailable={isAvailable} />

            <MaterialIcon name={appearsExpanded ? "expand-more" : "chevron-right"} color={colors.subText} size={20} />
          </Animated.View>

          {/* Right side */}
          <Animated.View style={[styles.row, styles.gap12, rightAnimatedStyle]}>
            {appearsExpanded && <AddActivityButton activitySequenceId={activity_sequence_id} type={type} />}

            <OptionsButton id={id} type={type} openRoutineInfoModal={openRoutineInfoModal} />
          </Animated.View>
        </View>

        {/* Collapsed row*/}
        {!appearsExpanded && (
          <View style={styles.collapsedRow}>
            <BodyXSmallText color={colors.subText} numberOfLines={1} weight="300">
              {[activitiesStatusText, scheduleStatusText].filter(Boolean).join(" · ")}
            </BodyXSmallText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

interface RoutinePillProps {
  type: ActivityType;
  name: string;
  isAvailable?: boolean;
}

export const RoutinePill = memo(function RoutinePill({ type, name, isAvailable }: RoutinePillProps) {
  const { colors } = useTheme();
  const pillHeight = ROUTINE_PILL_HEIGHT * clampFontScale(useWindowDimensions().fontScale);

  const { icon, color: pillColor } = useRoutineTheme(type);
  const pillOpacity = isAvailable ? 1 : 0.5;

  return (
    <View
      style={[
        [styles.routinePill, styles.row, styles.gap8],
        { height: pillHeight, backgroundColor: pillColor, opacity: pillOpacity },
      ]}
      renderToHardwareTextureAndroid
    >
      {icon && <ScalableIcon name={icon} color={colors.white} size={14} />}

      <HeadingSmallText
        numberOfLines={1}
        size={13}
        style={styles.routineText}
        weight={isAvailable ? "700" : "300"}
        color={colors.white}
      >
        {name.toUpperCase()}
      </HeadingSmallText>
    </View>
  );
});

interface OptionsButtonProps {
  id: string;
  type: ActivityType;
  openRoutineInfoModal: RoutineSectionHeaderProps["openRoutineInfoModal"];
}

const OptionsButton = memo(function OptionsButton({ id, type, openRoutineInfoModal }: OptionsButtonProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const shouldShowToolTip = useSelector(showRoutineOptionsToolTipSelector);
  const isHabitsTabFocused = useIsHabitsTabFocused();

  const [tooltipVisible, setTooltipVisible] = useState(false);

  const dismissTooltip = useCallback(() => {
    dispatch(setRoutineOptionsToolTip(false));
    setTooltipVisible(false);
  }, [dispatch]);

  const onPressOptions = useCallback(() => {
    dismissTooltip();
    openRoutineInfoModal(id, RoutineInfoScreens.RoutineOptions);
  }, [dismissTooltip, id, openRoutineInfoModal]);

  const showHint = shouldShowToolTip && type === ACTIVITY_TYPE.MORNING && isHabitsTabFocused;

  useEffect(() => {
    if (!showHint) return;
    const timer = setTimeout(() => setTooltipVisible(true), 600);
    return () => clearTimeout(timer);
  }, [showHint]);

  useEffect(() => {
    if (!isHabitsTabFocused) {
      setTooltipVisible(false);
    }
  }, [isHabitsTabFocused]);

  const button = (
    <TouchableOpacity
      style={styles.routineOptionsButton}
      hitSlop={8}
      onPress={onPressOptions}
      testID="test:/routine-options"
    >
      <Icon name="ellipsis-horizontal" size={18} color={colors.subText} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.optionsButtonContainer}>
      <Tooltip
        actionType="none"
        isVisible={tooltipVisible}
        setIsVisible={(visible) => {
          setTooltipVisible(visible);
          if (!visible) {
            dispatch(setRoutineOptionsToolTip(false));
          }
        }}
        onClose={() => dispatch(setRoutineOptionsToolTip(false))}
        popover={<BodyXSmallText color={colors.text}>{t("home.routineOptionsTooltip")}</BodyXSmallText>}
        width="72%"
        height={null}
      >
        {button}
      </Tooltip>
    </View>
  );
});

interface AddActivityButtonProps {
  activitySequenceId: string;
  type: ActivityType;
}

const AddActivityButton = memo(function AddActivityButton({ activitySequenceId, type }: AddActivityButtonProps) {
  const navigation = useNavigation<ScreenNavigationProp>();
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.addActivityButton, { backgroundColor: colors.separator }]}
      hitSlop={8}
      onPress={() => navigation.navigate(NAVIGATION.HabitSetting, { activitySequenceId, activityType: type } as any)}
      testID="test:/add-activityy"
    >
      <MaterialIcon name="add" size={20} color={colors.subText} />
    </TouchableOpacity>
  );
});

interface NoActivitiesPlaceholderProps extends FormattedRoutine {
  openRoutineInfoModal: RoutineSectionHeaderProps["openRoutineInfoModal"];
}

export const NoActivitiesPlaceholder = memo(function NoActivitiesPlaceholder({
  openRoutineInfoModal,
  ...routine
}: NoActivitiesPlaceholderProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { activities, isAvailable, isCompleted } = routine;
  const isEmpty = activities.length === 0;

  const descriptionText = (() => {
    if (isCompleted) return t("overview.routineCompletedMessage");
    if (isEmpty) {
      if (isAvailable) return t("home.noHabitsYetAddPrompt");
      return t("home.routineIsEmpty");
    }
    return t("home.allHabitsHidden");
  })();

  return (
    <View style={[styles.flex, styles.emptyRoutineContent]}>
      {isCompleted || isEmpty ? (
        <BodySmallText color={colors.subText} center>
          {descriptionText}
        </BodySmallText>
      ) : (
        <TouchableOpacity
          onPress={() => openRoutineInfoModal(routine.id, RoutineInfoScreens.UnavailableActivities)}
          hitSlop={16}
          testID="test:/show-unavailable-activities"
        >
          <BodySmallText color={colors.subText} center>
            {descriptionText}...
          </BodySmallText>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap4: { gap: 4 },
  gap6: { gap: 6 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  gap24: { gap: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  container: {
    paddingVertical: 8,
    paddingRight: 4,
  },
  collapsedRow: {
    paddingHorizontal: 12,
  },
  routineOptionsButton: {
    padding: 3,
  },
  optionsButtonContainer: {
    position: "relative",
  },
  addActivityButton: {
    padding: 3,
    borderRadius: 100,
  },
  emptyRoutineContent: {
    justifyContent: "center",
  },
  routinePill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    flexShrink: 1,
  },
  routineText: {
    letterSpacing: 0.4,
  },
});
