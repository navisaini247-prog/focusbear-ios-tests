import {
  checkScreenTimePermission,
  getScreenTimePermission,
  revokeScreenTimePermission,
} from "@/utils/NativeModuleMethods";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { useAppActiveState } from "./use-app-active-state";
import { useDispatch } from "react-redux";
import { setScreenTimePermission } from "@/actions/GlobalActions";
import { InteractionManager } from "react-native";
import { useSelector } from "@/reducers";
import { useState, useEffect } from "react";

const ScreenTimePermissionStatus = {
  UNDETERMINED: 0,
  DENIED: 1,
  AUTHORIZED: 2,
};

export const useScreenTimePermission = () => {
  const dispatch = useDispatch();

  const isScreenTimePermissionGranted = useSelector((state) => state.global.isScreenTimePermissionGranted);
  const [isRequestingScreenTimePermission, setIsRequestingScreenTimePermission] = useState(undefined);

  // Do not remove this logic, IOS only allow one native callback at a time, two cannot be called at the same time
  const [isFirstTime, setIsFirstTime] = useState(true);

  const requestScreenTimePermission = async () => {
    if (checkIsAndroid()) {
      dispatch(setScreenTimePermission(false));
      return false;
    }

    try {
      setIsRequestingScreenTimePermission(true);
      const isAuthorized = await checkScreenTimePermission();
      dispatch(setScreenTimePermission(isAuthorized));
      return isAuthorized;
    } catch (error) {
      dispatch(setScreenTimePermission(false));
      return false;
    } finally {
      setIsRequestingScreenTimePermission(false);
    }
  };

  const getIsScreenTimePermissionGranted = async () => {
    if (checkIsAndroid()) {
      dispatch(setScreenTimePermission(false));
      return false;
    }

    try {
      const authorizationStatus = await getScreenTimePermission();
      if (authorizationStatus === ScreenTimePermissionStatus.UNDETERMINED && isScreenTimePermissionGranted) {
        return await requestScreenTimePermission();
      } else {
        const isAuthorized = authorizationStatus === ScreenTimePermissionStatus.AUTHORIZED;
        dispatch(setScreenTimePermission(isAuthorized));
        return isAuthorized;
      }
    } catch (error) {
      dispatch(setScreenTimePermission(false));
      return false;
    }
  };

  const revokePermission = async () => {
    if (checkIsAndroid()) {
      dispatch(setScreenTimePermission(false));
      return false;
    }

    try {
      const result = await revokeScreenTimePermission();
      dispatch(setScreenTimePermission(!result));
      return result;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      if (isFirstTime) {
        getIsScreenTimePermissionGranted().finally(() => {
          setIsFirstTime(false);
        });
      }
    });
  }, []);

  useAppActiveState(() => {
    InteractionManager.runAfterInteractions(() => {
      if (!isFirstTime) {
        getIsScreenTimePermissionGranted();
      }
    });
  });

  return {
    isScreenTimePermissionGranted,
    isRequestingScreenTimePermission,
    requestScreenTimePermission,
    revokeScreenTimePermission: revokePermission,
  };
};
