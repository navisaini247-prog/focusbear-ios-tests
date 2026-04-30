import { NAVIGATION } from "@/constants";
import { useTranslation } from "react-i18next";
// Ordered list of onboarding routes used to compute progress
// Logical grouped steps mapping
// Step 1: Goals + UserAchievement
// Step 2: RoutineSuggestion
// Step 3: SimplifiedSchedule
export const ONBOARDING_STEPS = [NAVIGATION.Goals, NAVIGATION.RoutineSuggestion, NAVIGATION.TimeSetup];

export function useOnboardingStepLabels() {
  const { t } = useTranslation();
  return [t("goalsSteps.goals"), t("goalsSteps.routine"), t("goalsSteps.timing")];
}

export function mapRouteToStepIndex(routeName) {
  if (routeName === NAVIGATION.Goals || routeName === NAVIGATION.UserAchievement) return 0; // step 1
  if (routeName === NAVIGATION.RoutineSuggestion) return 1; // step 2
  if (routeName === NAVIGATION.TimeSetup || routeName === NAVIGATION.SimplifiedSchedule) return 2; // step 3
  return -1;
}

export function getOnboardingIndex(routeName) {
  return mapRouteToStepIndex(routeName);
}
