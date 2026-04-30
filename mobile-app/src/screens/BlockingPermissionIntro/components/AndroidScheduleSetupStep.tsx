import React from "react";
import { View, Image, StyleSheet, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { BearWithSpeechBubble } from "./BearWithSpeechBubble";
import { HeadingLargeText } from "@/components";
import androidBlockingExample5 from "@/assets/blocking_permission_intro/android_blocking_example_5.png";
import introBear3 from "@/assets/blocking_permission_intro/intro_bear_3.png";
import COLOR from "@/constants/color";

const AndroidScheduleSetupStep: React.FC = () => {
  const { t } = useTranslation();
  const { height: screenHeight } = useWindowDimensions();

  const title = t("blockingPermissionIntro.androidScheduleSetupTitle");
  const bubbleText = t("blockingPermissionIntro.androidScheduleSetupBubble");

  return (
    <View>
      <View style={styles.textContainer}>
        <HeadingLargeText center style={styles.title}>
          {title}
        </HeadingLargeText>
      </View>

      <View style={styles.previewWrapper}>
        <Image source={androidBlockingExample5} style={[styles.phoneImage, { height: screenHeight * 0.7 }]} />
      </View>

      <View style={[styles.previewOverlayBase, styles.previewOverlayLeft]}>
        <BearWithSpeechBubble
          text={bubbleText}
          bearSource={introBear3}
          tailSide="left"
          bearWidth={210}
          bearHeight={200}
          bubbleStyle={styles.bubbleCloserToBear}
          bubbleMaxWidth={200}
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
  previewOverlayLeft: {
    left: 0,
    bottom: -32,
  },
  bubbleCloserToBear: {
    marginLeft: -72,
  },
});

export { AndroidScheduleSetupStep };
