import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import DatePicker from "react-native-date-picker";
import { HeadingSmallText, ModalHeader, Card } from "@/components";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";

export const ScheduleTimePickerCard = ({ title, initialValue, onSubmit }) => {
  const { t } = useTranslation();
  const { colors, isDarkTheme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(initialValue);

  return (
    <Card noPadding style={styles.pickerCard}>
      <ModalHeader
        title={title}
        rightContent={
          <TouchableOpacity
            onPress={() => onSubmit(selectedDate)}
            hitSlop={12}
            testID="test:id/schedule-time-picker-done"
          >
            <HeadingSmallText color={colors.primary}>{t("common.done")}</HeadingSmallText>
          </TouchableOpacity>
        }
      />

      <View style={styles.alignCenter}>
        <DatePicker
          mode="time"
          date={selectedDate}
          onDateChange={setSelectedDate}
          theme={isDarkTheme ? "dark" : "light"}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  pickerCard: {
    paddingVertical: 8,
    gap: 8,
  },
  alignCenter: {
    alignItems: "center",
  },
});
