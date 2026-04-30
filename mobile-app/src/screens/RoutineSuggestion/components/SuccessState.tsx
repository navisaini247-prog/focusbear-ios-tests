import React, { useState, useRef } from "react";
import { View, StyleSheet } from "react-native";
import {
  BodyMediumText,
  ConfirmationButton,
  DisplayMediumText,
  AnimatedTabHeader,
  HeadingSmallText,
  ScalableIcon,
  BodySmallText,
} from "@/components";
import { Route, TabViewFlatList } from "@/components/TabViewFlatList";
import { EditActivitiesFlatList } from "@/screens/EditRoutine/components/EditActivitiesFlatList";
import { FloatingAddButton } from "@/screens/Home/components/FloatingAddButton";
import { useTranslation } from "react-i18next";
import { useSharedValue } from "react-native-reanimated";
import { AdjustWithAiModal } from "./AdjustWithAiModal";
import { AiAdjustButton } from "./AiAdjustButton";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { useTheme, useNavigation } from "@react-navigation/native";
import { ActivityType as RoutineTab, RoutineData } from "..";
import { NAVIGATION } from "@/constants";
import { formatTime } from "@/utils/TimeMethods";
import {
  calculateRoutineDataWithModifiedActivity,
  calculateRoutineDataWithAddedActivity,
  calculateRoutineDataWithDeletedActivity,
  calculateRoutineDataWithReorderedActivities,
} from "@/actions/RoutineActions";
import type { Activity } from "@/types/Routine";

const routes: Route[] = [
  { key: RoutineTab.MORNING, titleKey: "routineSuggestion.morningRoutine", testID: "test:id/morning-tab" },
  { key: RoutineTab.EVENING, titleKey: "routineSuggestion.eveningRoutine", testID: "test:id/evening-tab" },
];

const getTotalSeconds = (activities: Activity[]): number => {
  return activities.reduce((sum, activity) => sum + activity.duration_seconds, 0);
};

interface SuccessStateProps {
  routineData: RoutineData;
  onContinue: () => void;
  onUpdateRoutineData?: (updatedData: RoutineData) => void;
  isSaving?: boolean;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  routineData,
  onContinue,
  onUpdateRoutineData,
  isSaving,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  const [isAiModalVisible, setIsAiModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(RoutineTab.MORNING);

  const tabViewFlatListRef = useRef(null);
  const tabViewTranslateX = useSharedValue(0);
  const goToTab = (index) => tabViewFlatListRef.current && tabViewFlatListRef.current.goToTab(index);

  const handleEditActivity = (activity: Activity) => {
    navigation.navigate(NAVIGATION.HabitSetting, {
      hideRoutineSelection: true,
      activity,
      onSave: (updatedActivity: Activity) => {
        const updatedData: RoutineData = calculateRoutineDataWithModifiedActivity(routineData, updatedActivity);

        onUpdateRoutineData(updatedData);
        postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_EDIT_HABIT, { tab: activeTab, activity_id: activity.id });
      },
    });
  };

