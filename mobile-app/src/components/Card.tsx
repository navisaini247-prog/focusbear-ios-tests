import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";

export interface CardProps extends ViewProps {
  noPadding?: boolean;
}

export const Card = ({ noPadding, style, ...props }: CardProps) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.separator },
        !noPadding && styles.padding,
        style,
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  padding: {
    padding: 12,
  },
});
