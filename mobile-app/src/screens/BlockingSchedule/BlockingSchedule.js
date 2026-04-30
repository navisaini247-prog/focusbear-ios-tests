import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  BodyMediumText,
  BodySmallText,
  ConfirmationModal,
  Group,
  BigAppHeader,
  SmallButton,
  FloatingButton,
  Checkmark,
} from "@/components";
import { NameAndEmojiInput } from "../HabitSettingScreen/components/HabitNameInput";
import { DayOfWeekSelector } from "./components/DayOfWeekSelector";
import { BlockingModeSelector } from "./components/BlockingModeSelector";
import { ScheduleTimePickerGroup } from "./components/ScheduleTimePickerGroup";
import { ChooseAppsButton } from "./components/ChooseAppsButton";
import { ChooseUrlsButton } from "./components/ChooseUrlsButton";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { ControlFunctionModule } from "@/nativeModule";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { useBlockingScheduleLogic } from "./hooks/useBlockingScheduleLogic";
import { postHogCapture } from "@/utils/Posthog";
import { i18n } from "@/localization";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { NAVIGATION } from "@/constants";
import { DAYS, EMOJI_REGEX } from "@/constants/activity";
import uuid from "react-native-uuid";
import { useHomeContext } from "@/screens/Home/context";
import { AccessibilityPermissionModal } from "@/components/AccessibilityPermissionInfoModal";
import { BLOCKING_MODE } from "@/constants/blockingSchedule";
const isIOS = Platform.OS === "ios";

const DEFAULT_DAYS_OF_WEEK = DAYS.slice(1, 6);
const DEFAULT_START_HOUR = 9;
const DEFAULT_END_HOUR = 17;

