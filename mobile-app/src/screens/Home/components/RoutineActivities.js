import React, { memo, useCallback, useMemo, useState, useEffect, useRef } from "react";
import { View, StyleSheet, FlatList, useWindowDimensions } from "react-native";
import { BodySmallText, Card, MenuItem } from "@/components";
import { ActivityItemButton, ActivityItemCard, ACTIVITY_CARD_HEIGHT } from "./ActivityItem";
import { RoutineSectionHeader, NoActivitiesPlaceholder } from "./RoutineItem";
import { FloatingAddButton } from "./FloatingAddButton";
import { AddItemModal } from "./AddItemModal";
import { AnimatedItemPosition, DraggableItem, ANIM_DURATION } from "@/components/AnimatedListItems";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { ActivityItemPopup } from "./ActivityItemPopup";
import { RoutineInfoModal } from "./RoutineInfoModal";
import { useDispatch } from "react-redux";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useRoutineWatchIntegration } from "./RoutineActionButtons";
import { useNextHabit } from "@/hooks/use-next-habit";
import {
  getCurrentActivityProps,
  getUserDetails,
  getUserLocalDeviceSettings,
  getUserSubscription,
} from "@/actions/UserActions";
import { addErrorLog } from "@/utils/FileLogger";
import { cutOffTimeSelector, startUpTimeSelector } from "@/selectors/RoutineSelectors";
import { useHomeContext } from "../context";
import { routineProcessSelector } from "@/selectors/RoutineSelectors";
import { useUpdateWidgetState } from "@/hooks/use-update-widget-state";
import { onStartMorningRoutineEarly, reorderRoutineActivities, userRoutineDataAction } from "@/actions/RoutineActions";
import { isCutoffLessThan2HoursBeforeStartup, isNowLessThan2HoursBeforeStartup } from "@/utils/TimeMethods";
import { showFreemiumAlert } from "@/hooks/use-is-freemium";
import { postHogCapture } from "@/utils/Posthog";
import { i18n } from "@/localization";
import { clampFontScale } from "@/utils/FontScaleUtils";
import { triggerHaptics, HapticTypes } from "react-native-turbo-haptics";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import COLOR from "@/constants/color";

const ITEM_TYPES = {
  ROUTINE_HEADER: "ROUTINE_HEADER",
  ROUTINE_COLLAPSED: "ROUTINE_COLLAPSED",
  ACTIVITY: "ACTIVITY",
  NO_ACTIVITIES: "NO_ACTIVITIES",
};

const LIST_HEADER_HEIGHT = 0; // increase if there is some static content in the header

const ITEM_HEIGHTS = {
  ROUTINE_HEADER: 44,
  ROUTINE_COLLAPSED: 74,
};

// These values are not scaled with font scaling
const LIST_TOP_PAD = 8;
const ROUTINE_GAP = 12;
const ACTIVITY_GAP = 8;

const STACK_SPREAD = 6;
const STACK_SHRINK = 0.05;

const getItemHeight = (itemType, fontScale) => {
  switch (itemType) {
    case ITEM_TYPES.ROUTINE_HEADER:
    case ITEM_TYPES.ROUTINE_COLLAPSED:
      return ITEM_HEIGHTS[itemType] * fontScale + ROUTINE_GAP;
    case ITEM_TYPES.ACTIVITY:
    case ITEM_TYPES.NO_ACTIVITIES:
      return ACTIVITY_CARD_HEIGHT * fontScale + ACTIVITY_GAP;
  }
};

export const showHabitLimitAlert = (navigation) => {
  showFreemiumAlert(i18n.t("complete.freemiumLimitReached"), i18n.t("home.habitLimitMessage"), navigation);
};

