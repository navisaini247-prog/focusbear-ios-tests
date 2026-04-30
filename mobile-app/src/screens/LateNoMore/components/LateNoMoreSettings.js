import React, { Fragment, useState } from "react";
import { Alert, Linking, StyleSheet, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  BodyMediumText,
  BodySmallText,
  Card,
  Group,
  HeadingMediumText,
  MenuItem,
  PressableWithFeedback,
  Separator,
} from "@/components";
import { NotificationPermissionMenu } from "@/screens/Permissions/Permissions";
import { useHomeContext } from "@/screens/Home/context";
import {
  lateNoMoreConnectedPlatformsSelector,
  lateNoMoreNotificationsEnabledSelector,
  lateNoMoreReminderTimesSelector,
  lateNoMoreRequireMeetingUrlSelector,
} from "@/selectors/UserSelectors";
import {
  setLateNoMoreNotificationsEnabled,
  setLateNoMoreReminderTimes,
  setLateNoMoreRequireMeetingUrl,
} from "@/actions/UserActions";
import { WEB_URL } from "@/utils/Enums";
import LateNoMoreManager, { REMINDER_TIMING_OPTIONS } from "@/controllers/LateNoMoreManager";
import { ReminderOptionsModal } from "@/screens/LateNoMore/components/ReminderOptionsModal";
import moment from "moment";
import { posthog } from "@/utils/Posthog";

const toSentenceCase = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const isLateNoMoreGoogleCalendarEnabled = posthog.isFeatureEnabled("hide-late-no-more-google-calendar");

