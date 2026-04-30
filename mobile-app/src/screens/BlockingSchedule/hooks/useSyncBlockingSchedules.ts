import { useCallback, useState, useRef, useEffect } from "react";
import moment from "moment";
import { logAPIError, addInfoLog } from "@/utils/FileLogger";
import { checkIsAndroid, checkIsIOS } from "@/utils/PlatformMethods";
import { ControlFunctionModule, BlockingScheduleModule } from "@/nativeModule";
import {
  clearAllBlockingSchedulesNativeMethod,
  getBlockingSchedulesNativeMethod,
  removeBlockingScheduleNativeMethod,
  updateScheduleBlockingStatus,
} from "@/utils/NativeModuleMethods";
import {
  fetchBlockingSchedules,
  createBlockingSchedule,
  createFocusMode,
  BLOCKED_ANDROID_APPS_METADATA_KEY,
  BLOCKED_URLS_METADATA_KEY,
  LEGACY_BLOCKED_APPS_METADATA_KEY,
} from "@/actions/BlockingSchedulesAction";
import { useDispatch, useSelector } from "react-redux";
import useFetchInstalledApps from "@/hooks/use-fetch-installed-apps";
import { userAccessTokenSelector } from "@/selectors/UserSelectors";
import { convertDaysFromApi, buildNativePayload, buildBlockedAppInfos } from "@/utils/BlockingScheduleUtils";
import { DEFAULT_BLOCKING_MODE } from "@/constants/blockingSchedule";

const getValidAndroidPackageNames = (apps: unknown): string[] => {
  if (!Array.isArray(apps)) {
    return [];
  }

  return [...new Set(apps.filter((app): app is string => typeof app === "string" && app.includes(".")))];
};

