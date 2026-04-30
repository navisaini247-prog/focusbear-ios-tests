import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "@react-navigation/native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSelector } from "@/reducers";
import Icon from "react-native-vector-icons/Ionicons";
import { NAVIGATION } from "@/constants";
import COLOR, { FONTFAMILY } from "@/constants/color";
import { useTranslation } from "react-i18next";
import { hideFocusModeToolTipSelector } from "@/reducers/FocusModeReducer";
import { isBeforeMethod } from "@/utils/TimeMethods";
import { FocusMode, Home, Settings, Stats } from "@/screens";
import { withAfterAnimation } from "@/hooks/with-after-animation";
import { Dot } from "@/components/Dot";
import { DisplaySmallText } from "@/components";
import { emailVerifiedSelector } from "@/selectors/UserSelectors";
import { useHomeContext } from "@/screens/Home/context";
import { useUpdateBlockUrl } from "@/hooks/use-update-block-url";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { useLauncherContext } from "@/navigation/AppLauncher/context";
import { useIsGuestAccount } from "@/hooks/useIsGuestAccount";
import { OpenAppMenuButton } from "@/navigation/AppLauncher/components/OpenAppMenuButton/OpenAppMenuButton";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";

const ICONS = {
  [NAVIGATION.Home]: "home",
  [NAVIGATION.Focus]: "eye",
  [NAVIGATION.Stats]: "stats-chart",
  [NAVIGATION.Launcher]: "apps",
  [NAVIGATION.SettingsScreen]: "settings",
};

const Tab = createBottomTabNavigator();

const styles = StyleSheet.create({
  square: {
    width: 10,
    height: 10,
    backgroundColor: COLOR.ALTERNATIVE_ACTION,
    position: "absolute",
    left: 7,
    bottom: -4,
    transform: [{ rotate: "45deg" }],
  },
  tooltip: {
    height: 30,
    width: 220,
    backgroundColor: COLOR.ALTERNATIVE_ACTION,
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    bottom: 25,
  },
  textStyle: {
    fontSize: 10,
    fontFamily: FONTFAMILY.FENWICK,
  },
  labelStyle: { fontFamily: FONTFAMILY.FENWICK },
  dot: {
    position: "absolute",
    left: -2,
    top: -2,
  },
});

const FocusModeTooltip = () => {
  const { t } = useTranslation();
  const hideFocusModeToolTip = useSelector(hideFocusModeToolTipSelector);
  const currentFocusModeFinishTime = useSelector((state) => state?.user?.current_focus_mode_finish_time);

  const shouldShowFocusSessionRunningToolTip =
    !hideFocusModeToolTip && currentFocusModeFinishTime && isBeforeMethod(new Date(), currentFocusModeFinishTime);

  if (!shouldShowFocusSessionRunningToolTip) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.tooltip}>
      <DisplaySmallText style={styles.textStyle} allowFontScaling={false}>
        {t("focusMode.runningFocusModeDesc")}
      </DisplaySmallText>
      <View style={styles.square} />
    </View>
  );
};

const MemoizedTabIcon = ({ routeName, color, focused }) => {
  const emailVerified = useSelector(emailVerifiedSelector);
  const isGuestAccount = useIsGuestAccount();
  const { showBlockedAppsWarning, allBlockingPermissionsGranted } = useHomeContext();

  const iconName = ICONS[routeName] + (focused ? "" : "-outline");
  const shouldShowDot =
    routeName === NAVIGATION.SettingsScreen &&
    ((!emailVerified && !isGuestAccount) || showBlockedAppsWarning || !allBlockingPermissionsGranted);

  return (
    <View>
      {routeName === NAVIGATION.Focus && <FocusModeTooltip />}
      <Icon color={color} name={iconName} size={22} />
      {shouldShowDot && <Dot style={styles.dot} />}
    </View>
  );
};

const TabIcon = React.memo(MemoizedTabIcon);

export const TabNavigator = withAfterAnimation(() => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isFocusBearDefaultLauncher, setOpenAppMenu } = (useLauncherContext() as any) || {};
  useUpdateBlockUrl();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarLabelStyle: styles.labelStyle,
        tabBarLabelAllowFontScaling: false,
        tabBarIcon: ({ color, focused }) => <TabIcon routeName={route.name} color={color} focused={focused} />,
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subText,
        tabBarStyle: {
          display: "flex",
          borderColor: colors.separator,
          borderTopWidth: 1,
          elevation: 0,
        },
      })}
    >
      <Tab.Screen
        name={NAVIGATION.Home}
        options={{ title: t("home.title"), tabBarButtonTestID: "test:id/home-tab" }}
        component={Home}
        listeners={{ tabPress: () => postHogCapture(POSTHOG_EVENT_NAMES.BOTTOM_NAV_OVERVIEW) }}
      />
      <Tab.Screen
        name={NAVIGATION.Focus}
        options={{ title: t("focus.title"), tabBarButtonTestID: "test:id/focus-tab" }}
        component={FocusMode}
        listeners={{ tabPress: () => postHogCapture(POSTHOG_EVENT_NAMES.BOTTOM_NAV_FOCUS) }}
      />
      <Tab.Screen
        name={NAVIGATION.Stats}
        options={{ title: t("stats.title"), tabBarButtonTestID: "test:id/stats-tab" }}
        component={Stats}
        listeners={{ tabPress: () => postHogCapture(POSTHOG_EVENT_NAMES.BOTTOM_NAV_STATS) }}
      />
      {checkIsAndroid() && isFocusBearDefaultLauncher && (
        <Tab.Screen
          name={NAVIGATION.Launcher}
          options={{ title: t("launcher.title"), tabBarButtonTestID: "test:id/launcher-tab" }}
          component={OpenAppMenuButton}
          listeners={{
            tabPress: (e: any) => {
              postHogCapture(POSTHOG_EVENT_NAMES.BOTTOM_NAV_LAUNCHER);
              e.preventDefault();
              setOpenAppMenu(true);
            },
          }}
        />
      )}
      <Tab.Screen
        name={NAVIGATION.SettingsScreen}
        options={{ title: t("settings.title"), tabBarButtonTestID: "test:id/settings-tab" }}
        component={Settings}
        listeners={{ tabPress: () => postHogCapture(POSTHOG_EVENT_NAMES.BOTTOM_NAV_SETTINGS) }}
      />
    </Tab.Navigator>
  );
});
