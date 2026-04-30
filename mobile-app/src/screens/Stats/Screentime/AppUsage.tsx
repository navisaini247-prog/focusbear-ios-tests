/* eslint-disable react-native/no-unused-styles */
import React, { useState } from "react";
import { StyleSheet, RefreshControl, View, ScrollView } from "react-native";
import { HeadingLargeText, Space } from "@/components";
import { AppUsageProvider, useAppUsage } from "./context/AppUsageContext";
import AppUsageList from "../components/AppUsageList";
import { CircularProgress } from "@/components/CircularProgress";
import AppStats from "../components/Stats";
import HealthStats from "../components/HealthStats";
import { useTranslation } from "react-i18next";
import { useHomeContext } from "../../Home/context";
import { NoPermissionComponent } from "../components/NoPermissionComponent";
import { UsageAfterCutOffModal } from "../components/UsageAfterCutOffModal";
import { AppQualityEditorModal } from "../components/AppQualityEditorModal";
import { AppCategories } from "@/types/AppUsage.types";
import { LoadingScreenWithTexts } from "@/components/LoadingScreenWIthTexts";

const USAGE_LIMIT = 4 * 60 * 60 * 1000;

const AppUsageContent: React.FC = () => {
  const { totalTimeUsed, fetchAppStats, fetchTimeUsedAfterCutoff, isLoading, appsStats } = useAppUsage();
  const { isUsagePermissionGranted } = useHomeContext() as any;
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [editorModalVisible, setEditorModalVisible] = useState(false);
  const [editingApp, setEditingApp] = useState<{
    packageName: string;
    appName: string;
    appIcon?: string;
    category?: AppCategories;
  } | null>(null);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppStats();
    fetchTimeUsedAfterCutoff();
    setRefreshing(false);
  };

  const handleQualityPress = (packageName: string, appName: string, icon?: string, category?: AppCategories) => {
    setEditingApp({ packageName, appName, appIcon: icon, category });
    setEditorModalVisible(true);
  };

  const handleCloseEditorModal = () => {
    setEditorModalVisible(false);
  };

  const hasData = appsStats.length > 0;
  const shouldShowLoading = isUsagePermissionGranted && (isLoading || !hasData);

  const loadingMessages = [
    t("appUsage.loadingMessage.harvesting"),
    t("appUsage.loadingMessage.removingGremlins"),
    t("appUsage.loadingMessage.crunchingFormulas"),
    t("appUsage.loadingMessage.assemblingMetrics"),
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        style={styles.container}
      >
        {!isUsagePermissionGranted && <NoPermissionComponent />}
        {isUsagePermissionGranted && !shouldShowLoading && (
          <>
            <Space height={20} />
            <HeadingLargeText center style={styles.title}>
              {totalTimeUsed <= USAGE_LIMIT ? t("appUsage.doingGreat") : t("appUsage.overLimit")}
            </HeadingLargeText>
            <CircularProgress used={totalTimeUsed} limit={USAGE_LIMIT} />
            <AppStats />
            <HealthStats />
            <AppUsageList onQualityPress={handleQualityPress} />
          </>
        )}
      </ScrollView>
      <LoadingScreenWithTexts
        isLoading={shouldShowLoading}
        loadingMessages={loadingMessages}
        messageInterval={2000}
        messageSize="small"
      />
      <UsageAfterCutOffModal />
      <AppQualityEditorModal
        visible={editorModalVisible}
        onClose={handleCloseEditorModal}
        packageName={editingApp?.packageName ?? null}
        appName={editingApp?.appName ?? null}
        appIcon={editingApp?.appIcon}
        category={editingApp?.category}
      />
    </View>
  );
};

const AppUsage: React.FC = () => {
  return (
    <AppUsageProvider>
      <AppUsageContent />
    </AppUsageProvider>
  );
};

export const styles = StyleSheet.create({
  title: {
    paddingBottom: 16,
  },
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appName: {
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
});

export { AppUsage };
