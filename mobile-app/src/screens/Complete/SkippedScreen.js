import React, { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NAVIGATION } from "@/constants";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { POSTHOG_EVENT_NAMES, WATCH_ACTIVITY } from "@/utils/Enums";
import { useWatchListener } from "@/hooks/use-watch-listener";
import { skipActivity } from "@/actions/ActivityActions";
import { addInfoLog } from "@/utils/FileLogger";
import { ConfirmationModal, Group, MenuItem } from "@/components";
import { postHogCapture } from "@/utils/Posthog";

function SkippedModal({ isVisible, onClose, activity }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { savedNoteText = "" } = route?.params || {};
  const [isProcessing, setIsProcessing] = useState({
    didAlready: false,
    cantDoIt: false,
  });
  const isAnyProcessing = isProcessing.didAlready || isProcessing.cantDoIt;

  const onPressOutSideModal = () => {
    if (!isAnyProcessing) {
      onClose();
    }
  };

  const iosListenerCallback = (message) => {
    if (message?.sendDataToRN == t("complete.already_did")) {
      completeSkip(true);
    } else if (message?.sendDataToRN == t("complete.cannot_today")) {
      postHogCapture(POSTHOG_EVENT_NAMES.SKIPPED_HABIT_CANNOT_DO_TODAY);
      completeSkip(false);
    }
  };

  const androidListenerCallback = (value) => {
    if (value[WATCH_ACTIVITY.MESSAGE] == t("complete.already_did")) {
      completeSkip(true);
    } else if (value[WATCH_ACTIVITY.MESSAGE] == t("complete.cannot_today")) {
      postHogCapture(POSTHOG_EVENT_NAMES.SKIPPED_HABIT_CANNOT_DO_TODAY);
      completeSkip(false);
    }
  };

  useWatchListener({
    androidListenerCallback,
    iosListenerCallback,
  });

  /*
  param - true - did already
  param - false - can't do it today
 */
  const completeSkip = async (didAlready) => {
    try {
      setIsProcessing({ cantDoIt: !didAlready, didAlready });
      addInfoLog(didAlready ? "SKIP: Pressed on Did Already" : "SKIP: Pressed on Can't Do it today");
      await dispatch(skipActivity(activity, didAlready));
      onClose();
      navigation.replace(NAVIGATION.CompleteScreen, { savedNoteText, item: activity, didAlready });
    } finally {
      setIsProcessing({ didAlready: false, cantDoIt: false });
    }
  };

  return (
    <ConfirmationModal isVisible={isVisible} onCancel={onPressOutSideModal} title={t("complete.why_skip")}>
      <Group>
        <MenuItem
          isLoading={isProcessing.didAlready}
          onPress={() => completeSkip(true)}
          title={t("complete.already_did")}
          testID="test:id/already-did-activity"
          disabled={isProcessing.cantDoIt}
        />
        <MenuItem
          isLoading={isProcessing.cantDoIt}
          onPress={() => completeSkip(false)}
          title={t("complete.cannot_today")}
          testID="test:id/cannot-do-activity"
          disabled={isProcessing.didAlready}
        />
      </Group>
    </ConfirmationModal>
  );
}

export default SkippedModal;
