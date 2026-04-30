import React, { useState } from "react";
import { ScrollView, View, TouchableOpacity, KeyboardAvoidingView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FullPageLoading, TextField, ConfirmationButton, Or, Button } from "@/components";
import { BodyLargeText, DisplayXLargeText, HeadingXLargeText } from "@/components/Text";
import { useTheme } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { loginWithDetails } from "@/actions/UserActions";
import { useTranslation } from "react-i18next";
import { styles } from "@/screens/SignUp/Signup.styles";
import { NAVIGATION } from "@/constants";
import { NormalAlert } from "@/utils/GlobalMethods";
import { useNavigation, useRoute } from "@react-navigation/native";
import { checkIsIOS } from "@/utils/PlatformMethods";

import { isValidEmail } from "@/utils/GlobalUtils";
import { HorizontalAppLogo } from "@/components/AppLogo";
import { AuthSignInButtons } from "../SignUp/Signup";
import { participantCodeEmailSelector } from "@/selectors/UserSelectors";
import { useHomeContext } from "@/screens/Home/context";
import WelcomeBear9 from "@/assets/bears/welcome-bear-9.png";
import Icon from "react-native-vector-icons/MaterialIcons";
import { FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";

export function SignIn() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { isUnicasStudyParticipant } = useHomeContext();
  const participantCodeEmail = useSelector(participantCodeEmailSelector);
  const juniorBearMode = useSelector((state) => state.global.juniorBearMode) || "normal";
  const isPirate = juniorBearMode === "pirate";
  const returnToOnboarding = Boolean(route?.params?.returnToOnboarding);

  const [credentials, setCredentials] = useState({
    email: isUnicasStudyParticipant ? participantCodeEmail : "",
    password: "",
    isGoogleSignIn: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailFields, setShowEmailFields] = useState(!!participantCodeEmail);

  const handleSubmit = async () => {
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
    if (isUnicasStudyParticipant && participantCodeEmail !== credentials.email) {
      NormalAlert({ message: t("signIn.enterValidEmailError") });
      return;
    }
    setIsLoading(true);

    dispatch(loginWithDetails(credentials.email, credentials.password, false, false, () => setIsLoading(false)));
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={checkIsIOS() ? "padding" : null}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.contentContainer}>
          <HorizontalAppLogo />

          <View style={styles.headerContainer}>
            <DisplayXLargeText maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI} center>
              {t("signIn.logIn")}
            </DisplayXLargeText>
            <HeadingXLargeText center color={colors.subText}>
              {t("common.welcome")}
            </HeadingXLargeText>
          </View>

          <View style={[styles.bodyContainer, styles.flex]}>
            {!showEmailFields ? (
              <>
                {!isUnicasStudyParticipant && (
                  <>
                    <AuthSignInButtons setIsLoading={setIsLoading} isSignUp={false} />
                    <Or />
                  </>
                )}
                <Button
                  style={styles.emailButton}
                  title={t("signIn.startWithEmail")}
                  testID="test:id/start-with-email"
                  onPress={() => setShowEmailFields(true)}
                  renderLeftIcon={<Icon name="email" size={24} color={colors.text} />}
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
                  autoComplete="current-password"
                  textContentType="password" // for iOS
                  testID="test:id/password"
                />

                <View style={styles.forgot_password_container}>
                  <BodyLargeText
                    center
                    color={colors.subText}
                    underline
                    onPress={() => navigation.navigate(NAVIGATION.ForgotPassword)}
                    testID="test:id/forgot-password"
                  >
                    {t("signIn.forgotPassword")}
                  </BodyLargeText>
                </View>
                {!isUnicasStudyParticipant && (
                  <TouchableOpacity onPress={() => setShowEmailFields(false)} testID="test:id/back-to-signin">
                    <BodyLargeText center underline color={colors.subText}>
                      {t("signIn.backToSignInMethod")}
                    </BodyLargeText>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {!showEmailFields && (
            <TouchableOpacity
              onPress={() => navigation.popTo(returnToOnboarding ? NAVIGATION.BearOnboarding : NAVIGATION.SignUp)}
              testID="test:id/dont-have-account"
            >
              <BodyLargeText underline center color={colors.subText}>
                {t("signIn.dontHaveAccount") + " " + t("signIn.signup")}
              </BodyLargeText>
            </TouchableOpacity>
          )}
          <View style={styles.bearSpacer} />
          {!isPirate && <Image source={WelcomeBear9} style={styles.bearImage} resizeMode="contain" />}
        </ScrollView>
        {showEmailFields && (
          <ConfirmationButton
            confirmTestID="test:id/log-in"
            onConfirm={handleSubmit}
            confirmTitle={t("signIn.logIn")}
          />
        )}
      </KeyboardAvoidingView>
      <FullPageLoading show={isLoading} />
    </SafeAreaView>
  );
}
