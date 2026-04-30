import "react-native-get-random-values";
import { i18n } from "@/localization";

const secureRandom = () => {
  const randomArray = new Uint32Array(1);
  window.crypto.getRandomValues(randomArray);
  return randomArray[0];
};

export const getRandomizedEndReasons = () =>
  [
    { label: i18n.t("focusMode.endEarlyReasonDescription1"), value: "EMERGENCY" },
    { label: i18n.t("focusMode.endEarlyReasonDescription2"), value: "FOCUS_MODE_BUG" },
    { label: i18n.t("focusMode.endEarlyReasonDescription3"), value: "ACHIEVED" },
    { label: i18n.t("focusMode.endEarlyReasonDescription4"), value: "NEED_BREAK" },
  ]
    .map((reason) => ({ ...reason, sort: secureRandom() }))
    .sort((reasonA, reasonB) => reasonA.sort - reasonB.sort)
    .map(({ sort, ...rest }) => rest);
