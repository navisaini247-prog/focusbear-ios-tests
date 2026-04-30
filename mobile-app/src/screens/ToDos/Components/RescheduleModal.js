import React from "react";
import { View, StyleSheet } from "react-native";
import { SheetModal, ModalHeader } from "@/components";
import { DueDateMenu, Badge } from "./EditTaskComponents";
import Icon from "react-native-vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { updateTask } from "@/actions/UserActions";
import { tasksSelector } from "@/selectors/UserSelectors";
import { draftTodosSelector } from "@/reducers/UserReducer";
import { formatDateFromNow } from "@/utils/TimeMethods";
import { stripBackendScores } from "@/utils/toDos";

export const RescheduleModal = ({ isVisible, setIsVisible, taskId }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const tasks = useSelector(tasksSelector);
  const draftTodos = useSelector(draftTodosSelector);

  const task = tasks.find((_task) => _task.id === taskId) || draftTodos.find((draft) => draft.id === taskId);

  return (
    <SheetModal isVisible={isVisible} onCancel={() => setIsVisible(false)}>
      <ModalHeader
        title={t("toDos.rescheduleTitle")}
        rightContent={
          <View style={styles.row}>
            <Badge value={formatDateFromNow(task?.due_date)} />
            <Icon name="arrow-forward" size={14} color={colors.text} />
            <Badge value="..." />
          </View>
        }
      />

      <DueDateMenu
        isReschedule
        task={task}
        setTask={(updater) => dispatch(updateTask(stripBackendScores(updater(task))))}
        onSubmit={() => setIsVisible(false)}
      />
    </SheetModal>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
