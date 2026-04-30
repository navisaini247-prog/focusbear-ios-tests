import { useCallback } from "react";
import { isParticipantCodeLinkedSelector, participantCodeSelector } from "@/selectors/UserSelectors";
import { useDispatch, useSelector } from "react-redux";
import {
  getParticipantCodeActivationStatus,
  linkUserToParticipantCode,
  registerParticipant,
  verifyParticipantCode,
  getStatsLastSyncedDate,
  setParticipantCodeLinked,
} from "@/actions/UserActions";

export enum AppActivationStatus {
  DATA_COLLECTION_MODE = "data_collection_mode",
  ALL_INTERVENTIONS_ACTIVE = "all_interventions_active",
  END_OF_STUDY = "end_of_study",
}

interface ParticipantDetails {
  email: string;
  phoneNumber: string;
  name: string;
  whatsappConsent: boolean;
  faculty?: string;
  yearLevel?: string;
  lang?: string;
}

interface UseParticipantCodeReturn {
  register: (details: ParticipantDetails) => Promise<void>;
  verifyCode: (code: string) => Promise<{ email: string }>;
  linkCode: (code: string) => Promise<void>;
  getCodeActivationStatus: () => Promise<AppActivationStatus | null>;
  getLastSyncedDate: () => Promise<{
    healthDataLastReceived: Date;
    usageDataLastReceived: Date;
  }>;
}

export const useParticipantCode = (): UseParticipantCodeReturn => {
  const participantCode = useSelector(participantCodeSelector);
  const dispatch = useDispatch();
  const isParticipantCodeLinked = useSelector(isParticipantCodeLinkedSelector);

  const register = useCallback(async (details: ParticipantDetails) => {
    await registerParticipant(details);
  }, []);

  const verifyCode = useCallback(async (code: string) => {
    const response = await verifyParticipantCode(code);

    return response;
  }, []);

  const linkCode = useCallback(
    async (code: string) => {
      if (isParticipantCodeLinked) {
        return;
      }

      await linkUserToParticipantCode(code);
      dispatch(setParticipantCodeLinked(true));
    },
    [dispatch, isParticipantCodeLinked],
  );

  const getCodeActivationStatus = useCallback(async () => {
    const result = await getParticipantCodeActivationStatus(participantCode);
    return result;
  }, [participantCode]);

  const getLastSyncedDate = useCallback(async () => {
    if (!isParticipantCodeLinked) {
      return {
        healthDataLastReceived: "N/A",
        usageDataLastReceived: "N/A",
      };
    }
    const result = (await getStatsLastSyncedDate()).data;
    return {
      healthDataLastReceived: new Date(result.healthDataLastReceived),
      usageDataLastReceived: new Date(result.usageDataLastReceived),
    };
  }, [isParticipantCodeLinked]);

  return {
    register,
    verifyCode,
    linkCode,
    getCodeActivationStatus,
    getLastSyncedDate,
  };
};