const RoutineActivities = ({ isFetchingRoutineError }) => {
  const dispatch = useDispatch();
  const { fontScale: baseScale } = useWindowDimensions();
  const fontScale = clampFontScale(baseScale);

  const { routineData } = useHomeContext();
  const routineProcess = useSelector(routineProcessSelector);

  const animatedOffsets = useSharedValue(null);
  const listDataRef = useRef(listData);
  const routineDataRef = useRef(routineData);

  const [refreshing, setRefreshing] = useState(false);

  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isActivityPopupVisible, setIsActivityPopupVisible] = useState(false);
  const selectedItemLayout = useSharedValue({});

  const [isRoutineInfoModalVisible, setIsRoutineInfoModalVisible] = useState(false);
  const [routineInfoModalRoutineId, setRoutineInfoModalRoutineId] = useState(null);
  const [routineInfoModalScreen, setRoutineInfoModalScreen] = useState(null);

  const [addItemModalVisible, setAddItemModalVisible] = useState(false);

  const [expandedSections, setExpandedSections] = useState(() => {
    return routineData.filter((routine) => routine.isAvailable).map((routine) => routine.id);
  });
  const [appearsExpandedSections, setAppearsExpandedSections] = useState(expandedSections);

  useEffect(() => {
    // Important for expanding/collapsing sections:
    // - A section is added/removed from `appearsExpandedSections` first while the animation is running
    // - After ANIM_DURATION, `expandedSections` is updated to match `appearsExpandedSections`
    if (expandedSections !== appearsExpandedSections) {
      const timeout = setTimeout(() => {
        animatedOffsets.value = null;
        setExpandedSections(appearsExpandedSections);
      }, ANIM_DURATION);
      return () => clearTimeout(timeout);
    }
  }, [appearsExpandedSections, expandedSections, animatedOffsets]);

  const { routineVisibleActivities, nextActivity } = useNextHabit(routineData, routineProcess);

  useRoutineWatchIntegration({ nextActivity });
  useUpdateWidgetState(nextActivity);

  const listData = useMemo(() => {
    return routineVisibleActivities.flatMap((routine) => {
      const { visibleActivities } = routine;

      const visibleCount = visibleActivities.length;

      const isExpanded = expandedSections.includes(routine.id);
      const appearsExpanded = appearsExpandedSections.includes(routine.id);

      const routineSection = {
        itemType: isExpanded ? ITEM_TYPES.ROUTINE_HEADER : ITEM_TYPES.ROUTINE_COLLAPSED,
        isExpanded,
        appearsExpanded,
        ...routine,
      };

      if (!isExpanded) {
        return [routineSection];
      }

      if (visibleActivities.length === 0) {
        const emptyRoutinePlaceholder = { itemType: ITEM_TYPES.NO_ACTIVITIES };

        return [routineSection, emptyRoutinePlaceholder];
      }

      const activityItems = visibleActivities.map((activity, index) => ({
        itemType: ITEM_TYPES.ACTIVITY,
        appearsExpanded,
        localIndex: index,
        visibleCount,
        ...activity,
      }));

      return [routineSection, ...activityItems];
    });
  }, [routineVisibleActivities, expandedSections, appearsExpandedSections]);

  useEffect(() => {
    // Keep identical refs
    listDataRef.current = listData;
    routineDataRef.current = routineData;
  }, [listData, routineData]);

  const itemOffsets = useMemo(() => {
    // Calculate all item offsets
    const listHeaderHeight = LIST_HEADER_HEIGHT * fontScale;
    return listData.reduce(
      (acc, { itemType }) => acc.concat(acc.at(-1) + getItemHeight(itemType, fontScale)),
      [listHeaderHeight],
    );
  }, [listData, fontScale]);

  const onItemPress = useCallback(
    async (activity, pendingItemLayout) => {
      triggerHaptics(HapticTypes.soft);
      postHogCapture(POSTHOG_EVENT_NAMES.EXPAND_HABIT, { habitId: activity.id, activityType: activity.activity_type });

      // Continue even if the .measure callback somehow doesn't resolve in under 500ms
      const itemLayout = await Promise.race([pendingItemLayout, new Promise((resolve) => setTimeout(resolve, 500))]);
      setSelectedActivity(activity);
      setIsActivityPopupVisible(true);
      selectedItemLayout.set(itemLayout || {});
    },
    [selectedItemLayout],
  );

  const openRoutineInfoModal = useCallback((routineId, screen) => {
    setIsRoutineInfoModalVisible(true);
    setRoutineInfoModalRoutineId(routineId);
    setRoutineInfoModalScreen(screen);
  }, []);

  const openAddItemModal = useCallback(() => setAddItemModalVisible(true), []);

  const refreshAll = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      dispatch(getUserDetails()),
      dispatch(getUserLocalDeviceSettings()),
      dispatch(getCurrentActivityProps()),
      dispatch(getUserSubscription()),
      dispatch(userRoutineDataAction()),
    ])
      .catch((error) => addErrorLog("Error occurred during data fetching:", error))
      .finally(() => setRefreshing(false));
  }, [dispatch]);

  const reorderActivity = useCallback(
    (fromListIndex, toListIndex) => {
      const itemId = listDataRef.current[fromListIndex]?.id;
      const referenceItemId = listDataRef.current[toListIndex]?.id; // item will be inserted adjacent to this one

      const routine = routineDataRef.current.find((_routine) =>
        _routine.activities.some((activity) => activity.id === itemId),
      );

      if (!itemId || !referenceItemId || !routine) return;
      const { activities, type, activity_sequence_id } = routine;

      const fromIndex = activities.findIndex((activity) => activity.id === itemId);
      const toIndex = activities.findIndex((activity) => activity.id === referenceItemId);

      const activityIds = activities.map((activity) => activity.id);
      activityIds.splice(fromIndex, 1);
      activityIds.splice(toIndex, 0, itemId);

      dispatch(reorderRoutineActivities({ activityIds, type, activitySequenceId: activity_sequence_id }));
      postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_REORDER_HABIT, { screen: "homescreen" });
    },
    [dispatch],
  );

  return (
    <>
      <FlatList
        contentContainerStyle={styles.contentContainer}
        data={listData}
        refreshing={refreshing}
        onRefresh={refreshAll}
        keyExtractor={(item) => `${item.itemType}-${item.id}`}
        getItemLayout={(data, index) => ({
          length: getItemHeight(data[index].itemType, fontScale),
          offset: itemOffsets[index],
          index,
        })}
        renderItem={({ item, index }) => {
          switch (item.itemType) {
            case ITEM_TYPES.ACTIVITY:
              return (
                <DraggableActivityItem
                  index={index}
                  animatedOffsets={animatedOffsets}
                  onItemPress={onItemPress}
                  isSelected={isActivityPopupVisible && selectedActivity?.id === item.id}
                  reorderActivity={reorderActivity}
                  {...item}
                />
              );

            case ITEM_TYPES.ROUTINE_HEADER:
            case ITEM_TYPES.ROUTINE_COLLAPSED:
              return (
                <CollapsableRoutineSection
                  index={index}
                  animatedOffsets={animatedOffsets}
                  setAppearsExpandedSections={setAppearsExpandedSections}
                  openRoutineInfoModal={openRoutineInfoModal}
                  {...item}
                />
              );

            case ITEM_TYPES.NO_ACTIVITIES:
              return <NoActivitiesPlaceholderItem {...item} />;
          }
        }}
        ListHeaderComponent={<ListHeader nextActivity={nextActivity} />}
        removeClippedSubviews={false} // is true by default on android
        windowSize={5}
      />

      <FloatingAddButton onPress={openAddItemModal} />

      <AddItemModal isVisible={addItemModalVisible} setIsVisible={setAddItemModalVisible} />

      <ActivityItemPopup
        isVisible={isActivityPopupVisible}
        setIsVisible={setIsActivityPopupVisible}
        activity={selectedActivity}
        itemLayout={selectedItemLayout}
        itemProps={{ hasDragHandle: true }}
      />

      <RoutineInfoModal
        isVisible={isRoutineInfoModalVisible}
        setIsVisible={setIsRoutineInfoModalVisible}
        routineId={routineInfoModalRoutineId}
        screen={routineInfoModalScreen}
      />
    </>
  );
};

