import { DAYS, ALL } from "@/constants/activity";
import { ACTIVITY_TYPE, ROUTINE_STATUS, ROUTINE_TRIGGER } from "@/constants/routines";

export type DayOfWeek = (typeof DAYS)[number] | typeof ALL;
export type ActivityType = (typeof ACTIVITY_TYPE)[keyof typeof ACTIVITY_TYPE];
export type RoutineTrigger = (typeof ROUTINE_TRIGGER)[keyof typeof ROUTINE_TRIGGER];
export type RoutineStatus = (typeof ROUTINE_STATUS)[keyof typeof ROUTINE_STATUS];

// Activity
export interface Activity {
  id: string;
  name: string;
  activity_sequence_id: string;
  activity_template_id: string | null;
  activity_type: ActivityType;
  duration_seconds: number;
  habit_icon: string;
  priority: "STANDARD" | "HIGH";
  created_at: string;
  is_default: boolean;
  run_micro_breaks: boolean;
  log_quantity: boolean;
  log_summary_type: "SUM" | "AVERAGE";
  days_of_week: DayOfWeek[];
  choices: string[];
  video_urls: string[];
  allowed_apps?: string[];
  allowed_urls?: string[];
  image_urls?: { url: string }[];
  text_instructions?: string;
  completion_requirements?: string;
  tutorial: any | null;
  take_notes?: "DURING_ACTIVITY" | "END_OF_ACTIVITY";
  category?: string;
  log_quantity_questions: {
    id: string;
    linked_question_id: string | null;
    question: string;
    min_value_description: string | null;
    max_value_description: string | null;
    min_value: number;
    max_value: number;
    log_summary_type: "SUM" | "AVERAGE";
  }[];
  linked_activity_id: string | null;
  impact_category: string | null;
  cutoff_time_for_doing_activity: string | null;
  check_list?: string[];
}

// Custom Routine
export interface CustomRoutine {
  id: string;
  name: string;
  trigger: RoutineTrigger;
  activity_sequence_id: string;
  standalone_activities: Activity[];
  created_at?: string;
  updated_at?: string;

  // Schedule properties (only for ON_SCHEDULE trigger)
  start_time: string | null;
  end_time: string | null;
  days_of_week?: DayOfWeek[];
}

export interface RoutineData {
  startup_time: string;
  shutdown_time: string;
  break_after_minutes: number;
  cutoff_time_for_high_priority_activities: string;
  break_activities: Activity[];
  evening_activities: Activity[];
  morning_activities: Activity[];
  custom_routines: CustomRoutine[];
}

// Routine Progress
export interface RoutineProgress {
  sequence_id: string;
  status: RoutineStatus;
  completed_habit_ids?: string[];
}

// Today Routine Progress
export interface TodayRoutineProgress {
  morning_routine: RoutineProgress | null;
  evening_routine: RoutineProgress | null;
  custom_routines: RoutineProgress[];
  standalone_routines: RoutineProgress[];
}

// Current Activity Sequence (for current-activity-props -> current_activity_sequence & last_completed_sequence)
export interface CurrentActivitySequence {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  type: "morning" | "evening" | "custom";
  activity_ids: string[];
  generated_sequence_activity_ids: string[] | null;
  total_duration_seconds: string;
  generated_total_duration_seconds: string | null;
  pack_id: string | null;
  custom_routine_id: string | null;
  custom_routine: any | null;
}
