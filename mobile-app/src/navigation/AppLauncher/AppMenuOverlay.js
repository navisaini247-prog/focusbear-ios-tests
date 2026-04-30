import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  DeviceEventEmitter,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { useLauncherContext } from "./context";
import { AppItem } from "./components/AppItem/AppItem";
import { BackButton } from "@/components/AppHeader";
import { useTranslation } from "react-i18next";
import { checkIsAndroid, checkIsIOS } from "@/utils/PlatformMethods";
import useBackHandler from "@/hooks/use-back-handler";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { addInfoLog } from "@/utils/FileLogger";
import { LauncherAppLabel, SetLabelModal } from "./components/SetLabelModal/SetLabelModal";
import { lastTimeLauncherFavouritesChangedSelector, launcherAppLabelSelector } from "@/selectors/GlobalSelectors";
import Icon from "react-native-vector-icons/Octicons";
import { useDependentSelector, useSelector } from "@/reducers";
import { addErrorLog } from "@/utils/FileLogger";
import PropTypes from "prop-types";
import { FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";

const AppMenuOverlay = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    openAppMenu,
    setOpenAppMenu,
    setSearchApp,
    installedApps,
    styles,
    isFocusBearDefaultLauncher,
    searchApp,
    fetchApps,
    handleAppInstalled,
    handleAppRemoved,
    isLoadingApps,
  } = useLauncherContext();

  const lastTimeLauncherChanged = useSelector(lastTimeLauncherFavouritesChangedSelector);
  const launcherAppLabels = useDependentSelector(launcherAppLabelSelector, lastTimeLauncherChanged);

  const [selectedFilter, setSelectedFilter] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleSearchApp = (text) => {
    setSearchApp(text);
  };

  const clearFilter = () => {
    setSelectedFilter(null);
    setSearchApp("");
  };

  useBackHandler(() => {
    if (openAppMenu) {
      setOpenAppMenu(false);
      return true; // Prevents default back action
    }
    return false; // Allows default back behavior
  });

  const filteredApps = useMemo(() => {
    if (checkIsIOS()) {
      return [];
    }

    let apps = [...installedApps];

    // Filter apps by the selected label, if one is active
    if (selectedFilter) {
      apps = apps?.filter((app) => launcherAppLabels?.[app.packageName]?.includes(LauncherAppLabel[selectedFilter]));
    }

    // Sort apps so that labeled apps appear at the top
    return apps.sort((a, b) => {
      const aHasLabel = launcherAppLabels?.[a.packageName]?.length > 0;
      const bHasLabel = launcherAppLabels?.[b.packageName]?.length > 0;

      if (aHasLabel && !bHasLabel) {
        return -1;
      }
      if (!aHasLabel && bHasLabel) {
        return 1;
      }
      // Handle both enhanced format (label) and legacy format (appName)
      const aName = a.label || a.appName || "";
      const bName = b.label || b.appName || "";
      return aName.localeCompare(bName);
    });
  }, [installedApps, launcherAppLabels, selectedFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchApps()
      .catch((error) => {
        addErrorLog("Error occurred during fetching apps:", error);
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [fetchApps]);

  const toggleFilter = (label) => {
    setSelectedFilter((prev) => (prev === label ? null : label)); // Toggle on or off
  };

  // Listen for navigation to BreathingExercise screen to close the launcher overlay
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener("onNavigateToBreathingExercise", () => {
      if (openAppMenu) {
        addInfoLog("Closing launcher overlay because BreathingExercise screen is active");
        setOpenAppMenu(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [openAppMenu, setOpenAppMenu]);

  useEffect(() => {
    if (openAppMenu) {
      addInfoLog("FocusBear launcher is opened");
      postHogCapture(POSTHOG_EVENT_NAMES.LAUNCHER_OPENED);
    }
  }, [openAppMenu]);

  // Listen for app installation and removal events
  useEffect(() => {
    if (!checkIsAndroid() || !isFocusBearDefaultLauncher) {
      return;
    }

    addInfoLog("Setting up app installation/removal listeners in AppMenuOverlay");

    const appInstalledSubscription = DeviceEventEmitter.addListener("onAppInstalled", handleAppInstalled);

    const appRemovedSubscription = DeviceEventEmitter.addListener("onAppRemoved", handleAppRemoved);

    return () => {
      addInfoLog("Cleaning up app installation/removal listeners in AppMenuOverlay");
      appInstalledSubscription.remove();
      appRemovedSubscription.remove();
    };
  }, [handleAppInstalled, handleAppRemoved, isFocusBearDefaultLauncher]);

  return (
    <>
      {openAppMenu && checkIsAndroid() && isFocusBearDefaultLauncher && (
        <>
          <SafeAreaView style={styles.container}>
            <View style={styles.searchBar}>
              <BackButton onPress={() => setOpenAppMenu(false)} />
              <View style={styles.textField}>
                <TextInput
                  placeholderTextColor={colors.subText}
                  placeholder={t("launcher.search")}
                  value={searchApp}
                  style={styles.textInputContainer}
                  onChangeText={(text) => handleSearchApp(text)}
                  testID="test:id/launcher-search-input"
                />
                <TouchableOpacity hitSlop={20} onPress={clearFilter} testID="test:id/launcher-clear-search">
                  <Icon name="x" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
            <LabelFilter selectedFilter={selectedFilter} toggleFilter={toggleFilter} />
            <FlatList
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              data={filteredApps}
              renderItem={({ item }) => <AppItem {...item} key={item.packageName} />}
              style={styles.flatListContainer}
              ListEmptyComponent={<ListEmptyComponent isLoading={isLoadingApps} />}
            />
          </SafeAreaView>
          <SetLabelModal />
        </>
      )}
    </>
  );
};

const ListEmptyComponent = ({ isLoading }) => {
  const { styles } = useLauncherContext();
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.listEmptyContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.listEmptyContainer}>
      <Text style={styles.listEmptyText}>{t("launcher.noAppsFound")}</Text>
    </View>
  );
};

ListEmptyComponent.propTypes = {
  isLoading: PropTypes.bool,
};

const LabelFilter = ({ selectedFilter, toggleFilter }) => {
  const { styles } = useLauncherContext();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();

  return (
    <View>
      <View style={styles.labelFilterContainer}>
        {Object.keys(LauncherAppLabel).map((labelKey) => (
          <TouchableOpacity
            key={labelKey}
            onPress={() => toggleFilter(labelKey)}
            testID={`test:id/launcher-filter-${labelKey.toLowerCase()}`}
            style={[
              styles.labelFilterItemContainer,
              selectedFilter === labelKey ? styles.labelFilterChipSelected : styles.labelFilterChipUnselected,
              { width: screenWidth / 4.5 },
            ]}
          >
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI}
              style={
                selectedFilter === labelKey ? styles.labelFilterChipTextSelected : styles.labelFilterChipTextUnselected
              }
            >
              {t(`launcher.${labelKey.toLowerCase()}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

LabelFilter.propTypes = {
  selectedFilter: PropTypes.string,
  toggleFilter: PropTypes.func.isRequired,
};

export { AppMenuOverlay };
