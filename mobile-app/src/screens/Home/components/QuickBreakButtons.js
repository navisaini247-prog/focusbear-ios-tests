import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  SmallButton,
  HeadingLargeText,
  DisplayMediumText,
  BodySmallText,
  PressableWithFeedback,
  ScalableIcon,
} from "@/components";
import { NAVIGATION } from "@/constants";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { setOnboardingMicroBreakFlag } from "@/actions/GlobalActions";
import { userQuickBreaksSelector } from "@/selectors/UserSelectors"; // <-- new selector
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { useFontScale } from "@/hooks/use-font-scale";

export const QuickBreakButtons = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const quickBreaks = useSelector(userQuickBreaksSelector); // <-- get data from Redux
  const { scaleSize } = useFontScale();
  const minWidth = scaleSize(100);
  const startQuickBreak = (habit, _index) => {
    postHogCapture(POSTHOG_EVENT_NAMES.START_MICROBREAK_ACTIVITY);
    dispatch(setOnboardingMicroBreakFlag(true));
    navigation.navigate(NAVIGATION.RoutineDetail, {
      item: { ...habit, id: `${habit.id}_${Date.now()}` },
      isQuickBreak: true,
    });
  };

  const onEditQuickBreakPress = (index, habit) => {
    navigation.navigate(NAVIGATION.EditQuickBreaksScreen, { index, habit });
  };

  return (
    <View style={styles.container}>
      <HeadingLargeText weight="700">{t("quickBreak.quickBreak")}</HeadingLargeText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, styles.gap8, styles.scrollContent]}
        style={styles.scrollView}
      >
        {quickBreaks.map((habit, index) => (
          <SmallButton
            subtle
            key={habit.id}
            style={[styles.button, styles.gap8, styles.buttonFlex, { minWidth: minWidth }]}
            onPress={() => startQuickBreak(habit, index)}
            testID={`test:id/quick-break-${habit.id}`}
          >
            <PressableWithFeedback
              hitSlop={8}
              style={[styles.editButton, { backgroundColor: colors.secondary }]}
              onPress={() => onEditQuickBreakPress(index, habit)}
              testID={`test:id/edit-quick-break-${habit.id}`}
            >
              <ScalableIcon name="pencil" size={14} iconType="MaterialCommunityIcons" color={colors.subText} />
            </PressableWithFeedback>
            <DisplayMediumText center>{habit.emoji}</DisplayMediumText>
            <BodySmallText center weight="700">
              {habit.labelLanguageKey ? t(`quickBreak.${habit.labelLanguageKey}`) : habit.name}
            </BodySmallText>
          </SmallButton>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  gap8: { gap: 8 },
  row: { flexDirection: "row" },
  scrollView: { marginHorizontal: -16 },
  scrollContent: { paddingHorizontal: 16, flexGrow: 1 },
  buttonFlex: { flex: 1 },
  container: {
    paddingHorizontal: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 8,
  },
  editButton: {
    position: "absolute",
    top: 3,
    left: 3,
    padding: 4,
  },
});
