import React from "react";
import { View, StyleSheet } from "react-native";
import { BodySmallText, HeadingSmallText, ScalableIcon } from "@/components";
import { useTheme } from "@react-navigation/native";

const ICON_BY_TYPE = {
  info: "information",
  warning: "warning",
  negation: "close-circle",
  check: "checkmark",
  description: "ellipsis-horizontal",
};

export const PermissionWarningInfoTile = ({ type = "description", title, description }) => {
  const { colors } = useTheme();

  const iconName = ICON_BY_TYPE[type] ?? ICON_BY_TYPE.description;

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.separator }]}>
        <ScalableIcon name={iconName} size={18} color={colors.text} iconType="Ionicons" />
      </View>
      <View style={styles.textContainer}>
        <HeadingSmallText>{title}</HeadingSmallText>
        <BodySmallText color={colors.subText} weight="400">
          {description}
        </BodySmallText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    height: 32,
    width: 32,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
});
