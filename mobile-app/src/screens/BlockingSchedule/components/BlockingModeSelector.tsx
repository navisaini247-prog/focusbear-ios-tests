import React from "react";
import { Group, MenuItem } from "@/components";
import { useTranslation } from "react-i18next";
import { BLOCKING_MODE } from "@/constants/blockingSchedule";

type BlockingMode = (typeof BLOCKING_MODE)[keyof typeof BLOCKING_MODE];

type Props = {
  mode: BlockingMode;
  onChange: (mode: BlockingMode) => void;
};

export const BlockingModeSelector = ({ mode, onChange }: Props) => {
  const { t } = useTranslation();

  const modes = [
    {
      key: BLOCKING_MODE.GENTLE,
      title: t("blockingSchedule.mode.gentle.title"),
      subtitle: t("blockingSchedule.mode.gentle.subtitle"),
    },
    {
      key: BLOCKING_MODE.STRICT,
      title: t("blockingSchedule.mode.strict.title"),
      subtitle: t("blockingSchedule.mode.strict.subtitle"),
    },
  ];

  return (
    <Group>
      {modes.map((opt) => (
        <MenuItem
          key={opt.key}
          title={opt.title}
          description={opt.subtitle}
          onPress={() => onChange(opt.key)}
          isSelected={mode === opt.key || (mode === BLOCKING_MODE.SUPER_STRICT && opt.key === BLOCKING_MODE.STRICT)}
          type="radio"
          isLargeFontScale
        />
      ))}
    </Group>
  );
};
