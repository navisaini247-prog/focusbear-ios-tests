import React, { useState } from "react";
import { View, StyleSheet, Linking, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";
import { VerticalAppLogo } from "@/components/AppLogo";
import { BodyLargeText, HeadingLargeText, BodySmallText } from "@/components/Text";
import { Button } from "@/components/Button";
import { TextField } from "@/components";
import { NAVIGATION } from "@/constants";
import { useRoute } from "@react-navigation/native";
import { useTheme } from "@react-navigation/native";
import { setRegisteredParticipantCodeEmail } from "@/actions/UserActions";
import { useDispatch } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { useParticipantCode } from "@/hooks/useParticipantCode";
import COLOR from "@/constants/color";
import { manuallyEnrolledInUnicasStudySelector } from "@/selectors/GlobalSelectors";
import { useSelector } from "react-redux";
import { setManuallyEnrolledInUnicasStudy } from "@/actions/GlobalActions";
import { Space } from "@/components/Space";

const STUDY_INFO_URL =
  "https://docs.google.com/document/d/18Il-4z5IiL9f26jpIcfvgO5B_TvE4tcqiWEHOxEODlE/edit?usp=sharing";

const ParticipantCodeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { verifyCode } = useParticipantCode();

  const params = useRoute()?.params as {
    hasParticipantCode?: boolean;
  };

  const [hasParticipantCode, setHasParticipantCode] = useState(!!params?.hasParticipantCode);
  const [participantCode, setParticipantCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const manuallyEnrolledInUnicasStudy = useSelector(manuallyEnrolledInUnicasStudySelector);

  const handleMoreInfo = () => {
    Linking.openURL(STUDY_INFO_URL);
  };

  const handleApply = () => {
    navigation.navigate(NAVIGATION.ApplicationForm);
  };

  const handleHasParticipantCode = () => {
    setHasParticipantCode(true);
  };

  const handleContinue = async () => {
    try {
      const response = await verifyCode(participantCode);

      if (response.email) {
        dispatch(setRegisteredParticipantCodeEmail(response.email, participantCode));
        navigation.navigate(NAVIGATION.PrivacyConsent, { signUp: true });
      } else {
        setErrorMessage(t("participantCode.invalidCode"));
      }
    } catch (e) {
      setErrorMessage(t("participantCode.invalidCode"));
    }
  };

  const handleBack = () => {
    setHasParticipantCode(false);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <VerticalAppLogo iconSize={120} />
      {!hasParticipantCode ? (
        <>
          <View style={styles.descriptionContainer}>
            <Trans
              i18nKey="participantCode.description"
              parent={BodyLargeText}
              style={styles.description}
              components={{
                hereLink: <BodyLargeText center size={16} color={COLOR.BLUE[500]} underline onPress={handleMoreInfo} />,
              }}
              values={{ email: "support@focusbear.io" }}
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              primary
              title={t("participantCode.applyButton")}
              style={styles.button}
              onPress={handleApply}
              testID="test:id/apply-for-participation"
            />
            <Button
              title={t("participantCode.hasParticipantCode")}
              style={styles.button}
              onPress={handleHasParticipantCode}
              testID="test:id/has-participant-code"
            />
            <Space height={16} />
          </View>
          {manuallyEnrolledInUnicasStudy && (
            <TouchableOpacity
              onPress={() => {
                dispatch(setManuallyEnrolledInUnicasStudy(false));
                navigation.navigate(NAVIGATION.Welcome);
              }}
              testID="test:id/exit-unicaes"
            >
              <BodyLargeText center underline color={colors.subText}>
                {t("participantCode.exitUnicaesStudy")}
              </BodyLargeText>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View>
          <HeadingLargeText style={styles.title}>{t("participantCode.enterYourCode")}</HeadingLargeText>
          <TextField
            placeholder={"XXXXXX"}
            errorMessage={errorMessage}
            value={participantCode}
            onChangeText={setParticipantCode}
            autoCapitalize="none"
            autoComplete="off"
          />
          <BodySmallText style={styles.errorMessage} color={colors.danger}>
            {errorMessage}
          </BodySmallText>
          <Button
            title={t("participantCode.continue")}
            style={styles.button}
            onPress={handleContinue}
            primary
            testID="test:id/has-participant-code-continue-button"
          />
          <Button
            title={t("participantCode.back")}
            style={styles.button}
            onPress={handleBack}
            testID="test:id/has-participant-code-back-button"
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  errorMessage: {
    marginTop: 4,
  },
  title: {
    marginBottom: 16,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  description: {
    marginBottom: 8,
    lineHeight: 22,
    textAlign: "center",
  },
  button: {
    width: "100%",
    marginTop: 16,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  descriptionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export { ParticipantCodeScreen };
