import React, { useState } from "react";
import { InteractionManager, StyleSheet } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { BodyLargeText, BodySmallText, Checkbox, ConfirmationModal } from "@/components";
import { useNavigation } from "@react-navigation/native";
import { useAppUsage } from "../Screentime/context/AppUsageContext";
import { NAVIGATION } from "@/constants";
import { formatHumanizeDuration } from "@/utils/TimeMethods";
import { TouchableOpacity } from "react-native";
import { useDispatch } from "react-redux";
import { setStopShowingUsageAfterCutoffModal } from "@/actions/GlobalActions";
import { showPasswordModal } from "@/actions/ModalActions";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
export const UsageAfterCutOffModal = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { showTimeUsedAfterCutoffModal, setShowTimeUsedAfterCutoffModal, timeUsedAfterCutoff } = useAppUsage();

  const [stopShowing, setStopShowing] = useState(false);

  const onConfirm = () => {
    postHogCapture(POSTHOG_EVENT_NAMES.USAGE_AFTER_SLEEP_GO_TO_FRICTION_SETTINGS);
    setShowTimeUsedAfterCutoffModal(false);
    dispatch(setStopShowingUsageAfterCutoffModal(stopShowing));
    InteractionManager.runAfterInteractions(() => {
      dispatch(
        showPasswordModal({
          onPasswordVerified: () => {
            navigation.navigate(NAVIGATION.FrictionSettingsScreen);
          },
          forceShow: true,
        }),
      );
    });
  };

  const onCancel = () => {
    postHogCapture(POSTHOG_EVENT_NAMES.USAGE_AFTER_SLEEP_IGNORE_LIMIT);
    setShowTimeUsedAfterCutoffModal(false);
    dispatch(setStopShowingUsageAfterCutoffModal(stopShowing));
  };

  return (
    <ConfirmationModal
      isVisible={showTimeUsedAfterCutoffModal}
      onCancel={onCancel}
      onConfirm={onConfirm}
      confirmTitle={t("appUsage.yes")}
      cancelTitle={t("appUsage.no")}
      title={t("appUsage.timeUsedAfterCutoffTitle")}
    >
      <Trans
        i18nKey="appUsage.timeUsedAfterCutoff"
        values={{ duration: formatHumanizeDuration(timeUsedAfterCutoff, { maxDecimalPoints: 0, units: ["h", "m"] }) }}
        parent={BodyLargeText}
        components={{ bold: <BodyLargeText weight="700" /> }}
        style={styles.container}
      />
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setStopShowing((prev) => !prev)}
        testID="test:id/dont-show-again-touchable"
      >
        <Checkbox small value={stopShowing} testID="test:id/dont-show-again-checkbox" />
        <BodySmallText>{t("appUsage.dontShowAgain")}</BodySmallText>
      </TouchableOpacity>
    </ConfirmationModal>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
});
