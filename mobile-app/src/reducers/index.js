import { combineReducers } from "redux";
import { errorReducer } from "@/reducers/ErrorReducer";
import { statusReducer } from "@/reducers/StatusReducer";
import { userReducer } from "@/reducers/UserReducer";
import { activityReducer } from "@/reducers/ActivityReducer";
import { routineReducer } from "@/reducers/RoutineReducer";
import { focusModeReducer } from "@/reducers/FocusModeReducer";
import { globalReducer } from "@/reducers/GlobalReducer";
import { modalReducer } from "@/reducers/ModalReducer";
import { appQualityReducer } from "@/reducers/AppQualityReducer";
import { deepCompare } from "@/utils/GlobalMethods";
import { useSelector as useReduxSelector } from "react-redux";

export const rootReducer = combineReducers({
  error: errorReducer,
  status: statusReducer,
  user: userReducer,
  activity: activityReducer,
  routine: routineReducer,
  focusMode: focusModeReducer,
  global: globalReducer,
  modal: modalReducer,
  appQuality: appQualityReducer,
});

export const useSelector = (selector, isDeepCompare) => {
  // Use Redux useSelector hook with deep comparison.
  return useReduxSelector(selector, isDeepCompare ? deepCompare : undefined);
};

export const useDependentSelector = (selector, dependency) => {
  // Use Redux useSelector hook with dependency-based comparison.
  return useReduxSelector(
    (state) => {
      const selectedState = selector(state);
      // Attach the dependency for comparison if necessary
      return { selectedState, dependency };
    },
    (prev, next) => {
      // Perform the comparison: you can change `dependency` to your actual logic
      return prev.dependency === next.dependency;
    },
  ).selectedState;
};