const useStackedItemStyle = (animation, index, routineHeaderHeight, activityItemHeight) => {
  const collapsedPos = ROUTINE_GAP + index * STACK_SPREAD;
  const expandedPos = routineHeaderHeight + index * activityItemHeight;
  return useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: interpolate(animation.value, [0, 1], [collapsedPos, expandedPos]) },
        { scale: interpolate(animation.value, [0, 1], [1 - index * STACK_SHRINK, 1]) },
      ],
    };
  });
};

const CollapsableRoutineSection = memo(function CollapsableRoutineSection({
  isExpanded,
  setAppearsExpandedSections,
  openRoutineInfoModal,
  index,
  appearsExpanded,
  animatedOffsets,
  ...routine
}) {
  const { fontScale: baseScale } = useWindowDimensions();
  const fontScale = clampFontScale(baseScale);

  const { id, visibleActivities } = routine;

  const animation = useSharedValue(appearsExpanded ? 1 : 0);

  const routineHeaderHeight = ITEM_HEIGHTS.ROUTINE_HEADER * fontScale + ROUTINE_GAP;
  const collapsedRoutineHeight = ITEM_HEIGHTS.ROUTINE_COLLAPSED * fontScale + ROUTINE_GAP;
  const activityCardHeight = ACTIVITY_CARD_HEIGHT * fontScale;
  const activityItemHeight = activityCardHeight + ACTIVITY_GAP;

  const headerTransitionHeight = routineHeaderHeight - collapsedRoutineHeight;
  const itemsHeight = Math.max(1, visibleActivities.length) * activityItemHeight;
  const totalHeight = headerTransitionHeight + itemsHeight;

  const hasNoVisibleActivities = visibleActivities.length === 0;
  const isTransitioning = isExpanded !== appearsExpanded;
  const isTransitioningOrCollapsed = !isExpanded || !appearsExpanded;

  useEffect(() => {
    animation.value = withSpring(appearsExpanded ? 1 : 0, { duration: ANIM_DURATION });
    if (isTransitioning) {
      // Add a positive offset if expanding, or a negative offset if collapsing
      animatedOffsets.set((prev) => ({ ...prev, [index + 1]: (appearsExpanded ? 1 : -1) * totalHeight }));
    }
  }, [animation, animatedOffsets, appearsExpanded, index, isTransitioning, totalHeight]);

  const stackedItemsAnimatedStyles = [
    useStackedItemStyle(animation, 0, routineHeaderHeight, activityItemHeight),
    useStackedItemStyle(animation, 1, routineHeaderHeight, activityItemHeight),
    useStackedItemStyle(animation, 2, routineHeaderHeight, activityItemHeight),
  ];

  const restAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animation.value, [0.5, 1], [0, 1]),
    transform: [
      { translateY: animation.value * activityItemHeight * 3 },
      { scale: interpolate(animation.value, [0, 1], [1 - 3 * STACK_SHRINK, 1]) },
    ],
  }));

  const backingCardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: hasNoVisibleActivities ? 1 : interpolate(animation.value, [0.5, 1], [1, 0]),
    transform: [{ translateY: interpolate(animation.value, [0, 1], [ROUTINE_GAP, routineHeaderHeight]) }],
  }));

  const toggleExpanded = useCallback(() => {
    setAppearsExpandedSections((prev) => (appearsExpanded ? prev.filter((_id) => id !== _id) : [...prev, id]));
  }, [appearsExpanded, id, setAppearsExpandedSections]);

  const stackedItems = visibleActivities.slice(0, 3);
  const rest = visibleActivities.slice(3, 10);

  return (
    <AnimatedItemPosition animatedOffsets={animatedOffsets} index={index} key={index}>
      {isTransitioningOrCollapsed &&
        stackedItems.map((activity, _index) => (
          <Animated.View
            key={activity.id}
            style={[styles.absolute, { zIndex: _index * -1 }, stackedItemsAnimatedStyles[_index]]}
          >
            <ActivityItemCard hasDragHandle {...activity} />
          </Animated.View>
        ))}

      <Animated.View style={[styles.absolute, backingCardAnimatedStyle]}>
        <Card style={[{ height: activityCardHeight }, hasNoVisibleActivities && styles.emptyRoutineBackingCard]}>
          {hasNoVisibleActivities && appearsExpanded && (
            <NoActivitiesPlaceholder openRoutineInfoModal={openRoutineInfoModal} {...routine} />
          )}
        </Card>
      </Animated.View>

      {isTransitioning && rest.length > 0 && (
        <Animated.View
          style={[
            styles.absolute,
            styles.expandingRoutineRestContainer,
            { top: routineHeaderHeight },
            restAnimatedStyle,
          ]}
        >
          {rest.map((activity) => (
            <View style={[styles.activityItemContainer, { height: activityCardHeight }]} key={activity.id}>
              <ActivityItemCard hasDragHandle {...activity} />
            </View>
          ))}
        </Animated.View>
      )}

      <View
        style={[styles.routineHeaderContainer, { height: isExpanded ? routineHeaderHeight : collapsedRoutineHeight }]}
      >
        <RoutineSectionHeader
          animation={animation}
          appearsExpanded={appearsExpanded}
          onPress={toggleExpanded}
          openRoutineInfoModal={openRoutineInfoModal}
          disabled={isTransitioning}
          {...routine}
        />
      </View>
    </AnimatedItemPosition>
  );
});

