import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import {
  SmallButton,
  BodySmallText,
  BodyMediumText,
  Tooltip,
  Separator,
  PressableWithFeedback,
  ScalableIcon,
  InfoIcon,
} from "@/components";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { convertTo12HourFormat, formatTime } from "@/utils/TimeMethods";
import { useSelector } from "@/reducers";
import { useHomeContext } from "../context";
import { NAVIGATION } from "@/constants";
import { fullRoutineDataSelector } from "@/selectors/RoutineSelectors";
import {
  postponeActivatedStatusSelector,
  postponeStartTimeSelector,
  postponeDurationSelector,
  isFocusSuperStrictModeSelector,
} from "@/selectors/GlobalSelectors";
import { INDEFINITE } from "@/modals/PostponeModal";
import { customClearInterval, customSetInterval } from "@/utils/BackgroundTimer";
import { setPostponeActivated } from "@/actions/GlobalActions";
import { addInfoLog } from "@/utils/FileLogger";
import notifee from "@notifee/react-native";
import {
  showFloatingView,
  resumeBlockingSchedulesNativeMethod,
  updateScheduleBlockingStatus,
} from "@/utils/NativeModuleMethods";
import { useDispatch } from "react-redux";
import { showPasswordModal } from "@/actions/ModalActions";
import useBlockingMode from "@/hooks/use-blocking-mode";
import { BLOCKING_MODE } from "@/constants/blockingSchedule";

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row" },
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
  },
  pauseSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pauseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    minWidth: 0,
  },
  pauseButtonText: {
    flexShrink: 1,
    minWidth: 0,
  },
  separator: {
    marginVertical: 0,
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 75,
    marginRight: 5,
  },
  countdownText: {
    fontWeight: "600",
  },
  scheduleText: {
    flexShrink: 1,
    minWidth: 0,
  },
  scheduleTextContainer: {
    flex: 1,
    minWidth: 120,
  },
  disabledPauseButton: {
    opacity: 0.4,
  },
});

