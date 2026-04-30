import React from "react";
import { StyleSheet } from "react-native";
import { continueWithGoogle } from "@/actions/UserActions";
import { useTheme } from "@react-navigation/native";
import { Button } from "@/components/Button";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { GoogleLogoIcon } from "@/assets";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";

export const ContinueWithGoogleButton = ({ setIsLoading }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onPress = async () => {
    setIsLoading(true);
    await dispatch(continueWithGoogle());
    setIsLoading(false);
    postHogCapture(POSTHOG_EVENT_NAMES.SIGNIN_WITH_GOOGLE);
  };

  return (
    <Button
      renderLeftIcon={<GoogleLogoIcon width={18} />}
      title={t("signIn.googleSignIn")}
      backgroundColor={colors.background}
      style={styles.button}
      onPress={onPress}
      testID="test:id/google-sign-up"
    />
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 48,
  },
});
