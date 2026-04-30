import React, { useMemo, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { useRoutineDetailContext } from "../context/context";
import { SmallButton } from "@/components";
import { VideoHabit } from "./VideoHabit";
import ImagesView from "./ImagesView";
import { ActivityCheckList } from "./ActivityCheckList";
import AddNoteView from "./AddNoteView";
import { TAKE_LOGS } from "@/utils/Enums";
import { useFontScale } from "@/hooks/use-font-scale";
import { useTranslation } from "react-i18next";

const ActivityTabs = () => {
  const { isNonVideoHabit, imageUrls, activityInfo } = useRoutineDetailContext();

  const { t } = useTranslation();
  const { isLargeFontScale } = useFontScale();

  const tabs = [
    { key: "video", label: t("routineDetail.video"), component: VideoHabit },
    { key: "images", label: t("routineDetail.images"), component: ImagesView },
    { key: "checklist", label: t("routineDetail.checklist"), component: ActivityCheckList },
    { key: "note", label: t("routineDetail.note"), component: AddNoteView },
  ];

  const availableTabs = useMemo(() => {
    return tabs.filter((tab) => {
      if (tab.key === "video" && !isNonVideoHabit) {
        return true;
      }
      if (tab.key === "images" && imageUrls?.length > 0) {
        return true;
      }
      if (tab.key === "checklist" && activityInfo?.checkList) {
        return true;
      }
      if (tab.key === "note" && activityInfo?.takeNotes === TAKE_LOGS.DURING_ACTIVITY) {
        return true;
      }
      return false;
    });
  }, [activityInfo?.checkList, activityInfo?.takeNotes, imageUrls?.length, isNonVideoHabit]);

  const [activeTab, setActiveTab] = useState(availableTabs.length > 0 ? availableTabs[0].key : "");

  return (
    <>
      {availableTabs.length > 1 && (
        <View style={styles.tabsContainer}>
          <FlatList
            data={availableTabs}
            horizontal={!isLargeFontScale}
            numColumns={isLargeFontScale ? 2 : undefined}
            key={isLargeFontScale ? "wrap" : "horizontal"}
            keyExtractor={(item) => item.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.tabsFlatlist, isLargeFontScale && styles.tabsFlatlistWrap]}
            columnWrapperStyle={isLargeFontScale && styles.columnWrapper}
            renderItem={({ item }) => (
              <SmallButton
                style={[styles.tabButton, isLargeFontScale && styles.tabButtonWrap]}
                primary={activeTab === item.key}
                disabledWithoutStyleChange={activeTab === item.key}
                title={item.label}
                onPress={() => {
                  setActiveTab(item.key);
                }}
              />
            )}
          />
        </View>
      )}

      <View style={styles.flex}>
        {availableTabs.map((tab) => (
          <TabContentView activeTab={activeTab} key={tab.key} tabKey={tab.key} component={tab.component} />
        ))}
      </View>
    </>
  );
};

const TabContentView = ({ tabKey, activeTab, component }) => {
  const TabComponent = component;
  return (
    <View style={[styles.flex, activeTab !== tabKey && styles.hidden]}>
      <TabComponent />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  hidden: {
    display: "none",
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  tabsFlatlist: {
    gap: 10,
  },
  tabsFlatlistWrap: {
    width: "100%",
  },
  columnWrapper: {
    gap: 10,
    justifyContent: "center",
  },
  tabButton: {
    flex: 1,
    width: 120,
  },
  tabButtonWrap: {
    flex: 1,
    minWidth: 100,
  },
});

export default ActivityTabs;
