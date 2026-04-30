import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import Icon from "react-native-vector-icons/Ionicons";
import { BodyMediumText, Card, HeadingMediumText, HeadingSmallText, PressableWithFeedback } from "@/components";
import COLOR from "@/constants/color";
import LateNoMoreManager from "@/controllers/LateNoMoreManager";
import { lateNoMoreDismissEvent } from "@/actions/UserActions";
import { addErrorLog, addInfoLog } from "@/utils/FileLogger";

export const MeetingCountdownCard = ({
  hasUpcomingMeeting,
  emptyTitle,
  emptyDescription,
  countdownText,
  primaryColor,
  ignoreMeetingText,
  subTextColor,
  eventId,
  isMeetingOngoing,
}) => {
  const dispatch = useDispatch();

  const handleIgnoreMeeting = useCallback(() => {
    if (eventId == null || eventId === "") {
      addErrorLog("[MeetingCountdownCard] Ignore meeting: missing event id");
      return;
    }
    addInfoLog("[MeetingCountdownCard] User pressed ignore meeting");
    dispatch(lateNoMoreDismissEvent(eventId));
    LateNoMoreManager.cancelScheduledNotifications();
  }, [dispatch, eventId]);

  if (!hasUpcomingMeeting) {
    return (
      <Card style={[styles.gap8, styles.countdownPill, styles.countdownColumn]}>
        <Icon name="calendar-outline" size={72} color={primaryColor} style={styles.countdownIcon} />

        <HeadingMediumText style={styles.countdownText} numberOfLines={2} adjustsFontSizeToFit>
          {emptyTitle}
        </HeadingMediumText>

        {emptyDescription ? (
          <BodyMediumText center color={subTextColor} style={styles.emptyDescription}>
            {emptyDescription}
          </BodyMediumText>
        ) : null}
      </Card>
    );
  }

  return (
    <Card style={[styles.gap8, styles.countdownPill, styles.countdownColumn]}>
      <Icon name="time-outline" size={72} color={primaryColor} style={styles.countdownIcon} />

      <HeadingMediumText style={styles.countdownText} numberOfLines={1} adjustsFontSizeToFit>
        {isMeetingOngoing ? (
          <Trans
            i18nKey="lateNoMore.yourMeetingIsOngoing"
            components={{
              highlight: <HeadingMediumText weight="700" color={primaryColor} style={styles.countdownText} />,
            }}
          />
        ) : (
          <Trans
            i18nKey="lateNoMore.yourMeetingStartsIn"
            components={{
              highlight: <HeadingMediumText weight="700" color={primaryColor} style={styles.countdownText} />,
            }}
            values={{ countdown: countdownText }}
          />
        )}
      </HeadingMediumText>

      <View style={styles.ignoreWrapper}>
        <PressableWithFeedback
          style={styles.pressable}
          onPress={handleIgnoreMeeting}
          testID="test:id/late-no-more-ignore-meeting"
        >
          <HeadingSmallText center underline color={subTextColor}>
            {ignoreMeetingText}
          </HeadingSmallText>
        </PressableWithFeedback>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  gap8: { gap: 8 },
  countdownPill: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLOR.TRANSPARENT,
    paddingHorizontal: 8,
  },
  countdownColumn: {
    flexDirection: "column",
    alignItems: "center",
  },
  countdownIcon: {
    marginTop: -4,
    marginBottom: 2,
  },
  countdownText: {
    textAlign: "center",
    fontSize: 22,
    lineHeight: 28,
  },
  emptyDescription: {
    paddingHorizontal: 4,
    alignSelf: "stretch",
  },
  ignoreWrapper: {
    alignSelf: "center",
  },
  pressable: {
    padding: 8,
    margin: -8,
  },
});
