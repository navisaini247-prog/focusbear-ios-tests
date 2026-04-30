import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  BodyMediumText,
  BodySmallText,
  DisplaySmallText,
  Group,
  HeadingMediumText,
  MenuItem,
  SheetModal,
} from "@/components";
import { ActivityItemCard } from "./ActivityItem";
import { DeleteRoutineConfirmationModal } from "./DeleteRoutineConfirmationModal";
import { useRoutineTheme } from "../hooks/use-routine-theme";
import { useHomeContext } from "../context";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { store } from "@/store";
import { customRoutinesSelector, cutOffTimeSelector, startUpTimeSelector } from "@/selectors/RoutineSelectors";
import { getSplitDateTime, isAfterCutOffTime } from "@/utils/TimeMethods";
import { formatRoutineSchedule } from "@/screens/HabitSettingScreen/components/RoutineSelection";
import moment from "moment";
import { NAVIGATION } from "@/constants";
import { ACTIVITY_TYPE, ROUTINE_TRIGGER } from "@/constants/routines";
import type { ScreenNavigationProp } from "@/navigation/AppNavigator";
import type { FormattedRoutine } from "@/hooks/use-routine-data";
import type { CustomRoutine } from "@/types/Routine";

export enum Screens {
  CompletedActivities,
  UnavailableActivities,
  RoutineOptions,
}

interface RoutineInfoModalProps {
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
  routineId: string;
  screen: Screens;
}

export const RoutineInfoModal = ({ isVisible, setIsVisible, routineId, screen }: RoutineInfoModalProps) => {
  const { routineData } = useHomeContext() as any;

  const routine = routineData.find((_routine: FormattedRoutine) => _routine.id === routineId);

  if (!routine) return null;

  return (
    <SheetModal isVisible={isVisible} onCancel={() => setIsVisible(false)}>
      <View style={styles.contentContainer}>
        {(() => {
          switch (screen) {
            case Screens.CompletedActivities:
              return <CompletedActivitiesScreen routine={routine} />;
            case Screens.UnavailableActivities:
              return <UnavailableActivitiesScreen routine={routine} setIsVisible={setIsVisible} />;
            case Screens.RoutineOptions:
              return <RoutineOptionsScreen routine={routine} setIsVisible={setIsVisible} />;
          }
        })()}
      </View>
    </SheetModal>
  );
};

interface ActivitiesScreenProps {
  routine: FormattedRoutine;
  setIsVisible?: (isVisible: boolean) => void;
}

const CompletedActivitiesScreen = ({ routine }: ActivitiesScreenProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { activities = [] } = routine || {};

  const filteredActivities = useMemo(() => activities.filter((activity) => activity.isCompleted), [activities]);

  return (
    <View style={styles.gap16}>
      <View style={styles.gap8}>
        <BodySmallText color={colors.subText}>{routine.name}</BodySmallText>
        <HeadingMediumText>{t("home.completedHabits")}</HeadingMediumText>
      </View>

      <View style={styles.gap8}>
        {filteredActivities.map((activity) => (
          <ActivityItemCard key={activity.id} {...activity} />
        ))}
      </View>
    </View>
  );
};

const UnavailableActivitiesScreen = ({ routine, setIsVisible }: ActivitiesScreenProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<ScreenNavigationProp>();

  const { activities = [] } = routine || {};

  const cutoffTime = useSelector(cutOffTimeSelector);
  const startUpTime = useSelector(startUpTimeSelector);
  const isAfterCutoff = isAfterCutOffTime(cutoffTime, startUpTime);

  const filteredActivities = useMemo(() => activities.filter((activity) => !activity.isAvailable), [activities]);

  const onPressEditCutoff = () => {
    setIsVisible(false);
    navigation.navigate(NAVIGATION.EditTiming);
  };

  return (
    <View style={styles.gap16}>
      <View style={styles.gap8}>
        <BodySmallText color={colors.subText}>{routine.name}</BodySmallText>
        <HeadingMediumText>{t("home.hiddenHabits")}</HeadingMediumText>
      </View>

      {isAfterCutoff && (
        <View style={styles.gap4}>
          <BodyMediumText>
            {t("home.cutoffTimeNote", { time: moment(getSplitDateTime(cutoffTime)).format("LT") })}
            <BodyMediumText color={colors.primary} underline onPress={onPressEditCutoff}>
              {t("home.editCutoff")}
            </BodyMediumText>
          </BodyMediumText>
        </View>
      )}

      <View style={styles.gap8}>
        {filteredActivities.map((activity) => (
          <ActivityItemCard key={activity.id} {...activity} />
        ))}
      </View>
    </View>
  );
};

