import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { BearWithSpeechBubble } from "./BearWithSpeechBubble";
import { HeadingLargeText } from "@/components";
import { CongratsMark } from "@/components/CongratsMark";
import { ScheduleItem } from "../../BlockingSchedule/components/ScheduleItem";
import type { Schedule } from "../../BlockingSchedule/hooks/useBlockingScheduleLogic";
import introBear1 from "@/assets/blocking_permission_intro/intro_bear_1.png";
import COLOR from "@/constants/color";

type Props = {
  createdSchedule: Schedule | null;
};

const ScheduleCreatedStep: React.FC<Props> = ({ createdSchedule }) => {
  const { t } = useTranslation();

  const title = t("blockingPermissionIntro.scheduleCreatedTitle");
  const bubbleText = t("blockingPermissionIntro.scheduleCreatedBubble");

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <HeadingLargeText center style={styles.title}>
          {title}
        </HeadingLargeText>
      </View>

      <View style={styles.content}>
        {createdSchedule && (
          <View style={styles.scheduleItemWrapper}>
            <ScheduleItem schedule={createdSchedule} />
          </View>
        )}

        <View style={styles.congratsWrapper}>
          <CongratsMark size={220} />
        </View>

        <View style={styles.bearWrapper}>
          <BearWithSpeechBubble text={bubbleText} bearSource={introBear1} tailSide="right" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textContainer: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  title: {
    color: COLOR.WHITE,
    marginBottom: 30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  scheduleItemWrapper: {
    marginBottom: 32,
  },
  congratsWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  bearWrapper: {
    alignItems: "flex-end",
    marginTop: 16,
  },
});

export { ScheduleCreatedStep };
