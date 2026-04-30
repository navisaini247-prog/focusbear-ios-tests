import React from "react";
import { StyleSheet, View, useWindowDimensions, ScrollView, Modal } from "react-native";
import {
  BodyLargeText,
  BodyMediumText,
  Card,
  ConfirmationButton,
  HeadingLargeText,
  HeadingXLargeText,
  Separator,
} from "@/components";
import { useTheme } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTranslation, Trans } from "react-i18next";
import { getStreakIconState, STREAK_STATES } from "@/utils/StreakStatus";

export const StreakInfoModal = ({
  isVisible,
  onConfirm,
  morningStreak,
  eveningStreak,
  focusStreak,
  morningDoneToday,
  eveningDoneToday,
  focusDoneToday,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { height } = useWindowDimensions();

  const focusState = getStreakIconState(focusStreak, focusDoneToday);
  const morningState = getStreakIconState(morningStreak, morningDoneToday);
  const eveningState = getStreakIconState(eveningStreak, eveningDoneToday);

  const getStreakColor = (state) => (state === STREAK_STATES.ACTIVE ? colors.primary : colors.subText);

  const verticalGap = Math.max(20, height * 0.04);

  return (
    <Modal
      visible={isVisible}
      backdropColor={colors.background}
      presentationStyle="formSheet"
      animationType="slide"
      onRequestClose={() => onConfirm()}
    >
      <>
        <ScrollView
          contentContainerStyle={[styles.contentContainer, { gap: verticalGap, paddingTop: verticalGap * 2 }]}
          showsVerticalScrollIndicator={false}
        >
          <HeadingXLargeText center>{t("streak.title")}</HeadingXLargeText>

          <BodyLargeText center>
            <Trans
              i18nKey="streak.howItWorks"
              components={{
                bold: <BodyLargeText weight="800" />,
              }}
            />
          </BodyLargeText>

          <Card style={[styles.gap16, styles.card]}>
            <View style={[styles.gap16, styles.row]}>
              <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
                <Icon name="whatshot" color={getStreakColor(morningState)} size={28} />
              </View>
              <View style={[styles.gap4, styles.flex]}>
                <BodyLargeText color={colors.subText}>{t("streak.morningStreak")}</BodyLargeText>
                <HeadingLargeText>{t("streak.day", { count: morningStreak })}</HeadingLargeText>
              </View>
            </View>
            <Separator />
            <View style={[styles.gap16, styles.row]}>
              <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
                <Icon name="whatshot" color={getStreakColor(eveningState)} size={28} />
              </View>
              <View style={[styles.gap4, styles.flex]}>
                <BodyLargeText color={colors.subText}>{t("streak.eveningStreak")}</BodyLargeText>
                <HeadingLargeText>{t("streak.day", { count: eveningStreak })}</HeadingLargeText>
              </View>
            </View>
            <Separator />
            <View style={[styles.gap16, styles.row]}>
              <View style={[styles.iconContainer, { backgroundColor: colors.secondary }]}>
                <Icon name="whatshot" color={getStreakColor(focusState)} size={28} />
              </View>
              <View style={[styles.gap4, styles.flex]}>
                <BodyLargeText color={colors.subText}>{t("streak.focusModeStreak")}</BodyLargeText>
                <HeadingLargeText>{t("streak.day", { count: focusStreak })}</HeadingLargeText>
              </View>
            </View>
          </Card>

          <BodyMediumText center color={colors.subText}>
            {t("streak.motivationTip")}
          </BodyMediumText>
        </ScrollView>

        <ConfirmationButton onConfirm={onConfirm} confirmTitle={t("common.ok")} />
      </>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap4: { gap: 4 },
  gap16: { gap: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  contentContainer: {
    padding: 32,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 100,
  },
});
