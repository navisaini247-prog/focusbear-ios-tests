import { useState, useCallback, useEffect, Dispatch, SetStateAction } from "react";
import { Platform, DeviceEventEmitter } from "react-native";
import moment from "moment";
import { BlockingScheduleModule, ControlFunctionModule } from "@/nativeModule";
import { NormalAlert } from "@/utils/GlobalMethods";
import { showPasswordModal } from "@/actions/ModalActions";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { postHogCapture } from "@/utils/Posthog";
import { addErrorLog } from "@/utils/FileLogger";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import useBlockingMode from "@/hooks/use-blocking-mode";
import {
  deleteBlockingSchedule,
  createBlockingSchedule,
  updateBlockingSchedule,
} from "@/actions/BlockingSchedulesAction";
import { DAYS } from "@/constants/activity";
import { BLOCKING_MODE, PAUSE_FRICTION } from "@/constants/blockingSchedule";
import { removeBlockingScheduleNativeMethod, updateScheduleBlockingStatus } from "@/utils/NativeModuleMethods";

const isIOS = Platform.OS === "ios";

type BlockingMode = (typeof BLOCKING_MODE)[keyof typeof BLOCKING_MODE];

export type Schedule = {
  blockingMode?: BlockingMode;
  id?: string;
  name?: string;
  startHour?: number;
  startMinute?: number;
  endHour?: number;
  endMinute?: number;
  daysOfWeek?: string[];
  hasSelection?: boolean;
  selectedApplicationsCount?: number;
  selectedCategoriesCount?: number;
  selectedWebDomainsCount?: number;
  type?: string;
  blockedPackages?: string[];
  focusModeId?: string;
  pauseFriction?: string;
  isAiBlockingEnabled?: boolean;
};

export type SelectionCounts = {
  applicationsCount: number;
  categoriesCount: number;
  webDomainsCount: number;
};

const normalizeBlockingScheduleName = (name = "") => name.trim().replace(/[\r\n]+/g, " ");

type UseBlockingScheduleLogicProps = {
  schedule: Schedule;
  setSelectionCounts: Dispatch<SetStateAction<SelectionCounts | null>>;
};

