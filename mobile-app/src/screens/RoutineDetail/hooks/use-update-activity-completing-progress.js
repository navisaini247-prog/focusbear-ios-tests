import { useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { updateActivityCompletionProgress } from "@/actions/RoutineActions";
import { throttle } from "lodash";

const useUpdateActivityCompletionProgress = (activityId, timeLeft, savedLogs = "") => {
  const dispatch = useDispatch();

  const throttledDispatch = useCallback(
    throttle((activityId, timeLeft, savedLogs) => {
      dispatch(
        updateActivityCompletionProgress({
          id: activityId,
          duration: timeLeft - 1,
          savedLogs: savedLogs,
        }),
      );
    }, 5000),
    [dispatch],
  );

  useEffect(() => {
    throttledDispatch(activityId, timeLeft, savedLogs);

    return () => {
      throttledDispatch.cancel();
    };
  }, [activityId, timeLeft, savedLogs, throttledDispatch]);
};

export { useUpdateActivityCompletionProgress };
