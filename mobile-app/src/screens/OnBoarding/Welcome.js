import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { NAVIGATION } from "@/constants";
import { Button } from "@/components";
import { useNavigation, useTheme } from "@react-navigation/native";
import { TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { VerticalAppLogo } from "@/components/AppLogo";
import { BodyLargeText, DisplayLargeText, HeadingLargeText } from "@/components/Text";
import { useDispatch, useSelector } from "react-redux";
import { setFirstAppOpenPostHogCaptured, setHasGoneThroughIntroduction } from "@/actions/GlobalActions";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { postHogCapture } from "@/utils/Posthog";

export function Welcome() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isFirstAppOpenPostHogCaptured = useSelector((state) => state.global.isFirstAppOpenPostHogCaptured);

  useEffect(() => {
    dispatch(setHasGoneThroughIntroduction(false));
    if (!isFirstAppOpenPostHogCaptured) {
      postHogCapture(POSTHOG_EVENT_NAMES.USER_OPEN_THE_APP_FOR_THE_FIRST_TIME);
      dispatch(setFirstAppOpenPostHogCaptured(true));
    }
  }, [isFirstAppOpenPostHogCaptured, dispatch]);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, styles.flex]}>
      <VerticalAppLogo iconSize={120} style={styles.logoImage} />
      <DisplayLargeText center style={styles.headingText}>
        {t("onboarding.welcomeAboard")}
      </DisplayLargeText>
      <HeadingLargeText center>{t("onboarding.lookingForwardToHelp")}</HeadingLargeText>
      <View style={styles.subContainer}>
        <Button
          primary
          testID="test:id/start-onboarding"
          onPress={() => navigation.replace(NAVIGATION.BearOnboarding)}
          title={t("onboarding.letsDoIt")}
        />
        <TouchableOpacity
          onPress={() => {
            postHogCapture(POSTHOG_EVENT_NAMES.ALREADY_HAVE_AN_ACCOUNT);
            navigation.replace(NAVIGATION.SignIn);
          }}
          testID="test:id/already-have-account"
        >
          <BodyLargeText center underline color={colors.subText}>
            {t("signIn.alreadyHaveAccount")}
          </BodyLargeText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 32,
  },
  logoImage: {
    alignSelf: "center",
  },
  headingText: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  subContainer: {
    flex: 1,
    justifyContent: "flex-end",
    gap: 12,
  },
});
