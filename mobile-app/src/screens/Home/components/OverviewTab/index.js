import React from "react";
import { StyleSheet, ScrollView } from "react-native";
import { Separator } from "@/components";
import RoutineCard from "./RoutineCard";
import FocusModeCard from "./FocusModeCard";
import { BlockingStatusBanner } from "../BlockingStatusBanner";
import { currentFocusModeFinishTimeSelector } from "@/selectors/UserSelectors";
import { useSelector } from "@/reducers";
import { useHomeContext } from "../../context";
import { isEmpty } from "lodash";

export const OverviewTab = ({ goToHabitTab }) => {
  const finishTime = useSelector(currentFocusModeFinishTimeSelector);
  const { routineData } = useHomeContext();

  const isFocusActive = new Date(finishTime).getTime() > Date.now();
  const currentRoutine = routineData.find((routine) => routine.isAvailable);
  const isRoutineEmpty = isEmpty(currentRoutine?.activities);

  // Note: Focus mode card also includes quick breaks
  const routineCard = <RoutineCard key="routine" onPressViewAll={goToHabitTab} />;
  const focusModeCard = <FocusModeCard key="focus" />;

  // Focus mode card first when active. Routine card last when empty.
  const cards = (() => {
    if (isFocusActive) return [focusModeCard, routineCard];
    if (isRoutineEmpty) return [focusModeCard, routineCard];
    return [routineCard, focusModeCard];
  })();

  return (
    <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <BlockingStatusBanner />
      {cards.map((card, index) => [index !== 0 && <Separator key={index} style={styles.separator} />, card])}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    gap: 20,
    paddingVertical: 16,
  },
  separator: {
    marginHorizontal: 0,
  },
});
