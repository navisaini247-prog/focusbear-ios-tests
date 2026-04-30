import React, { memo, useState } from "react";
import { StyleSheet } from "react-native";
import { SheetModal, ModalHeader, Group, MenuItem, MenuItemProps } from "@/components";
import { useTranslation } from "react-i18next";
import { ROUTINE_TRIGGER } from "@/constants/routines";
import { RoutineTrigger } from "@/types/Routine";

interface RoutineTriggerSelectorProps extends MenuItemProps {
  trigger: RoutineTrigger;
  setTrigger: (trigger: RoutineTrigger) => void;
}

export const RoutineTriggerSelector = memo(function RoutineTriggerSelector({
  trigger,
  setTrigger,
  ...props
}: RoutineTriggerSelectorProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <MenuItem
        type="dropDown"
        onPress={() => setIsModalVisible(true)}
        title={t("editRoutine.timing")}
        subtitle={trigger === ROUTINE_TRIGGER.ON_DEMAND ? t("editRoutine.anytime") : t("editRoutine.scheduled")}
        testID={"test:id/routine-trigger"}
        {...props}
      />

      <SheetModal
        isVisible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        HeaderComponent={<ModalHeader title={t("editRoutine.timing")} />}
      >
        <Group style={styles.modalContent}>
          <MenuItem
            type="checkmark"
            icon="play-circle"
            title={t("editRoutine.anytime")}
            description={t("editRoutine.doHabitsWhenever")}
            onPress={() => {
              setTrigger(ROUTINE_TRIGGER.ON_DEMAND);
              setIsModalVisible(false);
            }}
            isSelected={trigger === ROUTINE_TRIGGER.ON_DEMAND}
            testID={"test:id/trigger-on-demand"}
          />
          <MenuItem
            type="checkmark"
            icon="time"
            title={t("editRoutine.scheduled")}
            description={t("editRoutine.doHabitsAtSpecificTime")}
            onPress={() => {
              setTrigger(ROUTINE_TRIGGER.ON_SCHEDULE);
              setIsModalVisible(false);
            }}
            isSelected={trigger === ROUTINE_TRIGGER.ON_SCHEDULE}
            testID={"test:id/trigger-on-schedule"}
          />
        </Group>
      </SheetModal>
    </>
  );
});

const styles = StyleSheet.create({
  modalContent: {
    padding: 16,
    paddingTop: 8,
  },
});
