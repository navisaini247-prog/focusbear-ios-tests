import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, UIManager, ScrollView, Linking } from "react-native";
import { useTheme } from "@react-navigation/native";
import { BodyMediumText, DisplaySmallText, ConfirmationButton } from "@/components";
import { NAVIGATION } from "@/constants";
import { useDispatch } from "react-redux";
import { consentToPrivacyPolicy } from "@/actions/UserActions";
import { TermsAndConditions } from "../SignUp/Signup";
import { useNavigation } from "@react-navigation/native";
import { Trans } from "react-i18next";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { SafeAreaView } from "react-native-safe-area-context";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";

//this is for the small accordion section, visible only to android users as per issue 848
if (checkIsAndroid()) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 32,
    paddingTop: 48,
    paddingBottom: 16,
  },
  paragraph: {
    marginTop: 16,
  },
});

function PrivacyNoticeScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const dispatch = useDispatch();
  const [isConsented, setIsConsented] = useState(false);

  const onAccept = () => {
    dispatch(consentToPrivacyPolicy());
    navigation.replace(NAVIGATION.SignUp);
  };

  const onNavigateToPrivacy = () => navigation.navigate(NAVIGATION.PrivacyTerms, { isFrom: t("common.privacyPolicy") });

  const onEmailSupport = () => {
    Linking.openURL("mailto:support@focusbear.io").catch(() => {
      // Fail silently; no-op if mail client not available
    });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.flex}>
      <View style={styles.contentContainer}>
        <DisplaySmallText center>{t("privacyModal.heading")}</DisplaySmallText>
        <ScrollView style={styles.flex}>
          <BodyMediumText style={styles.paragraph}>{t("privacyModal.notShareData")}</BodyMediumText>
          <BodyMediumText style={styles.paragraph}>{t("privacyModal.doNotLog")}</BodyMediumText>
          <BodyMediumText style={styles.paragraph}>{t("privacyModal.dataEncrypted")}</BodyMediumText>
          {checkIsAndroid() && (
            <BodyMediumText style={styles.paragraph}>{t("privacyModal.chooseToBlock")}</BodyMediumText>
          )}
          <Trans
            defaults={t("privacyModal.moreDetails")}
            parent={BodyMediumText}
            style={styles.paragraph}
            components={{
              bold: <BodyMediumText onPress={onNavigateToPrivacy} style={{ color: colors.primary }} />,
              email: <BodyMediumText onPress={onEmailSupport} style={{ color: colors.primary }} />,
            }}
          />
        </ScrollView>
        <TermsAndConditions
          isAgree={isConsented}
          onChange={() => {
            if (!isConsented) {
              postHogCapture(POSTHOG_EVENT_NAMES.AGREE_TO_TERMS_OF_SERVICE_AND_PRIVACY_POLICY);
            }
            setIsConsented((prev) => !prev);
          }}
        />
      </View>
      <ConfirmationButton
        onConfirm={onAccept}
        confirmTitle={t("privacyModal.accept")}
        disabled={!isConsented}
        confirmTestID="test:id/accept-privacy-notice"
      />
    </SafeAreaView>
  );
}

export { PrivacyNoticeScreen };
