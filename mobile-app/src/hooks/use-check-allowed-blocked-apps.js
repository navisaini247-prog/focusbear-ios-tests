import { useEffect, useMemo, useState } from "react";
import { addErrorLog } from "@/utils/FileLogger";
import { getAndroidInstalledApps } from "@/utils/NativeModuleMethods";
import { useDispatch } from "react-redux";
import { checkIsIOS } from "@/utils/PlatformMethods";
import { InteractionManager } from "react-native";
import { useDeepEffect } from "./use-deep-effect";
import {
  setAllowedAppSelectionStatus,
  setBlockedAppsCountFromIOS,
  setBlockedAppSelectionStatus,
} from "@/actions/GlobalActions";
import { blockedAppsCountDataFromIOSSelector } from "@/selectors/GlobalSelectors";
import { APP_LIST_TYPE, RESTRICTED_APPS_LIST_TYPE, USER_LOCAL_DEVICE_SETTINGS_KEYS } from "@/utils/Enums";
import { restrictedAppsListTypeSelector } from "@/selectors/UserSelectors";
import { getBlockedAppsCountFromIOS } from "@/utils/NativeModuleMethods";
import { useSelector } from "@/reducers";

const useCheckBlockedAppsStatus = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [hasUserSelectedAnyBlockedApps, setHasUserSelectedAnyBlockedApps] = useState(false);
  const [hasUserSelectedAnyAllowedApps, setHasUserSelectedAnyAllowedApps] = useState(false);

  const userLocalDeviceSettingsData = useSelector((state) => state.user.userLocalDeviceSettingsData);
  const blockListCountData = useSelector(blockedAppsCountDataFromIOSSelector);
  const restrictedAppsListType = useSelector(restrictedAppsListTypeSelector);

  useDeepEffect(() => {
    InteractionManager.runAfterInteractions(async () => {
      try {
        if (checkIsIOS()) {
          const hasCountGreaterThanZero = Object.values(blockListCountData).some((count) => count > 0);
          setHasUserSelectedAnyBlockedApps(hasCountGreaterThanZero);
          dispatch(setBlockedAppSelectionStatus(hasCountGreaterThanZero));
          setLoading(false);
        } else {
          const apps = await getAndroidInstalledApps();
          const installedAppsPackageNames = apps.map((installedApp) => installedApp.packageName);

          const checkUserSelectedApp = (installedAppsPackageNames) => {
            const appList =
              APP_LIST_TYPE[restrictedAppsListType] ?? USER_LOCAL_DEVICE_SETTINGS_KEYS.ALWAYS_BLOCKED_APPS;
            const userSelectedApps = userLocalDeviceSettingsData?.Android?.[appList] ?? [];
            const hasUserSelectedAnyApp = installedAppsPackageNames?.some((app) => userSelectedApps.includes(app));
            setHasUserSelectedApp(restrictedAppsListType, hasUserSelectedAnyApp);
          };

          const setHasUserSelectedApp = (type, value) => {
            if (type === RESTRICTED_APPS_LIST_TYPE.ALLOW_LIST) {
              setHasUserSelectedAnyAllowedApps(value);
              dispatch(setAllowedAppSelectionStatus(value));
            } else {
              setHasUserSelectedAnyBlockedApps(value);
              dispatch(setBlockedAppSelectionStatus(value));
            }
          };

          checkUserSelectedApp(installedAppsPackageNames);
          setLoading(false);
        }
      } catch (error) {
        addErrorLog(error);
        setHasUserSelectedAnyBlockedApps(false);
        setHasUserSelectedAnyAllowedApps(false);
        dispatch(setAllowedAppSelectionStatus(false));
        dispatch(setBlockedAppSelectionStatus(false));
        setLoading(false);
      }
    });
  }, [
    userLocalDeviceSettingsData?.Android?.always_allowed_apps,
    userLocalDeviceSettingsData?.Android?.always_blocked_apps,
    blockListCountData,
    restrictedAppsListType,
  ]);

  useEffect(() => {
    const fetchBlockedAppsCount = async () => {
      if (checkIsIOS()) {
        const blockedAppsCountData = await getBlockedAppsCountFromIOS();
        dispatch(setBlockedAppsCountFromIOS(blockedAppsCountData));
      }
    };

    InteractionManager.runAfterInteractions(() => {
      fetchBlockedAppsCount();
    });
  }, [dispatch]);

  const hasUserSelectedAnyApp = useMemo(() => {
    if (checkIsIOS()) {
      return hasUserSelectedAnyBlockedApps;
    }

    return restrictedAppsListType === RESTRICTED_APPS_LIST_TYPE.ALLOW_LIST
      ? hasUserSelectedAnyAllowedApps
      : hasUserSelectedAnyBlockedApps;
  }, [hasUserSelectedAnyAllowedApps, hasUserSelectedAnyBlockedApps, restrictedAppsListType]);

  return { hasUserSelectedAnyApp, loading };
};

export default useCheckBlockedAppsStatus;
