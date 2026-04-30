import React, { memo } from "react";
import { useWindowDimensions } from "react-native";
import { useTheme } from "@react-navigation/native";
import type { IconProps } from "react-native-vector-icons/Icon";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { scaleByFontScale } from "@/utils/FontScaleUtils";

const ICON_COMPONENTS = {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  FontAwesome5,
  MaterialCommunityIcons,
} as const;

export type IconType = keyof typeof ICON_COMPONENTS;

export interface ScalableIconProps extends Omit<IconProps, "size" | "name"> {
  name: string;
  /** Base size in pixels. Scales with accessibility font scale when scaleWithText is true. */
  size?: number;
  /** Icon font family. Default: Ionicons */
  iconType?: IconType;
  /** Whether to scale size with text (accessibility). Default: true */
  scaleWithText?: boolean;
  /** Options for font scale: maxFontScale, round. */
  scaleOptions?: { maxFontScale?: number; round?: boolean };
}

const DEFAULT_SIZE = 20;

export const ScalableIcon = memo(function ScalableIcon({
  name,
  size = DEFAULT_SIZE,
  color,
  iconType = "Ionicons",
  scaleWithText = true,
  scaleOptions,
  style,
  ...rest
}: ScalableIconProps) {
  const { colors } = useTheme();
  const { fontScale } = useWindowDimensions();
  const IconComponent = ICON_COMPONENTS[iconType];

  const scaledSize = scaleWithText ? scaleByFontScale(size, fontScale, scaleOptions) : size;

  return <IconComponent name={name as any} size={scaledSize} color={color ?? colors.text} style={style} {...rest} />;
});
