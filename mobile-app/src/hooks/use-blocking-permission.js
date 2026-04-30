import { useCallback, useState, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { checkUsageStatPermission, overlayPermission, getUsageStatPermission } from "@/utils/GlobalMethods";
import { useAppActiveState } from "@/hooks/use-app-active-state";
import OverlayPermissionModule from "rn-android-overlay-permission";
import { setOverlayPermission } from "@/actions/GlobalActions";
import { useDispatch } from "react-redux";
import notifee, { AuthorizationStatus } from "@notifee/react-native";
import { checkIsIOS } from "@/utils/PlatformMethods";
import { useScreenTimePermission } from "./use-screen-time-permission";
import {
  requestIgnoreBatteryOptimization,
  checkIsDNDPermissionGranted,
  getIgnoreBatteryOptimizationPermission,
  checkAccessibilityPermission,
  grantAccessibilityPermission,
} from "@/utils/NativeModuleMethods";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { postHogCapture } from "@/utils/Posthog";

export const useBlockingPermission = () => {
  const [isUsagePermissionGranted, setIsUsagePermissionGranted] = useState(undefined);
  const [isOverlayPermissionGranted, setIsOverlayPermissionGranted] = useState(undefined);
  const [isPushNotificationPermissionGranted, setIsPushNotificationPermissionGranted] = useState(false);
  const [isIgnoredBatteryPermissionGranted, setIsIgnoredBatteryPermissionGranted] = useState(false);
  const [isDNDPermissionGranted, setIsDNDPermissionGranted] = useState(false);
  const [isAccessibilityPermissionGranted, setIsAccessibilityPermissionGranted] = useState(false);

  const dispatch = useDispatch();

  const requestOverlayPermission = useCallback(async () => {
    postHogCapture(POSTHOG_EVENT_NAMES.REQUEST_OVERLAY_PERMISSION);
    return await OverlayPermissionModule.requestOverlayPermission();
  }, []);

  const requestUsagePermission = useCallback(async () => {
    postHogCapture(POSTHOG_EVENT_NAMES.REQUEST_USAGE_PERMISSION);
    return await getUsageStatPermission();
  }, []);

  const requestAccessibilityPermission = useCallback(() => {
    postHogCapture(POSTHOG_EVENT_NAMES.REQUEST_ACCESSIBILITY_PERMISSION);
    return grantAccessibilityPermission();
  }, []);

  const {
    isScreenTimePermissionGranted,
    isRequestingScreenTimePermission,
    requestScreenTimePermission,
    revokeScreenTimePermission,
  } = useScreenTimePermission();

  const checkPermission = useCallback(() => {
    notifee.getNotificationSettings().then((value) => {
      const isGranted = value.authorizationStatus === AuthorizationStatus.AUTHORIZED;
      setIsPushNotificationPermissionGranted(isGranted);
    });

    checkUsageStatPermission()
      .then((status) => {
        const isGranted = status === "USAGE_STAT_PERMISSION_PROVIDED";
        setIsUsagePermissionGranted(isGranted);
        if (isGranted) {
          postHogCapture(POSTHOG_EVENT_NAMES.GRANT_USAGE_PERMISSION);
        }
      })
      .catch(() => {
        setIsUsagePermissionGranted(false);
      });

    overlayPermission()
      .then((status) => {
        const isGranted = status === "OVERLAY_PERMISSION_PROVIDED";
        setIsOverlayPermissionGranted(isGranted);
        dispatch(setOverlayPermission(isGranted));
        if (isGranted) {
          postHogCapture(POSTHOG_EVENT_NAMES.GRANT_OVERLAY_PERMISSION);
        }
      })
      .catch(() => {
        setIsOverlayPermissionGranted(false);
        dispatch(setOverlayPermission(false));
      });

    checkIsDNDPermissionGranted()
      .then((isGranted) => {
        setIsDNDPermissionGranted(isGranted);
      })
      .catch(() => {
        setIsDNDPermissionGranted(false);
      });

    getIgnoreBatteryOptimizationPermission()
      .then((isGranted) => {
        setIsIgnoredBatteryPermissionGranted(isGranted);
      })
      .catch(() => {
        setIsIgnoredBatteryPermissionGranted(false);
      });

    checkAccessibilityPermission()
      .then((isGranted) => {
        setIsAccessibilityPermissionGranted(isGranted);
      })
      .catch(() => {
        setIsAccessibilityPermissionGranted(false);
      });
  }, [dispatch]);

  const ignoreBatteryOptimization = useCallback(() => {
    if (checkIsIOS()) {
      return;
    }
    requestIgnoreBatteryOptimization()
      .then((isGranted) => {
        setIsIgnoredBatteryPermissionGranted(isGranted);
      })
      .catch(() => {
        setIsIgnoredBatteryPermissionGranted(false);
      });
  }, []);

  useFocusEffect(useCallback(() => checkPermission(), [checkPermission]));
  useAppActiveState(checkPermission);

  // Memoizing the object for consistent reference across renders
  const allBlockingPermissionsGranted = useMemo(
    () => (checkIsIOS() ? isScreenTimePermissionGranted : isUsagePermissionGranted && isOverlayPermissionGranted),
    [isScreenTimePermissionGranted, isUsagePermissionGranted, isOverlayPermissionGranted],
  );

  return {
    isUsagePermissionGranted,
    isOverlayPermissionGranted,
    isPushNotificationPermissionGranted,
    isScreenTimePermissionGranted,
    isRequestingScreenTimePermission,
    isDNDPermissionGranted,
    isIgnoredBatteryPermissionGranted,
    isAccessibilityPermissionGranted,
    requestUsagePermission,
    requestOverlayPermission,
    requestScreenTimePermission,
    revokeScreenTimePermission,
    allBlockingPermissionsGranted,
    ignoreBatteryOptimization,
    requestAccessibilityPermission,
  };
};
