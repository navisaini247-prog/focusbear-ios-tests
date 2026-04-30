import React, { useState } from "react";
import { Image } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { TYPES } from "@/actions/UserActions";
import {
  Button,
  FullPageLoading,
  TextField,
  HeadingMediumText,
  HeadingLargeText,
  ConfirmationModal,
} from "@/components";
import { useTranslation } from "react-i18next";
import { styles } from "@/screens/ForgotPassword/ForgotPassword.styles";
import { isLoadingSelector } from "@/selectors/StatusSelectors";
import { NAVIGATION } from "@/constants";
import { ic_logo } from "@/assets";
import Toast from "react-native-toast-message";
import { useForgotPassword } from "@/hooks/use-forgot-password";
import { TimeCountDown } from "@/components/TimeCountDown";
import { addErrorLog } from "@/utils/FileLogger";
import { FORGOT_PASSWORD_ERROR_TYPES } from "@/constants/forgotPassword";

export function ForgotPassword({ navigation }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isLoading = useSelector((state) => isLoadingSelector([TYPES.LOGIN], state));

  const [showUnverifiedModal, setShowUnverifiedModal] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);

  const {
    email,
    setEmail,
    coolDownEndTime,
    isProcessing,
    resetPassword,
    sendVerificationEmailLink,
    startCoolDown,
    handleCoolDownComplete,
  } = useForgotPassword();

  const handlePasswordReset = async () => {
    try {
      await resetPassword();

      // Reset password link has successfully been sent
      Toast.show({
        type: "success",
        text1: t("common.Success"),
        text2: t("forgotPassword.resetLinkSent"),
      });
    } catch (error) {
      switch (error?.type) {
        case FORGOT_PASSWORD_ERROR_TYPES.UNVERIFIED_EMAIL:
          setShowUnverifiedModal(true);
          addErrorLog(`Password Reset Failed: ${error?.message}`);
          break;

        case FORGOT_PASSWORD_ERROR_TYPES.OAUTH_ACCOUNT_THIRD_PARTY:
          setShowOAuthModal(true);
          addErrorLog(`Password Reset Failed: ${error?.message}`);
          break;

        case FORGOT_PASSWORD_ERROR_TYPES.EMAIL_DOES_NOT_EXIST:
          startCoolDown();
          addErrorLog(`Password Reset Failed: ${error?.message}`);
          // Even though email does not exist, show success message
          Toast.show({
            type: "success",
            text1: t("common.Success"),
            text2: t("forgotPassword.resetLinkSent"),
          });
          break;

        case FORGOT_PASSWORD_ERROR_TYPES.VALIDATION_ERROR:
          break;

        default:
          addErrorLog(`${error?.message}`);
          Toast.show({
            type: "success",
            text1: t("common.Success"),
            text2: t("forgotPassword.resetLinkSent"),
          });
      }
    }
  };

  const handleSendEmailVerification = async () => {
    try {
      await sendVerificationEmailLink();

      setShowUnverifiedModal(false);

      // Email verification email has successfully been sent
      Toast.show({
        type: "success",
        text1: t("common.Success"),
        text2: t("forgotPassword.verificationEmailSent"),
      });
    } catch (error) {
      addErrorLog(`${error?.message}`);

      Toast.show({
        type: "error",
        text1: t("common.Error"),
        text2: t("forgotPassword.verificationEmailFailed"),
      });
    }
  };

  const shouldDisableButtons = !!coolDownEndTime || isProcessing;

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAwareScrollView contentContainerStyle={[styles.contentContainer, styles.flex]}>
        <Image source={ic_logo} style={styles.image} />
        <HeadingLargeText center>{t("forgotPassword.forgotPasswordTitle")}</HeadingLargeText>
        <TextField
          placeholder={t("signIn.enterEmailHint")}
          value={email}
          onChangeText={(value) => setEmail(value.trim())}
          autoComplete="email"
          textContentType="emailAddress" // for iOS
          testID="test:id/email"
        />

        <Button
          key={isProcessing}
          primary
          testID="test:id/reset-password"
          onPress={handlePasswordReset}
          title={coolDownEndTime ? t("forgotPassword.waitBeforeRetry") : t("forgotPassword.resetPassword")}
          isLoading={isProcessing}
          disabled={shouldDisableButtons}
        />

        {coolDownEndTime && <TimeCountDown time={coolDownEndTime} callback={handleCoolDownComplete} size={20} />}

        <HeadingMediumText
          color={colors.subText}
          underline
          center
          onPress={() => navigation.navigate(NAVIGATION.SignIn)}
          testID="test:id/back-to-signin"
        >
          {t("forgotPassword.backToSignIn")}
        </HeadingMediumText>
      </KeyboardAwareScrollView>

      <ConfirmationModal
        title={t("forgotPassword.forgotPasswordNotVerifiedTitle")}
        text={t("forgotPassword.forgotPasswordNotVerifiedBody")}
        isVisible={showUnverifiedModal}
        onCancel={() => setShowUnverifiedModal(false)}
        cancelTitle={t("common.no")}
        onConfirm={() => {
          handleSendEmailVerification();
        }}
        confirmTitle={t("common.verify")}
      ></ConfirmationModal>

      <ConfirmationModal
        title={t("forgotPassword.cannotResetPasswordOAuthAccountTitle")}
        text={t("forgotPassword.forgotPasswordErrorThirdParty")}
        isVisible={showOAuthModal}
        onCancel={() => setShowOAuthModal(false)}
        onConfirm={() => {
          setShowOAuthModal(false);
          navigation.navigate(NAVIGATION.SignIn);
        }}
        confirmTitle={t("forgotPassword.backToSignIn")}
        cancelTitle={t("common.cancel")}
      ></ConfirmationModal>
      <FullPageLoading show={isLoading} />
    </SafeAreaView>
  );
}
