export const PAUSE_FRICTION = {
  NONE: "none",
  PASSWORD: "password",
};

export const BLOCKING_MODE = {
  GENTLE: "gentle",
  STRICT: "strict",
  SUPER_STRICT: "super-strict",
};

export const SCHEDULE_TYPE = {
  CUSTOM: "custom",
  HABIT: "habit",
};

export const DEFAULT_BLOCKING_MODE = BLOCKING_MODE.GENTLE;
export const DEFAULT_SCHEDULE_TYPE = SCHEDULE_TYPE.CUSTOM;

export const MIN_GENTLE_BLOCK_UNLOCK_MINUTES = 1;
export const MAX_GENTLE_BLOCK_UNLOCK_MINUTES = 30;

export const MIN_PAUSE_BASE_DELAY_SECONDS = 1;
export const MAX_PAUSE_BASE_DELAY_SECONDS = 60;
export const DEFAULT_PAUSE_BASE_DELAY_SECONDS = 5;
export const PAUSE_DELAY_STEP_COUNT = 5;

export function generatePauseDelays(base, stepCount = PAUSE_DELAY_STEP_COUNT) {
  return Array.from({ length: stepCount }, (_, i) => base * Math.pow(2, i));
}
