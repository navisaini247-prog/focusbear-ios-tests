import { useEffect } from "react";
import { NativeModules } from "react-native";
import { useSelector } from "@/reducers";
import { userBlockedUrlsSelector } from "@/selectors/UserSelectors";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { useIsFreemium } from "./use-is-freemium";
import { FREEMIUM_BLOCK_URL_LIMIT } from "./use-is-freemium";
import { useHomeContext } from "@/screens/Home/context";

const { AccessibilityModule } = NativeModules;

export const useUpdateBlockUrl = () => {
  const blockedUrls = useSelector(userBlockedUrlsSelector);
  const isFreemium = useIsFreemium();
  const { isAccessibilityPermissionGranted } = useHomeContext();

  useEffect(() => {
    if (blockedUrls && checkIsAndroid()) {
      if (isFreemium) {
        AccessibilityModule.setRestrictedAddresses(blockedUrls.slice(0, FREEMIUM_BLOCK_URL_LIMIT));
      } else {
        AccessibilityModule.setRestrictedAddresses(blockedUrls);
      }
    }
  }, [blockedUrls, isFreemium, isAccessibilityPermissionGranted]);
};
