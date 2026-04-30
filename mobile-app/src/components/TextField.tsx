import React, { useState, useMemo, forwardRef, useRef, useImperativeHandle, useEffect } from "react";
import { useTheme } from "@react-navigation/native";
import { FONTFAMILY } from "@/constants/color";
import { View, StyleSheet, TextInput, TouchableOpacity, TextInputProps } from "react-native";
import { TextInput as RNGHTextInput } from "react-native-gesture-handler";
import { ScalableIcon } from "./ScalableIcon";
import { FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";

const LEFT_ICONS = {
  password: "lock-closed-outline",
  email: "mail-outline",
  url: "link-outline",
  search: "search-outline",
};

const INPUT_ICON_SIZE = 20;
const INPUT_ICON_PADDING = 12;
const INPUT_LEFT_PADDING = INPUT_ICON_SIZE + INPUT_ICON_PADDING * 2;
const INPUT_RIGHT_PADDING = INPUT_ICON_SIZE + INPUT_ICON_PADDING * 2;

interface TextFieldProps extends TextInputProps {
  clearable?: boolean;
  inputStyle?: TextInputProps["style"];
  type?: "password" | "email" | "numeric" | "url" | "search";
  validationError?: string;
  small?: boolean;
  transparent?: boolean;
  errorMessage?: string;
  useRNGHTextInput?: boolean;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    clearable,
    type,
    value,
    multiline,
    editable = true,
    autoFocus,
    inputStyle,
    small,
    transparent,
    style,
    errorMessage,
    onFocus,
    onBlur,
    onChangeText,
    useRNGHTextInput,
    ...props
  },
  ref,
) {
  const { colors } = useTheme();
  const leftIcon = LEFT_ICONS[type] || null;

  const localRef = useRef<RNGHTextInput>(null);
  useImperativeHandle(ref, () => localRef.current);

  const showClearButton = useMemo(() => clearable && editable && value?.length > 0, [clearable, editable, value]);

  const [isFocused, setIsFocused] = useState(autoFocus);
  const [secureTextEntry, setSecureTextEntry] = useState(type === "password");

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => localRef.current && localRef.current.focus(), 100);
    }
  }, [autoFocus]);

  const TextInputComponent: typeof TextInput | typeof RNGHTextInput = useRNGHTextInput ? RNGHTextInput : TextInput;

  const borderColor = errorMessage ? colors.danger : isFocused ? colors.border : colors.secondaryBorder;

  return (
    <View
      style={[
        styles.container,
        !transparent && [{ backgroundColor: colors.secondary, borderColor }, styles.border],
        !editable && styles.containerDisabled,
        style,
      ]}
    >
      {leftIcon && (
        <View pointerEvents="none" style={[styles.leftIconSlot, { width: INPUT_LEFT_PADDING }]}>
          <ScalableIcon
            name={leftIcon}
            size={INPUT_ICON_SIZE}
            style={styles.leftIcon}
            color={colors.subText}
            iconType="Ionicons"
            scaleOptions={{ maxFontScale: FONT_SCALE_LIMIT.TEXT_INPUT }}
          />
        </View>
      )}
      <TextInputComponent
        ref={localRef}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          { color: colors.text },
          small && styles.smallInput,
          leftIcon && { paddingLeft: INPUT_LEFT_PADDING },
          multiline && styles.inputMultiline,
          inputStyle,
        ]}
        placeholderTextColor={colors.border}
        underlineColorAndroid="transparent"
        maxFontSizeMultiplier={FONT_SCALE_LIMIT.TEXT_INPUT}
        secureTextEntry={secureTextEntry && type === "password"}
        inputMode={type === "password" ? "text" : type} // There is no password mode
        autoCapitalize={type ? "none" : "sentences"} // We don't want autocaps for any of the special types
        autoCorrect={type === "email" || type === "url" ? false : true}
        {...{ value, onChangeText, editable, multiline, ...props }}
      />
      {showClearButton && (
        <TouchableOpacity
          testID="test:id/clear-text"
          style={{ width: INPUT_RIGHT_PADDING }}
          onPress={() => {
            localRef?.current?.clear?.();
            onChangeText?.("");
          }}
        >
          <ScalableIcon
            name="close-circle"
            size={INPUT_ICON_SIZE}
            color={colors.subText}
            style={styles.rightIcon}
            iconType="Ionicons"
            scaleOptions={{ maxFontScale: FONT_SCALE_LIMIT.TEXT_INPUT }}
          />
        </TouchableOpacity>
      )}
      {type === "password" && (
        <TouchableOpacity
          style={{ width: INPUT_RIGHT_PADDING }}
          onPress={() => setSecureTextEntry((prev) => !prev)}
          testID="test:id/toggle-password-visibility"
        >
          <ScalableIcon
            name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
            size={INPUT_ICON_SIZE}
            color={colors.subText}
            style={styles.rightIcon}
            iconType="Ionicons"
            scaleOptions={{ maxFontScale: FONT_SCALE_LIMIT.TEXT_INPUT }}
          />
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    zIndex: 1, // To put its' border above adjacent elements in a group
  },
  border: {
    borderWidth: 1,
  },
  containerDisabled: {
    opacity: 0.4,
  },
  input: {
    fontFamily: FONTFAMILY.FENWICK,
    fontWeight: "400",
    fontSize: 14,
    minHeight: 48,
    padding: 12,
    flex: 1,
  },
  smallInput: {
    minHeight: 0,
    paddingVertical: 8,
  },
  inputMultiline: {
    textAlignVertical: "top",
    minHeight: 80,
  },
  leftIconSlot: {
    position: "absolute",
  },
  leftIcon: {
    textAlign: "center",
  },

  rightIcon: {
    textAlign: "center",
  },
});
