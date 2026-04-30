import React, { useRef } from "react";
import { View, StyleSheet } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { TabViewFlatList, AnimatedTabHeader, AppHeader } from "@/components";
import { useTranslation } from "react-i18next";
import { STATS_TABS } from "@/constants/stats";
import { UserStats } from "../OtherStats/UserStats";
import { AppUsage } from "../Screentime/AppUsage";

export const StatsTabView = () => {
  const { t } = useTranslation();
  const tabViewFlatListRef = useRef<any>(null);
  const translateX = useSharedValue(0);

  const routes = [
    { key: STATS_TABS.SCREENTIME, titleKey: "stats.tabs.screentime", testID: "test:id/stats-tab-screentime" },
    { key: STATS_TABS.OTHER, titleKey: "stats.tabs.otherStats", testID: "test:id/stats-tab-other" },
  ];

  const goToTab = (index: number) => tabViewFlatListRef.current?.goToTab(index);

  const renderScene = ({ item }: { item: any }) => {
    switch (item.key) {
      case STATS_TABS.SCREENTIME:
        return <AppUsage />;
      case STATS_TABS.OTHER:
        return <UserStats />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title={t("home.stats")}
        hideBackButton
        secondaryRowContent={<AnimatedTabHeader routes={routes} onTabPress={goToTab} translateX={translateX} />}
      />
      <TabViewFlatList
        ref={tabViewFlatListRef}
        routes={routes}
        translateX={translateX}
        renderScene={renderScene}
        onCurrentTabChange={() => {}}
        bounces={false}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
