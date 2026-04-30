import React from "react";
import { View, StyleSheet } from "react-native";
import { AppHeader } from "@/components";
import { useTranslation } from "react-i18next";
import { UserStats } from "./OtherStats/UserStats";
import { checkIsIOS } from "@/utils/PlatformMethods";
import { StatsTabView } from "./components/StatsTabView";

export const Stats = () => {
  const { t } = useTranslation();
  if (checkIsIOS()) {
    return (
      <View style={styles.container}>
        <AppHeader title={t("home.stats")} hideBackButton />
        <UserStats />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatsTabView />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
