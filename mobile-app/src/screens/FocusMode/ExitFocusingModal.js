import React, { useState, useEffect } from "react";
import { ConfirmationModal, MenuItemFlatlist } from "@/components";
import { useTranslation } from "react-i18next";
import { getRandomizedEndReasons } from "@/utils/FocusModeUtil";

export function ExitFocusingModal({ isVisible, onCancel, onConfirm }) {
  const { t } = useTranslation();

  const [selectedReason, setSelectedReason] = useState(null);
  const [endReasons, setEndReasons] = useState([]);

  useEffect(() => {
    if (isVisible) {
      setEndReasons(getRandomizedEndReasons());
      setSelectedReason(null);
    }
  }, [isVisible]);

  const endReasonsMenu = endReasons.map((reason) => ({
    title: reason.label,
    onPress: () => setSelectedReason(reason.value),
    isSelected: reason.value === selectedReason,
    type: "radio",
    testID: `test:id/end-reason-${reason.value}`,
  }));

  return (
    <ConfirmationModal
      isVisible={isVisible}
      title={t("focusMode.exitFocusMode")}
      text={t("focusMode.exitFocusModeDescription")}
      confirmTitle={t("common.end")}
      confirmTestID={"test:id/confirm-end-focus-mode"}
      onConfirm={onConfirm}
      cancelTestID={"test:id/cancel-end-focus-mode"}
      onCancel={onCancel}
    >
      <MenuItemFlatlist data={endReasonsMenu} />
    </ConfirmationModal>
  );
}
