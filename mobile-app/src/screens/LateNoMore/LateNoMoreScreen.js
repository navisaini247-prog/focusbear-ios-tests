import React, { useEffect, useState, useMemo } from "react";
import { Linking, NativeModules, StyleSheet, View } from "react-native";
import { BigHeaderScrollView } from "@/components";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useHomeContext } from "../Home/context";
import LateNoMoreManager from "@/controllers/LateNoMoreManager";
import {
  lateNoMoreEventsSelector,
  lateNoMoreConnectedPlatformsSelector,
  lateNoMoreDismissedEventsSelector,
  lateNoMoreRequireMeetingUrlSelector,
} from "@/selectors/UserSelectors";
import { addErrorLog, addInfoLog } from "@/utils/FileLogger";
import { formatDateFromNow } from "@/utils/TimeMethods";
import { checkIsAndroid, checkIsIOS } from "@/utils/PlatformMethods";
import moment from "moment";
import {
  LateNoMoreSettings,
  MeetingActionButtons,
  MeetingCountdownCard,
  MeetingEventCard,
  OngoingMeetingJoinCard,
} from "@/screens/LateNoMore/components";

const formatMeetingTime = (upcomingMeeting) => {
  const start = new Date(upcomingMeeting.startDate);
  const end = new Date(upcomingMeeting.endDate);
  if (isNaN(start) || isNaN(end)) return null;

  const startTime = moment(start).format("LT").toLowerCase();
  const endTime = moment(end).format("LT").toLowerCase();
  return `${formatDateFromNow(start)} ${startTime} — ${endTime}`;
};

const TWENTY_MINUTES_MS = 20 * 60 * 1000;
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const APPLE_CALSHOW_REFERENCE_DATE_MS = new Date("2001-01-01T00:00:00Z").getTime();

const { LateNoMoreCalendarOpen } = NativeModules;

/**
 * LateNoMoreScreen - Main UI for the "Late No More" meeting reminder feature
 *
 * This screen provides:
 * - Calendar integration toggle with permission management
 * - Notification interval configuration
 * - Permission status display and management
 *
 */
