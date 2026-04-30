import { useCallback, useState, useEffect } from "react";
import InAppReview from "react-native-in-app-review";
import * as Sentry from "@sentry/react-native";
import { addInfoLog } from "@/utils/FileLogger";

export const useInAppReview = () => {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    setIsAvailable(InAppReview.isAvailable());
  }, []);

  const requestReview = useCallback(async () => {
    addInfoLog("Requesting in app review: (isAvailable) ", isAvailable);

    if (!isAvailable) {
      return false;
    }
    try {
      const hasFlowFinishedSuccessfully = await InAppReview.RequestInAppReview();
      return !!hasFlowFinishedSuccessfully;
    } catch (error) {
      Sentry.captureException(error);
      return false;
    }
  }, [isAvailable]);

  return { isAvailable, requestReview };
};
