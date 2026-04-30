import React, { useState, useCallback, useEffect, useMemo } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import {
  BodyMediumText,
  SheetModal,
  Card,
  Button,
  SelectableButton,
  DisplaySmallText,
  HeadingSmallText,
} from "@/components";
import { ModalHeader, TextField, Group, MenuItem, PressableWithFeedback, AnimatedHeightView } from "@/components";
import { MiniNav, useMiniNav } from "@/components/MiniNav";
import CountDown from "@/components/CountDown";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHomeContext } from "@/screens/Home/context";
import { useTheme } from "@react-navigation/native";
import { isEasySkipEnabledSelector } from "@/selectors/UserSelectors";
import { isPostponeModalVisibleSelector } from "@/selectors/ModalSelectors";
import { hidePostponeModal } from "@/actions/ModalActions";
import { postponeCountSelector, postponeStartTimeSelector } from "@/selectors/GlobalSelectors";
import { resetPostponeCount } from "@/actions/GlobalActions";
import { DEACTIVATE_REASONS, POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { postHogCapture } from "@/utils/Posthog";
import { addInfoLog } from "@/utils/FileLogger";
import { formatTime, formatHumanizeDuration } from "@/utils/TimeMethods";
import { AppQuality } from "@/types/AppUsage.types";
import { getAppQuality } from "@/utils/AppQualityUtils";
import { useUsageStats } from "@/hooks/use-usage-stats";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { useFontScale } from "@/hooks/use-font-scale";

const SCREENS = {
  CHOOSE_POSTPONE_TIME: "CHOOSE_POSTPONE_TIME",
  POSTPONE_COUNTDOWN: "POSTPONE_COUNTDOWN",
  DEACTIVATE_REASON: "DEACTIVATE_REASON",
};
export const INDEFINITE = -1;
const POSTPONE_OPTIONS_MINUTES = [5, 10, 15, 30, 60];
const POSTPONE_OPTIONS = POSTPONE_OPTIONS_MINUTES.map((minutes) => minutes * 60 * 1000);
const COUNTDOWN_CONFIG = { MIN_DURATION: 5, MAX_DURATION: 30, INCREMENT: 5 };

export const PostponeModal = () => {
  const dispatch = useDispatch();
  const isPostponeModalVisible = useSelector(isPostponeModalVisibleSelector);
  const postponeCount = useSelector(postponeCountSelector) ?? 0;
  const postponeStartTime = useSelector(postponeStartTimeSelector) ?? new Date();
  const todayDate = new Date().toDateString();

  useEffect(() => {
    const lastPostponeDate = new Date(postponeStartTime).toDateString();

    // Reset postpone count if last postpone was on a different day
    if (postponeCount > 0 && lastPostponeDate !== todayDate) {
      dispatch(resetPostponeCount());
    }
  }, [todayDate, postponeCount, postponeStartTime, dispatch]);

  return (
    <SheetModal isVisible={isPostponeModalVisible} onCancel={() => dispatch(hidePostponeModal())} noPadding>
      <AnimatedHeightView>
        <MiniNav initialScreen={SCREENS.CHOOSE_POSTPONE_TIME}>
          <MiniNav.Screen name={SCREENS.CHOOSE_POSTPONE_TIME} component={ChoosePostponeTimeScreen} />
          <MiniNav.Screen name={SCREENS.POSTPONE_COUNTDOWN} component={PostponeConfirmationScreen} />
          <MiniNav.Screen name={SCREENS.DEACTIVATE_REASON} component={DeactivateReasonScreen} />
        </MiniNav>
      </AnimatedHeightView>
    </SheetModal>
  );
};

const ChoosePostponeTimeScreen = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { miniNav } = useMiniNav();
  const { isLargeFontScale } = useFontScale();

  const options = POSTPONE_OPTIONS.map((duration) => ({
    title: formatHumanizeDuration(duration),
    value: duration,
  }));

  const onPressOption = (postponeDuration) => {
    if (postponeDuration === INDEFINITE) {
      addInfoLog(`User selected indefinite postpone`);
    } else {
      addInfoLog(`User selected postpone for ${postponeDuration / 60 / 1000} mins`);
    }
    miniNav.navigate(SCREENS.POSTPONE_COUNTDOWN, { postponeDuration });
  };

  return (
    <>
      <ModalHeader title={t("postpone.choosePostponeTime")} />
      <View style={styles.container}>
        <Group>
          {options.map(({ title, value }) => (
            <MenuItem
              key={value}
              onPress={() => onPressOption(value)}
              isLargeFontScale={isLargeFontScale}
              testID={`test:id/postpone-time-${value / 60000}min`}
            >
              <HeadingSmallText numberOfLines={1}>{title}</HeadingSmallText>
            </MenuItem>
          ))}
        </Group>

        <PressableWithFeedback
          style={styles.deactivateChoiceButton}
          onPress={() => onPressOption(INDEFINITE)}
          hitSlop={8}
          testID="test:id/postpone-indefinite"
        >
          <BodyMediumText center underline color={colors.subText} numberOfLines={1}>
            {t("postpone.indefinite")}
          </BodyMediumText>
        </PressableWithFeedback>

        <Button
          title={t("common.cancel")}
          onPress={() => dispatch(hidePostponeModal())}
          testID="test:id/postpone-cancel"
        />
      </View>
    </>
  );
};

