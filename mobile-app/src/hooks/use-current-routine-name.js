import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { startUpTimeSelector, shutDownTimeSelector } from "@/selectors/RoutineSelectors";
import { getSplitDateTime } from "@/utils/TimeMethods";
import { calculateIsMorningOrEvening } from "@/utils/ActivityRoutineMethods";

/*
 * A hook to get the current routine, which is time-dependent. A hook is used instead of a selector to enable
 * perfectly-timed updates to the UI.
 */
export const useIsMorningOrEvening = () => {
  const startUpTime = getSplitDateTime(useSelector(startUpTimeSelector));
  const shutDownTime = getSplitDateTime(useSelector(shutDownTimeSelector));
  const [currentRoutineName, setCurrentRoutineName] = useState(calculateIsMorningOrEvening(startUpTime, shutDownTime));

  // Recalculate every second. If the value is the same nothing will happen
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRoutineName(calculateIsMorningOrEvening(startUpTime, shutDownTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [startUpTime, shutDownTime]);

  return currentRoutineName;
};
