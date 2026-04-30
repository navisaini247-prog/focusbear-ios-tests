import { useEffect, useState } from "react";
import { useSelector } from "@/reducers";
import { NAVIGATION } from "@/constants";
import { AppActivationStatus, useParticipantCode } from "@/hooks/useParticipantCode";
import { useHomeContext } from "@/screens/Home/context";
import { checkIsIOS, checkIsAndroid } from "@/utils/PlatformMethods";
import { navigationReplace } from "../root.navigator";
import {
  hasCompletedConsentFormSelector,
  hasCompletedFlankerSelector,
  hasCompletedQuestionnaireSelector,
  hasCompletedAfterStudyFlankerSelector,
  hasCompletedEoSQuestionnaireSelector,
} from "@/selectors/UserSelectors";

export const useUnicaesStudyNavigation = () => {
  const { getCodeActivationStatus, getLastSyncedDate } = useParticipantCode();
  const [isLoading, setIsLoading] = useState(false);

  const {
    isUnicasStudyParticipant,
    isUsagePermissionGranted,
    isPhysicalPermissionGranted,
    isHealthPermissionGranted,
    isScreenTimePermissionGranted,
  } = useHomeContext();

  const hasCompletedFlanker = useSelector(hasCompletedFlankerSelector);
  const hasCompletedQuestionnaire = useSelector(hasCompletedQuestionnaireSelector);
  const hasCompletedConsentForm = useSelector(hasCompletedConsentFormSelector);
  const hasCompletedAfterStudyFlanker = useSelector(hasCompletedAfterStudyFlankerSelector);
  const hasCompletedEoSQuestionnaire = useSelector(hasCompletedEoSQuestionnaireSelector);

  useEffect(() => {
    if (
      isScreenTimePermissionGranted === undefined ||
      isUsagePermissionGranted === undefined ||
      isHealthPermissionGranted === undefined ||
      isPhysicalPermissionGranted === undefined
    ) {
      return;
    }

    if (isUnicasStudyParticipant) {
      setIsLoading(true);
      const timeout = setTimeout(() => {
        getCodeActivationStatus()
          .then((data) => {
            if (!data) {
              return;
            }

            if (data === AppActivationStatus.END_OF_STUDY) {
              if (!hasCompletedAfterStudyFlanker || !hasCompletedEoSQuestionnaire) {
                navigationReplace(NAVIGATION.UnicaesEndOfStudy);
              }
              return;
            }

            if (!hasCompletedFlanker || !hasCompletedQuestionnaire || !hasCompletedConsentForm) {
              navigationReplace(NAVIGATION.UnicaesStudyOnboarding);
              return;
            }

            const shouldNavigateToPermissionRequest =
              ((!isUsagePermissionGranted || !isPhysicalPermissionGranted) && checkIsAndroid()) ||
              ((!isHealthPermissionGranted || !isScreenTimePermissionGranted) && checkIsIOS());

            if (shouldNavigateToPermissionRequest) {
              navigationReplace(NAVIGATION.PermissionRequest);
            } else {
              if (data === AppActivationStatus.DATA_COLLECTION_MODE) {
                navigationReplace(NAVIGATION.DataCollectionOnly);
              } else {
                if (checkIsIOS()) {
                  getLastSyncedDate().then((data) => {
                    if (data.usageDataLastReceived) {
                      const now = new Date();
                      const diffTime = Math.abs(now.getTime() - data.usageDataLastReceived.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      if (diffDays >= 6) {
                        navigationReplace(NAVIGATION.DataCollectionOnly, {
                          fromMain: true,
                        });
                      }
                    }
                  });
                }
              }
            }
          })
          .finally(() => {
            setIsLoading(false);
          });
      }, 2000);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [
    isHealthPermissionGranted,
    isPhysicalPermissionGranted,
    isScreenTimePermissionGranted,
    isUnicasStudyParticipant,
    isUsagePermissionGranted,
  ]);

  return { isLoading };
};
