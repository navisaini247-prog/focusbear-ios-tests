import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SmallButton, HeadingSmallText, FullPageLoading, ScalableIcon } from "@/components";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { logout } from "@/actions/UserActions";
import { useTheme } from "@react-navigation/native";
import { addErrorLog, addInfoLog } from "@/utils/FileLogger";

export const GuestWidget = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const signOutOfGuestAccount = async () => {
    try {
      setIsLoggingOut(true);
      addInfoLog("User logging out in account settings!");
      await dispatch(logout());
    } catch (error) {
      addErrorLog("Fail to log out", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeadingSmallText color={colors.subText}>{t("home.guestSignUpDescription")}</HeadingSmallText>
      <SmallButton
        title={t("signUp.signUp")}
        titleNumberOfLines={2}
        renderRightIcon={<ScalableIcon name="chevron-forward" size={14} color={colors.text} />}
        onPress={signOutOfGuestAccount}
      />
      <FullPageLoading show={isLoggingOut} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});
