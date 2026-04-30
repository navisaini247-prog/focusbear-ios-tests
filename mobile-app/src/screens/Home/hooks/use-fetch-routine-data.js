import { useCallback, useState, useEffect } from "react";
import { userRoutineDataAction } from "@/actions/RoutineActions";
import { getCurrentActivityProps } from "@/actions/UserActions";
import { lastTimeCurrentActivityPropsFetchedSelector } from "@/selectors/UserSelectors";
import { useDispatch } from "react-redux";
import { addErrorLog, addInfoLog } from "@/utils/FileLogger";
import { useFocusEffect } from "@react-navigation/native";
import { useAppActiveState } from "@/hooks/use-app-active-state";
import { store } from "@/store";
import NetInfo from "@react-native-community/netinfo";

const ONE_MINUTE = 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

/*
 * Hook to regularly sync current activity props and user settings (fullRoutineData) under certain triggers.
 * - note: current-activity-props has the property last_time_user_settings_modified which we use to trigger a user-settings sync.
 */
export const useFetchRoutineData = () => {
  const dispatch = useDispatch();

  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);

  const checkAndFetchRoutineData = useCallback(async () => {
    const lastTimeCurrentActivityPropsFetched = lastTimeCurrentActivityPropsFetchedSelector(store.getState());
    // Fetch current activity props every 10 minutes
    const shouldFetchCurrentActivityProps =
      Date.now() > new Date(lastTimeCurrentActivityPropsFetched).getTime() + TEN_MINUTES;

    if (shouldFetchCurrentActivityProps) {
      // Guard against clearly-offline state to avoid unnecessary error events (#4162)
      let isConnected = false;
      if (NetInfo && typeof NetInfo.fetch === "function") {
        const netState = await NetInfo.fetch();
        isConnected = netState.isConnected;
      }
      if (!isConnected) {
        addInfoLog("use-fetch-routine-data: skipping poll — no network connection or NetInfo unavailable");
        return;
      }

      setIsFetching(true);
      try {
        dispatch(userRoutineDataAction());

        if (shouldFetchCurrentActivityProps) await dispatch(getCurrentActivityProps());
      } catch (error) {
        addErrorLog("Error use-fetch-routine-data", error);
        setIsError(true);
      } finally {
        setIsFetching(false);
      }
    }
  }, [dispatch]);

  useEffect(() => {
    checkAndFetchRoutineData();
    const interval = setInterval(checkAndFetchRoutineData, ONE_MINUTE);
    return () => clearInterval(interval);
  }, [checkAndFetchRoutineData]);

  // Fetch current activity props when home screen if focused and when app is focused
  useFocusEffect(
    useCallback(() => {
      dispatch(getCurrentActivityProps());
    }, [dispatch]),
  );
  useAppActiveState(async () => {
    let isConnected = false;
    if (NetInfo && typeof NetInfo.fetch === "function") {
      const netState = await NetInfo.fetch();
      isConnected = netState.isConnected;
    }
    if (isConnected) {
      dispatch(getCurrentActivityProps());
    } else {
      addInfoLog("use-fetch-routine-data: skipping app-resume fetch — no network connection or NetInfo unavailable");
    }
  });

  return { isFetching, isFetchingRoutineError: isError };
};
