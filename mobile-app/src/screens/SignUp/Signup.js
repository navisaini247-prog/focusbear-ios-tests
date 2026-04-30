import React, { useState } from "react";
import { ScrollView, View, TouchableOpacity, KeyboardAvoidingView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Checkbox, FullPageLoading, TextField, Or, Button, ConfirmationButton } from "@/components";
import { BearLoading } from "@/components/LoadingScreen";
import { BodyLargeText, DisplayXLargeText, Text, HeadingXLargeText } from "@/components/Text";
import { signup } from "@/actions/UserActions";
import { PasswordRules } from "@/components/PasswordRules";
import { NAVIGATION } from "@/constants";
import { useTranslation } from "react-i18next";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { NormalAlert } from "@/utils/GlobalMethods";
import { useDispatch, useSelector } from "react-redux";
import { ContinueWithGoogleButton } from "@/components/ContinueWithGoogleButton";
import { styles } from "./Signup.styles";
import { AppleSignInButton } from "@/components/SignInWithAppleButton";
import { useConsentToPrivacyPolicy } from "@/hooks/use-consent-to-privacy-policy";
import { useNavigation, useTheme } from "@react-navigation/native";
import PropTypes from "prop-types";
import { Trans } from "react-i18next";
import { isValidEmail } from "@/utils/GlobalUtils";
import { checkIsIOS } from "@/utils/PlatformMethods";
import { HorizontalAppLogo } from "@/components/AppLogo";
import Icon from "react-native-vector-icons/MaterialIcons";
import { participantCodeEmailSelector } from "@/selectors/UserSelectors";
import { useHomeContext } from "@/screens/Home/context";
import { postHogCapture } from "@/utils/Posthog";
import { validatePassword } from "@/utils/passwordValidation";
import { GUEST_PASSWORD, createGuestEmail } from "@/hooks/useIsGuestAccount";
import WelcomeBear9 from "@/assets/bears/welcome-bear-9.png";
import { FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";

export function TermsAndConditions({ isAgree, onChange }) {
  const navigation = useNavigation();
  const navigateToTOS = () => navigation.navigate(NAVIGATION.PrivacyTerms, { isFrom: t("common.termsOfUse") });
  const navigateToPrivacy = () => {
    postHogCapture(POSTHOG_EVENT_NAMES.VIEWING_PRIVACY_POLICY);
    navigation.navigate(NAVIGATION.PrivacyTerms, { isFrom: t("common.privacyPolicy") });
  };
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity onPress={onChange} hitSlop={16} style={styles.termsContainer} data-test-skip>
      <Checkbox value={isAgree} testID="test:id/agree-terms" />
      <View style={styles.termsTextContainer}>
        <Trans
          i18nKey={"signUp.tosAndPP"}
          parent={BodyLargeText}
          style={styles.termsText}
          components={{
            bold: <Text size="inherit" onPress={navigateToTOS} color={colors.primary} />,
            bold1: <Text size="inherit" onPress={navigateToPrivacy} color={colors.primary} />,
          }}
        />
      </View>
    </TouchableOpacity>
  );
}

TermsAndConditions.propTypes = {
  isAgree: PropTypes.bool,
  onChange: PropTypes.func,
};

export const AuthSignInButtons = ({ setIsLoading, isSignUp = false }) => (
  <>
    {checkIsIOS() && <AppleSignInButton isSignUp={isSignUp} setIsLoading={setIsLoading} />}
    <ContinueWithGoogleButton isSigningUp={isSignUp} setIsLoading={setIsLoading} />
  </>
);

AuthSignInButtons.propTypes = {
  setIsLoading: PropTypes.func,
  isSignUp: PropTypes.bool,
};

