export enum HealthMetricType {
  HOURS_OF_SLEEP = "hours_of_sleep",
  MINUTES_OF_MOVEMENT = "minutes_of_movement",
  NUMBER_OF_STEPS_MOVED = "number_of_steps_moved",
}

export interface HealthMetricItem {
  metricType: HealthMetricType;
  dayOfTracking: Date;
  metricValue: number;
}

export interface SyncHealthMetricsDto {
  healthMetrics: HealthMetricItem[];
}
