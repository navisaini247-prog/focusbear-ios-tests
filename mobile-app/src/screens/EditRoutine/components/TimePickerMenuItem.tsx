import React, { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Modal, MenuItem, MenuItemProps, BodySmallText } from "@/components";
import { ScheduleTimePickerCard } from "@/screens/BlockingSchedule/components/ScheduleTimePickerCard";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import moment from "moment";
const isIOS = Platform.OS === "ios";

interface Props extends MenuItemProps {
  time: Date;
  setTime: (time: Date) => void;
  modalTitle: string;
  errorMessage?: string;
}

export const TimePickerMenuItem = ({ time, setTime, modalTitle, errorMessage, ...props }: Props) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const { colors } = useTheme();

  const onPress = () => {
    if (isIOS) {
      setModalVisible(true);
    } else {
      DateTimePickerAndroid.open({
        mode: "time",
        value: time,
        onChange: (event, time) => event.type === "set" && time && setTime(time),
      });
    }
  };

  return (
    <View>
      <MenuItem onPress={onPress} subtitle={moment(time).format("LT")} {...props} />

      {!!errorMessage && <BodySmallText style={[styles.error, { color: colors.danger }]}>{errorMessage}</BodySmallText>}

      <Modal isVisible={isModalVisible} onCancel={() => setModalVisible(false)}>
        <ScheduleTimePickerCard
          title={modalTitle}
          initialValue={time}
          onSubmit={(_time: Date) => {
            setTime(_time);
            setModalVisible(false);
          }}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  error: {
    marginTop: 8,
    marginLeft: 16,
  },
});