export const LateNoMoreSettings = ({ upcomingMeeting, expanded, onToggleExpanded }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();

  const notificationsEnabled = useSelector(lateNoMoreNotificationsEnabledSelector);
  const reminderTimes = useSelector(lateNoMoreReminderTimesSelector) || [2, 15];
  const requireMeetingUrl = useSelector(lateNoMoreRequireMeetingUrlSelector);
  const isGoogleCalendarConnected = Boolean(useSelector(lateNoMoreConnectedPlatformsSelector)?.google);
  const { requestCalendarPermission, isCalendarPermissionGranted, isPushNotificationPermissionGranted } =
    useHomeContext();

  const [isReminderOptionsModalVisible, setIsReminderOptionsModalVisible] = useState(false);

  const reminderTimeLabels = Object.fromEntries(
    REMINDER_TIMING_OPTIONS.map((time) => {
      const duration = toSentenceCase(moment.duration(time, "minutes").humanize());
      const label = time === 0 ? t("lateNoMore.whenMeetingStarts") : t("lateNoMore.durationBefore", { duration });
      return [time, label];
    }),
  );

  const toggleNotificationsEnabled = () => {
    const newEnabledState = !notificationsEnabled;
    dispatch(setLateNoMoreNotificationsEnabled(newEnabledState));

    if (newEnabledState && upcomingMeeting) {
      LateNoMoreManager.scheduleMeetingNotifications(upcomingMeeting);
    } else {
      LateNoMoreManager.cancelScheduledNotifications(true);
    }
  };

  const addReminder = (option) => {
    dispatch(setLateNoMoreReminderTimes([...reminderTimes, option].sort((a, b) => a - b)));
    setIsReminderOptionsModalVisible(false);
    if (notificationsEnabled && upcomingMeeting) {
      LateNoMoreManager.scheduleMeetingNotifications(upcomingMeeting);
    }
  };

  const removeReminder = (reminder) => {
    dispatch(setLateNoMoreReminderTimes(reminderTimes.filter((_reminder) => _reminder !== reminder)));
    if (notificationsEnabled && upcomingMeeting) {
      LateNoMoreManager.scheduleMeetingNotifications(upcomingMeeting);
    }
  };

  const onPressCalendarPermission = async () => {
    if (!isCalendarPermissionGranted) {
      const granted = await requestCalendarPermission();
      if (!granted) {
        Alert.alert(
          t("lateNoMore.calendarPermission"),
          t("lateNoMore.calendarPermissionDenied"),
          [
            { text: t("common.cancel"), style: "cancel" },
            { text: t("lateNoMore.openSettings"), style: "default", onPress: () => Linking.openSettings() },
          ],
          { cancelable: true },
        );
      }
    } else {
      Alert.alert(t("lateNoMore.calendarPermission"), t("lateNoMore.calendarPermissionAlreadyGranted"), null, {
        cancelable: true,
      });
    }
  };

  return (
    <View style={styles.gap12}>
      <PressableWithFeedback
        style={[styles.row, styles.gap8, styles.pressable]}
        onPress={onToggleExpanded}
        testID="test:id/late-no-more-toggle-settings-section"
      >
        <Icon name={expanded ? "chevron-down" : "chevron-forward"} size={20} color={colors.text} />
        <HeadingMediumText>{t("settings.title")}</HeadingMediumText>
      </PressableWithFeedback>

      {expanded && (
        <View style={styles.gap24}>
          {(isGoogleCalendarConnected || isCalendarPermissionGranted) && (
            <View style={styles.gap12}>
              <Group>
                {isPushNotificationPermissionGranted ? (
                  <MenuItem
                    big
                    type="switch"
                    title={t("lateNoMore.enableReminders")}
                    icon="notifications"
                    isSelected={notificationsEnabled}
                    onPress={toggleNotificationsEnabled}
                  />
                ) : (
                  <NotificationPermissionMenu showDot />
                )}

                {notificationsEnabled && isPushNotificationPermissionGranted && (
                  <Card noPadding>
                    {reminderTimes.map((reminder) => (
                      <Fragment key={reminder}>
                        <View style={[styles.reminderTime, styles.row, styles.gap12]}>
                          <Icon name="square" size={20} color="transparent" />
                          <BodyMediumText style={styles.flex}>{reminderTimeLabels[reminder]}</BodyMediumText>
                          <PressableWithFeedback
                            style={styles.pressable}
                            onPress={() => removeReminder(reminder)}
                            testID={`test:id/late-no-more-delete-reminder-${reminder}`}
                          >
                            <Icon name="close" size={18} color={colors.subText} />
                          </PressableWithFeedback>
                        </View>
                        <Separator />
                      </Fragment>
                    ))}

                    {REMINDER_TIMING_OPTIONS.some((option) => !reminderTimes.includes(option)) && (
                      <PressableWithFeedback
                        style={[styles.reminderTime, styles.row, styles.gap12]}
                        onPress={() => setIsReminderOptionsModalVisible(true)}
                        testID="test:id/late-no-more-add-reminder"
                      >
                        <Icon name="add" size={20} color={colors.subText} />
                        <BodyMediumText color={colors.subText}>{t("lateNoMore.addReminder")}</BodyMediumText>
                      </PressableWithFeedback>
                    )}
                  </Card>
                )}
              </Group>

              <MenuItem
                type="switch"
                title={t("lateNoMore.requireMeetingUrl")}
                description={t("lateNoMore.requireMeetingUrlDescription")}
                isSelected={requireMeetingUrl}
                onPress={() => dispatch(setLateNoMoreRequireMeetingUrl(!requireMeetingUrl))}
              />
            </View>
          )}

          <View style={styles.gap8}>
            <BodySmallText style={styles.sectionLabel} weight="700" color={colors.subText}>
              {t("lateNoMore.calendarIntegration")}
            </BodySmallText>
            <Group>
              <MenuItem
                title={t("lateNoMore.calendarPermission")}
                icon="phone-portrait"
                subtitle={isCalendarPermissionGranted ? t("lateNoMore.connected") : t("lateNoMore.notConnected")}
                onPress={onPressCalendarPermission}
                testID="test:id/late-no-more-calendar-permission"
              />
              {isLateNoMoreGoogleCalendarEnabled && (
                <MenuItem
                  title={t("lateNoMore.googleCalendar")}
                  icon="logo-google"
                  subtitle={isGoogleCalendarConnected ? t("lateNoMore.connected") : t("lateNoMore.notConnected")}
                  onPress={() => Linking.openURL(WEB_URL.INTEGRATIONS)}
                  testID="test:id/late-no-more-google-link"
                />
              )}
            </Group>
          </View>

          {!isCalendarPermissionGranted && !isGoogleCalendarConnected && (
            <BodyMediumText color={colors.subText} style={styles.sectionLabel} center>
              {t("lateNoMore.calendarTooltip")}
            </BodyMediumText>
          )}

          <ReminderOptionsModal
            isVisible={isReminderOptionsModalVisible}
            setIsVisible={setIsReminderOptionsModalVisible}
            addReminder={addReminder}
            reminderTimes={reminderTimes}
            reminderTimeLabels={reminderTimeLabels}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  gap24: { gap: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionLabel: {
    paddingHorizontal: 4,
  },
  pressable: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  reminderTime: {
    padding: 12,
  },
});
