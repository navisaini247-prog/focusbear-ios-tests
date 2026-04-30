import React, { useEffect, useState } from "react";
import { View, Platform, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PressableWithFeedback, HorizontalAppLogo, DisplaySmallText, Modal, HeadingMediumText } from "@/components";
import { HeadingSmallText, FullPageLoading } from "@/components";
import { BlockingPermissionMenu } from "../Permissions/Permissions";
import { styles } from "./GrantPermissionScreen.styles";
import { NAVIGATION } from "@/constants";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { UsagePermissionTutorial } from "@/assets";
import Video from "react-native-video";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { useHomeContext } from "../Home/context";
import COLOR from "@/constants/color";

const isIOS = Platform.OS === "ios";
const isAndroid = Platform.OS === "android";

export function GrantPermissionScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [openTutorial, setOpenTutorial] = useState(false);

  const {
    isUsagePermissionGranted,
    isOverlayPermissionGranted,
    isScreenTimePermissionGranted,
    isRequestingScreenTimePermission,
  } = useHomeContext();

  const isAllPermissionsGranted = isIOS
    ? isScreenTimePermissionGranted
    : isOverlayPermissionGranted && isUsagePermissionGranted;

  useEffect(() => {
    if (isAllPermissionsGranted) navigation.navigate(NAVIGATION.Blocklist, {});
  }, [isAllPermissionsGranted, navigation]);

  const onOpenTutorial = () => {
    postHogCapture(POSTHOG_EVENT_NAMES.OPENING_VIDEO_TUTORIAL);
    setOpenTutorial(true);
  };

  return (
    <SafeAreaView style={[styles.container, styles.flex]}>
      <View style={[styles.flex, styles.gap24]}>
        <HorizontalAppLogo />
        <DisplaySmallText center>{t("grantPermission.title")}</DisplaySmallText>
        <HeadingMediumText center color={colors.subText}>
          {t("grantPermission.description")}
        </HeadingMediumText>
        <BlockingPermissionMenu showCheckmark />

        {isAndroid && (
          <PressableWithFeedback testID="test:id/need-help" onPress={onOpenTutorial} style={styles.pressable}>
            <HeadingSmallText color={colors.primary}>{t("grantPermission.needHelp")}</HeadingSmallText>
          </PressableWithFeedback>
        )}
      </View>

      <PressableWithFeedback
        testID="test:id/permission-skip"
        onPress={() => navigation.navigate(NAVIGATION.Blocklist)}
        style={styles.pressable}
      >
        <HeadingMediumText color={colors.subText} underline>
          {t("common.skip")}
        </HeadingMediumText>
      </PressableWithFeedback>

      <FullPageLoading show={isRequestingScreenTimePermission} />

      {isAndroid && (
        <PermissionTutorialModal
          openTutorial={openTutorial}
          setOpenTutorial={setOpenTutorial}
          title={t("onboarding.instructionVideo")}
          videoSource={UsagePermissionTutorial}
        />
      )}
    </SafeAreaView>
  );
}

export const PermissionTutorialModal = ({ openTutorial, setOpenTutorial, title, videoSource }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { height: screenHeight } = useWindowDimensions();

  return (
    <Modal
      isVisible={openTutorial}
      onCancel={() => setOpenTutorial(false)}
      backdropColor={COLOR.DARKER_OVERLAY}
      fullScreen
    >
      <SafeAreaView style={[styles.container, styles.gap24, styles.flex]}>
        <DisplaySmallText center color={colors.white}>
          {title}
        </DisplaySmallText>

        <View style={[styles.videoContainer, styles.flex]} pointerEvents="none">
          <Video repeat source={videoSource} style={{ height: screenHeight * 0.6 }} />
        </View>

        <PressableWithFeedback
          testID="test:id/close-tutorial-button"
          style={styles.pressable}
          onPress={() => setOpenTutorial(false)}
        >
          <HeadingMediumText color={colors.white}>{t("common.done")}</HeadingMediumText>
        </PressableWithFeedback>
      </SafeAreaView>
    </Modal>
  );
};
