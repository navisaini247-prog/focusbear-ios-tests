import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { MenuItemFlatlist } from "@/components";
import { useRoutineDetailContext } from "../context/context";
import { useFontScale } from "@/hooks/use-font-scale";

// This is used for habits which have a checklist embedded inside them
// e.g. Habit might be "Prepare to leave house" and the checklist could be
// Keys, wallet, lunch
// (It is not the same as the list of habits on the home page)
const ActivityCheckList = () => {
  const { activityInfo } = useRoutineDetailContext();
  const { checkList } = activityInfo;
  const [checkedList, setCheckedList] = useState({});

  const { isLargeFontScale } = useFontScale();

  if (!checkList) {
    return null;
  }

  const checkListMenuItems = checkList?.map?.((item, index) => ({
    title: item,
    onPress: () => setCheckedList((prev) => ({ ...prev, [index]: !prev[index] })),
    isSelected: !!checkedList[index],
    type: "checkbox",
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, isLargeFontScale && styles.contentContainerScaled]}
    >
      <MenuItemFlatlist data={checkListMenuItems} isLargeFontScale={isLargeFontScale} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  contentContainerScaled: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

export { ActivityCheckList };
