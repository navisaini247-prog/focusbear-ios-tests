import { useEffect, useRef } from "react";
import { useSelector } from "@/reducers";
import { OverlayModule } from "@/nativeModule";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { getCurrentScreenName, subscribeToRouteChanges } from "@/navigation/root.navigator";
import { addInfoLog } from "@/utils/FileLogger";

/**
 * Hook to sync soft block settings from Redux to native Android.
 * This allows the native OverlayControl to make breathing exercise decisions
 * without needing to round-trip through JS, which fixes the deep link issue
 * when accessibility service is not enabled.
 */
export const useSyncSoftBlockSettings = () => {
  const isInFocusMode = useSelector((state) => state.focusMode?.isInFocusMode ?? false);
  const easySkipModeEnabled = useSelector(
    (state) => state.user?.userLocalDeviceSettingsData?.MacOS?.kIsEasySkipEnabled ?? true,
  );
  const recentBreathingExercise = useSelector((state) => state.global?.recentBreathingExercise);

  // Track last synced values to avoid redundant native calls
  const lastSyncedRef = useRef({
    easySkipModeEnabled: null,
    isInFocusMode: null,
    currentScreen: null,
    bypassPackageId: null,
    bypassUntil: null,
    unblockingReason: null,
  });

  useEffect(() => {
    if (!checkIsAndroid()) {
      return;
    }

    const syncToNative = () => {
      const currentScreen = getCurrentScreenName() ?? "";
      const bypassPackageId = recentBreathingExercise?.packageId ?? null;
      const bypassUntil = recentBreathingExercise?.bypassUntil ?? 0;
      const unblockingReason = recentBreathingExercise?.unblockingReason ?? null;

      const last = lastSyncedRef.current;

      // Only sync if values have actually changed
      if (
        last.easySkipModeEnabled === easySkipModeEnabled &&
        last.isInFocusMode === isInFocusMode &&
        last.currentScreen === currentScreen &&
        last.bypassPackageId === bypassPackageId &&
        last.bypassUntil === bypassUntil &&
        last.unblockingReason === unblockingReason
      ) {
        return; // No changes, skip sync
      }

      // Update last synced values
      lastSyncedRef.current = {
        easySkipModeEnabled,
        isInFocusMode,
        currentScreen,
        bypassPackageId,
        bypassUntil,
        unblockingReason,
      };

      addInfoLog(
        `[useSyncSoftBlockSettings] Syncing to native: easySkip=${easySkipModeEnabled}, focusMode=${isInFocusMode}, screen=${currentScreen}, bypassPkg=${bypassPackageId}, bypassUntil=${bypassUntil}`,
      );

      OverlayModule.updateSoftBlockSettings(
        easySkipModeEnabled,
        isInFocusMode,
        currentScreen,
        bypassPackageId,
        bypassUntil,
        unblockingReason,
      );
    };

    // Sync immediately on mount and when Redux values change
    syncToNative();

    const unsubscribeRouteChanges = subscribeToRouteChanges(() => {
      syncToNative();
    });

    return () => unsubscribeRouteChanges();
  }, [isInFocusMode, easySkipModeEnabled, recentBreathingExercise]);
};
