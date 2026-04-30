import { View, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { NAVIGATION } from "@/constants";
import { useTranslation } from "react-i18next";
import { ConfirmationButton, DisplayLargeText, HeadingXLargeText, Text } from "@/components";
import { styles } from "./AllDone.styles";
import { useTheme } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { setIsOnboardingStatus } from "@/actions/GlobalActions";
import { useUpdateOnboardingProcess } from "@/hooks/use-update-onboarding-process";
import { addInfoLog } from "@/utils/FileLogger";
import { Trans } from "react-i18next";
import { FOCUS_BEAR_WEB_URL } from "@/utils/Enums";

export default function AllDone() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  useUpdateOnboardingProcess(NAVIGATION.AllDone);

  const doOnBoardingComplete = async () => {
    addInfoLog("onboarding complete!");
    dispatch(setIsOnboardingStatus(true));
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.flex}>
      <View style={[styles.container, styles.flex]}>
        <DisplayLargeText center>{t("onboarding.allDone")}</DisplayLargeText>
        <HeadingXLargeText center>{t("onboarding.installDesktopApp")}</HeadingXLargeText>
        <HeadingXLargeText center>
          <Trans
            i18nKey={"onboarding.installDesktopAppDesc"}
            components={{
              bold: (
                <Text onPress={() => Linking.openURL(FOCUS_BEAR_WEB_URL)} size={"inherit"} color={colors.primary} />
              ),
            }}
          />
        </HeadingXLargeText>
      </View>
      <ConfirmationButton
        confirmTestID="test:id/complete-onboarding"
        onConfirm={doOnBoardingComplete}
        confirmTitle={t("common.continue")}
      />
    </SafeAreaView>
  );
}
