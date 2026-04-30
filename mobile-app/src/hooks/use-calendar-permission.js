import { useCallback, useState } from "react";
import { useAppActiveState } from "@/hooks/use-app-active-state";
import { useFocusEffect } from "@react-navigation/native";
import CalendarHelper from "@/utils/CalendarHelper";

export const useCalendarPermission = () => {
  const [isCalendarPermissionGranted, setIsCalendarPermissionGranted] = useState(false);

  const requestPermission = useCallback(async () => {
    const granted = await CalendarHelper.requestPermissions();
    setIsCalendarPermissionGranted(granted);
    return granted;
  }, []);

  const checkPermission = useCallback(async () => {
    setIsCalendarPermissionGranted(await CalendarHelper.checkPermissions());
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkPermission();
    }, [checkPermission]),
  );
  useAppActiveState(checkPermission);

  return {
    isCalendarPermissionGranted,
    requestCalendarPermission: requestPermission,
    checkCalendarPermission: checkPermission,
  };
};
