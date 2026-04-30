import { useSelector } from "@/reducers";
import { useState, useEffect, useCallback } from "react";
import { getPreLoadedInstalledApps } from "@/selectors/GlobalSelectors";
import { OverlayModule } from "@/nativeModule";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { addErrorLog } from "@/utils/FileLogger";

const useFetchInstalledApps = (isOnboarding) => {
  const preLoadedInstalledApps = useSelector(getPreLoadedInstalledApps);
  const [installedApps, setInstalledApps] = useState([]);
  const [isFetchingApps, setIsFetchingApps] = useState(true);
  const [shouldFetchApps, setShouldFetchApps] = useState(false);

  useEffect(() => {
    if (checkIsAndroid() && preLoadedInstalledApps?.length > 0) {
      setInstalledApps(preLoadedInstalledApps);
      setIsFetchingApps(false);
    }
  }, [preLoadedInstalledApps]);

  const fetchApps = useCallback(async () => {
    if (!checkIsAndroid()) {
      return;
    }
    setIsFetchingApps(true);
    try {
      const apps = await OverlayModule.getApps();
      setInstalledApps(apps || []);
    } catch (error) {
      addErrorLog("Error fetching installed apps:", error);
    } finally {
      setIsFetchingApps(false);
    }
  }, []);

  // This is used to allow the UI to complete a render before fetching the apps
  useEffect(() => setShouldFetchApps(true), []);

  useEffect(() => {
    if (shouldFetchApps && (!checkIsAndroid() || !isOnboarding || preLoadedInstalledApps?.length === 0)) {
      fetchApps();
    }
  }, [fetchApps, isOnboarding, preLoadedInstalledApps, shouldFetchApps]);

  return { installedApps, isFetchingApps, refetchApps: fetchApps };
};

export default useFetchInstalledApps;
