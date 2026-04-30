import React from "react";
import { View, Image, StyleSheet, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { BearWithSpeechBubble } from "./BearWithSpeechBubble";
import { HeadingLargeText } from "@/components";
import androidBlockingExample2 from "@/assets/blocking_permission_intro/android_blocking_example_2.png";
import introBear2 from "@/assets/blocking_permission_intro/intro_bear_2.png";
import COLOR from "@/constants/color";

const AndroidUsagePermissionStep: React.FC = () => {
  const { t } = useTranslation();
  const { height: screenHeight } = useWindowDimensions();

  const title = t("blockingPermissionIntro.androidUsageTitle");
  const bubbleText = t("blockingPermissionIntro.androidUsageBubble");

  return (
    <View>
      <View style={styles.textContainer}>
        <HeadingLargeText center style={styles.title}>
          {title}
        </HeadingLargeText>
      </View>

      <View style={styles.previewWrapper}>
        <Image source={androidBlockingExample2} style={[styles.phoneImage, { height: screenHeight * 0.7 }]} />
      </View>

      <View style={[styles.previewOverlayBase, styles.previewOverlayCenter, { top: screenHeight * 0.32 }]}>
        <BearWithSpeechBubble
          text={bubbleText}
          bearSource={introBear2}
          tailSide="right"
          bearWidth={150}
          bearHeight={190}
          bubbleMaxWidth={220}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  title: {
    color: COLOR.WHITE,
    marginBottom: 30,
  },
  previewWrapper: {
    width: "100%",
    alignItems: "flex-start",
  },
  phoneImage: {
    width: "100%",
    resizeMode: "contain",
  },
  previewOverlayBase: {
    position: "absolute",
    alignItems: "center",
  },
  previewOverlayCenter: {
    right: 0,
    alignItems: "flex-end",
  },
});

export { AndroidUsagePermissionStep };
