// TurboModule spec for ScheduleTasksModule
import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  scheduleTask(timeInMinutes: number): void;
  resumeBlockingAfterPostponeDuration(postponeDuration: number): void;
}

export default TurboModuleRegistry.get<Spec>("ScheduleTasksModule");