interface RoutineOptionsScreenProps {
  routine: FormattedRoutine;
  setIsVisible: (isVisible: boolean) => void;
}

const RoutineOptionsScreen = ({ routine, setIsVisible }: RoutineOptionsScreenProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const locale = t("baseLanguage", { defaultValue: "en" });
  const navigation = useNavigation<ScreenNavigationProp>();

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const { type, name, trigger, id, activities, isCompleted } = routine;
  const { color } = useRoutineTheme(type);

  const isCustomRoutine = type === ACTIVITY_TYPE.STANDALONE;
  const isScheduled = trigger === ROUTINE_TRIGGER.ON_SCHEDULE;
  const completedCount = activities.reduce((acc, item) => (item.isCompleted ? acc + 1 : acc), 0);
  const unavailableCount = activities.reduce(
    (acc, item) => (!item.isCompleted && !item.isAvailable ? acc + 1 : acc),
    0,
  );

  const activitiesCountText = t("home.habitsCount", { count: activities.length });

  const unavailableActivitiesText = unavailableCount > 0 && t("home.unavailableWithCount", { count: unavailableCount });

  const completedActivitiesText = (() => {
    if (isCompleted) return t("overview.routineCompletedShort");
    if (completedCount > 0) return t("home.completedWithCount", { count: completedCount });
    return null;
  })();

  const onPressEditMorningEveningRoutine = () => {
    navigation.navigate(NAVIGATION.EditMorningEveningRoutine, { type } as any);
    setIsVisible(false);
  };

  const onPressEditCustomRoutine = () => {
    setIsVisible(false);
    // Get the un-formatted custom routine object
    const customRoutines = customRoutinesSelector(store.getState()) as CustomRoutine[];
    const customRoutine = customRoutines.find((_routine) => _routine.id === id);
    if (customRoutine) {
      navigation.navigate(NAVIGATION.EditCustomRoutine, { routine: customRoutine } as any);
    }
  };

  return (
    <View style={styles.gap16}>
      <View style={styles.gap12}>
        <DisplaySmallText>{name}</DisplaySmallText>

        <BodyMediumText>
          {isScheduled ? formatRoutineSchedule(routine, locale) : t("editRoutine.anytime")}
          <BodyMediumText color={colors.subText}>
            {" - "}
            {[activitiesCountText, completedActivitiesText, unavailableActivitiesText].filter(Boolean).join(", ")}
          </BodyMediumText>
        </BodyMediumText>
      </View>

      <Group>
        <MenuItem
          big
          title={t("home.editRoutine")}
          icon="pencil"
          iconType="MaterialCommunityIcons"
          iconColor={color}
          onPress={isCustomRoutine ? onPressEditCustomRoutine : onPressEditMorningEveningRoutine}
          testID="test:id/edit-activity"
        />

        <MenuItem
          big
          title={t("home.changeTiming")}
          icon="time"
          iconColor={colors.subText}
          onPress={() => {
            navigation.navigate(NAVIGATION.EditTiming);
            setIsVisible(false);
          }}
          testID="test:id/change-timing"
        />
      </Group>

      {isCustomRoutine && (
        <MenuItem
          title={t("home.deleteRoutine")}
          icon="trash"
          onPress={() => setIsDeleteModalVisible(true)}
          testID="test:id/delete-routine"
        />
      )}

      <DeleteRoutineConfirmationModal
        isVisible={isDeleteModalVisible}
        setIsVisible={setIsDeleteModalVisible}
        routine={routine}
        onDeleteSuccess={() => setIsVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  gap4: { gap: 4 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  gap16: { gap: 16 },
  contentContainer: {
    padding: 16,
    paddingVertical: 12,
  },
});