const PostponeConfirmationScreen = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { miniNav } = useMiniNav();
  const { postponeBlocking } = useHomeContext();
  const { postponeDuration } = miniNav.params;
  const { MIN_DURATION, MAX_DURATION, INCREMENT } = COUNTDOWN_CONFIG;
  const { appsStats, fetchStats, isLoading } = useUsageStats();
  const isEasySkipEnabled = useSelector(isEasySkipEnabledSelector);
  const postponeCount = useSelector(postponeCountSelector) || 0;

  useEffect(() => {
    if (checkIsAndroid()) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
      fetchStats(startOfDay, endOfDay);
    }
  }, []);

  const appQualities = useMemo(() => {
    if (!checkIsAndroid()) return new Map();
    const qualitiesMap = new Map();
    appsStats.forEach((app) => {
      const quality = getAppQuality(app.packageName, app.category);
      qualitiesMap.set(app.packageName, quality);
    });
    return qualitiesMap;
  }, [appsStats]);

  const lowQualityScreenTime = useMemo(() => {
    if (!checkIsAndroid()) return 0;
    return appsStats.reduce((acc, app) => {
      const quality = appQualities.get(app.packageName) ?? AppQuality.NEUTRAL;
      return acc + (quality <= AppQuality.SLIGHTLY_DISTRACTING ? app.totalTimeUsed : 0);
    }, 0);
  }, [appsStats, appQualities]);

  const showLowQualityUsage = checkIsAndroid() && lowQualityScreenTime > 5 * 60 * 1000; // 5 minutes

  const enableCountdown = !isEasySkipEnabled;
  const countdownDuration = Math.min(MIN_DURATION + postponeCount * INCREMENT, MAX_DURATION);

  const [canContinue, setCanContinue] = useState(!enableCountdown);

  const onPressContinue = () => {
    if (postponeDuration === INDEFINITE) {
      miniNav.navigate(SCREENS.DEACTIVATE_REASON, { postponeDuration });
    } else {
      postponeBlocking(postponeDuration);
    }
  };

  return (
    <>
      <ModalHeader
        title={t("postpone.doYouReallyWantTo")}
        onBackPress={() => miniNav.goBack()}
        testID="test:id/postpone-back"
      />
      <View style={styles.container}>
        {postponeDuration === INDEFINITE && <BodyMediumText>{t("postpone.areYouSureIndefinite")}</BodyMediumText>}

        <BodyMediumText>{t("postpone.youHavePausedTimesToday", { count: postponeCount })}</BodyMediumText>

        {/* App usage summary */}
        {showLowQualityUsage && (
          <Card style={styles.usageSummaryCard}>
            <View style={styles.usageSummaryTime}>
              {isLoading ? (
                <ActivityIndicator size="small" />
              ) : (
                <DisplaySmallText>{formatTime(lowQualityScreenTime)}</DisplaySmallText>
              )}
            </View>
            <View style={styles.usageSummaryDescription}>
              <BodyMediumText>{t("postpone.lowQualityUsageDesc")}</BodyMediumText>
            </View>
          </Card>
        )}

        {/* Countdown */}
        {enableCountdown && (
          <Card style={styles.row}>
            <CountDown duration={countdownDuration} onComplete={() => setCanContinue(true)} />

            <View style={styles.flexShrink}>
              <BodyMediumText>
                {t("postpone.countdown", { countdown: formatHumanizeDuration(countdownDuration * 1000) })}
              </BodyMediumText>
            </View>
          </Card>
        )}

        <Button
          title={postponeDuration === INDEFINITE ? t("common.continue") : t("postpone.pauseBlocking")}
          onPress={onPressContinue}
          disabled={!canContinue}
          testID="test:id/postpone-confirm"
        />

        <Button
          primary
          title={t("postpone.doHabits")}
          onPress={() => dispatch(hidePostponeModal())}
          testID="test:id/postpone-do-habits"
        />
      </View>
    </>
  );
};

