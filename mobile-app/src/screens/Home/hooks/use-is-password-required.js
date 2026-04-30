import { ROUTINE_NAMES } from "@/constants";
import {
  macPasswordSelector,
  passwordRequiredForSkipMorningRoutineSelector,
  passwordRequiredForSkipEveningRoutineSelector,
  passwordRequiredForSkipAfterCuttOffTimeSelector,
} from "@/selectors/UserSelectors";
import { useSelector } from "@/reducers";
import { isAfterCutOffTime } from "@/utils/TimeMethods";
import { startUpTimeSelector, cutOffTimeSelector } from "@/selectors/RoutineSelectors";

const useIsPasswordRequired = (routineName) => {
  const userUnlockPassword = useSelector(macPasswordSelector);

  const startupTime = useSelector(startUpTimeSelector);
  const cutoffTime = useSelector(cutOffTimeSelector);

  const isPasswordRequiredForPostponeMorningRoutine = useSelector(passwordRequiredForSkipMorningRoutineSelector);
  const isPasswordRequiredForPostponeEveningRoutine = useSelector(passwordRequiredForSkipEveningRoutineSelector);
  const isPasswordRequiredForPostponeAfterCutOffTime = useSelector(passwordRequiredForSkipAfterCuttOffTimeSelector);

  const isPasswordRequired =
    Boolean(userUnlockPassword) &&
    ((routineName === ROUTINE_NAMES.MORNING && isPasswordRequiredForPostponeMorningRoutine) ||
      (routineName === ROUTINE_NAMES.EVENING && isPasswordRequiredForPostponeEveningRoutine) ||
      (routineName === ROUTINE_NAMES.EVENING &&
        isPasswordRequiredForPostponeAfterCutOffTime &&
        isAfterCutOffTime(cutoffTime, startupTime)));

  return isPasswordRequired;
};

export { useIsPasswordRequired };
