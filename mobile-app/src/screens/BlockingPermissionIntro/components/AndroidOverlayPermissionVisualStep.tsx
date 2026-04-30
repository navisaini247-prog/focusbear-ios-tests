import React from "react";
import { View, Image, StyleSheet, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { BearWithSpeechBubble } from "./BearWithSpeechBubble";
import { HeadingLargeText } from "@/components";
import androidBlockingExample4 from "@/assets/blocking_permission_intro/android_blocking_example_4.png";
import introBear5 from "@/assets/blocking_permission_intro/intro_bear_5.png";
import COLOR from "@/constants/color";

const AndroidOverlayPermissionVisualStep: React.FC = () => {
  const { t } = useTranslation();
  const { height: screenHeight } = useWindowDimensions();

  const title = t("blockingPermissionIntro.androidPermissionVisualTitle");
  const bubbleText = t("blockingPermissionIntro.androidPermissionVisualBubble");

  return (
    <View>
      <View style={styles.textContainer}>
        <HeadingLargeText center style={styles.title}>
          {title}
        </HeadingLargeText>
      </View>

      <View style={styles.previewWrapper}>
        <Image source={androidBlockingExample4} style={[styles.phoneImage, { height: screenHeight * 0.7 }]} />
      </View>

      <View style={[styles.previewOverlayBase, styles.previewOverlayAndroidPermission, { top: screenHeight * 0.32 }]}>
        <BearWithSpeechBubble text={bubbleText} bearSource={introBear5} tailSide="right" />
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
  previewOverlayAndroidPermission: {
    right: -8,
    alignItems: "flex-end",
  },
});

export { AndroidOverlayPermissionVisualStep };
