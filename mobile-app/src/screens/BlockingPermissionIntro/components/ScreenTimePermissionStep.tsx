import React from "react";
import { View, Image, StyleSheet, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { BearWithSpeechBubble } from "./BearWithSpeechBubble";
import { HeadingLargeText } from "@/components";
import iosBlockingExample2 from "@/assets/blocking_permission_intro/ios_blocking_example_2.png";
import introBear2 from "@/assets/blocking_permission_intro/intro_bear_2.png";
import COLOR from "@/constants/color";

type Props = {
  showCongrats: boolean;
};

const ScreenTimePermissionStep: React.FC<Props> = ({ showCongrats }) => {
  const { t } = useTranslation();
  const { height: screenHeight } = useWindowDimensions();

  const title = showCongrats
    ? t("blockingPermissionIntro.screenTimeCongratsTitle")
    : t("blockingPermissionIntro.howItWorksTitle");
  const bubbleText = t("blockingPermissionIntro.howItWorksBubble");

  return (
    <View>
      <View style={styles.textContainer}>
        <HeadingLargeText center style={styles.title}>
          {title}
        </HeadingLargeText>
      </View>

      <View style={styles.previewWrapper}>
        <Image source={iosBlockingExample2} style={[styles.phoneImage, { height: screenHeight * 0.7 }]} />
      </View>

      {!showCongrats && (
        <View style={[styles.previewOverlayBase, styles.previewOverlayCenter, { top: screenHeight * 0.24 }]}>
          <BearWithSpeechBubble text={bubbleText} bearSource={introBear2} tailSide="right" />
        </View>
      )}
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

export { ScreenTimePermissionStep };