const LateNoMoreScreen = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const requireMeetingUrl = useSelector(lateNoMoreRequireMeetingUrlSelector);
  const events = useSelector(lateNoMoreEventsSelector);
  const dismissedEvents = useSelector(lateNoMoreDismissedEventsSelector);
  const { isCalendarPermissionGranted } = useHomeContext();
  const isGoogleCalendarConnected = Boolean(useSelector(lateNoMoreConnectedPlatformsSelector)?.google);
  const [settingsSectionExpanded, setSettingsSectionExpanded] = useState(true);
  const [countdownText, setCountdownText] = useState(null);
  const [nowMs, setNowMs] = useState(Date.now());

  const upcomingMeeting = useMemo(
    () => LateNoMoreManager.getUpcomingMeeting(events, dismissedEvents || [], requireMeetingUrl),
    [events, dismissedEvents, requireMeetingUrl],
  );

  const startDate = upcomingMeeting?.startDate;
  const endDate = upcomingMeeting?.endDate;
  const meetingUrl = useMemo(() => LateNoMoreManager.extractMeetingUrl(upcomingMeeting), [upcomingMeeting]);
  const meetingColor = upcomingMeeting?.calendar?.color || colors.blue;
  const isCalendarConnected = isCalendarPermissionGranted || isGoogleCalendarConnected;

  const isMeetingOngoing = useMemo(() => {
    const startMs = startDate ? new Date(startDate).getTime() : NaN;
    const endMs = endDate ? new Date(endDate).getTime() : NaN;
    const hasValidStart = Number.isFinite(startMs);
    const hasValidEnd = Number.isFinite(endMs);

    if (!hasValidStart) return false;
    if (nowMs < startMs - FIVE_MINUTES_MS) return false;
    if (hasValidEnd) return nowMs <= endMs;
    return true;
  }, [startDate, endDate, nowMs]);

  const isWithinJoinWindow = useMemo(() => {
    if (!startDate) return false;
    const startMs = new Date(startDate).getTime();
    if (!Number.isFinite(startMs)) return false;
    return startMs - nowMs <= TWENTY_MINUTES_MS;
  }, [startDate, nowMs]);

  useEffect(() => {
    const updateTimer = () => {
      setCountdownText(startDate ? moment(startDate).fromNow(true) : "?");
      setNowMs(Date.now());
    };

    updateTimer();

    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [startDate]);

  const openCalendarEvent = async () => {
    addInfoLog("[LateNoMoreScreen] Opening calendar event");

    try {
      if (upcomingMeeting.external_metadata?.htmlLink) {
        await Linking.openURL(upcomingMeeting.external_metadata.htmlLink); // url included with google calendar events
      } else if (checkIsAndroid()) {
        await Linking.openURL(`content://com.android.calendar/events/${upcomingMeeting.id}`);
      } else {
        if (checkIsIOS() && upcomingMeeting?.source === "local" && upcomingMeeting?.id != null) {
          try {
            await LateNoMoreCalendarOpen.openLocalEventWithCalendarItemId(String(upcomingMeeting.id));
            return;
          } catch (nativeErr) {
            addErrorLog("[LateNoMoreScreen] Native open calendar event failed, trying calshow:", nativeErr);
          }
        }
        const timestamp = (new Date(startDate).getTime() - APPLE_CALSHOW_REFERENCE_DATE_MS) / 1000;
        await Linking.openURL(`calshow:${timestamp}`);
      }
    } catch (error) {
      addErrorLog("[LateNoMoreScreen] Failed to open calendar event:", error);
    }
  };

  return (
    <View style={styles.flex}>
      <BigHeaderScrollView
        title={t("lateNoMore.title")}
        contentContainerStyle={[styles.bodyContainer, styles.mainColumn, { paddingBottom: insets.bottom + 12 }]}
      >
        <View style={styles.meetingStack}>
          <MeetingCountdownCard
            hasUpcomingMeeting={Boolean(upcomingMeeting)}
            emptyTitle={t("lateNoMore.noUpcomingMeetings")}
            emptyDescription={t("lateNoMore.noMeetingsDescription")}
            countdownText={countdownText}
            primaryColor={colors.primary}
            ignoreMeetingText={t("lateNoMore.ignoreMeeting")}
            subTextColor={colors.subText}
            eventId={upcomingMeeting?.id}
            isMeetingOngoing={isMeetingOngoing}
          />

          {upcomingMeeting && (
            <>
              <MeetingEventCard
                upcomingMeeting={upcomingMeeting}
                meetingColor={meetingColor}
                onPress={openCalendarEvent}
                meetingTimeText={formatMeetingTime(upcomingMeeting)}
                noMeetingText={t("lateNoMore.noMeetingScheduled")}
                subTextColor={colors.subText}
                source={upcomingMeeting.source}
              />

              {meetingUrl &&
                (isMeetingOngoing ? (
                  <OngoingMeetingJoinCard
                    meetingUrl={meetingUrl}
                    onOpenCalendarEvent={openCalendarEvent}
                    startMeetingText={t("lateNoMore.startMeeting")}
                    subTextColor={colors.subText}
                  />
                ) : (
                  isWithinJoinWindow && (
                    <MeetingActionButtons
                      meetingUrl={meetingUrl}
                      isWithinJoinWindow={isWithinJoinWindow}
                      isMeetingOngoing={isMeetingOngoing}
                      onOpenCalendarEvent={openCalendarEvent}
                      startMeetingText={t("lateNoMore.startMeeting")}
                      subTextColor={colors.subText}
                    />
                  )
                ))}
            </>
          )}
        </View>

        <LateNoMoreSettings
          upcomingMeeting={upcomingMeeting}
          expanded={settingsSectionExpanded}
          onToggleExpanded={() => setSettingsSectionExpanded((prev) => !prev)}
        />
      </BigHeaderScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bodyContainer: {
    padding: 16,
  },
  /** One gap before Settings; avoids stacking 24px between countdown / event / join siblings. */
  mainColumn: { gap: 20 },
  meetingStack: { gap: 10 },
});

export default LateNoMoreScreen;