const Signup = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const guestEmail = createGuestEmail();

  const participantCodeEmail = useSelector(participantCodeEmailSelector);
  const juniorBearMode = useSelector((state) => state.global.juniorBearMode) || "normal";
  const isPirate = juniorBearMode === "pirate";
  const { isUnicasStudyParticipant } = useHomeContext();

  const [credentials, setCredentials] = useState({
    email: isUnicasStudyParticipant ? participantCodeEmail : "",
    password: "",
    isAgreed: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showEmailFields, setShowEmailFields] = useState(!!participantCodeEmail);

  useConsentToPrivacyPolicy();

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!credentials.email) {
      NormalAlert({ message: t("signIn.enterEmailError") });
      return;
    }
    if (!isValidEmail(credentials.email)) {
      NormalAlert({ message: t("signIn.enterValidEmailError") });
      return;
    }
    if (!credentials.password) {
      NormalAlert({ message: t("signIn.enterPasswordError") });
      return;
    }
    if (!validatePassword(credentials.password)) {
      NormalAlert({ message: t("passwordRules.passwordRequirements") });
      return;
    }
    if (!credentials.isAgreed) {
      NormalAlert({ message: t("signUp.acceptTerms") });
      return;
    }

    if (isUnicasStudyParticipant && participantCodeEmail && participantCodeEmail !== credentials.email) {
      NormalAlert({ message: t("participantCode.wrongEmail") });
      return;
    }

    setIsLoading(true);

    dispatch(
      signup(credentials.email, credentials.password, false, (_error) => {
        setIsLoading(false);
      }),
    );
  };

  const handleSignInAsGuest = () => {
    setIsLoading(true);
    setIsGuestLoading(true);
    postHogCapture(POSTHOG_EVENT_NAMES.SIGNIN_AS_GUEST);
    dispatch(
      signup(guestEmail, GUEST_PASSWORD, true, () => {
        setIsLoading(false);
        setIsGuestLoading(false);
      }),
    );
  };

  return (
    <>
      <SafeAreaView edges={["top"]} style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={checkIsIOS() ? "padding" : null}>
          <ScrollView style={styles.flex} contentContainerStyle={styles.contentContainer}>
            <HorizontalAppLogo />
            <View style={styles.headerContainer}>
              <DisplayXLargeText maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI} center>
                {t("signUp.signUp")}
              </DisplayXLargeText>
              <HeadingXLargeText center color={colors.subText}>
                {t("common.welcome")}
              </HeadingXLargeText>
            </View>

            <View style={[styles.bodyContainer, styles.flex]}>
              {!showEmailFields ? (
                <>
                  <AuthSignInButtons setIsLoading={setIsLoading} isSignUp={true} />
                  <Or />
                  <Button
                    style={styles.emailButton}
                    title={t("signUp.emailSignup")}
                    testID="test:id/sign-up-with-email"
                    onPress={() => setShowEmailFields(true)}
                    renderLeftIcon={<Icon name="email" size={24} color={colors.text} />}
                  />
                  <Or />
                  <Button
                    title={t("signUp.continueWithNoAccount")}
                    testID="test:id/enable-guest-mode"
                    onPress={() => {
                      handleSignInAsGuest();
                    }}
                  />
                </>
              ) : (
                <>
                  <TextField
                    type="email"
                    placeholder={t("signIn.enterEmailHint")}
                    value={credentials.email}
                    onChangeText={(value) => setCredentials((prev) => ({ ...prev, email: value.trim() }))}
                    autoComplete="email"
                    textContentType="emailAddress" // for iOS
                    testID="test:id/email"
                    autoCorrect={false}
                  />
                  <TextField
                    type="password"
                    placeholder={t("signIn.enterPasswordHint")}
                    value={credentials.password}
                    onChangeText={(value) => setCredentials((prev) => ({ ...prev, password: value.trim() }))}
                    style={styles.passwordContainer}
                    autoComplete="new-password"
                    textContentType="newPassword" // for iOS
                    testID="test:id/password"
                  />
                  <PasswordRules password={credentials.password} submitted={submitted} />
                  {!isUnicasStudyParticipant && (
                    <TouchableOpacity onPress={() => setShowEmailFields(false)} testID="test:id/back-to-signup">
                      <BodyLargeText center underline color={colors.subText}>
                        {t("signUp.backToSignUpMethod")}
                      </BodyLargeText>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
            {!showEmailFields && (
              <TouchableOpacity
                onPress={() => {
                  postHogCapture(POSTHOG_EVENT_NAMES.ALREADY_HAVE_AN_ACCOUNT);
                  navigation.replace(NAVIGATION.SignIn);
                }}
                testID="test:id/already-have-account"
              >
                <BodyLargeText center underline color={colors.subText}>
                  {t("signUp.alreadyHaveAccount") + " " + t("signIn.logIn")}
                </BodyLargeText>
              </TouchableOpacity>
            )}
            <View style={styles.bearSpacer} />
            {!isPirate && <Image source={WelcomeBear9} style={styles.bearImage} resizeMode="contain" />}
          </ScrollView>

          {showEmailFields && (
            <ConfirmationButton
              confirmTestID="test:id/sign-up"
              onConfirm={handleSubmit}
              confirmTitle={t("signUp.signUp")}
            />
          )}
          {isGuestLoading ? <BearLoading visible={isLoading} /> : <FullPageLoading show={isLoading} />}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};

export default Signup;