  const handleAddActivity = () => {
    navigation.navigate(NAVIGATION.HabitSetting, {
      hideRoutineSelection: true,
      activity: { activity_type: activeTab },
      onSave: (newActivity: Activity) => {
        const updatedData: RoutineData = calculateRoutineDataWithAddedActivity(routineData, newActivity);

        onUpdateRoutineData(updatedData);
        postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_ADD_HABIT, { tab: activeTab, activity_id: newActivity.id });
      },
    });
  };

  const handleDeleteActivity = (activity: Activity) => {
    const { id, activity_type, activity_sequence_id } = activity;
    const updatedData: RoutineData = calculateRoutineDataWithDeletedActivity(routineData, {
      id,
      activityType: activity_type,
      activitySequenceId: activity_sequence_id,
    });

    onUpdateRoutineData(updatedData);
    postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_DELETE_HABIT, { tab: activeTab, activity_id: activity.id });
  };

  const handleReorderActivity = (fromIndex: number, toIndex: number, activities: Activity[], type: string) => {
    const item = activities[fromIndex];
    const { id: activityId } = item;

    const activityIds = activities.map((activity) => activity.id);
    activityIds.splice(fromIndex, 1);
    activityIds.splice(toIndex, 0, activityId);

    const updatedData: RoutineData = calculateRoutineDataWithReorderedActivities(routineData, {
      activityIds,
      type,
      activitySequenceId: null,
    });
    onUpdateRoutineData(updatedData);
    postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_REORDER_HABIT, { tab: activeTab, activity_id: activityId });
  };

  const hasNoActivities = routineData.morning_activities.length === 0 && routineData.evening_activities.length === 0;

  const currentTabActivities =
    activeTab === RoutineTab.MORNING ? routineData.morning_activities : routineData.evening_activities;

  return (
    <>
      <View style={styles.flex}>
        <View style={[styles.headerContainer, { borderColor: colors.separator }]}>
          <View style={styles.headerTextContainer}>
            <DisplayMediumText center>{t("routineSuggestion.successTitle")}</DisplayMediumText>
            <BodyMediumText center color={colors.subText}>
              {t("routineSuggestion.successMessage")}
            </BodyMediumText>
          </View>
          {!hasNoActivities && (
            <AnimatedTabHeader routes={routes} onTabPress={goToTab} translateX={tabViewTranslateX} />
          )}
        </View>

        {hasNoActivities ? (
          <View style={styles.emptyStateContainer}>
            <DisplayMediumText center style={styles.emptyStateTitle}>
              {t("routineSuggestion.noHabitsTitle")}
            </DisplayMediumText>
            <BodyMediumText center color={colors.subText} style={styles.emptyStateMessage}>
              {t("routineSuggestion.noHabitsMessage")}
            </BodyMediumText>
          </View>
        ) : (
          <TabViewFlatList
            ref={tabViewFlatListRef}
            routes={routes}
            translateX={tabViewTranslateX}
            onCurrentTabChange={(index) => setActiveTab(routes[index].key)}
            renderScene={({ item: { key } }) => {
              const activities =
                key === RoutineTab.MORNING ? routineData.morning_activities : routineData.evening_activities;

              return (
                <EditActivitiesFlatList
                  enableQuickDelete
                  data={activities}
                  onPressEdit={handleEditActivity}
                  onPressDelete={handleDeleteActivity}
                  onReorder={(fromIndex: number, toIndex: number) =>
                    handleReorderActivity(fromIndex, toIndex, activities, key)
                  }
                  ListHeaderComponent={
                    <View style={[styles.row, styles.listHeaderContainer]}>
                      <View style={[styles.row, styles.gap8]}>
                        <ScalableIcon name="time" size={14} color={colors.subText} />
                        <BodySmallText color={colors.subText} weight="300">
                          {formatTime(getTotalSeconds(activities) * 1000)}
                        </BodySmallText>
                      </View>

                      <View style={[styles.row, styles.flexShrink, styles.gap4]}>
                        <ScalableIcon
                          name="gesture-tap-hold"
                          iconType="MaterialCommunityIcons"
                          size={16}
                          color={colors.subText}
                        />
                        <BodySmallText color={colors.subText} weight="300">
                          {t("routineSuggestion.tapToEdit")}
                        </BodySmallText>
                      </View>
                    </View>
                  }
                  ListEmptyComponent={
                    <View style={styles.listEmptyContainer}>
                      <HeadingSmallText center color={colors.subText}>
                        {t("routineSuggestion.noActivities")}
                      </HeadingSmallText>
                    </View>
                  }
                />
              );
            }}
          />
        )}
      </View>

      <>
        <AiAdjustButton
          onPress={() => {
            postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_ROUTINE_SUGGESTION_AI_ADJUST_CLICKED, { tab: activeTab });
            setIsAiModalVisible(true);
          }}
        />
        <FloatingAddButton onPress={handleAddActivity} testID="test:id/add-activity" />
      </>

      <ConfirmationButton
        confirmTitle={t("common.continue")}
        confirmTestID="test:id/continue-button"
        onConfirm={onContinue}
        disabled={isSaving}
        isLoading={isSaving}
      />

      <AdjustWithAiModal
        isVisible={isAiModalVisible}
        onCancel={() => setIsAiModalVisible(false)}
        activities={currentTabActivities}
        onApplied={(adjusted) => {
          if (!onUpdateRoutineData) return;
          const updated = { ...routineData };
          const isEmpty = currentTabActivities.length === 0;

          if (!isEmpty) {
            if (activeTab === RoutineTab.MORNING) {
              updated.morning_activities = adjusted;
            } else {
              updated.evening_activities = adjusted;
            }
          } else {
            updated.morning_activities = [
              ...routineData.morning_activities,
              ...adjusted.filter((a) => a.activity_type === RoutineTab.MORNING),
            ];
            updated.evening_activities = [
              ...routineData.evening_activities,
              ...adjusted.filter((a) => a.activity_type === RoutineTab.EVENING),
            ];
          }

          onUpdateRoutineData(updated);
          setIsAiModalVisible(false);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  gap4: { gap: 4 },
  gap8: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerContainer: {
    paddingTop: 48,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTextContainer: {
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 12,
  },
  listHeaderContainer: {
    justifyContent: "space-between",
    paddingTop: 4,
    paddingBottom: 12,
  },
  listEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyStateTitle: {
    marginBottom: 8,
  },
  emptyStateMessage: {
    textAlign: "center",
    marginBottom: 24,
  },
});