const DraggableActivityItem = memo(function DraggableActivityItem({
  index,
  localIndex,
  appearsExpanded,
  animatedOffsets,
  visibleCount,
  onItemPress,
  isSelected,
  reorderActivity,
  ...activity
}) {
  const containerRef = useRef(null);

  const cardHeight = ACTIVITY_CARD_HEIGHT * clampFontScale(useWindowDimensions().fontScale);
  const itemHeight = cardHeight + ACTIVITY_GAP;

  // Limit to dragging within it's own routine
  const minTranslateY = -localIndex * itemHeight;
  const maxTranslateY = (visibleCount - localIndex - 1) * itemHeight;

  const onPress = useCallback(() => {
    const pendingItemLayout = new Promise((resolve) => {
      containerRef.current?.measure?.((_x, _y, width, _height, pageX, pageY) => resolve({ x: pageX, y: pageY, width }));
    });
    onItemPress(activity, pendingItemLayout);
  }, [activity, onItemPress]);

  return (
    <View ref={containerRef}>
      <DraggableItem
        index={index}
        itemHeight={itemHeight}
        animatedOffsets={animatedOffsets}
        onReorder={reorderActivity}
        minTranslateY={minTranslateY}
        maxTranslateY={maxTranslateY}
        style={[styles.activityItemContainer, { height: cardHeight }]}
      >
        {appearsExpanded && !isSelected && (
          <ActivityItemButton hasDragHandle onPress={onPress} testID={`test:id/activity-${index}`} {...activity} />
        )}
      </DraggableItem>
    </View>
  );
});

