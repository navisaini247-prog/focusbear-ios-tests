import React from "react";
import { useTheme } from "@react-navigation/native";
import { loginWithApple } from "@/actions/UserActions";
import { useDispatch } from "react-redux";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import Icon from "react-native-vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { BodyLargeText } from "@/components";
import COLOR from "@/constants/color";

export function AppleSignInButton({ isSignUp = false, setIsLoading = () => {} }) {
  const dispatch = useDispatch();
  const { isDarkTheme } = useTheme();
  const { t } = useTranslation();

  const backgroundColor = isDarkTheme ? COLOR.WHITE : COLOR.BLACK;
  const textColor = isDarkTheme ? COLOR.BLACK : COLOR.WHITE;

  const onAppleButtonPress = () => {
    setIsLoading(true);
    dispatch(loginWithApple(() => setIsLoading(false)));
    postHogCapture(POSTHOG_EVENT_NAMES.SIGNIN_WITH_APPLE);
  };

  return (
    <TouchableOpacity
      onPress={onAppleButtonPress}
      style={[styles.appleButton, { backgroundColor }]}
      activeOpacity={0.8}
      testID={isSignUp ? "test:id/apple-signup" : "test:id/apple-signin"}
    >
      <View style={styles.contentRow}>
        <Icon style={styles.iconSlot} name="logo-apple" size={24} color={textColor} />
        <View style={styles.titleSlot}>
          <BodyLargeText center color={textColor} numberOfLines={2}>
            {t("signIn.startWithApple")}
          </BodyLargeText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  appleButton: {
    width: "100%",
    minHeight: 55,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    justifyContent: "center",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  iconSlot: {
    flexShrink: 0,
    paddingLeft: 4,
  },
  titleSlot: {
    flexShrink: 1,
    minWidth: 0,
    alignItems: "center",
  },
});
