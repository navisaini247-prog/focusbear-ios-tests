import { useCallback, useState } from "react";
import GoogleFit, { Scopes } from "react-native-google-fit";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { PERMISSIONS, request, RESULTS, check } from "react-native-permissions";
import { setHealthPermissionGranted } from "@/actions/GlobalActions";
import { useDispatch, useSelector } from "react-redux";
import { useAppActiveState } from "@/hooks/use-app-active-state";
import { useFocusEffect } from "@react-navigation/native";
import { useHomeContext } from "@/screens/Home/context";

export const GOOGLE_FIT_SCOPES = [Scopes.FITNESS_ACTIVITY_READ, Scopes.FITNESS_SLEEP_READ];

export const useHealthPermission = () => {
  const [isHealthPermissionGranted, setIsHealthPermissionGranted] = useState(undefined);
  const [isPhysicalPermissionGranted, setIsPhysicalPermissionGranted] = useState(undefined);
  const { isPhysicalActivityPermissionDisabled } = useHomeContext();
  const dispatch = useDispatch();
  const healthPermissionGranted = useSelector((state) => state.global.isHealthPermissionGranted);

  const requestPermission = useCallback(() => {
    if (checkIsAndroid()) {
      GoogleFit.authorize({ scopes: GOOGLE_FIT_SCOPES })
        .then((res) => {
          if (res.success) {
            setIsHealthPermissionGranted(true);
            dispatch(setHealthPermissionGranted(true));
          } else {
            dispatch(setHealthPermissionGranted(false));
            setIsHealthPermissionGranted(false);
          }
        })
        .catch((e) => {
          setIsHealthPermissionGranted(false);
        });
    } else {
      // HealthKit removed - iOS health permissions not available
      setIsHealthPermissionGranted(false);
      dispatch(setHealthPermissionGranted(false));
    }
  }, [dispatch]);

  const requestPhysicalActivityPermission = useCallback(async () => {
    if (checkIsAndroid()) {
      const result = await request(PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION);
      if (result === RESULTS.GRANTED) {
        setIsPhysicalPermissionGranted(true);
      } else {
        setIsPhysicalPermissionGranted(false);
      }
    }
  }, []);

  const checkPermission = useCallback(async () => {
    if (checkIsAndroid()) {
      if (!healthPermissionGranted) {
        GoogleFit.checkIsAuthorized().then(() => {
          setIsHealthPermissionGranted(GoogleFit.isAuthorized);
        });
      } else {
        requestPermission();
      }
      check(PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION).then((result) => {
        setIsPhysicalPermissionGranted(result === RESULTS.GRANTED);
      });
    } else {
      // HealthKit removed - iOS health permissions not available
      setIsHealthPermissionGranted(false);
    }
  }, [healthPermissionGranted, requestPermission]);

  useFocusEffect(
    useCallback(() => {
      checkPermission();
    }, [checkPermission]),
  );

  useAppActiveState(checkPermission);

  const revokePermission = useCallback(() => {
    if (checkIsAndroid()) {
      GoogleFit.disconnect();
      setIsHealthPermissionGranted(false);
      dispatch(setHealthPermissionGranted(false));
    }
  }, []);

  return {
    isHealthPermissionGranted,
    isPhysicalPermissionGranted: isPhysicalPermissionGranted || isPhysicalActivityPermissionDisabled,
    requestPermission,
    requestPhysicalActivityPermission,
    checkPermission,
    revokePermission,
  };
};
