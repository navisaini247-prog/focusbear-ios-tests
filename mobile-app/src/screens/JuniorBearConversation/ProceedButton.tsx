import React from "react";
import { StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";
import { useTheme } from "@react-navigation/native";
import COLOR from "@/constants/color";
import { BodyLargeText } from "@/components";
import { BackIcon, SkipIcon } from "@/assets";

type Align = "left" | "right";
type IconType = "back" | "skip";

/** Muted pill for skip (etc.) on dark backgrounds — fill #71717A @ ~30% alpha */
const DARK_MUTED_SKIP_BG = "#71717A4D";
const DARK_MUTED_SKIP_BORDER = "rgba(113, 113, 122, 0.45)";

interface ProceedButtonProps {
  label: string;
  onPress: () => void;
  align?: Align;
  icon?: IconType;
  testID?: string;
  disabled?: boolean;
  /** Use gray muted pill in dark mode (e.g. Skip on junior bear flow) */
  darkMuted?: boolean;
}

const ICON_SIZE = 20;

export const ProceedButton: React.FC<ProceedButtonProps> = ({
  label,
  onPress,
  align = "right",
  icon,
  testID,
  disabled = false,
  darkMuted = false,
}) => {
  const { colors, dark } = useTheme();
  const containerStyle: ViewStyle = align === "left" ? { alignSelf: "flex-start" } : { alignSelf: "flex-end" };
  const useDarkMuted = dark && darkMuted;
  const contentColor = dark ? COLOR.WHITE : colors.primary;

  const IconComponent = icon === "back" ? BackIcon : icon === "skip" ? SkipIcon : null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={[styles.button, containerStyle, useDarkMuted && styles.buttonDarkMuted, disabled && styles.buttonDisabled]}
    >
      <View style={styles.content}>
        {IconComponent && align === "left" && (
          <IconComponent width={ICON_SIZE} height={ICON_SIZE} color={contentColor} style={styles.iconLeft} />
        )}
        <BodyLargeText style={[styles.label, { color: contentColor }]}>{label}</BodyLargeText>
        {IconComponent && align === "right" && (
          <IconComponent width={ICON_SIZE} height={ICON_SIZE} color={contentColor} style={styles.iconRight} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const AMBER_BORDER = "rgba(235, 145, 46, 0.50)";
const AMBER_BG = "rgba(235, 145, 46, 0.10)";

const styles = StyleSheet.create({
  button: {
    padding: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AMBER_BORDER,
    backgroundColor: AMBER_BG,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconLeft: {
    marginRight: 2,
  },
  iconRight: {
    marginLeft: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonDarkMuted: {
    borderColor: DARK_MUTED_SKIP_BORDER,
    backgroundColor: DARK_MUTED_SKIP_BG,
  },
  label: {
    color: COLOR.AMBER[500],
  },
});
