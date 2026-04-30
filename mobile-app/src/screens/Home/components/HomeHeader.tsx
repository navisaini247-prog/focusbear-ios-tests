import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { PressableWithFeedback, BodyXSmallText, AppHeader, ScalableIcon } from "@/components";
import { AppHeaderProps } from "@/components/AppHeader";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useHomeContext } from "@/screens/Home/context";
import { NAVIGATION } from "@/constants";
import { ScreenNavigationProp } from "@/navigation/AppNavigator";
import { StreakBadge } from "@/components/StreakBadge";
import { StreakInfoModal } from "@/components/StreakInfoModal";
import { useSelector } from "react-redux";
import {
  eveningStreakSelector,
  focusStreakSelector,
  hasDoneDailyEveningSessionSelector,
  hasDoneDailyFocusSessionSelector,
  hasDoneDailyMorningSessionSelector,
  morningStreakSelector,
} from "@/selectors/UserSelectors";
import { FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";

export const HomeHeader = (props: AppHeaderProps) => {
  const navigation = useNavigation<ScreenNavigationProp>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { bearsona } = useHomeContext() as any;
  const ProfilePicture = bearsona.profilePictures.og;

  const [isStreakModalVisible, setIsStreakModalVisible] = useState(false);

  const morningStreak = useSelector(morningStreakSelector);
  const eveningStreak = useSelector(eveningStreakSelector);
  const focusStreak = useSelector(focusStreakSelector);
  const morningDoneToday = useSelector(hasDoneDailyMorningSessionSelector);
  const eveningDoneToday = useSelector(hasDoneDailyEveningSessionSelector);
  const focusDoneToday = useSelector(hasDoneDailyFocusSessionSelector);

  return (
    <>
      <AppHeader
        hideBackButton
        extraTall
        leftContent={
          <View style={styles.row}>
            <PressableWithFeedback
              onPress={() => navigation.navigate(NAVIGATION.BearsonaSettings)}
              style={[styles.userButton, { borderColor: colors.separator, backgroundColor: colors.background }]}
              testID="test:id/home-header-bearsona"
            >
              <ProfilePicture style={styles.bearsonaImage} />
            </PressableWithFeedback>

            <StreakBadge
              morningStreak={morningStreak}
              eveningStreak={eveningStreak}
              focusStreak={focusStreak}
              morningDoneToday={morningDoneToday}
              eveningDoneToday={eveningDoneToday}
              focusDoneToday={focusDoneToday}
              onPress={() => {
                postHogCapture(POSTHOG_EVENT_NAMES.VIEW_STREAK);
                setIsStreakModalVisible(true);
              }}
            />
          </View>
        }
        rightContent={
          <PressableWithFeedback
            testID="test:id/home-header-help"
            onPress={() => navigation.navigate(NAVIGATION.HelpScreen)}
            style={styles.bigHeaderButton}
          >
            <ScalableIcon
              name="chatbubble-ellipses"
              size={22}
              color={colors.subText}
              scaleOptions={{ maxFontScale: FONT_SCALE_LIMIT.CONSTRAINED_UI }}
            />
            <BodyXSmallText center size={11} maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI}>
              {t("settings.help")}
            </BodyXSmallText>
          </PressableWithFeedback>
        }
        {...props}
      />
      <StreakInfoModal
        isVisible={isStreakModalVisible}
        onConfirm={() => setIsStreakModalVisible(false)}
        morningStreak={morningStreak}
        eveningStreak={eveningStreak}
        focusStreak={focusStreak}
        morningDoneToday={morningDoneToday}
        eveningDoneToday={eveningDoneToday}
        focusDoneToday={focusDoneToday}
      />
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  userButton: {
    width: 48,
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 4,
  },
  bearsonaImage: {
    width: "100%",
    height: "100%",
    transform: [{ scale: 1.2 }],
  },
  bigHeaderButton: {
    width: 54,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
});