export const useSyncBlockingSchedules = () => {
  const dispatch = useDispatch();
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { installedApps } = useFetchInstalledApps(false);
  const accessToken = useSelector(userAccessTokenSelector);
  const createdFocusMapRef = useRef<Map<string, string>>(new Map());
  const migratingRef = useRef(false);
  const migratedIdsRef = useRef<Set<string>>(new Set());

  const installedAppsRef = useRef(installedApps);

  useEffect(() => {
    installedAppsRef.current = installedApps;
  }, [installedApps]);

  const migrateLegacyNativeSchedules = useCallback(async () => {
    if (migratingRef.current) {
      return;
    }
    migratingRef.current = true;
    try {
      const schedules = await getBlockingSchedulesNativeMethod();

      for (const schedule of schedules) {
        if (!schedule || typeof schedule !== "object") {
          continue;
        }
        if (schedule.focusModeId) {
          continue;
        }
        if (migratedIdsRef.current.has(schedule.id)) {
          continue;
        }

        const interval =
          schedule.interval && typeof schedule.interval === "object"
            ? schedule.interval
            : {
                startHour: schedule.startHour,
                startMinute: schedule.startMinute,
                endHour: schedule.endHour,
                endMinute: schedule.endMinute,
              };

        const blockedAppInfos = Array.isArray(schedule.blockedAppInfos) ? schedule.blockedAppInfos : [];
        const blockedPackages = Array.isArray(schedule.blockedPackages)
          ? schedule.blockedPackages.filter((pkg) => typeof pkg === "string")
          : [];

        const derivedDaysOfWeek =
          Array.isArray(schedule.daysOfWeek) && schedule.daysOfWeek.length
            ? schedule.daysOfWeek
            : convertDaysFromApi(schedule.days_of_week);

        const startTimeDate = moment()
          .hours(interval.startHour || 0)
          .minutes(interval.startMinute || 0)
          .seconds(0)
          .milliseconds(0)
          .toDate();
        const endTimeDate = moment()
          .hours(interval.endHour || 0)
          .minutes(interval.endMinute || 0)
          .seconds(0)
          .milliseconds(0)
          .toDate();

        const selectedApps =
          blockedAppInfos.length > 0
            ? blockedAppInfos.map((app) => ({ packageName: app.packageName }))
            : blockedPackages.map((pkg) => ({ packageName: pkg }));

        try {
          addInfoLog(`[BlockingSchedule] Migrating legacy schedule ${schedule.id}`);
          const legacyUrls = Array.isArray(schedule.blockedUrls) ? schedule.blockedUrls : [];
          const apiResponse = await dispatch(
            createBlockingSchedule({
              scheduleId: schedule.id,
              name: schedule.name,
              startTime: startTimeDate,
              endTime: endTimeDate,
              selectedDays: derivedDaysOfWeek,
              blockingMode: schedule.blockingMode || DEFAULT_BLOCKING_MODE,
              selectedApps,
              selectedUrls: legacyUrls,
            }) as any,
          );

          const newFocusModeId = apiResponse?.focus_mode_id || apiResponse?.focusModeId;

          if (newFocusModeId) {
            createdFocusMapRef.current.set(schedule.id, newFocusModeId);
            migratedIdsRef.current.add(schedule.id);
          }

          await removeBlockingScheduleNativeMethod(schedule.id);
          await updateScheduleBlockingStatus();
        } catch (error) {
          logAPIError("migrateLegacyNativeSchedule createBlockingSchedule error:", error);
        }
      }
    } finally {
      migratingRef.current = false;
    }
  }, [dispatch]);

  const syncSchedules = useCallback(async () => {
    try {
      setIsSyncing(true);

      const response = await dispatch(fetchBlockingSchedules());

      const apiSchedules = Array.isArray(response) ? response : [];

      if (checkIsAndroid()) {
        // Process migration sequentially to avoid overwhelming the API with concurrent requests
        for (const item of apiSchedules) {
            const focusMode = item?.focus_mode;
            const focusModeId = focusMode?.id || item?.focus_mode_id;
            const metadata = focusMode?.metadata;
            const hasAndroidApps = Array.isArray(metadata?.[BLOCKED_ANDROID_APPS_METADATA_KEY]);

            if (!focusModeId || hasAndroidApps) {
              continue;
            }

            const legacyApps = getValidAndroidPackageNames(metadata?.[LEGACY_BLOCKED_APPS_METADATA_KEY]);
            if (legacyApps.length === 0) {
              continue;
            }

            try {
              await createFocusMode({
                focusModeId,
                name: (focusMode?.name || item?.name || "").trim().replace(/[\r\n]+/g, " "),
                selectedApps: legacyApps.map((packageName: string) => ({ packageName })),
                selectedUrls: Array.isArray(metadata?.[BLOCKED_URLS_METADATA_KEY]) ? metadata[BLOCKED_URLS_METADATA_KEY] : [],
              });
              item.focus_mode = {
                ...focusMode,
                metadata: {
                  ...metadata,
                  [BLOCKED_ANDROID_APPS_METADATA_KEY]: legacyApps,
                },
              };
            } catch (error) {
              logAPIError("migrate-legacy-focus-mode-metadata error:", error);
            }
        }
      }

      // Reconcile native schedules with API: only keep schedules that still exist in the backend.
      // If a schedule was deleted on another device (e.g. Windows), remove it locally.
      try {
        const apiIds = new Set(apiSchedules.map((s) => s?.id).filter(Boolean));
        const nativeSchedules = await getBlockingSchedulesNativeMethod();
        nativeSchedules
          .filter((s: any) => s && typeof s.id === "string" && !apiIds.has(s.id))
          .forEach((stale: any) => {
            addInfoLog(`[BlockingSchedule] Removing stale native schedule ${stale.id} not found in API`);
            removeBlockingScheduleNativeMethod(stale.id).catch((error) => {
              logAPIError("remove-stale-native-schedule error:", error);
            });
          });
      } catch (error) {
        logAPIError("reconcile-native-schedules error:", error);
      }

      const nativePayload = apiSchedules.map((schedule) => {
        const base = buildNativePayload(schedule);
        return base;
      });

      let appMap: Map<string, { appName: string; icon: string }> | null = null;
      const blockedAppsBySchedule: Record<string, string[]> = {};
      const blockedUrlsBySchedule: Record<string, string[]> = {};
      apiSchedules.forEach((item) => {
        const appList = item?.focus_mode?.metadata?.[BLOCKED_ANDROID_APPS_METADATA_KEY] || [];
        if (Array.isArray(appList) && appList.length > 0) {
          blockedAppsBySchedule[item.id] = appList;
        }
        const urlList = item?.focus_mode?.metadata?.[BLOCKED_URLS_METADATA_KEY] || [];
        if (Array.isArray(urlList) && urlList.length > 0) {
          blockedUrlsBySchedule[item.id] = urlList;
        }
      });

      // Use ref to get latest installedApps without causing dependency changes
      const currentInstalledApps = installedAppsRef.current;
      if (checkIsAndroid() && Array.isArray(currentInstalledApps) && currentInstalledApps.length > 0) {
        appMap = new Map();
        currentInstalledApps.forEach((app) => {
          if (app?.packageName) {
            appMap.set(app.packageName, {
              appName: app.appName || app.packageName,
              icon: app.icon || "",
            });
          }
        });
      }

      if (checkIsIOS() && ControlFunctionModule?.setBlockingSchedules) {
        await ControlFunctionModule.setBlockingSchedules(JSON.stringify(nativePayload));
      } else if (checkIsAndroid() && BlockingScheduleModule?.setBlockingSchedules) {
        await BlockingScheduleModule.setBlockingSchedules(JSON.stringify(nativePayload));
      }

      if (checkIsAndroid() && BlockingScheduleModule?.setScheduleBlockedSelection) {
        await Promise.all(
          nativePayload.map(async (item) => {
            const packages = blockedAppsBySchedule[item.id] || [];
            if (packages.length === 0) return;
            const infos = buildBlockedAppInfos(packages, appMap);
            try {
              await BlockingScheduleModule.setScheduleBlockedSelection(item.id, infos);
            } catch (error) {
              logAPIError("useSyncBlockingSchedules setScheduleBlockedSelection error:", error);
            }
          }),
        );
      }

      if (checkIsAndroid() && BlockingScheduleModule?.setScheduleBlockedUrls) {
        await Promise.all(
          nativePayload.map(async (item) => {
            const urls = blockedUrlsBySchedule[item.id] || [];
            if (urls.length === 0) return;
            try {
              await BlockingScheduleModule.setScheduleBlockedUrls(item.id, urls);
            } catch (error) {
              logAPIError("useSyncBlockingSchedules setScheduleBlockedUrls error:", error);
            }
          }),
        );
      }

      // 6) Reload from native and expose to UI
      const schedules = await getBlockingSchedulesNativeMethod();
      setAllSchedules(schedules);
      return schedules;
    } catch (error) {
      logAPIError("sync-blocking-schedules error:", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (accessToken) {
      const run = async () => {
        await migrateLegacyNativeSchedules();
        await syncSchedules();
      };
      run();
    } else {
      try {
        clearAllBlockingSchedulesNativeMethod();
        addInfoLog("[BlockingSchedule] Cleared native schedules on logout");
      } catch (error) {
        logAPIError("clear-native-schedules-on-logout error:", error);
      }
      setAllSchedules([]);
      createdFocusMapRef.current.clear();
      migratedIdsRef.current.clear();
      return;
    }
  }, [accessToken, migrateLegacyNativeSchedules, syncSchedules]);

  return {
    allSchedules,
    isSyncing,
    syncSchedules,
  };
};

export default useSyncBlockingSchedules;
