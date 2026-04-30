const ONE_DAY = 24 * 60 * 60 * 1000;

// ---- Domain constants (Preset A) -------------------------------------------
export const URGENCY_DECAY_TAU_DAYS = 8.586175740226025; // where the cliff starts
export const URGENCY_SHAPE_BETA = 0.4289868389966291; // steepness of the cliff
export const EFFORT_MINUTES_PER_RUNWAY_DAY = 60; // 1 hour ≍ 1 runway day
export const SCORE_TODAY = 9;
export const SCORE_PAST_DUE = 10;
export const SCORE_FLOOR = 0.1;

const MS_PER_DAY = ONE_DAY;
const NUMERIC_STABILITY_EPS = 1e-9;

export const DUE_IN = {
  TODAY: "TODAY",
  TOMORROW: "TOMORROW",
  A_FEW_DAYS: "A_FEW_DAYS",
  NEXT_WEEK: "NEXT_WEEK",
  TWO_WEEKS: "TWO_WEEKS",
  A_MONTH: "A_MONTH",
  A_FEW_MONTHS: "A_FEW_MONTHS",
  A_YEAR: "A_YEAR",
  NEVER: "NEVER",
};

export const DUE_IN_TIME = {
  [DUE_IN.TODAY]: new Date(0),
  [DUE_IN.TOMORROW]: new Date(ONE_DAY),
  [DUE_IN.A_FEW_DAYS]: new Date(ONE_DAY * 2),
  [DUE_IN.NEXT_WEEK]: new Date(ONE_DAY * 7),
  [DUE_IN.TWO_WEEKS]: new Date(ONE_DAY * 14),
  [DUE_IN.A_MONTH]: new Date(ONE_DAY * 30),
  [DUE_IN.A_FEW_MONTHS]: new Date(ONE_DAY * 120),
  [DUE_IN.A_YEAR]: new Date(ONE_DAY * 365),
  [DUE_IN.NEVER]: new Date(ONE_DAY * 365 * 10),
};

export const OUTCOME = {
  WHO_CARES: 1,
  KIND_OF_IMPORTANT: 3,
  BIG_DEAL: 5,
  HUGE: 7,
  MIND_BLOWING: 10,
};

export const PERSPIRATION = {
  FIVE_MINUTE_JOB: 1,
  FIFTEEN_MINUTES_WORK: 2,
  HALF_AN_HOUR: 3,
  AN_HOUR: 4,
  HALF_A_DAY: 6,
  A_DAY: 8,
  A_WEEK: 10,
};

export const TASK_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  DRAFT: "DRAFT",
};

export const TASK_LIST_ORDER = {
  ASC: "ASC",
  DESC: "DESC",
};

export const NOT_STARTED_AND_IN_PROGRESS = "NOT_STARTED_AND_IN_PROGRESS";

export const TASK_LIST_GROUPING = {
  GROUPED_TOGETHER: "GROUPED_TOGETHER",
  SEPARATE: "SEPARATE",
};

export const PERSPIRATION_FILTER = {
  LOW_SPOONS: "LOW_SPOONS",
  FULL_SPOONS: "FULL_SPOONS",
};

export const TIME_HORIZON_FILTER = {
  OVERDUE: "OVERDUE",
  TODAY: "TODAY",
  TOMORROW: "TOMORROW",
  THIS_WEEK: "THIS_WEEK",
  NEXT_WEEK: "NEXT_WEEK",
  LATER: "LATER",
};

// Convert a due date to a score between 0 and 10.0
// WHEN to_do.due_date IS NULL THEN 0.1
// WHEN to_do.due_date < CURRENT_DATE THEN 10.0
// WHEN to_do.due_date = CURRENT_DATE THEN 9
// ELSE GREATEST(0.1, 8.0 - (LN(EXTRACT(DAY FROM (to_do.due_date - CURRENT_DATE)) + 1) * 1.5))
export const getTimelineScore = (due_date) => {
  const dueDate = new Date(due_date);
  if (isNaN(dueDate)) return 0.1;

  const currentDate = new Date(new Date().setHours(0, 0, 0, 0));
  if (dueDate.getTime() < currentDate.getTime()) {
    // Overdue: 10 + 1 per full day overdue (no cap)
    const daysOverdue = Math.floor((currentDate.getTime() - dueDate.getTime()) / ONE_DAY);
    return 10 + daysOverdue;
  }
  if (dueDate.getTime() === currentDate.getTime()) return 9;

  const days = (dueDate.getTime() - currentDate.getTime()) / ONE_DAY;
  return Math.max(0.1, 8 - Math.log(days + 1) * 1.5);
};

// ---- Date helpers -----------------------------------------------------------
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const daysUntilDue = (due, now = new Date()) =>
  (startOfDay(new Date(due)).getTime() - startOfDay(now).getTime()) / MS_PER_DAY;

// ---- Urgency (0..10, 10 today → 0 far away) --------------------------------
export const exponentialUrgency = (days) => 10 * Math.exp(-Math.pow(days / URGENCY_DECAY_TAU_DAYS, URGENCY_SHAPE_BETA));

// ---- Base urgency (logarithmic formula from original proposal) ------------
export const baseUrgency = (days) => {
  return Math.max(0.1, 8 - Math.log(days + 1) * 1.5);
};

