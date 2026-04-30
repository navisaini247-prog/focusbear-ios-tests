import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { BodyMediumText, HeadingLargeText, HeadingSmallText, ScalableIcon } from "@/components";
import { TaskItem } from "@/screens/ToDos/Components/TaskItem";
import { useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { tasksSelector } from "@/selectors/UserSelectors";
import { TASK_STATUS, getTOPScore } from "@/utils/toDos";
import { Trans, useTranslation } from "react-i18next";

export const TodoCard = ({ onPressViewAll }: { onPressViewAll: (newTask: boolean) => void }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const tasks = useSelector(tasksSelector) || [];

  const uncompleted = tasks.filter((task) => task.status !== TASK_STATUS.COMPLETED);
  const sortedByTop = [...uncompleted].sort((a, b) => {
    const scoreDiff = getTOPScore(b) - getTOPScore(a);
    if (scoreDiff !== 0) return scoreDiff; // higher TOP score first
    // Tie-breaker: earlier due date first
    const ad = a?.due_date ? new Date(a.due_date).getTime() : Infinity;
    const bd = b?.due_date ? new Date(b.due_date).getTime() : Infinity;
    return ad - bd;
  });
  const firstThree = sortedByTop.slice(0, 3);
  const isEmpty = firstThree.length === 0;

  return (
    <View style={styles.gap12}>
      <View style={[styles.containerPadding, styles.headerContainer]}>
        <View style={styles.headerTitle}>
          <HeadingLargeText weight="700">{t("overview.topTasksToday")}</HeadingLargeText>
        </View>
        <TouchableOpacity
          hitSlop={12}
          style={[styles.row, styles.gap4]}
          onPress={() => onPressViewAll(false)}
          testID="test:id/todo-card-view-all"
        >
          <HeadingSmallText style={{ color: colors.primary }}>{t("common.viewAll")}</HeadingSmallText>
          <ScalableIcon name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <BodyMediumText center color={colors.subText}>
            <Trans
              i18nKey="overview.noTasksCta"
              components={{
                bold: <BodyMediumText weight="700" onPress={() => onPressViewAll(true)} color={colors.primary} />,
              }}
            />
          </BodyMediumText>
        </View>
      ) : (
        <View style={styles.gap8}>
          {firstThree.map((item) => (
            <TaskItem key={item?.id} {...item} />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  emptyContainer: {
    padding: 24,
  },
});

export default TodoCard;
