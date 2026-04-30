import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Button, ScalableIcon, ButtonProps } from "@/components";
import { useTheme } from "@react-navigation/native";

const ADD_HABIT_BUTTON_SIZE = 56;
const ADD_HABIT_ICON_SIZE = 46;

export const FloatingAddButton = memo(function FloatingAddButton(props: ButtonProps) {
  const { colors, shadowStyles } = useTheme();

  return (
    <View>
      <Button
        primary
        style={[styles.addHabitButton, shadowStyles.bigShadow]}
        renderLeftIcon={
          <ScalableIcon name="add" size={ADD_HABIT_ICON_SIZE} color={colors.white} scaleWithText={false} />
        }
        {...props}
        testID="test:id/add-routine-item-button"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  addHabitButton: {
    position: "absolute",
    right: 16,
    bottom: 16,
    paddingHorizontal: 0,
    paddingVertical: 0,
    height: ADD_HABIT_BUTTON_SIZE,
    aspectRatio: 1,
    borderRadius: ADD_HABIT_BUTTON_SIZE / 2,
  },
});
