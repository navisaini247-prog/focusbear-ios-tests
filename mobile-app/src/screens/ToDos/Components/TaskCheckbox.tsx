import React, { memo } from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { useTheme } from "@react-navigation/native";
import { scaleByFontScale, FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";
import { Checkmark } from "@/components";
import COLOR from "@/constants/color";
import { useFontScale } from "@/hooks/use-font-scale";

const NORMAL_SIZE = 26;
const SMALL_SIZE = 22;

interface CheckboxProps extends ViewProps {
  value: boolean;
  small?: boolean;
}

/** A circular, un-animated checkbox component */
export const TaskCheckbox = memo(function TaskCheckbox({ value, small, style, ...props }: CheckboxProps) {
  const { colors } = useTheme();
  const { fontScale } = useFontScale();

  const baseSize = small ? SMALL_SIZE : NORMAL_SIZE;
  const size = scaleByFontScale(baseSize, fontScale, { round: false, maxFontScale: FONT_SCALE_LIMIT.CONSTRAINED_UI });

  const backgroundColor = value ? colors.primary : COLOR.TRANSPARENT;
  const borderColor = value ? colors.primaryBorder : colors.border;

  return (
    <View style={[styles.checkbox, { width: size, height: size, backgroundColor, borderColor }, style]} {...props}>
      <Checkmark value={value} size={Math.round(size * 0.5)} color={colors.white} />
    </View>
  );
});

const styles = StyleSheet.create({
  checkbox: {
    borderRadius: 100,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
