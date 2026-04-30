import { useEffect } from "react";
import LateNoMoreManager from "@/controllers/LateNoMoreManager";
import { useFocusEffect } from "@react-navigation/native";
import { useAppActiveState } from "./use-app-active-state";
import { useHomeContext } from "@/screens/Home/context";
import { debounce } from "lodash";

const checkMeetings = debounce(() => {
  LateNoMoreManager.checkUpcomingMeetings();
}, 500);

export const useLateNoMore = () => {
  const { isCalendarPermissionGranted } = useHomeContext();

  // Setup meeting checks once
  useEffect(() => {
    LateNoMoreManager.setupMeetingChecks();
  }, []);

  // Auto-refresh on interval, and when permission status changes
  useEffect(() => {
    checkMeetings();

    const interval = setInterval(checkMeetings, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isCalendarPermissionGranted]);

  useFocusEffect(checkMeetings);
  useAppActiveState(checkMeetings);
};
