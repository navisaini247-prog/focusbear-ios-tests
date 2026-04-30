import React, { useEffect, useState } from "react";
import { MenuItemFlatlist, ConfirmationModal } from "@/components";
import { useDispatch, useSelector } from "react-redux";
import { useFontScale } from "@/hooks/use-font-scale";
import { useTranslation } from "react-i18next";
import { launcherAppLabelSelector } from "@/selectors/GlobalSelectors";
import { setAppLabel } from "@/actions/GlobalActions";
import { useLauncherContext } from "../../context";

export const LauncherAppLabel = {
  MORNING: 1,
  EVENING: 2,
  PLAY: 3,
  WORK: 4,
};

export const SetLabelModal = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isLargeFontScale } = useFontScale();
  const launcherAppLabels = useSelector(launcherAppLabelSelector);

  const { openSetAppLabel, setOpenSetAppLabel, selectedLabellingApp } = useLauncherContext();

  // Initialize labels using the values stored in Redux for the selected app
  const [labels, setLabels] = useState(launcherAppLabels?.[selectedLabellingApp?.packageName] || []);

  useEffect(() => {
    setLabels(launcherAppLabels?.[selectedLabellingApp?.packageName] || []);
  }, [openSetAppLabel]);

  const onSelectLabel = (labelValue) => {
    setLabels((prevLabels) =>
      prevLabels.includes(labelValue) ? prevLabels.filter((l) => l !== labelValue) : [...prevLabels, labelValue],
    );
  };

  const onSaveLabel = () => {
    dispatch(setAppLabel(selectedLabellingApp.packageName, labels));
    setOpenSetAppLabel(false);
  };

  if (!selectedLabellingApp) {
    return null;
  }

  const appLabelMenuItems = Object.entries(LauncherAppLabel).map(([key, value]) => ({
    title: t(`launcher.${key.toLowerCase()}`),
    onPress: () => onSelectLabel(value),
    isSelected: labels.includes(value),
    type: "checkbox",
  }));

  return (
    <ConfirmationModal
      isVisible={openSetAppLabel}
      title={t("launcher.setAppLabel", { appName: selectedLabellingApp.appName })}
      onConfirm={onSaveLabel}
      confirmTitle={t("common.save")}
      onCancel={() => setOpenSetAppLabel(false)}
    >
      <MenuItemFlatlist data={appLabelMenuItems} isLargeFontScale={isLargeFontScale} />
    </ConfirmationModal>
  );
};
