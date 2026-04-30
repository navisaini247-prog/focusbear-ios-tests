import React from "react";
import { View, Image, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { BearWithSpeechBubble } from "./BearWithSpeechBubble";
import { HeadingLargeText } from "@/components";
import iosBlockingExample1 from "@/assets/blocking_permission_intro/ios_blocking_example_1.png";
import androidBlockingExample1 from "@/assets/blocking_permission_intro/android_blocking_example_1.png";
import introBear1 from "@/assets/blocking_permission_intro/intro_bear_1.png";
import COLOR from "@/constants/color";

const isAndroid = Platform.OS === "android";

const IntroStep: React.FC = () => {
  const { t } = useTranslation();
  const { height: screenHeight } = useWindowDimensions();

  const phoneImage = isAndroid ? androidBlockingExample1 : iosBlockingExample1;
  const title = isAndroid ? t("blockingPermissionIntro.androidIntroTitle") : t("blockingPermissionIntro.introTitle");
  const bubbleText = t("blockingPermissionIntro.introBubble");

  return (
    <View>
      <View style={styles.textContainer}>
        <HeadingLargeText center style={styles.title}>
          {title}
        </HeadingLargeText>
      </View>

      <View style={styles.previewWrapper}>
        <Image source={phoneImage} style={[styles.phoneImage, { height: screenHeight * 0.7 }]} />
      </View>

      <View style={[styles.previewOverlayBase, styles.previewOverlayRight]}>
        <BearWithSpeechBubble text={bubbleText} bearSource={introBear1} tailSide="right" />
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
  previewOverlayRight: {
    bottom: -32,
    right: 24,
  },
});

export { IntroStep };
