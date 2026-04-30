import React from "react";
import { View, Image, GestureResponderEvent, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Button, HeadingLargeText } from "@/components";
import { CongratsMark } from "@/components/CongratsMark";
import introBear4 from "@/assets/blocking_permission_intro/intro_bear_4.png";
import sparkle from "@/assets/blocking_permission_intro/sparkle.png";
import COLOR from "@/constants/color";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  /** Called when user taps the primary button on the finish step */
  onPrimaryPress: (event: GestureResponderEvent) => void;
};

const FinishStep: React.FC<Props> = ({ onPrimaryPress }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <HeadingLargeText center style={styles.title}>
          {t("blockingPermissionIntro.finishTitle")}
        </HeadingLargeText>

        <View style={styles.congratsWrapper}>
          <CongratsMark size={270} />
        </View>

        <View style={styles.bearWrapper}>
          <Image source={sparkle} style={styles.sparkleImage} resizeMode="contain" />
          <Image source={introBear4} style={styles.bearImage} resizeMode="contain" />
        </View>
      </View>

      <Button
        testID="test:id/blocking-permission-intro-finish-primary"
        title={t("blockingPermissionIntro.finishPrimary")}
        onPress={onPrimaryPress}
        primary
        style={[styles.primaryButton, { marginBottom: insets.bottom + 12 }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: COLOR.WHITE,
    marginBottom: 16,
  },
  congratsWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  bearWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  sparkleImage: {
    position: "absolute",
    width: 260,
    height: 260,
    top: -20,
  },
  bearImage: {
    width: 260,
    height: 260,
    marginBottom: 24,
  },
  primaryButton: {
    marginTop: 8,
  },
});

export { FinishStep };
