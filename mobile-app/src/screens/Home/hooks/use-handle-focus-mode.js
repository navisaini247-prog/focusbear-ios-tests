import { showFocusModeToolTip } from "@/actions/FocusModeActions";
import { userSelector } from "@/selectors/UserSelectors";
import { compareTime } from "@/utils/TimeMethods";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "@/reducers";

const useHandleFocusMode = () => {
  const dispatch = useDispatch();
  const user = useSelector(userSelector);

  useEffect(() => {
    if (user.current_focus_mode_finish_time) {
      const futureTime = new Date(user.current_focus_mode_finish_time);
      const currentTime = new Date();

      // Calculate the time difference in milliseconds
      const { hours, minutes, seconds } = compareTime(futureTime, currentTime);

      if (hours === 0 && minutes === 0 && seconds === 0) {
        return;
      }

      dispatch(showFocusModeToolTip());
    }
  }, []);
};

export { useHandleFocusMode };
