import React, { memo, useCallback } from "react";
import { Image, ScrollView, StyleSheet } from "react-native";
import { BodyMediumText, HeadingLargeText, ConfirmationButton, Modal } from "./";
import { SafeAreaView } from "react-native-safe-area-context";
import { OverlayModule } from "@/nativeModule";
import { useTranslation } from "react-i18next";
import { icFocusBear, icFocusBearWhite } from "@/assets";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { postHogCapture } from "@/utils/Posthog";
import { getUsageStatPermission } from "@/utils/GlobalMethods";
import { useTheme } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { setUserCancelledOverlayPermission, setUserCancelledUsagePermission } from "@/actions/GlobalActions";
import { PermissionWarningInfoTile } from "./PermissionWarningInfoTile";

export const PermissionWarningModal = memo(function PermissionWarningModal({
  isShowPermissionWarningModal,
  setisShowPermissionWarningModal,
  showPermissionWarningFor,
}) {
  const { colors, isDarkTheme } = useTheme();
  const { t } = useTranslation();

  const dispatch = useDispatch();

  const hidePermissionWarningModal = () => {
    setisShowPermissionWarningModal(false);
  };

  const handleOverlayPermission = () => {
    OverlayModule.openOverlayPermission();
  };

  const onConfirm = useCallback(() => {
    postHogCapture(POSTHOG_EVENT_NAMES.REQUEST_USAGE_STATE_PERMISSIONS);
    showPermissionWarningFor === t("home.usagePermission") ? getUsageStatPermission() : handleOverlayPermission();
    hidePermissionWarningModal();
  }, [hidePermissionWarningModal, showPermissionWarningFor, t]);

  const onReject = useCallback(() => {
    showPermissionWarningFor === t("home.usagePermission")
      ? dispatch(setUserCancelledUsagePermission(true))
      : dispatch(setUserCancelledOverlayPermission(true));
    hidePermissionWarningModal();
  }, [dispatch, hidePermissionWarningModal, showPermissionWarningFor, t]);

  return (
    <Modal isVisible={isShowPermissionWarningModal} onCancel={onReject} fullScreen backdropColor={colors.background}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Image source={isDarkTheme ? icFocusBearWhite : icFocusBear} style={styles.logoImage} />
          <HeadingLargeText center>
            {showPermissionWarningFor === t("home.usagePermission")
              ? t("permissionWarning.usageAccessTitle")
              : t("permissionWarning.overlayTitle")}
          </HeadingLargeText>

          <BodyMediumText>
            {showPermissionWarningFor === t("home.usagePermission")
              ? t("permissionWarning.deviceUsagedescription")
              : t("permissionWarning.overlayDescription")}
          </BodyMediumText>

          <PermissionWarningInfoTile
            colors={colors}
            title={t("permissionWarning.privacyNoteTitle")}
            description={t("permissionWarning.privacyNoteDesc")}
          />
        </ScrollView>
      </SafeAreaView>

      <ConfirmationButton
        confirmTitle={t("permissionWarning.grantAccess")}
        onConfirm={onConfirm}
        confirmTestID={"test:id/confirm-access-permission-warning"}
        cancelTitle={t("common.cancel")}
        onCancel={onReject}
        cancelTestID={"test:id/cancel-access-permission-warning"}
      />
    </Modal>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 32,
    gap: 32,
  },
  logoImage: {
    alignSelf: "center",
    height: 70,
    width: 180,
    resizeMode: "contain",
  },
});
