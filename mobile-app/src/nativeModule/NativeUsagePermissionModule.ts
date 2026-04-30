// TurboModule spec for UsagePermissionModule
import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  requestIgnoreBatteryOptimization(): Promise<boolean>;
  getIgnoreBatteryOptimizationPermission(): Promise<boolean>;
  requestDNDPermissions(): void;
  checkIsDNDPermissionGranted(): Promise<boolean>;
  shouldEnableDNDMode(shouldEnable: boolean): void;
}

export default TurboModuleRegistry.get<Spec>("UsagePermissionModule");
