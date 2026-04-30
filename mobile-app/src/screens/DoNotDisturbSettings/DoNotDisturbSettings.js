import React from "react";
import { View } from "react-native";
import { styles } from "@/screens/Settings/Settings.styles";
import { MenuItemFlatlist, Text } from "@/components";
import { BigAppHeader, BIG_TITLE_HEIGHT } from "@/components/AppHeader";
import { useTranslation } from "react-i18next";
import { i18n } from "@/localization";
import { NormalAlert } from "@/utils/GlobalMethods";
import { useMemo } from "react";
import { requestDNDPermissions } from "@/utils/NativeModuleMethods";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { useTheme } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { setEnableDndDuringFocus } from "@/actions/FocusModeActions";
import { setEnableDndDuringHabit } from "@/actions/ActivityActions";
import { useHomeContext } from "../Home/context";

const showDNDPermissionWarning = () => {
  NormalAlert({
    title: i18n.t("settings.warning"),
    message: i18n.t("settings.DND_permissionWarning"),
    cancelText: i18n.t("common.cancel"),
    yesText: i18n.t("common.proceed"),
    singleButton: false,
    onPressYesButton: requestDNDPermissions,
  });
};

export const DoNotDisturbSettings = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const enableDndDuringFocus = useSelector((state) => state.focusMode.enableDndDuringFocus);
  const enableDndDuringHabit = useSelector((state) => state.activity.enableDndDuringHabit);

  const { isDNDPermissionGranted } = useHomeContext();

  const dndPermissionMenuItems = useMemo(
    () => [
      {
        title: t("settings.DND_permission"),
        subtitle: isDNDPermissionGranted ? t("settings.allowed") : t("settings.notAllowed"),
        onPress: () => {
          if (isDNDPermissionGranted) {
            showDNDPermissionWarning();
            dispatch(setEnableDndDuringFocus(true));
            dispatch(setEnableDndDuringHabit(false));
          } else {
            requestDNDPermissions();
          }
        },
        icon: "moon",
        big: true,
        description: (
          <Text color={colors.danger} size="inherit">
            {t("settings.experimental")}
          </Text>
        ),
      },
      {
        title: t("DND.duringFocusSessions"),
        isSelected: enableDndDuringFocus,
        type: "switch",
        onPress: () => {
          dispatch(setEnableDndDuringFocus(!enableDndDuringFocus));
          if (enableDndDuringFocus) {
            postHogCapture(POSTHOG_EVENT_NAMES.DND_DURING_FOCUS_ENABLED);
          } else {
            postHogCapture(POSTHOG_EVENT_NAMES.DND_DURING_FOCUS_DISABLED);
          }
        },
      },
      {
        title: t("DND.duringHabits"),
        isSelected: enableDndDuringHabit,
        type: "switch",
        onPress: () => {
          dispatch(setEnableDndDuringHabit(!enableDndDuringHabit));
          if (enableDndDuringHabit) {
            postHogCapture(POSTHOG_EVENT_NAMES.DND_DURING_HABITS_ENABLED);
          } else {
            postHogCapture(POSTHOG_EVENT_NAMES.DND_DURING_HABITS_DISABLED);
          }
        },
      },
    ],
    [t, isDNDPermissionGranted, colors.danger, enableDndDuringFocus, enableDndDuringHabit, dispatch],
  );
  return (
    <View style={styles.container}>
      <BigAppHeader title={t("settings.DND")} />
      <View style={[styles.bodyContainer, { paddingTop: BIG_TITLE_HEIGHT }]}>
        <MenuItemFlatlist data={isDNDPermissionGranted ? dndPermissionMenuItems : dndPermissionMenuItems.slice(0, 1)} />
      </View>
    </View>
  );
};
