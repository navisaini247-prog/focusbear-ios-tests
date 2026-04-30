import React, { memo, useMemo } from "react";
import { View, StyleSheet, FlatList, Image } from "react-native";
import {
  BodyMediumText,
  BodySmallText,
  SheetModal,
  ModalHeader,
  PressableWithFeedback,
  ScalableIcon,
} from "@/components";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import useFetchInstalledApps from "@/hooks/use-fetch-installed-apps";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { LauncherKit } from "@/nativeModule";
import { useFontScale } from "@/hooks/use-font-scale";

interface AllowedAppsModalProps {
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
  allowedApps: string[];
}

type InstalledApp = {
  packageName: string;
  appName: string;
  icon?: string;
};

export const AllowedAppsModal = memo(function AllowedAppsModal({
  isVisible,
  setIsVisible,
  allowedApps,
}: AllowedAppsModalProps) {
  const { t } = useTranslation();
  const { installedApps, isFetchingApps, refetchApps } = useFetchInstalledApps(false);

  const filteredApps = useMemo(() => {
    if (!installedApps || !allowedApps) return [];
    return installedApps.filter((app) => allowedApps.includes(app.packageName));
  }, [installedApps, allowedApps]);

  const launchApp = (packageName: string) => {
    if (checkIsAndroid()) {
      LauncherKit.launchApplication(packageName);
    }
  };

  return (
    <SheetModal
      isVisible={isVisible}
      onCancel={() => setIsVisible(false)}
      style={styles.modal}
      HeaderComponent={<ModalHeader title={t("habitSetting.openAllowedApps")} />}
      CustomScrollView={
        <FlatList
          refreshing={isFetchingApps}
          onRefresh={refetchApps}
          data={filteredApps}
          renderItem={({ item }) => <AppItem app={item} onLaunch={launchApp} />}
          ListEmptyComponent={!isFetchingApps && <ListEmptyComponent />}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          keyExtractor={(item) => item.packageName}
        />
      }
    />
  );
});

interface AppItemProps {
  app: InstalledApp;
  onLaunch: (packageName: string) => void;
}

const AppItem = memo(function AppItem({ app, onLaunch }: AppItemProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isLargeFontScale, scaleSize } = useFontScale();
  const iconSize = scaleSize(48);

  return (
    <PressableWithFeedback
      style={[styles.row, styles.gap12, styles.appItem]}
      onPress={() => onLaunch(app.packageName)}
      testID={`allowed-app-${app.packageName}`}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.secondary, width: iconSize, height: iconSize }]}>
        {app.icon ? (
          <Image source={{ uri: app.icon }} style={{ width: iconSize, height: iconSize }} />
        ) : (
          <View style={[{ width: iconSize, height: iconSize }, styles.iconPlaceholder]}>
            <ScalableIcon name="cube-outline" size={28} color={colors.subText} />
          </View>
        )}
      </View>

      <View style={[styles.flex, styles.gap4]}>
        <BodyMediumText color={colors.text} numberOfLines={isLargeFontScale ? 2 : 1}>
          {app.appName}
        </BodyMediumText>
      </View>

      <View style={[styles.launchButton, { backgroundColor: colors.primary }]}>
        <BodySmallText color={colors.white}>{t("habitSetting.launchApp")}</BodySmallText>
      </View>
    </PressableWithFeedback>
  );
});

const ListEmptyComponent = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.emptyContainer}>
      <BodyMediumText color={colors.subText} center>
        {t("habitSetting.noAppsSelected")}
      </BodyMediumText>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap4: { gap: 4 },
  gap12: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  modal: {
    height: 400,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 12,
    gap: 8,
  },
  appItem: {
    padding: 12,
    marginHorizontal: 12,
    borderRadius: 8,
  },
  iconContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  iconPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  launchButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
});
