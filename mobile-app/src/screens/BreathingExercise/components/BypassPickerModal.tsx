import { BodyMediumText, ConfirmationModal, Group, MenuItem, TextField } from "@/components";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFontScale } from "@/hooks/use-font-scale";

const MINUTE_MS = 60 * 1000;

const BYPASS_OPTIONS = [
  { key: "FIVE_MIN", minutes: 5 },
  { key: "TEN_MIN", minutes: 10 },
  { key: "FIFTEEN_MIN", minutes: 15 },
  { key: "TWENTY_MIN", minutes: 20 },
];

export const BypassPickerModal = ({ isVisible, onCancel, onConfirm, app }) => {
  const [selectedKey, setSelectedKey] = useState("FIVE_MIN");
  const [unblockingReason, setUnblockingReason] = useState("");
  const [hasAttempted, setHasAttempted] = useState(false);
  const { t } = useTranslation();
  const { isLargeFontScale } = useFontScale();

  const options = useMemo(() => {
    return BYPASS_OPTIONS.map((option) => ({
      ...option,
      title: t("byPassTimePicker.duration", { count: option.minutes }),
    }));
  }, [t]);

  const handleConfirm = useCallback(() => {
    setHasAttempted(true);
    const selectedOption = BYPASS_OPTIONS.find((option) => option.key === selectedKey);

    if (!selectedOption || !unblockingReason.trim()) return;

    const durationMs = selectedOption.minutes * MINUTE_MS;
    onConfirm(durationMs, unblockingReason.trim());
  }, [onConfirm, selectedKey, unblockingReason]);

  const isInvalid = hasAttempted && !unblockingReason.trim();

  return (
    <ConfirmationModal
      isVisible={isVisible}
      title={t("byPassTimePicker.title", { app: app })}
      onCancel={onCancel}
      onConfirm={handleConfirm}
    >
      <BodyMediumText>{t("byPassTimePicker.intention", { app })}</BodyMediumText>
      <TextField
        value={unblockingReason}
        onChangeText={(value) => {
          setUnblockingReason(value);
        }}
        multiline
        errorMessage={isInvalid ? t("byPassTimePicker.intentionRequiredError") : undefined}
        placeholder={t("byPassTimePicker.intentionInfo", { app: app })}
      />
      <BodyMediumText>{t("postpone.choosePostponeTime")}</BodyMediumText>
      <Group>
        {options.map((option) => (
          <MenuItem
            key={option.key}
            type="checkmark"
            isSelected={selectedKey === option.key}
            title={option.title}
            isLargeFontScale={isLargeFontScale}
            onPress={() => setSelectedKey(option.key)}
          />
        ))}
      </Group>
    </ConfirmationModal>
  );
};
