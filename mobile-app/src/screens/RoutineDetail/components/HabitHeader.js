import React from "react";
import { AppHeader } from "@/components";
import { useRoutineDetailContext } from "../context/context";

export const HabitHeader = () => {
  const {
    activityInfo: { activityName },
  } = useRoutineDetailContext();

  return <AppHeader title={activityName} />;
};