// ---- Workload factor (0..1): share of runway consumed by this effort --------
export const workloadShareOfRunway = (effortMinutes, days) => {
  const minutes = Math.max(0, Number(effortMinutes) || 0);
  const runwayMinutes = Math.max(0, days) * EFFORT_MINUTES_PER_RUNWAY_DAY;
  return minutes / Math.max(NUMERIC_STABILITY_EPS, minutes + runwayMinutes);
};

// ---- Time-pressure score (0.1..10+) ----------------------------------------
export const timePressureScore = (due, effortMinutes = 0) => {
  if (!due) return SCORE_FLOOR;

  const dueDate = new Date(due);
  if (isNaN(dueDate.getTime())) return SCORE_FLOOR;

  const days = daysUntilDue(dueDate);

  // Handle overdue tasks: base score + 1 point per overdue day (no cap)
  if (days < 0) {
    const overdueDays = Math.abs(days);
    const baseScore = SCORE_PAST_DUE; // 10 points
    const overduePenalty = overdueDays; // +1 for each day overdue
    return baseScore + overduePenalty;
  }

  if (days === 0) return SCORE_TODAY;

  // Use the exact formula from original proposal
  const base = baseUrgency(days);
  const modifier = workloadShareOfRunway(effortMinutes, days);
  return Math.max(SCORE_FLOOR, (base / 8) * 10 * modifier);
};

// ---- Map perspiration level (1..10) to effort minutes ----------------------
export const mapPerspirationLevelToMinutes = (level) => {
  const mapping = {
    1: 5, // 5 minute job
    2: 15, // 15 minutes work
    3: 30, // Half an hour
    4: 60, // An hour
    5: 240, // Half a day
    6: 240, // Half a day
    7: 480, // A day
    8: 480, // A day
    9: 3360, // A week
    10: 3360, // A week
  };

  const numLevel = Number(level);
  if (isNaN(numLevel) || numLevel < 1 || numLevel > 10) {
    return 5; // Default to 5 minutes for unknown/invalid levels
  }

  const L = Math.floor(numLevel);
  return mapping[L] || 5; // Default to 5 minutes if somehow not in mapping
};

export const getTOPScore = (task) => {
  if (!task) return 0;
  // Prefer backend-computed score when available
  if (typeof task.top_score === "number") return task.top_score;

  const outcome = Number(task?.outcome);
  const perspirationLevel = Math.max(1, Math.min(10, Number(task?.perspiration_level) || 1));
  const effortMinutes = mapPerspirationLevelToMinutes(perspirationLevel);
  if (isNaN(outcome)) return 0;

  const timePressure = timePressureScore(task?.due_date, effortMinutes);
  // Divide by perspiration level
  return (timePressure * outcome) / Math.max(1, perspirationLevel);
};

export const stripBackendScores = (task) => {
  if (!task || typeof task.top_score !== "number") {
    return task;
  }
  const { top_score: _unusedTopScore, ...rest } = task;
  return rest;
};

export const getDueInCategory = (dueIn) => {
  for (const [category, _dueIn] of Object.entries(DUE_IN_TIME)) {
    if (dueIn.getTime() === _dueIn.getTime()) {
      return category;
    }
  }

  return null;
};

export const convertDueInToDate = (dueIn) => {
  dueIn = new Date(dueIn);
  const today = new Date().setHours(0, 0, 0, 0);
  if (isNaN(dueIn)) {
    return new Date(today);
  }
  return new Date(today + dueIn.getTime());
};

export const convertDateToDueIn = (date) => {
  date = new Date(date);
  if (isNaN(date)) {
    return new Date(ONE_DAY);
  }
  const today = new Date().setHours(0, 0, 0, 0);
  return new Date(date.getTime() - today);
};

export const filterTasks = (tasks, { perspirationFilter, timeHorizonFilter, tagFilter }) => {
  return tasks.filter((task) => {
    let matchesPerspiration = true,
      matchesTags = true,
      matchesDueDate = true;
    if (perspirationFilter !== null) {
      if (perspirationFilter === PERSPIRATION_FILTER.LOW_SPOONS) {
        matchesPerspiration = task?.perspiration_level <= 3;
      } else if (perspirationFilter === PERSPIRATION_FILTER.FULL_SPOONS) {
        matchesPerspiration = task?.perspiration_level > 3;
      }
    }
    if (tagFilter.length > 0) {
      matchesTags = tagFilter.every((_tag) => (task?.tags || []).some((tag) => tag?.id === _tag?.id));
    }

    if (timeHorizonFilter !== null) {
      if (!task?.due_date) {
        matchesDueDate = false;
      } else {
        const days = daysUntilDue(task?.due_date);
        if (days === null || isNaN(days)) {
          matchesDueDate = false;
        } else {
          switch (timeHorizonFilter) {
            case TIME_HORIZON_FILTER.TODAY:
              matchesDueDate = days === 0;
              break;
            case TIME_HORIZON_FILTER.TOMORROW:
              matchesDueDate = days === 1;
              break;
            case TIME_HORIZON_FILTER.THIS_WEEK:
              matchesDueDate = days >= 2 && days <= 7;
              break;
            case TIME_HORIZON_FILTER.NEXT_WEEK:
              matchesDueDate = days >= 8 && days <= 14;
              break;
            case TIME_HORIZON_FILTER.LATER:
              matchesDueDate = days >= 15;
              break;
            case TIME_HORIZON_FILTER.OVERDUE:
              matchesDueDate = days < 0;
              break;
            default:
              matchesDueDate = false;
              break;
          }
        }
      }
    }
    return matchesPerspiration && matchesTags && matchesDueDate;
  });
};
