// TurboModule spec for LauncherKitModule
import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  openAppMenu(): void;
  closeAppMenu(): void;
  isAppMenuOpen(): Promise<boolean>;
}

export default TurboModuleRegistry.get<Spec>("LauncherKit");