export const useBlockingScheduleLogic = ({ schedule, setSelectionCounts }: UseBlockingScheduleLogicProps) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { mode: globalBlockingMode } = useBlockingMode();

  const [isSaving, setIsSaving] = useState(false);
  const [schedules, setSchedules] = useState([]);

  const refreshSchedules = useCallback(async () => {
    try {
      if (isIOS && ControlFunctionModule?.getBlockingSchedules) {
        const response = await ControlFunctionModule.getBlockingSchedules();
        const nextSchedules = Array.isArray(response) ? response : [];
        setSchedules(nextSchedules);
        return nextSchedules;
      }

      if (!isIOS && BlockingScheduleModule?.getBlockingSchedules) {
        const response = await BlockingScheduleModule.getBlockingSchedules();
        const nextSchedules = Array.isArray(response) ? response : [];
        setSchedules(nextSchedules);
        return nextSchedules;
      }
    } catch (error) {
      addErrorLog("[BlockingSchedule] Unable to load schedules", error);
    }

    return [];
  }, []);

  useEffect(() => {
    refreshSchedules();
  }, [refreshSchedules]);

  useEffect(() => {
    if (!isIOS) {
      return undefined;
    }

    const scheduleSelectionListener = DeviceEventEmitter.addListener("onScheduleSelectionChanged", (payload = {}) => {
      const { applicationsCount = 0, categoriesCount = 0, webDomainsCount = 0, scheduleId: _scheduleId } = payload;
      if (_scheduleId !== schedule?.id) return;
      setSelectionCounts({ applicationsCount, categoriesCount, webDomainsCount });
    });

    return () => {
      scheduleSelectionListener.remove();
    };
  }, [schedule?.id, setSelectionCounts]);

  useEffect(() => {
    if (isIOS && schedule.id) {
      ControlFunctionModule.loadSelectionForSchedule(schedule.id)
        .then(({ applicationsCount = 0, categoriesCount = 0, webDomainsCount = 0 }) => {
          setSelectionCounts({ applicationsCount, categoriesCount, webDomainsCount });
        })
        .catch((error) => {
          addErrorLog("[BlockingSchedule] Unable to load selection for schedule", error);
        });
    }
    // Important: selection loading must run only when the schedule id changes.
    // Re-running on every schedule edit (time/day/block level) causes iOS to reload
    // from native schedule selectionData, which isn't committed yet during "create".
  }, [schedule?.id, setSelectionCounts]);

  const handleRemove = useCallback(async () => {
    try {
      await dispatch(deleteBlockingSchedule({ scheduleId: schedule.id }));
      await removeBlockingScheduleNativeMethod(schedule.id);
      await updateScheduleBlockingStatus();
      navigation?.goBack?.();
    } catch (error) {
      addErrorLog("[BlockingSchedule] Failed to remove schedule", error);
      await NormalAlert({
        title: t("blockingSchedule.removeFailedTitle"),
        message: error?.message ?? t("blockingSchedule.removeFailedMessage"),
      });
    }
  }, [dispatch, schedule?.id, navigation, t]);

  const requestRemove = useCallback(() => {
    const requirePassword = globalBlockingMode === BLOCKING_MODE.STRICT;
    if (requirePassword) {
      dispatch(showPasswordModal({ onPasswordVerified: handleRemove }));
    } else {
      handleRemove();
    }
  }, [globalBlockingMode, dispatch, handleRemove]);

  // prettier-ignore
  const handleSave = useCallback(async ({ selectedApps, selectedUrls, isEditing }: { selectedApps: any[]; selectedUrls?: string[]; isEditing: boolean }) => {
    postHogCapture(POSTHOG_EVENT_NAMES.BLOCKING_SCHEDULE_SAVE, { mode: isEditing ? "edit" : "create" });

    const { name, startHour, startMinute, endHour, endMinute, id, blockingMode, daysOfWeek, focusModeId, isAiBlockingEnabled } = schedule;
    const isStrictMode = blockingMode === BLOCKING_MODE.STRICT || blockingMode === BLOCKING_MODE.SUPER_STRICT;
    const pauseFriction = isStrictMode ? PAUSE_FRICTION.PASSWORD : PAUSE_FRICTION.NONE;
    const resolvedName = normalizeBlockingScheduleName(name || "") || t("blockingSchedule.defaultName");

    // Convert hour/minute to Date objects for API
    const now = moment();
    const startTime = moment().hour(startHour).minute(startMinute).second(0).millisecond(0).toDate();
    const endTime = moment().hour(endHour).minute(endMinute).second(0).millisecond(0).toDate();

    // Native module payload (keep for backward compatibility)
    const payload = {
      id,
      name: resolvedName,
      startHour,
      startMinute,
      endHour,
      endMinute,
      daysOfWeek: daysOfWeek || [],
      blockingMode: (blockingMode as BlockingMode | undefined) || BLOCKING_MODE.GENTLE,
      focusModeId,
      pauseFriction,
      isAiBlockingEnabled: isAiBlockingEnabled || false,
      interval: { startHour, startMinute, endHour, endMinute },
    };

    try {
      setIsSaving(true);
      const existingSchedules = await refreshSchedules();
      const hasDuplicateName = existingSchedules.some((existingSchedule) => {
        if (existingSchedule?.id === id) {
          return false;
        }

        return normalizeBlockingScheduleName(existingSchedule?.name || "") === resolvedName;
      });

      if (hasDuplicateName) {
        await NormalAlert({
          title: t("blockingSchedule.saveFailedTitle"),
          message: t("blockingSchedule.duplicateNameMessage"),
        });
        return;
      }

      // Call Redux action to sync with backend
      let savedSchedule;
      if (isEditing) {
        savedSchedule = await dispatch(
          updateBlockingSchedule({
            scheduleId: id,
            name: resolvedName,
            startTime,
            endTime,
            selectedDays: daysOfWeek || [],
            blockingMode: (blockingMode as BlockingMode | undefined) || BLOCKING_MODE.GENTLE,
            focusModeId,
            selectedApps: selectedApps || [],
            selectedUrls: selectedUrls || [],
            isAiBlockingEnabled: isAiBlockingEnabled || false,
          })
        );
      } else {
        savedSchedule = await dispatch(
          createBlockingSchedule({
            scheduleId: id,
            name: resolvedName,
            startTime,
            endTime,
            selectedDays: daysOfWeek || [],
            blockingMode: (blockingMode as BlockingMode | undefined) || BLOCKING_MODE.GENTLE,
            selectedApps: selectedApps || [],
            selectedUrls: selectedUrls || [],
          })
        );
      }

      // Update payload with server response if available
      if (savedSchedule?.id) {
        payload.id = savedSchedule.id;
      }

      // Handle native module calls for iOS
      if (isIOS) {
        await ControlFunctionModule.setBlockingSchedules(JSON.stringify([payload]));

        try {
          await ControlFunctionModule.commitSelectionForSchedule?.(payload.id);
        } catch (assignmentError) {
          await NormalAlert({
            title: t("blockingSchedule.saveFailedTitle"),
            message: t("blockingSchedule.saveFailedMessage"),
          });
          return;
        }

        const startTotal = startHour * 60 + startMinute;
        const endTotal = endHour * 60 + endMinute;
        const nowTotal = now.hours() * 60 + now.minutes();

        const spansMidnight = endTotal <= startTotal;
        const isNowInWindow = spansMidnight
          ? nowTotal >= startTotal || nowTotal < endTotal
          : nowTotal >= startTotal && nowTotal < endTotal;

        const todayCode = DAYS[now.isoWeekday() % 7];
        // Check if today is allowed: either all 7 days are selected, or today is in the selected days
        const isTodayAllowed =
          schedule.daysOfWeek.length === DAYS.length || schedule.daysOfWeek.includes(todayCode);
        const shouldForceStart = isNowInWindow && isTodayAllowed;

        const anyExistingActiveSchedule = schedules.some((item) => item.isActive);
        ControlFunctionModule.setBlockingStatus?.(anyExistingActiveSchedule || shouldForceStart);

        if (shouldForceStart) {
          await ControlFunctionModule.startBlockingSchedule?.(payload.id);
        }
        await refreshSchedules();
        DeviceEventEmitter.emit("onBlockingStatusChanged");
      } else if (!isIOS && BlockingScheduleModule?.setBlockingSchedules) {
        // IMPORTANT: setBlockingSchedules must be called FIRST to create/update the schedule,
        // then setScheduleBlockedSelection and setScheduleBlockedUrls update it with the selections.
        // If called in the wrong order, setBlockingSchedules would overwrite the selections.
        await BlockingScheduleModule.setBlockingSchedules(JSON.stringify([payload]));
        await BlockingScheduleModule?.setScheduleBlockedSelection?.(payload.id, selectedApps || []);

        // Always update blocked URLs, even when the list is empty,
        // so that removing all websites actually clears them natively.
        if (BlockingScheduleModule?.setScheduleBlockedUrls) {
          await BlockingScheduleModule.setScheduleBlockedUrls(payload.id, selectedUrls || []);
        }
        await refreshSchedules();
        DeviceEventEmitter.emit("onBlockingStatusChanged");
      }

      DeviceEventEmitter.emit("onBlockingScheduleCreated", payload);

      navigation.goBack();
    } catch (error: any) {
      addErrorLog("[BlockingSchedule] Save failed", error);
      await NormalAlert({
        title: t("blockingSchedule.saveFailedTitle"),
        message: error?.message ?? t("blockingSchedule.saveFailedMessage"),
      });
    } finally {
      setIsSaving(false);
    }
  }, [schedule, t, navigation, schedules, refreshSchedules, dispatch]);

  return { isSaving, handleSave, requestRemove };
};
