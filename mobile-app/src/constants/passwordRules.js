import { i18n } from "@/localization";
import { store } from "@/store";
import { Platform } from "react-native";
import { PLATFORMS } from "./platforms";

export const platform = Platform.OS === "android" ? PLATFORMS.ANDROID : PLATFORMS.IOS;

export const PASSWORD_VERIFICATION_TIMEOUT = 120; //2 minutes

export const PASSWORD_RULES = {
  changeSettings: "kIsPasswordRequireInChangeSettings",
  requireInSkipMorning: "kIsPasswordRequireInSkipMorning",
  requireInSkipEvening: "kIsPasswordRequireInSkipEvening",
  kIsPasswordRequireInSkipEveningAfterCutOff: "kIsPasswordRequireInSkipEveningAfterCutOff",
  kIsPasswordRequireInAbortShutoff: "kIsPasswordRequireInAbortShutoff",
  kIsAllowRelaxFocusMode: "kIsAllowRelaxFocusMode",
};

const updatePasswordRulesData = () => {
  const userLocalDeviceSettingsData = store.getState()?.user?.userLocalDeviceSettingsData;

  return [
    {
      id: 1,
      key: PASSWORD_RULES.changeSettings,
      title: i18n.t("strictness.changingSettings"),
      status: userLocalDeviceSettingsData?.MacOS?.kIsPasswordRequireInChangeSettings ?? false,
    },
    {
      id: 2,
      key: PASSWORD_RULES.requireInSkipMorning,
      title: i18n.t("strictness.postponingMorningRoutine"),
      status: userLocalDeviceSettingsData?.MacOS?.kIsPasswordRequireInSkipMorning ?? false,
    },
    {
      id: 3,
      key: PASSWORD_RULES.requireInSkipEvening,
      title: i18n.t("strictness.postponingEveningRoutine"),
      status: userLocalDeviceSettingsData?.MacOS?.kIsPasswordRequireInSkipEvening ?? false,
    },
    {
      id: 4,
      key: PASSWORD_RULES.kIsPasswordRequireInSkipEveningAfterCutOff,
      title: i18n.t("strictness.postponingAfterCuttOffTime"),
      status: userLocalDeviceSettingsData?.MacOS?.kIsPasswordRequireInSkipEveningAfterCutOff ?? false,
    },
    {
      id: 5,
      key: PASSWORD_RULES.kIsPasswordRequireInAbortShutoff,
      title: i18n.t("strictness.usingPhoneLateNight"),
      status: userLocalDeviceSettingsData?.MacOS?.kIsPasswordRequireInAbortShutoff ?? false,
    },
    {
      id: 5,
      key: PASSWORD_RULES.kIsAllowRelaxFocusMode,
      title: i18n.t("strictness.relaxFocusMode"),
      status: userLocalDeviceSettingsData?.MacOS?.kIsAllowRelaxFocusMode ?? false,
    },
  ];
};

// Initial assignment of PASSWORD_RULES_DATA
let PASSWORD_RULES_DATA = updatePasswordRulesData();

// Subscribe to the Redux store changes to keep PASSWORD_RULES_DATA updated
store.subscribe(() => {
  PASSWORD_RULES_DATA = updatePasswordRulesData();
});

// Export PASSWORD_RULES_DATA
export { PASSWORD_RULES_DATA };