const NoActivitiesPlaceholderItem = () => {
  const height = ACTIVITY_CARD_HEIGHT * clampFontScale(useWindowDimensions().fontScale);
  return <View style={[styles.activityItemContainer, { height }]} />;
};

const ListHeader = ({ nextActivity }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const startUpTime = useSelector(startUpTimeSelector);
  const cutOffTime = useSelector(cutOffTimeSelector);
  const height = LIST_HEADER_HEIGHT * clampFontScale(useWindowDimensions().fontScale) + LIST_TOP_PAD;

  const isLessThan2HoursBeforeStartup =
    !isCutoffLessThan2HoursBeforeStartup(cutOffTime, startUpTime) && isNowLessThan2HoursBeforeStartup(startUpTime);

  const shouldShowStartMorningRoutineEarly = isLessThan2HoursBeforeStartup && !nextActivity;

  return (
    <>
      {/* No static list header content right now */}
      <View style={[styles.listHeader, { height }]} />

      {shouldShowStartMorningRoutineEarly && (
        <MenuItem
          style={{ backgroundColor: colors.pinkBg, borderColor: colors.pink }}
          onPress={() => dispatch(onStartMorningRoutineEarly())}
        >
          <BodySmallText weight="300" style={styles.bannerText}>
            {t("home.upEarlyStartMorningRoutine")}
          </BodySmallText>
        </MenuItem>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  absolute: {
    position: "absolute",
    width: "100%",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  routineHeaderContainer: {
    paddingTop: ROUTINE_GAP,
  },
  expandingRoutineRestContainer: {
    transformOrigin: "top center",
  },
  activityItemContainer: {
    marginBottom: ACTIVITY_GAP,
    borderRadius: 16,
  },
  emptyRoutineBackingCard: {
    borderStyle: "dashed",
    backgroundColor: COLOR.TRANSPARENT,
    borderWidth: 1.5,
  },
  listHeader: {
    paddingTop: LIST_TOP_PAD,
  },
  bannerText: {
    opacity: 0.8,
  },
});

export default RoutineActivities;
