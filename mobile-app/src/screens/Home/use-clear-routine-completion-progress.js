import { clearActivityCompletionProgress } from "@/actions/RoutineActions";
import { clearRoutineProgressTimestampSelector } from "@/selectors/RoutineSelectors";
import { calculateNextClearTimestamp } from "@/utils/TimeMethods";
import moment from "moment";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useDependentSelector, useSelector } from "@/reducers";
import { userSelector } from "@/selectors/UserSelectors";

const useClearRoutineCompletionProgress = () => {
  const user = useSelector(userSelector);
  const { fullRoutineData } = useDependentSelector((state) => state.routine, user?.updated_at);
  const clearRoutineProgressTimestamp = useSelector(clearRoutineProgressTimestampSelector);
  const dispatch = useDispatch();

  useEffect(() => {
    // Clear routine completion progress if timestamp is outdated
    if (isTimestampOutdated(clearRoutineProgressTimestamp)) {
      const nextClearTimestamp = calculateNextClearTimestamp(fullRoutineData);
      dispatch(clearActivityCompletionProgress({ clearTimeStamp: nextClearTimestamp }));
    }
  }, [clearRoutineProgressTimestamp, fullRoutineData?.startup_time]);

  const isTimestampOutdated = (timestamp) => {
    return moment().unix() > (timestamp || 0);
  };
};

export { useClearRoutineCompletionProgress };
