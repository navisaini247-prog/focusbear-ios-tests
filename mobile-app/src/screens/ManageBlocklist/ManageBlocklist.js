import { useTheme } from "@react-navigation/native";
import React, { useEffect } from "react";
import { StyleSheet, Alert, View } from "react-native";
import { MenuItemFlatlist, Card, PermissionWarningInfoTile, BigHeaderScrollView } from "@/components";
import { useTranslation } from "react-i18next";
import { i18n } from "@/localization";
import { ControlFunction, getBlockedAppsCountFromIOS } from "@/utils/NativeModuleMethods";
import { checkIsIOS } from "@/utils/PlatformMethods";
import { useDispatch } from "react-redux";
import { setBlockedAppsCountFromIOS } from "@/actions/GlobalActions";

const confirmClearBlockedUrlsPopup = () => {
  Alert.alert(i18n.t("settings.confirmClearBlockedUrls"), "", [
    {
      text: i18n.t("common.cancel"),
      style: "cancel",
    },
    {
      text: i18n.t("common.confirm"),
      onPress: () => ControlFunction.clearBlockList(),
    },
  ]);
};

// This is the app blocklist screen for iOS
export function ManageBlocklist() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = customStyles(colors);
  const dispatch = useDispatch();

  const iOSMenu = [
    {
      title: t("settings.addUrls"),
      onPress: () => ControlFunction.selectApps(),
    },
    {
      title: t("settings.clearBlockedUrls"),
      onPress: confirmClearBlockedUrlsPopup,
    },
  ];

  useEffect(() => {
    const fetchBlockedAppsCount = async () => {
      if (checkIsIOS()) {
        const blockedAppsCountData = await getBlockedAppsCountFromIOS();
        dispatch(setBlockedAppsCountFromIOS(blockedAppsCountData));
      }
    };

    return () => {
      fetchBlockedAppsCount();
    };
  }, []);

  return (
    checkIsIOS() && (
      <View style={styles.container}>
        <BigHeaderScrollView title={t("blockUrl.title")} contentContainerStyle={styles.scrollContent}>
          <Card style={styles.infoCard}>
            <PermissionWarningInfoTile
              type="info"
              title={t("settings.urlBlockingHowToTitle")}
              description={t("settings.urlBlockingHowToMessage")}
            />
          </Card>
          <Card style={styles.infoCard}>
            <PermissionWarningInfoTile
              type="warning"
              title={t("settings.urlBlockingWarningTitle")}
              description={t("settings.urlBlockingWarningMessage")}
            />
          </Card>
          <MenuItemFlatlist data={iOSMenu} style={styles.menuItem} />
        </BigHeaderScrollView>
      </View>
    )
  );
}

const customStyles = (colors) => {
  const styles = StyleSheet.create({
    menuItem: {
      paddingHorizontal: 12,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 24,
    },
    infoCard: {
      marginHorizontal: 12,
      marginTop: 12,
      marginBottom: 8,
    },
  });
  return styles;
};
