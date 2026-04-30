// TurboModule spec for FloatingViewModule
import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  showFloatingView(
    isStarted: boolean,
    time: number,
    activityName: string,
    completionRequirements: string,
    isTimerPaused: boolean,
  ): void;
  hideFloatingView(): void;
}

export default TurboModuleRegistry.get<Spec>("FloatingViewModule");
