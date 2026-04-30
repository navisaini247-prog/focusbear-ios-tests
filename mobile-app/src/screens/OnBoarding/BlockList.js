import React from "react";
import { View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ConfirmationButton, PressableWithFeedback, DisplaySmallText, HeadingMediumText } from "@/components";
import { NAVIGATION } from "@/constants";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { styles } from "./BlockList.styles";
import { checkIsIOS } from "@/utils/PlatformMethods";
import { HorizontalAppLogo } from "@/components/AppLogo";
import { useHomeContext } from "../Home/context";

export function BlockList() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const subTitle = Platform.select({
    ios: t("blockList.subTitleIos"),
    android: t("blockList.subTitleAndroidBlockList"),
  });

  const buttonText = Platform.select({
    ios: t("blockList.buttonIos"),
    android: t("blockList.buttonAndroidBlockList"),
  });

  const { isScreenTimePermissionGranted, isRequestingScreenTimePermission, requestScreenTimePermission } =
    useHomeContext();

  const gotoManageApps = Platform.select({
    ios: async () => {
      if (!isScreenTimePermissionGranted) {
        await requestScreenTimePermission();
        return;
      }
      navigation.replace(NAVIGATION.BlockingScheduleList, {});
    },
    // MARK: Handle OnBoarding After Redesign UI based on the modes user select (Geek Mode / Simple Mode)
    // https://github.com/Focus-Bear/mobile-app/issues/1639
    android: async () => {
      navigation.replace(NAVIGATION.AppsBlockList, { fromInduction: true });
    },
  });

  const onIosSkip = () => navigation.replace(NAVIGATION.SimpleHome, {});

  return (
    <SafeAreaView edges={["top"]} style={styles.flex}>
      <View style={[styles.flex, styles.container]}>
        <HorizontalAppLogo />
        <DisplaySmallText center>{t("blockList.title")}</DisplaySmallText>
        <HeadingMediumText center color={colors.subText}>
          {subTitle}
        </HeadingMediumText>
        <View style={styles.flex} />
        {checkIsIOS() && (
          <PressableWithFeedback onPress={onIosSkip} style={styles.pressable} testID="test:id/blocklist-skip-button">
            <HeadingMediumText color={colors.subText} underline>
              {t("common.skip")}
            </HeadingMediumText>
          </PressableWithFeedback>
        )}
      </View>
      <ConfirmationButton
        confirmTestID="test:id/show-managed-apps"
        onConfirm={() => gotoManageApps()}
        confirmTitle={buttonText}
        isLoading={isRequestingScreenTimePermission}
      />
    </SafeAreaView>
  );
}