export const BlockingStatusBanner = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const fullRoutineData = useSelector(fullRoutineDataSelector);
  const isPostponeActivated = useSelector(postponeActivatedStatusSelector);
  const postponeStartTime = useSelector(postponeStartTimeSelector) || Date.now();
  const postponeDuration = useSelector(postponeDurationSelector) || 0;
  const isDeactivate = postponeDuration === INDEFINITE;
  const isSuperStrictMode = useSelector(isFocusSuperStrictModeSelector);
  const isInFocusMode = useSelector((state) => state.focusMode.isInFocusMode);

  const [timeLeft, setTimeLeft] = useState(postponeStartTime + postponeDuration - Date.now());
  const intervalRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  const { mode, activeSchedules = [], refresh, isInSoftUnlockPeriod } = useBlockingMode();
  const dispatch = useDispatch();
  const { blockingReason, isBlocking, allBlockingPermissionsGranted, onPressPostpone, refreshDistractionBlocking } =
    useHomeContext();

  const effectiveIsScheduleBlocking = activeSchedules?.length > 0;

  const shouldHidePauseButton = (isInFocusMode && isSuperStrictMode) || isInSoftUnlockPeriod;

  // Use activeSchedules to determine if schedule blocking is actually happening
  const cutOffTime = fullRoutineData?.cutoff_time_for_non_high_priority_activities || fullRoutineData?.sleep_time;
  const startUpTime = fullRoutineData?.startup_time;
  const isDetailedSleepBlockingDescription = blockingReason === t("distractionBlockingReason.afterCutoffTime");
  const requirePassword = mode === BLOCKING_MODE.STRICT;

  useEffect(() => {
    // Refresh immediately when dependencies change
    refresh?.();

    // Clear any existing interval
    if (refreshIntervalRef.current) {
      customClearInterval(refreshIntervalRef);
    }

    // Set up interval to refresh every 1 minute
    refreshIntervalRef.current = customSetInterval(
      () => {
        refresh?.();
      },
      60000, // 1 minute in milliseconds
      refreshIntervalRef,
    );

    return () => {
      if (refreshIntervalRef.current) {
        customClearInterval(refreshIntervalRef);
      }
    };
  }, [isBlocking, effectiveIsScheduleBlocking, refresh]);

  const activeScheduleSummary = useMemo(() => {
    if (!activeSchedules?.length) {
      return null;
    }

    const [first, ...rest] = activeSchedules;
    const formatScheduleTime = (hour, minute) =>
      convertTo12HourFormat(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);

    const start = formatScheduleTime(first.startHour, first.startMinute);
    const end = formatScheduleTime(first.endHour, first.endMinute);
    const additionalCount = rest.length;
    const extra =
      additionalCount > 0
        ? t("blockingStatusBanner.additionalSchedules", {
            count: additionalCount,
          })
        : "";

    return t("blockingStatusBanner.activeSchedule", {
      name: first.name,
      start,
      end,
      extra,
    });
  }, [activeSchedules, t]);

  const handleReactivation = useCallback(async () => {
    addInfoLog(`User Reactivated routine from banner - ${isDeactivate ? "deactivation state" : "postponed state"}`);
    await notifee.cancelAllNotifications();
    dispatch(setPostponeActivated(false));

    showFloatingView(false);

    resumeBlockingSchedulesNativeMethod();
    await updateScheduleBlockingStatus();

    if (refreshDistractionBlocking) {
      refreshDistractionBlocking();
    }
  }, [isDeactivate, dispatch, refreshDistractionBlocking]);

  useEffect(() => {
    if (intervalRef.current) {
      customClearInterval(intervalRef);
    }

    if (!isPostponeActivated || isDeactivate) {
      return;
    }

    setTimeLeft(postponeStartTime + postponeDuration - Date.now());

    intervalRef.current = customSetInterval(
      () => {
        const newTimeLeft = postponeStartTime + postponeDuration - Date.now();
        if (newTimeLeft <= 0) {
          handleReactivation();
          if (intervalRef.current) {
            customClearInterval(intervalRef);
          }
        } else {
          setTimeLeft(newTimeLeft);
        }
      },
      1000,
      intervalRef,
    );

    return () => {
      if (intervalRef.current) {
        customClearInterval(intervalRef);
      }
    };
  }, [isPostponeActivated, isDeactivate, postponeDuration, postponeStartTime, handleReactivation]);

  const handleBannerPress = () => {
    if (!allBlockingPermissionsGranted) {
      navigation.navigate(NAVIGATION.PermissionsScreen);
      return;
    }

    navigation.navigate(NAVIGATION.BlockingScheduleList);
  };

  if (isPostponeActivated) {
    return (
      <SmallButton
        subtle
        disabledWithoutStyleChange
        style={[styles.row, styles.container, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}
      >
        <View style={[styles.pauseButton, styles.scheduleTextContainer]}>
          <ScalableIcon color={colors.warning} name="pause-circle" size={14} iconType="FontAwesome" />
          <View style={styles.pauseButtonText}>
            <BodySmallText>
              {isDeactivate ? t("postpone.blockingPausedIndefinitely") : t("focusMode.blockingPaused")}
            </BodySmallText>
          </View>
        </View>

        {!isDeactivate && (
          <>
            <Separator vertical style={styles.separator} />
            <View style={styles.countdownContainer}>
              <ScalableIcon name="clock-o" size={14} color={colors.warning} iconType="FontAwesome" />
              <BodySmallText style={styles.countdownText}>{formatTime(timeLeft)}</BodySmallText>
            </View>
          </>
        )}

        <Separator vertical style={styles.separator} />
        <PressableWithFeedback
          testID="test:id/blocking-status-resume"
          onPress={handleReactivation}
          style={styles.pauseButton}
          hitSlop={12}
        >
          <ScalableIcon name="play" size={14} color={colors.success} iconType="FontAwesome" />
          <View style={styles.pauseButtonText}>
            <BodySmallText>{t("home.re_activate")}</BodySmallText>
          </View>
        </PressableWithFeedback>
      </SmallButton>
    );
  }

  return (
    <SmallButton
      subtle
      disabledWithoutStyleChange={false}
      onPress={handleBannerPress}
      style={[
        styles.row,
        styles.container,
        !allBlockingPermissionsGranted && { backgroundColor: colors.warningBg, borderColor: colors.warning },
      ]}
    >
      {allBlockingPermissionsGranted ? (
        <ScalableIcon
          color={colors.subText}
          name={isBlocking || effectiveIsScheduleBlocking ? "lock" : "unlock-alt"}
          size={20}
          iconType="FontAwesome"
        />
      ) : (
        <ScalableIcon color={colors.warning} name="warning" size={20} iconType="FontAwesome" />
      )}

      <View style={[styles.flex, styles.row, styles.scheduleTextContainer]}>
        <View style={[styles.flex, styles.scheduleTextContainer]}>
          {activeScheduleSummary ? (
            <BodySmallText style={[styles.scheduleText, { color: colors.primary }]}>
              {activeScheduleSummary}
            </BodySmallText>
          ) : (
            <BodySmallText style={styles.scheduleText}>{blockingReason}</BodySmallText>
          )}
        </View>
        {isDetailedSleepBlockingDescription && !activeScheduleSummary ? (
          <Tooltip
            popover={
              <BodyMediumText>
                {t("distractionBlockingReason.detailedCutOffSleepTimeBlockingReason", {
                  cutoff_time: convertTo12HourFormat(cutOffTime),
                  startup_time: convertTo12HourFormat(startUpTime),
                })}
              </BodyMediumText>
            }
          >
            <InfoIcon testID="test:id/blocking-status-info" />
          </Tooltip>
        ) : null}
      </View>

      {(isBlocking || effectiveIsScheduleBlocking) && (
        <View style={styles.pauseSection}>
          <Separator vertical style={styles.separator} />
          {shouldHidePauseButton ? (
            <Tooltip
              popover={
                <BodyMediumText>
                  {isInSoftUnlockPeriod
                    ? t("postpone.pauseDisabledDuringSoftUnlock")
                    : t("postpone.pauseDisabledStrictMode")}
                </BodyMediumText>
              }
            >
              <View style={[styles.pauseButton, styles.disabledPauseButton]}>
                <ScalableIcon name="pause" size={14} color={colors.subText} iconType="FontAwesome" />
                <View style={styles.pauseButtonText}>
                  <BodySmallText>{t("postpone.pauseBlocking")}</BodySmallText>
                </View>
              </View>
            </Tooltip>
          ) : (
            <PressableWithFeedback
              testID="test:id/blocking-status-pause"
              onPress={() => {
                if (requirePassword) {
                  dispatch(showPasswordModal({ onPasswordVerified: () => onPressPostpone() }));
                } else {
                  onPressPostpone();
                }
              }}
              style={styles.pauseButton}
              hitSlop={12}
            >
              <ScalableIcon name="pause" size={14} color={colors.subText} iconType="FontAwesome" />
              <View style={styles.pauseButtonText}>
                <BodySmallText>{t("postpone.pauseBlocking")}</BodySmallText>
              </View>
            </PressableWithFeedback>
          )}
        </View>
      )}
    </SmallButton>
  );
};
