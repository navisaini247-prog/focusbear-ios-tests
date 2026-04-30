import { useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { shouldEnableDNDMode } from "@/utils/NativeModuleMethods";
import { isBlockingSelector } from "@/selectors/ActivitySelectors";

export const useToggleDnd = (isDNDPermissionGranted) => {
  const isBlocking = useSelector(isBlockingSelector);
  const isInFocusMode = useSelector((state) => state.focusMode.isInFocusMode);
  const enableDndDuringFocus = useSelector((state) => state.focusMode.enableDndDuringFocus);
  const enableDndDuringHabit = useSelector((state) => state.activity.enableDndDuringHabit);

  const toggleDnd = useCallback(
    (status) => {
      shouldEnableDNDMode(status);
    },
    [isDNDPermissionGranted],
  );

  useEffect(() => {
    if (isDNDPermissionGranted) {
      const inFocusModeWithDnd = isInFocusMode && enableDndDuringFocus;
      const shouldEnableDnd = isBlocking && (inFocusModeWithDnd || enableDndDuringHabit);
      toggleDnd(shouldEnableDnd);
    }
  }, [isBlocking, isInFocusMode, enableDndDuringFocus, enableDndDuringHabit, toggleDnd]);
};