const DeactivateReasonScreen = () => {
  const { t } = useTranslation();
  const { miniNav } = useMiniNav();
  const { postponeBlocking, currentRoutine } = useHomeContext();
  const [selectedReason, setSelectedReason] = useState(DEACTIVATE_REASONS.APP_BROKEN);
  const [reasonInput, setReasonInput] = useState("");
  const { postponeDuration } = miniNav.params;

  const reasonMenuItems = [
    {
      label: t("reason.appBroken"),
      description: t("reason.appBrokenDesc"),
      value: DEACTIVATE_REASONS.APP_BROKEN,
    },
    {
      label: t("reason.gotEmergency"),
      description: t("reason.everythingIsOk"),
      value: DEACTIVATE_REASONS.EMERGENCY,
    },
    {
      label: t("reason.somethingElse"),
      description: t("reason.somethingElseDesc"),
      value: DEACTIVATE_REASONS.SOMETHING_ELSE,
    },
  ];

  const onSubmit = useCallback(() => {
    const META_DATA = {
      "routine-type": `${String(currentRoutine?.type).toLowerCase()}_routine`,
      deactivate_reason: selectedReason,
      detailed_reason: selectedReason === DEACTIVATE_REASONS.EMERGENCY ? "Emergency" : reasonInput,
    };
    postHogCapture(POSTHOG_EVENT_NAMES.DEACTIVATE_ROUTINE_METADATA, META_DATA);
    addInfoLog(`User deactivated routine for reason - ${selectedReason}`);

    postponeBlocking(INDEFINITE);
  }, [selectedReason, reasonInput, postponeBlocking]);

  return (
    <>
      <ModalHeader title={t("reason.shareFeedback")} onBackPress={() => miniNav.goBack({ postponeDuration })} />
      <View style={styles.container}>
        <BodyMediumText>{t("reason.canShare")}</BodyMediumText>
        <Card noPadding style={styles.optionsContainer}>
          <Group>
            {reasonMenuItems.map((item) => (
              <SelectableButton
                key={item.value}
                title={item.label}
                onPress={() => setSelectedReason(item.value)}
                selected={selectedReason === item.value}
              />
            ))}
          </Group>
        </Card>

        <View style={styles.smallGap}>
          <BodyMediumText>{reasonMenuItems.find((item) => item.value === selectedReason)?.description}</BodyMediumText>
          {selectedReason !== DEACTIVATE_REASONS.EMERGENCY && (
            <TextField
              style={styles.textField}
              testID="test:id/enter-reason-for-deactivation"
              placeholder={t("postpone.write")}
              onChangeText={(value) => setReasonInput(value)}
              value={reasonInput}
              multiline
            />
          )}
        </View>

        <Button title={t("postpone.pauseBlocking")} onPress={onSubmit} testID="test:id/postpone-deactivate-confirm" />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  flexShrink: { flexShrink: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  usageSummaryCard: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
  },
  usageSummaryTime: {
    alignSelf: "flex-start",
  },
  usageSummaryDescription: {
    width: "100%",
  },
  container: {
    padding: 16,
    paddingTop: 12,
    gap: 12,
  },
  smallGap: {
    gap: 8,
  },
  optionsContainer: {
    padding: 4,
    borderRadius: 12,
  },
  deactivateChoiceButton: {
    alignSelf: "center",
    padding: 8,
  },
  textField: {
    maxHeight: 200,
  },
});
