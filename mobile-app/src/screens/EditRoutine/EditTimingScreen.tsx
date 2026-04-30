import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { FloatingButton, Checkmark, BigHeaderScrollView } from "@/components";
import { TimePickerMenuItem } from "./components/TimePickerMenuItem";
import { useRoutineTheme } from "../Home/hooks/use-routine-theme";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { addErrorLog } from "@/utils/FileLogger";
import { postHogCapture } from "@/utils/Posthog";
import { ScreenNavigationProp } from "@/navigation/AppNavigator";
import {
  fullRoutineDataSelector,
  cutOffTimeSelector,
  shutDownTimeSelector,
  startUpTimeSelector,
} from "@/selectors/RoutineSelectors";
import { store } from "@/store";
import { putUserSettings } from "@/actions/UserActions";
import { getSplitDateTime } from "@/utils/TimeMethods";
import { validateRoutineSchedule } from "@/utils/scheduleValidation";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";

const toHHMM = (d: Date) => `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

export const EditTiming = ({ navigation }: { navigation: ScreenNavigationProp }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const state = store.getState();
  const { color: morningColor } = useRoutineTheme("morning");
  const { color: eveningColor } = useRoutineTheme("evening");

  const [startupTime, setStartupTime] = useState<string>(startUpTimeSelector(state));
  const [shutdownTime, setShutdownTime] = useState<string>(shutDownTimeSelector(state));
  const [cutoffTime, setCutoffTime] = useState<string>(cutOffTimeSelector(state));

  const validation = validateRoutineSchedule(t, startupTime, shutdownTime, cutoffTime);
  const saveDisabled = Object.values(validation).some(Boolean);

  const [isLoading, setIsLoading] = useState(false);

  const onPressSave = async () => {
    setIsLoading(true);
    const fullRoutineData = fullRoutineDataSelector(store.getState());

    const updatedRoutineData = {
      ...fullRoutineData,
      startup_time: startupTime,
      shutdown_time: shutdownTime,
      cutoff_time_for_non_high_priority_activities: cutoffTime,
    };

    try {
      await dispatch(putUserSettings(updatedRoutineData));
      postHogCapture(POSTHOG_EVENT_NAMES.ROUTINE_EDIT_TIMING);

      navigation.goBack();
    } catch (error) {
      addErrorLog("Error saving routine", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <BigHeaderScrollView title={t("editRoutine.editTiming")} contentContainerStyle={[styles.container, styles.gap24]}>
        <View style={styles.gap12}>
          <TimePickerMenuItem
            big
            time={getSplitDateTime(startupTime)}
            setTime={(time) => setStartupTime(toHHMM(time))}
            title={t("editRoutine.morningTime")}
            description={t("editRoutine.wakeUp")}
            icon="sunny"
            iconColor={morningColor}
            modalTitle={t("editRoutine.morningRoutineStartTime")}
            errorMessage={validation.startup}
            testID="test:id/morning-time"
          />

          <TimePickerMenuItem
            big
            time={getSplitDateTime(shutdownTime)}
            setTime={(time) => setShutdownTime(toHHMM(time))}
            title={t("editRoutine.eveningTime")}
            description={t("editRoutine.finishWork")}
            icon="moon"
            iconColor={eveningColor}
            modalTitle={t("editRoutine.eveningRoutineStartTime")}
            errorMessage={validation.shutdown}
            testID="test:id/evening-time"
          />

          <TimePickerMenuItem
            big
            time={getSplitDateTime(cutoffTime)}
            setTime={(time) => setCutoffTime(toHHMM(time))}
            title={t("editRoutine.techCurfew")}
            description={t("editRoutine.timeToSleep")}
            icon="bed"
            iconColor={colors.subText}
            modalTitle={t("editRoutine.techCurfew")}
            errorMessage={validation.cutoff}
            testID="test:id/cutoff-time"
          />
        </View>
      </BigHeaderScrollView>

      {/* Save button */}
      <FloatingButton
        primary
        title={t("common.save")}
        renderLeftIcon={<Checkmark value={true} color={saveDisabled ? colors.text : colors.white} />}
        onPress={onPressSave}
        isLoading={isLoading}
        disabled={saveDisabled}
        testID="test:id/confirm-edit-timing"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap12: { gap: 12 },
  gap24: { gap: 24 },
  container: {
    padding: 16,
  },
});
