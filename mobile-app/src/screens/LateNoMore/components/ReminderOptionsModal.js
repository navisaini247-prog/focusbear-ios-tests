import React from "react";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Group, MenuItem, SheetModal } from "@/components";
import { ModalHeader } from "@/components/AppHeader";
import { REMINDER_TIMING_OPTIONS } from "@/controllers/LateNoMoreManager";

export const ReminderOptionsModal = ({ isVisible, setIsVisible, addReminder, reminderTimes, reminderTimeLabels }) => {
  const { t } = useTranslation();

  return (
    <SheetModal isVisible={isVisible} onCancel={() => setIsVisible(false)}>
      <ModalHeader title={t("lateNoMore.addReminder")} />
      <View style={styles.modalContentContainer}>
        <Group>
          {REMINDER_TIMING_OPTIONS.filter((reminder) => !reminderTimes.includes(reminder)).map((reminder) => (
            <MenuItem
              key={reminder}
              hideChevron
              icon="add"
              title={reminderTimeLabels[reminder]}
              onPress={() => addReminder(reminder)}
            />
          ))}
        </Group>
      </View>
    </SheetModal>
  );
};

const styles = StyleSheet.create({
  modalContentContainer: {
    padding: 16,
    paddingTop: 8,
  },
});
