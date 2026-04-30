import { setPostponeActivated } from "@/actions/GlobalActions";
import {
  postponeActivatedStatusSelector,
  postponeDurationSelector,
  postponeStartTimeSelector,
} from "@/selectors/GlobalSelectors";
import { addInfoLog } from "@/utils/FileLogger";
import { useIsFocused } from "@react-navigation/native";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "@/reducers";
import { INDEFINITE } from "@/modals/PostponeModal";

const useHandlePostponeStatus = () => {
  const dispatch = useDispatch();
  const isPostponeActivated = useSelector(postponeActivatedStatusSelector);
  const isFocused = useIsFocused();
  const postponeDuration = useSelector(postponeDurationSelector);
  const postponeStartTime = useSelector(postponeStartTimeSelector);

  useEffect(() => {
    if (isPostponeActivated && isFocused && postponeDuration !== INDEFINITE) {
      const postponeEndTime = new Date(postponeStartTime + postponeDuration);

      if (Date.now() >= postponeEndTime.getTime()) {
        addInfoLog(`Postpone time has ended`);
        dispatch(setPostponeActivated(false));
      }
    }
  }, [isPostponeActivated, isFocused]);
};

export { useHandlePostponeStatus };
