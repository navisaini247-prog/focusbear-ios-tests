import { useIsFocused } from "@react-navigation/native";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useDispatch } from "react-redux";
import { FullPageLoading } from "@/components";
import {
  getUserDetails,
  getUserLocalDeviceSettings,
  getUserLongTermGoals,
  updateDeviceDataApiAction,
} from "@/actions/UserActions";
import { onPostPoneFlowFromDistractionAlert } from "@/actions/ActivityActions";
import { showFloatingView } from "@/utils/NativeModuleMethods";
import * as Sentry from "@sentry/react-native";
import AnalyzeSleepMoodModal from "@/components/AnalyzeSleepMoodModal";
import SurveyRating from "@/components/SurveyRating";
import { useHandleBackgroundFetch } from "@/hooks/use-handle-background-fetch";
import { useClearRoutineCompletionProgress } from "./use-clear-routine-completion-progress";
import { useUpdateUserConsentStatus } from "./hooks/use-update-user-consent";
import { useHandlePostponeStatus } from "./hooks/use-handle-postpone-status";
import { useInitializePushNotifications } from "./hooks/use-initialize-pusher-beam";
import { useHandleFocusMode } from "./hooks/use-handle-focus-mode";
import { useFetchRoutineData } from "./hooks/use-fetch-routine-data";
import { useLateNoMore } from "@/hooks/use-late-no-more";
import { useHomeContext } from "./context";
import { useSelector } from "@/reducers";
import { shutDownTimeSelector, startUpTimeSelector } from "@/selectors/RoutineSelectors";
import { userIdSelector } from "@/selectors/UserSelectors";
import { isPostPoneFlowFromDistractionAlertSelector } from "@/selectors/ActivitySelectors";
import { useSetUserPosthogProperties } from "./hooks/use-set-user-posthog-properties";
import { HomeTabView } from "./components/HomeTabView";
import { useStreakDailyReset } from "@/hooks/use-streak-daily-reset";
import { useAppActions } from "./hooks/use-app-actions";

export const Home = ({ navigation }) => {
  const dispatch = useDispatch();
  const startupTime = useSelector(startUpTimeSelector);
  const shutdownTime = useSelector(shutDownTimeSelector);
  const isPostPoneFlowFromDistractionAlert = useSelector(isPostPoneFlowFromDistractionAlertSelector);
  const isHabitsScreenVisible = useIsFocused();
  const userId = useSelector(userIdSelector);
  const addTaskAppActionRequest = useAppActions();

  const { onPressPostpone } = useHomeContext();

  useHandleBackgroundFetch();
  useClearRoutineCompletionProgress();
  useUpdateUserConsentStatus();
  useHandlePostponeStatus();
  useInitializePushNotifications();
  useHandleFocusMode();
  useLateNoMore();
  useSetUserPosthogProperties();
  useStreakDailyReset();

  const { isFetching, isFetchingRoutineError } = useFetchRoutineData();

  useEffect(() => {
    dispatch(updateDeviceDataApiAction());
    dispatch(getUserLongTermGoals());
  }, []);

  useEffect(() => {
    if (isHabitsScreenVisible) {
      dispatch(getUserDetails());
    }
  }, [isHabitsScreenVisible]);

  useEffect(() => {
    if (userId) {
      Sentry.setUser({ id: userId });
    }
  }, [userId]);

  useEffect(() => {
    if (isPostPoneFlowFromDistractionAlert) {
      onPressPostpone();
      dispatch(onPostPoneFlowFromDistractionAlert(false));
    }
  }, [isPostPoneFlowFromDistractionAlert]);

  useEffect(() => {
    if (startupTime && shutdownTime && isHabitsScreenVisible) {
      showFloatingView(false);
      dispatch(getUserLocalDeviceSettings());
    }
  }, [startupTime, shutdownTime, isHabitsScreenVisible, dispatch]);

  return (
    <View style={styles.flex}>
      <HomeTabView
        addTaskAppActionRequest={addTaskAppActionRequest}
        isFetchingRoutineError={isFetchingRoutineError}
      />
      <AnalyzeSleepMoodModal />
      <SurveyRating />
      <FullPageLoading show={isFetching} />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
