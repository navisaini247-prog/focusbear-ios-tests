import React from "react";
import { StyleSheet, View } from "react-native";
import { RoutineDetailContextProvider, useRoutineDetailContext } from "./context/context";
import { useTranslation } from "react-i18next";
import { WATCH_ACTIVITY } from "@/utils/Enums";
import { useWatchListener } from "@/hooks/use-watch-listener";
import { HabitHeader } from "./components/HabitHeader";
import { CompletionRequirements } from "./components/CompletionRequirements";
import TimerComponent from "./components/TimerComponent";
import ActivityTabs from "./components/ActivityTabs";

const RoutineDetail = () => {
  return (
    <RoutineDetailContextProvider>
      <RoutineDetailScreen />
    </RoutineDetailContextProvider>
  );
};

const RoutineDetailScreen = () => {
  const {
    activityInfo: { completionRequirements },
    setPlaying,
  } = useRoutineDetailContext();
  const { t } = useTranslation();

  const iosListenerCallback = (message) => {
    setPlaying(message?.sendDataToRN !== t("home.pause"));
  };

  const androidListenerCallback = (value) => {
    setPlaying(value[WATCH_ACTIVITY?.MESSAGE] !== t("home.pause"));
  };

  useWatchListener({
    androidListenerCallback,
    iosListenerCallback,
  });

  return (
    <View style={styles.flex}>
      <HabitHeader />
      <ActivityTabs />
      {completionRequirements ? <CompletionRequirements /> : <TimerComponent />}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

export default RoutineDetail;
