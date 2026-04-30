import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetDailyUserSession, TYPES } from "@/actions/UserActions";
import { lastResetDateSelector } from "@/selectors/UserSelectors";
import { startUpTimeSelector } from "@/selectors/RoutineSelectors";

export const useStreakDailyReset = () => {
  const dispatch = useDispatch();
  const lastResetDate = useSelector(lastResetDateSelector);
  const startUpTime = useSelector(startUpTimeSelector);

  const checkAndResetDaily = useCallback(() => {
    if (!startUpTime) {
      return;
    }
    const now = new Date();

    const [resetHour, resetMinute] = startUpTime.split(":").map(Number);

    const adjustedDate = new Date(now);

    const currentMinutes = adjustedDate.getHours() * 60 + adjustedDate.getMinutes();
    const resetMinutes = resetHour * 60 + resetMinute;

    if (currentMinutes < resetMinutes) {
      adjustedDate.setDate(adjustedDate.getDate() - 1);
    }

    const today = adjustedDate.toDateString();

    if (lastResetDate === null) {
      dispatch({
        type: TYPES.SET_LAST_RESET_DATE_ONLY,
        payload: { date: today },
      });
      return;
    }

    if (lastResetDate !== today) {
      dispatch(resetDailyUserSession());
    }
  }, [lastResetDate, dispatch, startUpTime]);

  useEffect(() => {
    checkAndResetDaily();
    const interval = setInterval(checkAndResetDaily, 60000);
    return () => clearInterval(interval);
  }, [checkAndResetDaily]);
};
