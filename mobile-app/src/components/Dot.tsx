import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { useTheme } from "@react-navigation/native";

export const Dot = ({ size, style }: { size?: number; style?: StyleProp<ViewStyle> }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.dot, { backgroundColor: colors.danger, outlineColor: colors.card, width: size || 8 }, style]}
    />
  );
};

const styles = StyleSheet.create({
  dot: {
    aspectRatio: 1,
    borderRadius: 1000,
    outlineWidth: 1.5,
  },
});
