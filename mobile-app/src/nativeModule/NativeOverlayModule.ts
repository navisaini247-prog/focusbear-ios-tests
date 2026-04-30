// TurboModule spec for OverlayModule
import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";
import type { EventEmitter } from "react-native/Libraries/Types/CodegenTypes";

export interface Spec extends TurboModule {
  getPhoneID(): Promise<string>;
  showDistractionWindow(
    routineName: string,
    activityName: string,
    isFocusModeEnabled: boolean,
    isSuperStrictMode: boolean,
    reason: string,
    shouldHideApp: boolean,
    blockedUrl: string,
  ): void;
  saveActivitySpecificAllowedApps(allowedApps: string[]): void;
  startService(routineName: string, activityName: string, allowedApps: string[], useGlobalBlockList: boolean): void;
  updateGlobalBlockingEnabled(enabled: boolean): void;
  stopOverlayService(): Promise<void>;
  storeUpcomingRoutineMessage(routineName: string, activityName: string, allowedApps: string[]): Promise<void>;
  saveAllowedAppsPreference(allowedApps: string[]): Promise<void>;
  saveBlockedAppsPreference(blockedApps: string[]): Promise<void>;
  getApps(): Promise<any[]>;
  saveInstalledApps(): void;
  openOverlayPermission(): void;
  saveRestrictedAppsListType(restrictedAppListType: string): void;
  requestNotificationPolicyDNDPermission(): void;
  isNotificationPolicyDNDPermissionEnabled(): Promise<boolean>;
  shouldEnableDNDMode(shouldEnable: boolean): void;
  goBackToDeviceHome(): void;
  saveCustomBlockedMessage(message: string): void;
  updateSoftBlockSettings(
    easySkipEnabled: boolean,
    isInFocusMode: boolean,
    currentScreen: string,
    bypassPackageId: string | null,
    bypassUntil: number,
    unblockingReason: string | null,
  ): void;

  readonly onOverlayEvent: EventEmitter<string>;
}

export default TurboModuleRegistry.get<Spec>("OverlayModule");
