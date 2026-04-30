import React from "react";
import PropTypes from "prop-types";
import { StyleSheet, View } from "react-native";
import { ScheduleItem } from "./ScheduleItem";

export const ExistingSchedulesList = ({ schedules, onSchedulePress }) => {
  return (
    <View style={styles.container}>
      {schedules.map((item) => (
        <ScheduleItem
          key={item.id}
          schedule={item}
          onPress={onSchedulePress ? () => onSchedulePress(item) : undefined}
        />
      ))}
    </View>
  );
};

ExistingSchedulesList.propTypes = {
  schedules: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSchedulePress: PropTypes.func,
  onClearAll: PropTypes.func.isRequired,
  showClearButton: PropTypes.bool,
};

ExistingSchedulesList.defaultProps = {
  showClearButton: true,
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});
