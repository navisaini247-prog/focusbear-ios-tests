import React, { useRef, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { TabViewFlatList, AnimatedTabHeader } from "@/components";
import { HOME_TABS } from "@/constants/home";
import RoutineActivities from "./RoutineActivities";
import { HomeHeader } from "./HomeHeader";
import { ToDosScreen } from "@/screens/ToDos/ToDosScreen";
import { OverviewTab } from "./OverviewTab";
import { HomeTabProvider, useHomeTab } from "./HomeTabContext";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";

const routes = [
  { key: HOME_TABS.OVERVIEW, titleKey: "tabTitle.overview", testID: "test:id/home-tab-overview" },
  { key: HOME_TABS.HABIT, titleKey: "tabTitle.habits", testID: "test:id/home-tab-habit" },
  { key: HOME_TABS.TASK, titleKey: "tabTitle.tasks", testID: "test:id/home-tab-task" },
];

const HABIT_TAB_INDEX = 1;

const TAB_CHANGE_EVENT_BY_INDEX = {
  0: POSTHOG_EVENT_NAMES.HOME_SCREEN_CHANGE_TAB_OVERVIEW,
  1: POSTHOG_EVENT_NAMES.HOME_SCREEN_CHANGE_TAB_HABITS,
  2: POSTHOG_EVENT_NAMES.HOME_SCREEN_CHANGE_TAB_TODOS,
};

const HomeTabViewInner = ({ addTaskAppActionRequest, isFetchingRoutineError }) => {
  const tabViewFlatListRef = useRef(null);
  const translateX = useSharedValue(0);
  const addTaskInputRef = useRef(null);
  const { setCurrentTabIndex } = useHomeTab();

  const goToTab = useCallback((index) => {
    const eventName = TAB_CHANGE_EVENT_BY_INDEX[index];
    if (eventName) {
      postHogCapture(eventName);
    }
    tabViewFlatListRef.current && tabViewFlatListRef.current.goToTab(index);
  }, []);

  const goToTaskTab = useCallback(
    (addNewTask) => {
      goToTab(2);
      if (addNewTask) {
        // Wait until input is visible on screen
        setTimeout(() => addTaskInputRef.current && addTaskInputRef.current.focus(), 300);
      }
    },
    [goToTab],
  );

  useEffect(() => {
    if (addTaskAppActionRequest) {
      goToTaskTab(true);
    }
    return undefined;
  }, [addTaskAppActionRequest, goToTaskTab]);

  const renderScene = ({ item }) => {
    switch (item.key) {
      case HOME_TABS.OVERVIEW:
      default:
        return <OverviewTab goToHabitTab={() => goToTab(1)} goToTaskTab={goToTaskTab} />;
      case HOME_TABS.HABIT:
        return <RoutineActivities isFetchingRoutineError={isFetchingRoutineError} />;
      case HOME_TABS.TASK:
        return <ToDosScreen addTaskInputRef={addTaskInputRef} />;
    }
  };

  return (
    <View style={styles.container}>
      <HomeHeader
        secondaryRowContent={<AnimatedTabHeader routes={routes} onTabPress={goToTab} translateX={translateX} />}
      />

      <TabViewFlatList
        ref={tabViewFlatListRef}
        routes={routes}
        translateX={translateX}
        onCurrentTabChange={setCurrentTabIndex}
        renderScene={renderScene}
        bounces={false}
        scrollEnabled={false}
      />
    </View>
  );
};

export const HomeTabView = ({ addTaskAppActionRequest, isFetchingRoutineError }) => {
  return (
    <HomeTabProvider habitTabIndex={HABIT_TAB_INDEX}>
      <HomeTabViewInner
        addTaskAppActionRequest={addTaskAppActionRequest}
        isFetchingRoutineError={isFetchingRoutineError}
      />
    </HomeTabProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
