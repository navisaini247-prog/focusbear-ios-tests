import React from "react";
import { StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { BodySmallText, Button, HeadingSmallText } from "@/components";
import COLOR from "@/constants/color";

export const MeetingEventCard = ({
  upcomingMeeting,
  meetingColor,
  onPress,
  meetingTimeText,
  noMeetingText,
  subTextColor,
  source,
}) => {
  const isDeviceSource = source === "local";
  const sourceIconName = isDeviceSource ? "calendar-outline" : "logo-google";
  const sourceIconColor = isDeviceSource ? COLOR.AMBER[500] : COLOR.BLUE[500];

  return (
    <Button subtle style={[styles.eventCard, styles.gap12]} onPress={onPress} testID="test:id/late-no-more-event">
      <View style={[styles.eventCardBg, StyleSheet.absoluteFill, { backgroundColor: meetingColor }]} />
      <View style={[styles.eventCardAccent, { backgroundColor: meetingColor }]} />

      <View style={[styles.gap4, styles.flex]}>
        <View style={[styles.row, styles.gap8]}>
          <HeadingSmallText style={styles.flex}>
            {upcomingMeeting?.summary || upcomingMeeting?.title || noMeetingText}
          </HeadingSmallText>
          <Icon name={sourceIconName} size={16} color={sourceIconColor} />
          <Icon name="open-outline" size={18} color={subTextColor} />
        </View>

        <BodySmallText color={subTextColor}>{meetingTimeText || noMeetingText}</BodySmallText>
      </View>
    </Button>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap4: { gap: 4 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventCard: {
    padding: 8,
    flexDirection: "row",
    alignItems: "stretch",
  },
  eventCardBg: {
    opacity: 0.1,
  },
  eventCardAccent: {
    width: 3,
    borderRadius: 1.5,
  },
});
