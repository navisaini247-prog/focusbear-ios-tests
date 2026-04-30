import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { BodyMediumText, Button, HeadingSmallText } from "@/components";
import { addInfoLog } from "@/utils/FileLogger";
import { formatMeetingUrlForDisplay, openLateNoMoreMeetingUrlWithJoinGuard } from "@/utils/LateNoMoreLinking";
import { websiteFavicon } from "@/constants/url";

export const MeetingActionButtons = ({
  meetingUrl,
  isWithinJoinWindow,
  isMeetingOngoing,
  onOpenCalendarEvent,
  startMeetingText,
  subTextColor,
}) => {
  return (
    <View style={styles.gap12}>
      {meetingUrl && (
        <Button
          title={startMeetingText}
          style={[styles.row, styles.gap12]}
          testID="test:id/late-no-more-start-meeting"
          onPress={async () => {
            addInfoLog("[LateNoMore] Start Meeting (join window) pressed:", meetingUrl);
            await openLateNoMoreMeetingUrlWithJoinGuard(meetingUrl, {
              isWithinJoinWindow,
              isMeetingOngoing,
              onOpenCalendar: onOpenCalendarEvent,
            });
          }}
        >
          <Image source={{ uri: websiteFavicon(meetingUrl) }} style={styles.meetingFavicon} />

          <View style={[styles.gap4, styles.flex]}>
            <HeadingSmallText>{startMeetingText}</HeadingSmallText>
            <BodyMediumText color={subTextColor}>{formatMeetingUrlForDisplay(meetingUrl)}</BodyMediumText>
          </View>
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap4: { gap: 4 },
  gap12: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  meetingFavicon: {
    width: 28,
    height: 28,
  },
});
