import moment from "moment";

const HH_MM = "HH:mm";
const parse = (time: string) => moment(time, HH_MM, true);

type ScheduleErrors = {
  startup?: string;
  shutdown?: string;
  cutoff?: string;
};

/**
 * Validates routine structure (startup_time, shutdown_time, cutoff_time)
 */
export const validateRoutineSchedule = (
  t: (key: string) => string,
  startupTime: string,
  shutdownTime: string,
  cutoffTime?: string,
): ScheduleErrors => {
  const startup = parse(startupTime);
  const shutdown = parse(shutdownTime);

  if (!startup.isValid() || !shutdown.isValid()) return {};

  // Starup and shutdown must not be equal
  if (startup.isSame(shutdown, "minute")) {
    return {
      startup: t("editRoutine.wakeUpFinishWorkSameError"),
      shutdown: t("editRoutine.wakeUpFinishWorkSameError"),
    };
  }

  if (cutoffTime) {
    const cutoff = parse(cutoffTime);
    if (!cutoff.isValid()) return {};

    const spansMidnight = startup.isAfter(shutdown);

    // Cutoff must be between shutdown and startup
    const isInvalid = spansMidnight
      ? cutoff.isAfter(startup) || cutoff.isBefore(shutdown)
      : cutoff.isAfter(startup) && cutoff.isBefore(shutdown);

    if (isInvalid) {
      return { cutoff: t("editRoutine.cutoffOutOfRangeError") };
    }
  }

  return {};
};

/**
 * Validates custom routine start and end times.
 */
export const validateCustomRoutineTimes = (
  t: (key: string) => string,
  startTime: string | null,
  endTime: string | null,
): string | null => {
  if (!startTime || !endTime) return null;

  const start = parse(startTime);
  const end = parse(endTime);

  if (!start.isValid() || !end.isValid()) return null;

  // Start must be strictly before end (spanning midnight is not allowed).
  if (start.isSameOrAfter(end, "minute")) {
    return t("editRoutine.startBeforeEndError");
  }

  return null;
};
