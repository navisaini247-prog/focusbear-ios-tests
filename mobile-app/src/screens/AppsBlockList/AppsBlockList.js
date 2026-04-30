import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ScrollView, SectionList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ConfirmationButton, SmallButton, TextField, BodySmallText, BodyMediumText, Group } from "@/components";
import { MenuItem, MenuItemFlatlist, Separator, Checkbox, SheetModal, FullPageLoading, AppHeader } from "@/components";
import { PressableWithFeedback, Card } from "@/components";
import ButtonWithTooltipModal from "@/components/ButtonWithToolTipModal";
import AppFlatListItem from "@/components/AppFlatListItem";
import Icon from "react-native-vector-icons/Ionicons";
import { postUserLocalDeviceSettings } from "@/actions/UserActions";
import { NAVIGATION } from "@/constants";
import { BLOCKLIST_APP_CATEGORY, CATEGORY_TO_FILTER_GROUP } from "@/types/appsBlocklist";
import { getAppQuality, getAppCategory } from "@/utils/AppQualityUtils";
import { AppQuality } from "@/types/AppUsage.types";
import useFetchInstalledApps from "@/hooks/use-fetch-installed-apps";
import { useTranslation } from "react-i18next";
import { styles } from "@/screens/AppsBlockList/AppsBlockList.styles";
import { userSelector, restrictedAppsListTypeSelector } from "@/selectors/UserSelectors";
import {
  saveBlockedAppsPreference,
  saveAllowedAppsPreference,
  saveRestrictedAppsListTypeToAndroid,
} from "@/utils/NativeModuleMethods";
import { useRoute, useTheme } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { showFreemiumAlert, checkIsAppLimitExceeded } from "@/hooks/use-is-freemium";
import { RESTRICTED_APPS_LIST_TYPE } from "@/utils/Enums";
import { addErrorLog } from "@/utils/FileLogger";
import { withDelayRender } from "@/hooks/with-after-animation";
import Toast from "react-native-toast-message";
import { useFontScale } from "@/hooks/use-font-scale";

const { BLOCK_LIST, ALLOW_LIST } = RESTRICTED_APPS_LIST_TYPE;

const RECOMMENDED_APPS_KEY = "recommendedApps";
const OTHER_APPS_KEY = "otherApps";

const isAppDistracting = (app) => {
  const quality = getAppQuality(app.packageName, app.category);
  return quality <= AppQuality.SLIGHTLY_DISTRACTING;
};

const isRecommendedToBlock = (app) => isAppDistracting(app);

