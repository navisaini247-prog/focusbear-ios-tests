import React from "react";
import { ActivityIndicator, ActivityIndicatorProps, StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";

function FullPageLoading({ show, style, ...props }: ActivityIndicatorProps & { show: boolean }) {
  const { colors } = useTheme();
  return show ? (
    <View style={[styles.container, StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, style]}>
      <ActivityIndicator size="large" color={colors.text} {...props} />
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
});

export default FullPageLoading;
