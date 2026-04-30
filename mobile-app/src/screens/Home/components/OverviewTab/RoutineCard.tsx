import React, { useState, useCallback, useMemo, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { HeadingLargeText, HeadingSmallText, BodyMediumText, ScalableIcon } from "@/components";
import { ACTIVITY_CARD_HEIGHT, ActivityItemButton } from "../ActivityItem";
import { ActivityItemPopup, ItemLayout } from "../ActivityItemPopup";
import { Trans, useTranslation } from "react-i18next";
import { useSharedValue } from "react-native-reanimated";
import { useHomeContext } from "../../context";
import { useTheme } from "@react-navigation/native";
import { clampFontScale } from "@/utils/FontScaleUtils";
import { postHogCapture } from "@/utils/Posthog";
import { isEmpty } from "lodash";
import { triggerHaptics } from "react-native-turbo-haptics";
import { ACTIVITY_TYPE } from "@/constants/routines";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import type { FormattedActivity, FormattedRoutine } from "@/hooks/use-routine-data";

interface RoutineCardProps {
  onPressViewAll: () => void;
}

export const RoutineCard: React.FC<RoutineCardProps> = ({ onPressViewAll }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { routineData } = useHomeContext() as { routineData: FormattedRoutine[] };

  const [selectedActivity, setSelectedActivity] = useState<FormattedActivity | null>(null);
  const [isActivityPopupVisible, setIsActivityPopupVisible] = useState(false);
  const selectedItemLayout = useSharedValue({});

  const currentRoutine = routineData.find((routine) => routine.isAvailable);
  const activities = (currentRoutine?.activities || []).filter((activity) => activity.isAvailable);
  const isRoutineCompleted = currentRoutine?.isCompleted;

  const allRoutinesEmpty = useMemo(() => isEmpty(routineData.flatMap((routine) => routine.activities)), [routineData]);

  // Find the first three that are not completed or deleted, record their original index
  const firstThree = activities.filter((item) => !item.isCompleted).slice(0, 3);
  const totalCount = activities.length;
  const completedCount = activities.filter((activity) => activity.isCompleted).length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isRoutineEmpty = totalCount === 0;

  const onItemPress = useCallback(
    async (activity: FormattedActivity, pendingItemLayout: Promise<ItemLayout>) => {
      triggerHaptics("soft");
      postHogCapture(POSTHOG_EVENT_NAMES.EXPAND_HABIT, { habitId: activity.id, activityType: activity.activity_type });

      // Continue even if the .measure callback somehow doesn't resolve in under 500ms
      const itemLayout = await Promise.race([pendingItemLayout, new Promise((resolve) => setTimeout(resolve, 500))]);
      setSelectedActivity(activity);
      setIsActivityPopupVisible(true);
      selectedItemLayout.set(itemLayout || {});
    },
    [selectedItemLayout],
  );

  const routineHeading = (() => {
    if (currentRoutine?.type === ACTIVITY_TYPE.MORNING) {
      return t("overview.morningRoutine");
    } else if (currentRoutine?.type === ACTIVITY_TYPE.EVENING) {
      return t("overview.eveningRoutine");
    }
    return currentRoutine?.name || t("habitSetting.routine");
  })();

  return (
    <View style={styles.gap12}>
      <View style={[styles.containerPadding, styles.gap8]}>
        <View style={styles.headerContainer}>
          <View style={styles.headerTitle}>
            <HeadingLargeText weight="700">{routineHeading}</HeadingLargeText>
          </View>
          <TouchableOpacity
            hitSlop={12}
            style={[styles.row, styles.gap4]}
            onPress={() => onPressViewAll()}
            testID="test:id/routine-card-view-all"
          >
            <HeadingSmallText style={{ color: colors.primary }}>{t("common.viewAll")}</HeadingSmallText>
            <ScalableIcon name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {isRoutineCompleted && (
          <BodyMediumText style={{ color: colors.primary }}>{t("overview.routineCompletedShort")}</BodyMediumText>
        )}
      </View>

      {/* Progress - only show if not empty and not completed */}
      {!isRoutineEmpty && !isRoutineCompleted && (
        <View style={[styles.containerPadding, styles.row, styles.gap8]}>
          <BodyMediumText style={{ color: colors.subText }}>
            {t("overview.routineProgress", { completed: completedCount, total: totalCount })}
          </BodyMediumText>
          <View style={[styles.progressBar, styles.flex, { backgroundColor: colors.separator }]}>
            <View style={[styles.progressBar, { width: `${progressPct}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>
      )}

      {allRoutinesEmpty ? (
        <View style={styles.emptyContainer}>
          <BodyMediumText center color={colors.subText}>
            <Trans
              i18nKey="overview.noHabitsCta"
              components={{
                bold: <BodyMediumText weight="700" onPress={() => onPressViewAll()} color={colors.primary} />,
              }}
            />
          </BodyMediumText>
        </View>
      ) : isRoutineCompleted ? (
        <View style={styles.emptyContainer}>
          <HeadingSmallText center color={colors.subText}>
            {t("overview.routineCompletedMessage")}
          </HeadingSmallText>
        </View>
      ) : (
        !isRoutineEmpty && (
          <View style={styles.containerPadding}>
            {firstThree.map((item) => (
              <ActivityItem
                key={item.id}
                onItemPress={onItemPress}
                isSelected={isActivityPopupVisible && selectedActivity.id === item.id}
                {...item}
              />
            ))}
          </View>
        )
      )}

      <ActivityItemPopup
        isVisible={isActivityPopupVisible}
        setIsVisible={setIsActivityPopupVisible}
        activity={selectedActivity}
        itemLayout={selectedItemLayout}
      />
    </View>
  );
};

interface ActivityItemProps extends FormattedActivity {
  onItemPress: (activity: FormattedActivity, pendingItemLayout: Promise<ItemLayout>) => void;
  isSelected: boolean;
}

const ActivityItem = ({ onItemPress, isSelected, ...activity }: ActivityItemProps) => {
  const containerRef = useRef<View>(null);

  const cardHeight = ACTIVITY_CARD_HEIGHT * clampFontScale(useWindowDimensions().fontScale);

  const onPress = useCallback(() => {
    const pendingItemLayout = new Promise((resolve) => {
      containerRef.current?.measure?.((_x, _y, width, _height, pageX, pageY) => resolve({ x: pageX, y: pageY, width }));
    });
    onItemPress(activity, pendingItemLayout);
  }, [activity, onItemPress]);

  return (
    <View style={[styles.activityItemContainer, { height: cardHeight }]} ref={containerRef}>
      {!isSelected && <ActivityItemButton onPress={onPress} {...activity} />}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap4: { gap: 4 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  headerTitle: {
    flexShrink: 1,
    flexGrow: 1,
    minWidth: "50%",
  },
  containerPadding: {
    paddingHorizontal: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  activityItemContainer: {
    marginBottom: 8,
  },
  emptyContainer: {
    padding: 24,
  },
});

export default RoutineCard;