// This is the app blocklist screen for Android
export const AppsBlockList = withDelayRender(() => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isLargeFontScale } = useFontScale();
  const navigation = useNavigation();
  const route = useRoute();

  const fromInduction = route.params?.fromInduction;
  const { installedApps, refetchApps, isFetchingApps } = useFetchInstalledApps(fromInduction);

  const { userLocalDeviceSettingsData } = useSelector(userSelector);
  const prevListType = useSelector(restrictedAppsListTypeSelector) || BLOCK_LIST;
  const prevBlockedApps = userLocalDeviceSettingsData?.Android?.always_blocked_apps || [];
  const prevAllowedApps = userLocalDeviceSettingsData?.Android?.always_allowed_apps || [];

  const { isBlockingSchedule, selectedApps: scheduleSelectedApps } = route?.params || {};

  const { isHabitAllowedApps, selectedApps: habitSelectedApps, onSave: habitOnSave } = route?.params || {};

  const getInitialSelectedApps = () => {
    if (isHabitAllowedApps) {
      return habitSelectedApps || [];
    }
    if (isBlockingSchedule) {
      return scheduleSelectedApps.map((app) => app.packageName);
    }
    return prevListType === BLOCK_LIST ? prevBlockedApps : prevAllowedApps;
  };

  const [selectedListType, setSelectedListType] = useState(
    isBlockingSchedule ? BLOCK_LIST : isHabitAllowedApps ? ALLOW_LIST : prevListType,
  );

  const [selectedApps, setSelectedApps] = useState(getInitialSelectedApps);
  const initialSelectedApps = useRef(selectedApps).current;

  const [searchText, setSearchText] = useState("");
  const [selectedChip, setSelectedChip] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isBlockingTypeModalVisible, setIsBlockingTypeModalVisible] = useState(false);

  const installedAppCount = installedApps.length;
  const selectedAppCount = selectedApps.length;

  const FILTER_CHIPS = {
    [BLOCKLIST_APP_CATEGORY.SOCIAL]: t("blocking.socialFilterTitle"),
    [BLOCKLIST_APP_CATEGORY.GAME]: t("blocking.gamesFilterTitle"),
    [BLOCKLIST_APP_CATEGORY.NEWS]: t("blocking.newsFilterTitle"),
    // [BLOCKLIST_APP_CATEGORY.MISC]: t("blocking.miscFilterTitle"),
  };

  const getAppFilterGroup = (app) => {
    const category = getAppCategory(app.packageName, app.category);
    if (!category) return null;
    return CATEGORY_TO_FILTER_GROUP[category.toUpperCase()] || null;
  };

  // Deselect apps that are not installed
  const filterNonexistentApps = (prev) => {
    if (installedApps.length === 0) return prev;

    const installedAppPackageNames = installedApps.map((app) => app.packageName);
    return prev.filter((app) => installedAppPackageNames.includes(app));
  };

  useEffect(() => {
    setSelectedApps(filterNonexistentApps);
  }, [installedApps]);

  useEffect(() => {
    if (fromInduction && installedApps.length > 0) {
      const distractingApps = installedApps.filter((app) => isRecommendedToBlock(app)).map((app) => app.packageName);
      setSelectedApps(distractingApps);
    }
  }, [fromInduction, installedApps]);

  // Sort selected apps to be first, then sort by usage time
  const sortedAppList = useMemo(() => {
    return [...installedApps].sort((a, b) => {
      const aBlocked = initialSelectedApps.includes(a?.packageName);
      const bBlocked = initialSelectedApps.includes(b?.packageName);
      const aUsageTime = parseInt(a?.usageTime || -1, 10);
      const bUsageTime = parseInt(b?.usageTime || -1, 10);

      if (aBlocked !== bBlocked) {
        return aBlocked ? -1 : 1;
      }
      return bUsageTime - aUsageTime;
    });
  }, [installedApps]);

  const checkLimitAndShowAlert = (appCount) => {
    const isLimitExceeded = checkIsAppLimitExceeded(appCount);
    isLimitExceeded && showFreemiumAlert(t("blocking.freeAppLimitTitle"), t("blocking.freeAppLimitDesc"), navigation);
    return isLimitExceeded;
  };

  // Toggle a single app. Dev note: this function is memoized because it's passed to every item in the list
  const toggleApp = useCallback((app) => {
    setSelectedApps((prev) => {
      if (prev.includes(app)) {
        return prev.filter((item) => item !== app);
      } else {
        const exceedsLimit = checkLimitAndShowAlert(prev.length + 1);
        return exceedsLimit ? prev : [...prev, app];
      }
    });
  }, []);

  // Select/deselect all apps in the filtered list
  const selectAll = () => {
    setSelectedApps((prev) => {
      const newApps = filteredPackageNames.filter((app) => !prev.includes(app));
      const exceedsLimit = checkLimitAndShowAlert(prev.length + newApps.length);
      return exceedsLimit ? prev : [...prev, ...newApps];
    });
  };

  const deselectAll = () => {
    setSelectedApps((prev) => prev.filter((app) => !filteredPackageNames.includes(app)));
  };

  const onComplete = async () => {
    // Final check for freemium limit.
    // This will only triggered if the user could cross the UI to select more than 5 apps
    if (checkLimitAndShowAlert(selectedApps.length)) {
      return;
    }

    setIsSaving(true);
    try {
      // Habit allowed apps mode: call onSave callback and go back
      if (isHabitAllowedApps) {
        if (habitOnSave) {
          habitOnSave(selectedApps);
        }
        navigation.goBack();
        return;
      }

      if (isBlockingSchedule) {
        // Per-schedule save with metadata (packageName, appName, icon)
        const selection = installedApps
          .filter((app) => selectedApps.includes(app.packageName))
          .map(({ packageName, appName, icon }) => ({ packageName, appName, icon }))
          .slice(0, 100); // hard cap
        navigation.popTo(NAVIGATION.BlockingSchedule, { selectedApps: selection });
        return;
      }

      const params = {
        [selectedListType === BLOCK_LIST ? "always_blocked_apps" : "always_allowed_apps"]: selectedApps,
        app_restriction_type: selectedListType,
      };

      selectedListType === BLOCK_LIST
        ? saveBlockedAppsPreference(selectedApps)
        : saveAllowedAppsPreference(selectedApps);
      saveRestrictedAppsListTypeToAndroid(selectedListType);

      await dispatch(postUserLocalDeviceSettings(params));

      Toast.show({ type: "success", text1: t("blocking.Success"), text2: t("blocking.saveSuccess") });

      if (fromInduction) {
        navigation.replace(NAVIGATION.SimpleHome);
      } else {
        navigation.goBack();
      }
    } catch (error) {
      addErrorLog("Error saving apps block list:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter apps by search/filter chips
  const filteredAppList = useMemo(() => {
    return sortedAppList?.filter((app) => {
      const matchesSearch = searchText ? app?.appName?.toLowerCase().includes(searchText.toLowerCase()) : true;
      const matchesFilter = selectedChip === null || getAppFilterGroup(app) === selectedChip;
      return matchesSearch && matchesFilter;
    });
  }, [sortedAppList, searchText, selectedChip]);

  const filteredPackageNames = useMemo(() => filteredAppList.map((app) => app.packageName), [filteredAppList]);

  const areAllFilteredAppsSelected =
    selectedAppCount === installedAppCount || !filteredPackageNames.some((app) => !selectedApps.includes(app));

  // Group apps into recommended/distracting and other categories
  // Uses new categorization system combined with hardcoded recommended apps
  const groupedAppList = useMemo(() => {
    const grouped = filteredAppList.reduce(
      (acc, app) => {
        acc[isRecommendedToBlock(app) ? RECOMMENDED_APPS_KEY : OTHER_APPS_KEY].push(app);
        return acc;
      },
      { [RECOMMENDED_APPS_KEY]: [], [OTHER_APPS_KEY]: [] },
    );

    grouped[RECOMMENDED_APPS_KEY].sort((a, b) => {
      const aQuality = getAppQuality(a.packageName, a.category);
      const bQuality = getAppQuality(b.packageName, b.category);
      return aQuality - bQuality; // Lower quality = more distracting, so sort ascending
    });

    return grouped;
  }, [filteredAppList]);

  // Define sections for the app list <SectionList>
  const appListSections = useMemo(() => {
    if (selectedListType === BLOCK_LIST) {
      return [
        { title: t("blocking.recommendedSectionListTitle"), data: groupedAppList[RECOMMENDED_APPS_KEY] },
        { title: t("blocking.otherSectionListTitle"), data: groupedAppList[OTHER_APPS_KEY] },
      ];
    } else {
      // Just exclude the section titles, changing the structure causes lag
      return [{ data: groupedAppList[RECOMMENDED_APPS_KEY] }, { data: groupedAppList[OTHER_APPS_KEY] }];
    }
  }, [groupedAppList, selectedListType, t]);

  // Blocking type menu modal
  const blockingTypeMenuItems = [
    {
      title: t("blocking.blockList"),
      isSelected: selectedListType === BLOCK_LIST,
      onPress: () => {
        setSelectedListType(BLOCK_LIST);
        setSelectedApps(filterNonexistentApps(prevBlockedApps));
        setIsBlockingTypeModalVisible(false);
      },
      description: t("blocking.blockListDescription"),
      testID: "test:id/block-list-option",
    },
    {
      title: t("blocking.allowList"),
      isSelected: selectedListType === ALLOW_LIST,
      onPress: () => {
        setSelectedListType(ALLOW_LIST);
        setSelectedApps(filterNonexistentApps(prevAllowedApps));
        setIsBlockingTypeModalVisible(false);
      },
      description: t("blocking.allowListDescription"),
      testID: "test:id/allow-list-option",
    },
  ];

  return (
    <SafeAreaView edges={fromInduction ? ["top"] : []} style={styles.flex}>
      {!fromInduction && (
        <AppHeader
          title={
            isHabitAllowedApps
              ? t("habitSetting.allowedApps")
              : selectedListType === BLOCK_LIST
                ? t("blocking.appBlockList")
                : t("blocking.appAllowList")
          }
          rightContent={
            !isHabitAllowedApps && (
              <ButtonWithTooltipModal
                modalTitle={selectedListType === BLOCK_LIST ? t("blocking.appBlockList") : t("blocking.appAllowList")}
                modalDescription={
                  selectedListType === BLOCK_LIST
                    ? t("home.manageAlwaysBlockedAppsDesc")
                    : t("home.manageAlwaysAllowedAppsDesc")
                }
              />
            )
          }
          secondaryRowContent={
            <>
              <View style={styles.searchContainer}>
                {/* Search bar */}
                <TextField
                  small
                  type="search"
                  placeholder={t("manageAllowedApps.searchPlaceholder")}
                  onChangeText={setSearchText}
                  value={searchText}
                  clearable
                  testID="test:id/app-search-box"
                />
              </View>

              <Card noPadding style={styles.horizontalBar}>
                {/* Select all checkbox + selection count */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                  <PressableWithFeedback
                    style={styles.selectToggleButton}
                    onPress={() => (areAllFilteredAppsSelected ? deselectAll() : selectAll())}
                    testID="test:id/select-all-pressable"
                  >
                    <Checkbox
                      small
                      value={installedAppCount > 0 && areAllFilteredAppsSelected}
                      indeterminate={selectedAppCount > 0 && !areAllFilteredAppsSelected}
                      testID="test:id/select-all-checkbox"
                    />
                    <View style={styles.selectedCountContainer}>
                      <BodySmallText>{selectedAppCount}</BodySmallText>
                    </View>
                    <BodySmallText>{` ${t("common.selected")}`}</BodySmallText>
                  </PressableWithFeedback>

                  <Separator vertical />

                  {/* Filter chips */}
                  {!selectedChip ? (
                    <View style={styles.filterChipsContainer}>
                      {Object.keys(FILTER_CHIPS).map((chip, index) => (
                        <SmallButton
                          subtle
                          key={index}
                          title={FILTER_CHIPS[chip]}
                          onPress={() => setSelectedChip(chip)}
                          testID={`test:id/filter-chip-${chip}`}
                        />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.filterChipsContainer}>
                      <SmallButton
                        primary
                        renderRightIcon={<Icon name="close" size={16} color={colors.white} />}
                        title={FILTER_CHIPS[selectedChip]}
                        onPress={() => setSelectedChip(null)}
                        testID="test:id/clear-selected-chip"
                      />
                    </View>
                  )}
                </ScrollView>
              </Card>
            </>
          }
        />
      )}

      {/* App list */}
      {filteredAppList.length > 0 ? (
        <SectionList
          refreshing={isFetchingApps}
          onRefresh={refetchApps}
          sections={appListSections}
          style={styles.flex}
          renderSectionHeader={({ section: { title, data } }) =>
            data.length > 0 && title && <BodySmallText style={styles.sectionListHeader}>{title}</BodySmallText>
          }
          keyExtractor={(item) => item.packageName}
          renderItem={({ item }) => (
            <AppFlatListItem {...item} onPress={toggleApp} isBlocked={selectedApps.includes(item.packageName)} />
          )}
        />
      ) : (
        <View style={[styles.flex, styles.emptyContainer]}>
          {!isFetchingApps && <BodyMediumText center>{t("launcher.noAppsFound")}</BodyMediumText>}
        </View>
      )}

      <Group>
        {/* Blocking type options - hidden when editing a schedule or habit allowed apps */}
        {!isBlockingSchedule && !isHabitAllowedApps && (
          <MenuItem
            title={t("blocking.blockingType")}
            subtitle={selectedListType === BLOCK_LIST ? t("blocking.blockList") : t("blocking.allowList")}
            onPress={() => setIsBlockingTypeModalVisible(true)}
            style={styles.horizontalBar}
            testID="test:id/blocking-type-options"
          />
        )}
        {/* Confirmation button */}
        <ConfirmationButton
          confirmTestID="test:id/save-managed-apps"
          cancelTestID="test:id/cancel-managed-apps"
          onConfirm={onComplete}
          confirmTitle={t("common.save_changes")}
          onCancel={() => navigation.goBack()}
          isLoading={isSaving}
        />
      </Group>

      <FullPageLoading show={isFetchingApps && installedAppCount === 0} />

      {/* Blocking type modal */}
      <SheetModal isVisible={isBlockingTypeModalVisible} onCancel={() => setIsBlockingTypeModalVisible(false)}>
        <MenuItemFlatlist
          type="radio"
          style={styles.modalContentContainer}
          data={blockingTypeMenuItems}
          isLargeFontScale={isLargeFontScale}
        />
      </SheetModal>
    </SafeAreaView>
  );
});
