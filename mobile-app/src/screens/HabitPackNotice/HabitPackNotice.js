import React from "react";
import { View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Trans, useTranslation } from "react-i18next";
import { styles } from "@/screens/HabitPackNotice/HabitPackNotice.styles";
import { NAVIGATION } from "@/constants";
import { BodyXLargeText, ConfirmationButton, HeadingLargeText } from "@/components";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUpdateOnboardingProcess } from "@/hooks/use-update-onboarding-process";

export function HabitPackNotice({ navigation }) {
  const { t } = useTranslation();
  const route = useRoute();

  useUpdateOnboardingProcess(NAVIGATION.HabitPackNotice);

  const { top } = useSafeAreaInsets();

  const handleOnPress = () => {
    navigation.replace(NAVIGATION.Habit, route.params);
  };

  return (
    <View style={[styles.flex, { paddingTop: top }]}>
      <View style={styles.container}>
        <Trans
          defaults={t("onboarding.habitPackSelectionNotice")}
          parent={BodyXLargeText}
          style={styles.textCenter}
          components={{
            bold: <HeadingLargeText center />,
          }}
        />
      </View>
      <ConfirmationButton
        confirmTestID="test:id/go-to-habit-pack-selection-screen"
        onConfirm={handleOnPress}
        confirmTitle={t("common.next")}
      />
    </View>
  );
}
