import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";

export const Pagination = ({ dotsLength, activeDotIndex }) => (
  <View style={styles.container}>
    {Array.from({ length: dotsLength }, (_, index) => (
      <PaginationDot key={index} isActive={activeDotIndex === index} />
    ))}
  </View>
);

const PaginationDot = ({ isActive }) => {
  const { colors } = useTheme();
  const backgroundColor = isActive ? colors.text : colors.border;
  return <View style={[styles.dot, isActive && styles.activeDot, { backgroundColor }]} />;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignSelf: "center",
    padding: 16,
    gap: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    transform: [{ scale: 1.5 }],
  },
});
