import React, { memo } from "react";
import { Text as RNText, StyleSheet, TextProps as RNTextProps, TextStyle } from "react-native";
import { useTheme } from "@react-navigation/native";
import { FONTFAMILY } from "../constants/color";
import { FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";

/**
 * Only supports "normal", "300", "400", "700"
 */
export enum FONT_WEIGHT {
  DEFAULT = "normal",
  LIGHT = "300",
  NORMAL = "400",
  BOLD = "700",
}

export enum FONT_SIZE {
  DISPLAY_XXLARGE = 48,
  DISPLAY_XLARGE = 40,
  DISPLAY_LARGE = 32,
  DISPLAY_MEDIUM = 28,
  DISPLAY_SMALL = 24,
  HEADING_XLARGE = 20,
  HEADING_LARGE = 18,
  HEADING_MEDIUM = 16,
  HEADING_SMALL = 14,
  BODY_X_LARGE = 18,
  BODY_LARGE = 16,
  BODY_MEDIUM = 14,
  BODY_SMALL = 13,
  BODY_XSMALL = 12,
}

export interface TextProps extends RNTextProps {
  color?: TextStyle["color"] | "inherit";
  /**
   * Default is 14.
   */
  size?: number | "inherit";
  /**
   * Only supports "normal", "300", "400", "700"
   */
  weight?: "normal" | "300" | "400" | "700" | "inherit";
  italic?: boolean;
  center?: boolean;
  underline?: boolean;
}

/**
 * A base component for rendering text with optional styling props for convienience.
 * @param {String}  color - The color.
 * @param {Number}  size - The font size.
 * @param {String}  weight - The font weight.
 * @param {Boolean} italic - Italicize the text.
 * @param {Boolean} center - Center the text.
 * @param {Boolean} underline - Underline the text.
 */
const Text: React.FC<TextProps> = ({
  color,
  size,
  weight,
  italic,
  center,
  style,
  underline,
  maxFontSizeMultiplier,
  ...props
}) => {
  const { colors } = useTheme();
  const effectiveMaxFontSizeMultiplier = maxFontSizeMultiplier ?? FONT_SCALE_LIMIT.DEFAULT_TEXT;

  const styles = StyleSheet.create({
    customText: {
      fontFamily: FONTFAMILY.FENWICK,
      ...(color !== "inherit" && { color: color || colors.text }),
      ...(size !== "inherit" && { fontSize: size || FONT_SIZE.BODY_MEDIUM }),
      ...(weight !== "inherit" && { fontWeight: weight }),
      ...(italic && { fontStyle: "italic" }),
      ...(center && { textAlign: "center" }),
      ...(underline && { textDecorationLine: "underline" }),
    },
  });

  return (
    <RNText
      style={[styles.customText, style]}
      maxFontSizeMultiplier={effectiveMaxFontSizeMultiplier}
      textBreakStrategy="highQuality"
      lineBreakStrategyIOS="standard"
      {...props}
    />
  );
};

/**
 * Display XXLarge Text - Used for the largest display text.
 * Font size: 48
 * Font weight: Bold
 */
const DisplayXXLargeText: React.FC<TextProps> = ({ ...props }) => (
  <Text size={FONT_SIZE.DISPLAY_XXLARGE} weight={FONT_WEIGHT.BOLD} {...props} />
);

/**
 * Display XLarge Text - Used for extra large display text.
 * Font size: 40
 * Font weight: Bold
 */
const DisplayXLargeText: React.FC<TextProps> = ({ ...props }) => (
  <Text size={FONT_SIZE.DISPLAY_XLARGE} weight={FONT_WEIGHT.BOLD} {...props} />
);

/**
 * Display Large Text - Used for large display text.
 * Font size: 32
 * Font weight: Bold
 */
const DisplayLargeText: React.FC<TextProps> = ({ ...props }) => (
  <Text size={FONT_SIZE.DISPLAY_LARGE} weight={FONT_WEIGHT.BOLD} {...props} />
);

/**
 * Display Medium Text - Used for medium display text.
 * Font size: 28
 * Font weight: Bold
 */
const DisplayMediumText: React.FC<TextProps> = ({ ...props }) => (
  <Text size={FONT_SIZE.DISPLAY_MEDIUM} weight={FONT_WEIGHT.BOLD} {...props} />
);

/**
 * Display Small Text - Used for small display text.
 * Font size: 24
 * Font weight: Bold
 */
const DisplaySmallText: React.FC<TextProps> = ({ ...props }) => (
  <Text size={FONT_SIZE.DISPLAY_SMALL} weight={FONT_WEIGHT.BOLD} {...props} />
);

/**
 * Heading XLarge Text - Used for extra large heading text.
 * Font size: 20
 * Font weight: Normal
 */
const HeadingXLargeText: React.FC<TextProps> = ({ ...props }) => (
  <Text size={FONT_SIZE.HEADING_XLARGE} weight={FONT_WEIGHT.NORMAL} {...props} />
);

/**
 * Heading Large Text - Used for large heading text.
 * Font size: 18
 * Font weight: Normal
 */
const HeadingLargeText: React.FC<TextProps> = ({ ...props }) => (
  <Text size={FONT_SIZE.HEADING_LARGE} weight={FONT_WEIGHT.NORMAL} {...props} />
);

/**
 * Heading Medium Text - Used for medium heading text.
 * Font size: 16
 * Font weight: Normal
 */
const HeadingMediumText: React.FC<TextProps> = ({ ...props }) => (
  <Text size={FONT_SIZE.HEADING_MEDIUM} weight={FONT_WEIGHT.NORMAL} {...props} />
);

/**
 * Heading Small Text - Used for small heading text.
 * Font size: 14
 * Font weight: Normal
 */
const HeadingSmallText: React.FC<TextProps> = ({ ...props }) => (
  <Text size={FONT_SIZE.HEADING_SMALL} weight={FONT_WEIGHT.NORMAL} {...props} />
);

/**
 * Body Large Text - Used for large body text.
 * Font size: 18
 * Font weight: Light
 */
const BodyXLargeText: React.FC<TextProps> = ({ ...props }) => (
  <Text size={FONT_SIZE.BODY_X_LARGE} weight={FONT_WEIGHT.LIGHT} {...props} />
);

/**
 * Body Large Text - Used for large body text.
 * Font size: 16
 * Font weight: Light
 */
const BodyLargeText: React.FC<TextProps> = ({ ...props }) => (
  <Text size={FONT_SIZE.BODY_LARGE} weight={FONT_WEIGHT.LIGHT} {...props} />
);

/**
 * Body Medium Text - Used for medium body text.
 * Font size: 14
 * Font weight: Light
 */
const BodyMediumText: React.FC<TextProps> = ({ ...props }) => (
  <Text size={FONT_SIZE.BODY_MEDIUM} weight={FONT_WEIGHT.LIGHT} {...props} />
);

/**
 * Body Small Text - Used for small body text.
 * Font size: 13
 * Font weight: Normal
 */
const BodySmallText: React.FC<TextProps> = ({ ...props }) => (
  <Text size={FONT_SIZE.BODY_SMALL} weight={FONT_WEIGHT.NORMAL} {...props} />
);

/**
 * Body XSmall Text - Used for extra small body text.
 * Font size: 12
 * Font weight: Normal
 */
const BodyXSmallText: React.FC<TextProps> = ({ ...props }) => (
  <Text size={FONT_SIZE.BODY_XSMALL} weight={FONT_WEIGHT.NORMAL} {...props} />
);

const memoizedText = memo(Text);

export {
  memoizedText as Text,
  DisplayXXLargeText,
  DisplayXLargeText,
  DisplayLargeText,
  DisplayMediumText,
  DisplaySmallText,
  HeadingXLargeText,
  HeadingLargeText,
  HeadingMediumText,
  HeadingSmallText,
  BodyLargeText,
  BodyMediumText,
  BodySmallText,
  BodyXSmallText,
  BodyXLargeText,
};
