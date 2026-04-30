import React from "react";
import { View, StyleSheet, ViewProps } from "react-native";
import { BodyMediumText } from "@/components";
import { useTranslation } from "react-i18next";

import { useTheme } from "@react-navigation/native";

interface SeparatorProps extends ViewProps {
  vertical?: boolean;
}

export const Separator: React.FC<SeparatorProps> = ({ style, vertical }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        vertical ? styles.verticalSeparator : styles.horizontalSeparator,
        { backgroundColor: colors.separator },
        style,
      ]}
    />
  );
};

export const Or: React.FC<ViewProps> = ({ style }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.orContainer, style]}>
      <Separator style={styles.orSeparator} />
      <BodyMediumText center color={colors.subText}>{` ${useTranslation().t("signUp.or")} `}</BodyMediumText>
      <Separator style={styles.orSeparator} />
    </View>
  );
};

const styles = StyleSheet.create({
  horizontalSeparator: {
    height: 1,
    marginHorizontal: 12,
  },
  verticalSeparator: {
    alignSelf: "stretch",
    width: 1,
    marginVertical: 6,
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 4,
  },
  orSeparator: {
    flex: 1,
  },
});
