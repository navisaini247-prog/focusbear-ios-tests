import React, { memo, useState, useCallback, useMemo } from "react";
import { ConfirmationModal, Card } from "@/components";
import { useTranslation } from "react-i18next";
import { TimePicker } from "./TimePicker";
import { checkIsFocusLimitExceeded, showFreemiumAlert } from "@/hooks/use-is-freemium";
import { DEFAULT_FOCUS_MINUTES } from "./FocusMode";
import { styles } from "./FocusMode.styles";
import { useNavigation } from "@react-navigation/native";
/*
This modal was original implementation in the focus session when user tried to edit it it would only allow to extend it 
this method is replaced by EditFocusSession Modal.
*/
export const ModifyFocusSessionModal = memo(
  ({
    isVisible,
    onCancel,
    onConfirm = () => {},
    mode = "extend", // "extend" or "reduce"
  }) => {
    const { t } = useTranslation();
    const navigation = useNavigation();

    const [additionalFocusTime, setAdditionalFocusTime] = useState(new Date(DEFAULT_FOCUS_MINUTES * 60 * 1000));

    const handleConfirm = useCallback(() => {
      // For reduction mode, we still need to check limits
      if (mode === "extend" && checkIsFocusLimitExceeded(additionalFocusTime)) {
        return showFreemiumAlert(t("focus.focusLimitReachedTitle"), t("focus.focusLimitReachedMessage"), navigation);
      }
      onConfirm(additionalFocusTime, mode);
    }, [additionalFocusTime, onConfirm, t, mode]);

    const [title, text, confirmTitle] = useMemo(() => {
      if (mode === "extend") {
        return [
          t("focusMode.extendFocusDuration"),
          t("focusMode.selectExtendFocusDuration"),
          t("focusMode.extendFocus"),
        ];
      } else {
        return [
          t("focusMode.shortenFocusDuration"),
          t("focusMode.selectShortenFocusDuration"),
          t("focusMode.shortenFocus"),
        ];
      }
    }, [mode, t]);

    return (
      <ConfirmationModal
        isVisible={isVisible}
        title={title}
        text={text}
        onCancel={onCancel}
        confirmTitle={confirmTitle}
        onConfirm={handleConfirm}
        disableSwipe
      >
        <Card style={styles.timePickerCard}>
          <TimePicker onTimePickerChange={setAdditionalFocusTime} />
        </Card>
      </ConfirmationModal>
    );
  },
);

ModifyFocusSessionModal.displayName = "ModifyFocusSessionModal";
