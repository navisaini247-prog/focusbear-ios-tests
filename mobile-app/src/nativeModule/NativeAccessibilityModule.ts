// TurboModule spec for AccessibilityModule
import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  checkAccessibilityPermission(): Promise<boolean>;
  grantAccessibilityPermission(): void;
  revokeAccessibilityPermission(): void;
}

export default TurboModuleRegistry.get<Spec>("AccessibilityModule");
