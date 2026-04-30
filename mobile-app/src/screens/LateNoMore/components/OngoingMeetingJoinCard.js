import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { BodyMediumText, Button, HeadingSmallText } from "@/components";
import { addInfoLog } from "@/utils/FileLogger";
import { formatMeetingUrlForDisplay, openLateNoMoreMeetingUrl } from "@/utils/LateNoMoreLinking";
import { websiteFavicon } from "@/constants/url";

export const OngoingMeetingJoinCard = ({ meetingUrl, onOpenCalendarEvent, startMeetingText, subTextColor }) => {
  if (!meetingUrl) return null;

  return (
    <Button
      title={startMeetingText}
      style={[styles.row, styles.gap12]}
      testID="test:id/late-no-more-start-meeting"
      onPress={async () => {
        addInfoLog("[LateNoMore] Start Meeting (ongoing) pressed:", meetingUrl);
        await openLateNoMoreMeetingUrl(meetingUrl, onOpenCalendarEvent);
      }}
    >
      <Image source={{ uri: websiteFavicon(meetingUrl) }} style={styles.meetingFavicon} />

      <View style={[styles.gap4, styles.flex]}>
        <HeadingSmallText>{startMeetingText}</HeadingSmallText>
        <BodyMediumText color={subTextColor}>{formatMeetingUrlForDisplay(meetingUrl)}</BodyMediumText>
      </View>
    </Button>
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
