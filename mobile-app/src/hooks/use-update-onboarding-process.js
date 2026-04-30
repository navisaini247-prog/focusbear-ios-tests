import { updateOnboardingProcess } from "@/actions/GlobalActions";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { postHogCapture } from "@/utils/Posthog";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export const useUpdateOnboardingProcess = (route) => {
  const dispatch = useDispatch();

  useEffect(() => {
    postHogCapture(`${POSTHOG_EVENT_NAMES.IN_ONBOARDING}-${route}`);
    dispatch(updateOnboardingProcess(route));
  }, []);
};
