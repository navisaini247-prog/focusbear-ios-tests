import React from "react";
import { StyleSheet, Pressable, PressableProps, StyleProp, View, ViewStyle } from "react-native";
import { HeadingSmallText, HeadingMediumText, FullPageLoading } from "@/components";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardStickyView, KeyboardStickyViewProps } from "react-native-keyboard-controller";
import { useTheme } from "@react-navigation/native";

export interface PressableWithFeedbackProps extends PressableProps {
  disabledWithoutStyleChange?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const PressableWithFeedback: React.FC<PressableWithFeedbackProps> = ({
  disabled,
  disabledWithoutStyleChange,
  style,
  children,
  ...props
}) => {
  const { colors } = useTheme();

  return (
    <Pressable
      testID={props.testID}
      disabled={disabled || disabledWithoutStyleChange}
      style={[styles.pressable, disabled && styles.semiTransparent, style]}
      {...props}
    >
      {({ pressed }) => (
        <>
          <View style={[styles.pressableFeedback, pressed && styles.pressed, { backgroundColor: colors.text }]} />
          {children}
        </>
      )}
    </Pressable>
  );
};

export interface ButtonProps extends PressableWithFeedbackProps {
  title?: React.ReactNode;
  titleNumberOfLines?: number;
  maxFontSizeMultiplier?: number;
  primary?: boolean;
  subtle?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  renderLeftIcon?: React.ReactNode;
  renderRightIcon?: React.ReactNode;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  titleNumberOfLines,
  maxFontSizeMultiplier,
  primary,
  subtle,
  isLoading,
  disabled,
  style,
  renderLeftIcon,
  renderRightIcon,
  textColor,
  backgroundColor,
  borderColor,
  children,
  ...props
}) => {
  const { colors } = useTheme();
  primary = disabled ? false : primary;
  textColor ||= primary ? colors.white : colors.text;
  backgroundColor ||= primary ? colors.primary : subtle ? colors.card : colors.secondary;
  borderColor ||= primary ? colors.primaryBorder : subtle ? colors.separator : colors.secondaryBorder;

  return (
    <PressableWithFeedback
      style={[styles.button, { backgroundColor, borderColor }, style]}
      disabledWithoutStyleChange={isLoading || disabled}
      {...props}
      data-test-skip
    >
      {children ?? (
        <View style={styles.buttonContentContainer}>
          {renderLeftIcon}
          {Boolean(title) && (
            <HeadingMediumText
              center
              color={textColor}
              numberOfLines={titleNumberOfLines}
              maxFontSizeMultiplier={maxFontSizeMultiplier}
            >
              {title}
            </HeadingMediumText>
          )}
          {renderRightIcon}
        </View>
      )}
      {disabled && <View style={[styles.disableOverlay, { backgroundColor }]} />}
      <FullPageLoading show={isLoading} size="small" color={textColor} style={{ backgroundColor }} />
    </PressableWithFeedback>
  );
};

interface SelectableButtonProps extends PressableWithFeedbackProps {
  selected?: boolean;
  title?: React.ReactNode;
  maxFontSizeMultiplier?: number;
}

export const SelectableButton: React.FC<SelectableButtonProps> = ({
  style,
  selected,
  children,
  title,
  maxFontSizeMultiplier,
  ...props
}) => {
  const { colors } = useTheme();

  return (
    <Button
      style={[styles.selectableButton, selected && [styles.selectedButton, { borderColor: colors.primary }], style]}
      {...props}
      data-test-skip
    >
      {children ?? <HeadingSmallText maxFontSizeMultiplier={maxFontSizeMultiplier}>{title}</HeadingSmallText>}
    </Button>
  );
};

export const SmallButton: React.FC<ButtonProps> = ({ title, style, maxFontSizeMultiplier, ...props }) => (
  <Button
    style={[styles.smallButton, style]}
    title={
      title && (
        <HeadingSmallText color="inherit" maxFontSizeMultiplier={maxFontSizeMultiplier}>
          {title}
        </HeadingSmallText>
      )
    }
    maxFontSizeMultiplier={maxFontSizeMultiplier}
    {...props}
    data-test-skip
  />
);

interface FloatingButtonProps extends ButtonProps {
  keyboardStickyViewProps?: KeyboardStickyViewProps;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({ style, keyboardStickyViewProps, ...props }) => {
  const { shadowStyles } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={["bottom"]} style={styles.floatingButtonContainer} pointerEvents="box-none">
      <KeyboardStickyView offset={{ opened: insets.bottom }} {...keyboardStickyViewProps}>
        <Button style={[styles.floatingButton, shadowStyles.bigShadow, style]} {...props} data-test-skip />
      </KeyboardStickyView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  pressable: {
    overflow: "hidden",
    borderRadius: 12,
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    minHeight: 48,
  },
  smallButton: {
    minHeight: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  selectableButton: {
    minHeight: 40,
  },
  selectedButton: {
    borderWidth: 2,
    paddingVertical: 11,
    paddingHorizontal: 15,
    zIndex: 1,
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
  },
  floatingButton: {
    borderRadius: 24,
    paddingHorizontal: 24,
  },
  buttonContentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  semiTransparent: {
    opacity: 0.5,
  },
  disableOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  pressableFeedback: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
  pressed: {
    opacity: 0.1,
  },
});
