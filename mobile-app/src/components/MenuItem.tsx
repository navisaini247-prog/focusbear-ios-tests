import React from "react";
import { View, StyleSheet } from "react-native";
import { Button, ButtonProps, Checkbox, Checkmark, Switch, Radio, Dot, ScalableIcon } from "./";
import type { IconType } from "./ScalableIcon";
import { HeadingSmallText, BodySmallText } from "./";
import { useTheme } from "@react-navigation/native";

import type { IconProps } from "react-native-vector-icons/Icon";

export interface MenuItemProps extends ButtonProps {
  icon?: string;
  trailingIcon?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  type?: "checkmark" | "checkbox" | "switch" | "radio" | "dropDown";
  isSelected?: boolean;
  isWarning?: boolean;
  hideChevron?: boolean;
  showChevron?: boolean;
  big?: boolean;
  iconType?: IconType;
  iconColor?: string;
  switchTestID?: string;
  isLargeFontScale?: boolean;
}

export const MenuItem = React.memo(function MenuItem({
  icon,
  trailingIcon,
  title,
  subtitle,
  description,
  type,
  isSelected,
  style,
  isWarning,
  hideChevron,
  showChevron,
  big,
  iconType,
  iconColor,
  children,
  switchTestID,
  isLargeFontScale,
  ...props
}: MenuItemProps) {
  const { colors } = useTheme();

  return (
    <Button
      subtle
      style={[styles.row, styles.gap8, big && styles.bigMenuItem, isLargeFontScale && styles.wrapRow, style]}
      {...props}
      data-test-skip
    >
      <View style={[styles.row, big ? styles.gap16 : styles.gap12, styles.flex, isLargeFontScale && styles.alignStart]}>
        {type === "checkbox" && <Checkbox small={!big} value={isSelected} />}
        {type === "radio" && <Radio small={!big} value={isSelected} />}
        {(icon || type === "checkmark") && (
          <View style={[styles.row, styles.gap8]}>
            {type === "checkmark" && <Checkmark value={isSelected} size={big ? 16 : 14} color={colors.primary} />}
            {icon && (
              <ScalableIcon
                name={icon}
                size={big ? 22 : 20}
                color={iconColor || (big ? colors.primary : colors.subText)}
                iconType={iconType || "Ionicons"}
              />
            )}
            {isWarning && <Dot style={styles.dot} />}
          </View>
        )}
        {children ?? (
          <View style={[styles.flex, styles.gap4]}>
            {title && <HeadingSmallText>{title}</HeadingSmallText>}
            {isLargeFontScale && subtitle && (
              <BodySmallText color={type === "dropDown" ? colors.text : colors.subText}>{subtitle}</BodySmallText>
            )}
            {description && <BodySmallText color={colors.subText}>{description}</BodySmallText>}
          </View>
        )}
      </View>

      <View
        style={[
          styles.row,
          styles.gap4,
          !isLargeFontScale && styles.limitWidth,
          isLargeFontScale && styles.flexWrap,
          isLargeFontScale && styles.alignStart,
        ]}
      >
        {subtitle && !isLargeFontScale && (
          <BodySmallText color={type === "dropDown" ? colors.text : colors.subText} style={styles.flexShrink}>
            {subtitle}
          </BodySmallText>
        )}
        {type === "switch" && <Switch value={isSelected} testID={switchTestID} />}
        {type === "dropDown" && <DropDownIcon />}
        {trailingIcon && (
          <ScalableIcon name={trailingIcon} size={18} color={colors.text} iconType={iconType || "Ionicons"} />
        )}
        {(!type || showChevron) && !hideChevron && (
          <ScalableIcon
            name="chevron-forward"
            size={18}
            color={colors.text}
            style={styles.chevron}
            iconType="Ionicons"
          />
        )}
      </View>
    </Button>
  );
});

export const DropDownIcon = (props: Omit<IconProps, "name">) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.dropDownIcon, { backgroundColor: colors.secondary }]}>
      <ScalableIcon name="chevron-expand" size={15} color={colors.subText} iconType="Ionicons" {...props} />
    </View>
  );
};

const styles = StyleSheet.create({
  gap4: { gap: 4 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  gap16: { gap: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  wrapRow: {
    flexWrap: "wrap",
  },
  flexWrap: {
    flexWrap: "wrap",
  },
  alignStart: {
    alignItems: "flex-start",
  },
  flex: {
    flex: 1,
    flexShrink: 1,
  },
  flexShrink: {
    flexShrink: 1,
  },
  limitWidth: {
    maxWidth: "50%",
  },
  bigMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  dot: {
    position: "absolute",
    top: -1,
    left: -1,
  },
  chevron: {
    marginRight: -6,
  },
  dropDownIcon: {
    padding: 2,
    borderRadius: 100,
  },
});