export const BlockingSchedule = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isAccessibilityPermissionGranted, requestAccessibilityPermission } = useHomeContext();

  const [schedule, setSchedule] = useState({
    id: uuid.v4(),
    name: t("blockingSchedule.defaultName"),
    startHour: DEFAULT_START_HOUR,
    startMinute: 0,
    endHour: DEFAULT_END_HOUR,
    endMinute: 0,
    daysOfWeek: DEFAULT_DAYS_OF_WEEK,
    blockingMode: BLOCKING_MODE.GENTLE,
    focusModeId: undefined,
    pauseFriction: "none",
    isAiBlockingEnabled: false,
  });
  const [selectionCounts, setSelectionCounts] = useState(null);
  const [selectedApps, setSelectedApps] = useState([]);
  const [selectedUrls, setSelectedUrls] = useState([]);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [showAccessibilityModal, setShowAccessibilityModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { isSaving, handleSave, requestRemove } = useBlockingScheduleLogic({ schedule, setSelectionCounts });

  const isSaveDisabled = (() => {
    const { applicationsCount = 0, categoriesCount = 0, webDomainsCount = 0 } = selectionCounts || {};
    return isIOS ? !(applicationsCount + categoriesCount + webDomainsCount) : !selectedApps.length;
  })();

  useEffect(() => {
    const prevSchedule = route?.params?.schedule;
    if (prevSchedule) {
      setIsEditing(true);

      const {
        id,
        name,
        startHour,
        startMinute,
        endHour,
        endMinute,
        daysOfWeek,
        blockingMode,
        focusModeId,
        pauseFriction,
        isAiBlockingEnabled,
      } = prevSchedule || {};
      const { selectedApplicationsCount, selectedCategoriesCount, selectedWebDomainsCount } = prevSchedule || {};

      setSchedule({
        id,
        name: name || i18n.t("blockingSchedule.defaultName"),
        startHour: typeof startHour === "number" ? startHour : DEFAULT_START_HOUR,
        startMinute: startMinute || 0,
        endHour: typeof endHour === "number" ? endHour : DEFAULT_END_HOUR,
        endMinute: endMinute || 0,
        daysOfWeek: daysOfWeek || DEFAULT_DAYS_OF_WEEK,
        blockingMode: blockingMode || BLOCKING_MODE.GENTLE,
        focusModeId: focusModeId || prevSchedule?.focus_mode_id,
        pauseFriction: pauseFriction || prevSchedule?.pause_friction || "none",
        isAiBlockingEnabled:
          typeof isAiBlockingEnabled === "boolean"
            ? isAiBlockingEnabled
            : Boolean(prevSchedule?.is_ai_blocking_enabled),
      });
      setSelectionCounts({
        applicationsCount: selectedApplicationsCount || 0,
        categoriesCount: selectedCategoriesCount || 0,
        webDomainsCount: selectedWebDomainsCount || 0,
      });
    }
  }, [route?.params?.schedule]);

  useEffect(() => {
    const _selectedApps = route?.params?.selectedApps; // from app selection screen
    const prevSchedule = route?.params?.schedule; // from editing existing schedule
    if (_selectedApps) {
      setSelectedApps(_selectedApps);
      return;
    }

    if (Array.isArray(prevSchedule?.blockedAppInfos) && prevSchedule.blockedAppInfos.length > 0) {
      setSelectedApps(prevSchedule.blockedAppInfos);
      return;
    }
  }, [route?.params?.selectedApps, route?.params?.schedule]);

  useEffect(() => {
    const _selectedUrls = route?.params?.selectedUrls; // from URL selection screen
    const prevSchedule = route?.params?.schedule; // from editing existing schedule
    if (_selectedUrls) {
      setSelectedUrls(_selectedUrls);
      return;
    }

    if (Array.isArray(prevSchedule?.blockedUrls) && prevSchedule.blockedUrls.length > 0) {
      setSelectedUrls(prevSchedule.blockedUrls);
      return;
    }
  }, [route?.params?.selectedUrls, route?.params?.schedule]);

  const setName = (name) =>
    setSchedule((prev) => ({ ...prev, name: `${prev.name.match(EMOJI_REGEX)?.[0] || ""} ${name}` }));
  const setEmoji = (emoji) =>
    setSchedule((prev) => ({ ...prev, name: `${emoji} ${prev.name.replace(EMOJI_REGEX, "").trimStart()}` }));
  const setStartTime = (startTime) =>
    setSchedule((prev) => ({ ...prev, startMinute: startTime.getMinutes(), startHour: startTime.getHours() }));
  const setEndTime = (endTime) =>
    setSchedule((prev) => ({ ...prev, endMinute: endTime.getMinutes(), endHour: endTime.getHours() }));
  const setSelectedDays = (selectedDays) => setSchedule((prev) => ({ ...prev, daysOfWeek: selectedDays }));
  const setBlockingMode = (mode) => setSchedule((prev) => ({ ...prev, blockingMode: mode }));

  return (
    <View style={styles.flex}>
      <BigAppHeader />
      <KeyboardAwareScrollView contentContainerStyle={[styles.bodyContainer, styles.gap24]}>
        <NameAndEmojiInput
          name={schedule.name.replace(EMOJI_REGEX, "").trimStart()}
          setName={setName}
          emoji={schedule.name.match(EMOJI_REGEX)?.[0]}
          setEmoji={setEmoji}
          placeholder={t("blockingSchedule.namePlaceholder")}
          testID="test:id/blocking-schedule-name"
        />

        <Group>
          <ScheduleTimePickerGroup
            startTime={new Date(new Date().setHours(schedule.startHour, schedule.startMinute, 0, 0))}
            setStartTime={setStartTime}
            endTime={new Date(new Date().setHours(schedule.endHour, schedule.endMinute, 0, 0))}
            setEndTime={setEndTime}
          />

          <DayOfWeekSelector selectedDays={schedule.daysOfWeek} setSelectedDays={setSelectedDays} />
        </Group>

        <View style={styles.gap8}>
          <BodySmallText color={colors.subText}>{t("blockingSchedule.appBlocking")}</BodySmallText>
          <ChooseAppsButton
            selectedApps={selectedApps}
            selectionCounts={selectionCounts}
            onPress={() => {
              if (isIOS) {
                ControlFunctionModule.selectAppsForSchedule?.(schedule?.id);
              } else {
                navigation?.navigate?.(NAVIGATION.AppsBlockList, { isBlockingSchedule: true, selectedApps });
              }
            }}
          />
        </View>

        {!isIOS && (
          <View style={styles.gap8}>
            <BodySmallText color={colors.subText}>{t("blockingSchedule.websiteBlocking")}</BodySmallText>
            <ChooseUrlsButton
              selectedUrls={selectedUrls}
              onPress={() => {
                navigation?.navigate?.(NAVIGATION.BlockUrl, { blockedUrls: selectedUrls, onSave: setSelectedUrls });
              }}
            />
          </View>
        )}

        <View style={styles.gap8}>
          <BodySmallText color={colors.subText} style={styles.sectionLabel}>
            {t("settings.editFriction")}
          </BodySmallText>
          <BlockingModeSelector mode={schedule.blockingMode} onChange={setBlockingMode} />
        </View>
      </KeyboardAwareScrollView>

      {isEditing && (
        <SafeAreaView edges={["bottom"]} style={[styles.footer, styles.row]}>
          <SmallButton
            subtle
            title={t("common.delete")}
            renderLeftIcon={<Icon name="trash" size={20} color={colors.subText} />}
            onPress={() => setIsDeleteModalVisible(true)}
            testID="test:id/delete-blocking-schedule"
          />
        </SafeAreaView>
      )}

      <FloatingButton
        primary
        title={t("common.save")}
        renderLeftIcon={<Checkmark value={true} color={isSaveDisabled ? colors.text : colors.white} />}
        onPress={() => {
          if (isSaveDisabled) {
            return;
          }
          handleSave({ selectedApps, selectedUrls, isEditing });
        }}
        isLoading={isSaving}
        disabled={isSaveDisabled}
        testID="test:id/confirm-edit-habit"
      />

      <ConfirmationModal
        isVisible={isDeleteModalVisible}
        title={t("blockingSchedule.removeTitle")}
        onCancel={() => setIsDeleteModalVisible(false)}
        confirmTitle={t("common.delete")}
        onConfirm={() => {
          setIsDeleteModalVisible(false);
          postHogCapture(POSTHOG_EVENT_NAMES.BLOCKING_SCHEDULE_REMOVE);
          requestRemove();
        }}
      >
        <BodyMediumText>{t("blockingSchedule.removeMessage")}</BodyMediumText>
      </ConfirmationModal>

      <AccessibilityPermissionModal
        isVisible={showAccessibilityModal}
        onCancel={() => setShowAccessibilityModal(false)}
        onConfirm={() => {
          setShowAccessibilityModal(false);
          requestAccessibilityPermission();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap8: { gap: 8 },
  gap24: { gap: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  bodyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  sectionLabel: {
    fontWeight: "700",
    paddingHorizontal: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
});
