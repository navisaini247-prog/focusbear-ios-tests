/* eslint-disable react-native/no-inline-styles */
import { FullPageLoading } from "@/components";
import { NAVIGATION } from "@/constants";
import { useSyncUsageStats } from "@/hooks/useSyncUsageStats";
import {
  AccountSettings,
  AppsBlockList,
  AskForHelp,
  BearsonaSettings,
  BlockList,
  BlockUrl,
  CompleteScreen,
  CustomizeBlocking,
  DoNotDisturbSettings,
  FocusMode,
  FrictionSettings,
  HelpScreen,
  LanguageSettings,
  ManageBlocklist,
  PermissionsScreen,
  PrivacyTerms,
  RoutineDetail,
  SearchTodosScreen,
  ShareLogs,
  Subscription,
} from "@/screens";
import BreathingExercise from "@/screens/BreathingExercise/BreathingExercise";
import { HabitSettingScreen } from "@/screens/HabitSettingScreen/HabitSettingScreen";
import LateNoMoreScreen from "@/screens/LateNoMore/LateNoMoreScreen";
import { MotivationalSummary } from "@/screens/MotivationalSummary";
import { GrantPermissionScreen } from "@/screens/OnBoarding/GrantPermissionScreen";
import { PermissionExplanationScreen } from "@/screens/OnBoarding/PermissionExplanationScreen";
import { PushNotificationPermission } from "@/screens/PushNotificationPermission/PushNotificationPermission";
import { VideoTutorials } from "@/screens/VideoTutorials/VideoTutorials";
import { createNativeStackNavigator, NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { TabNavigator } from "./TabNavigator";
import { EditCustomRoutine } from "@/screens/EditRoutine/EditCustomRoutineScreen";
import { EditMorningEveningRoutine } from "@/screens/EditRoutine/EditMorningEveningRoutineScreen";
import { EditTiming } from "@/screens/EditRoutine/EditTimingScreen";
import { EditQuickBreaksScreen } from "@/screens/EditQuickBreaksScreen/EditQuickBreaksScreen";
import { useUnicaesStudyNavigation } from "./hooks/useUnicaesStudyNavigation";
import { BlockingSchedule } from "@/screens/BlockingSchedule/BlockingSchedule";
import { BlockingScheduleList } from "@/screens/BlockingSchedule/BlockingScheduleList";
import { ControlView } from "@/utils/NativeModuleMethods";
import { checkIsIOS } from "@/utils/PlatformMethods";
import { useSelector } from "@/reducers";
import { isPushNotificationAskedStatusSelector } from "@/selectors/GlobalSelectors";

type StackNavigatorProps = Omit<React.ComponentProps<typeof Stack.Navigator>, "initialRouteName" | "screenOptions">;

export type UndefinedValues<T> = {
  [K in keyof T]: undefined;
};

type Merge<T, U> = Omit<T, keyof U> & U;

export type AppNavigatorParams = {
  [K in (typeof NAVIGATION)[keyof typeof NAVIGATION]]: K extends NAVIGATION.SimplifiedSchedule
    ? { isFromAppNavigator?: boolean }
    : undefined;
};

export type MergedAppNavigatorParams = Merge<UndefinedValues<typeof NAVIGATION>, AppNavigatorParams>;

export type ScreenNavigationProp = NativeStackNavigationProp<MergedAppNavigatorParams>;

const Stack = createNativeStackNavigator<MergedAppNavigatorParams>();

const HomePushNotifPermissionWarningScreen = () => <PushNotificationPermission isFromSignin />;

export const AppNavigator = (props: StackNavigatorProps): React.ReactElement => {
  const isPushNotificationPermissionAsked = useSelector(isPushNotificationAskedStatusSelector);

  useSyncUsageStats();
  const { isLoading } = useUnicaesStudyNavigation();

  const initialRoute = !isPushNotificationPermissionAsked ? NAVIGATION.PushNotificationScreen : NAVIGATION.TabNavigator;

  return (
    <>
      <Stack.Navigator
        {...props}
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name={NAVIGATION.BlockingScheduleList} component={BlockingScheduleList} />
        <Stack.Screen name={NAVIGATION.BlockingSchedule} component={BlockingSchedule} />
        <Stack.Screen name={NAVIGATION.TabNavigator} component={TabNavigator} />
        <Stack.Screen name={NAVIGATION.NonTabFocus} component={FocusMode} />
        <Stack.Screen name={NAVIGATION.ShareLogs} component={ShareLogs} />
        <Stack.Screen name={NAVIGATION.VideoTutorials} component={VideoTutorials} />
        <Stack.Screen name={NAVIGATION.PushNotificationScreen} component={HomePushNotifPermissionWarningScreen} />
        <Stack.Screen name={NAVIGATION.RoutineDetail} component={RoutineDetail} />
        <Stack.Screen name={NAVIGATION.CompleteScreen} component={CompleteScreen} />
        <Stack.Screen name={NAVIGATION.MotivationalSummary} component={MotivationalSummary} />
        <Stack.Screen name={NAVIGATION.HabitSetting} component={HabitSettingScreen} />
        <Stack.Screen name={NAVIGATION.EditCustomRoutine} component={EditCustomRoutine} />
        <Stack.Screen name={NAVIGATION.EditMorningEveningRoutine} component={EditMorningEveningRoutine} />
        <Stack.Screen name={NAVIGATION.EditTiming} component={EditTiming} />
        <Stack.Screen name={NAVIGATION.EditQuickBreaksScreen} component={EditQuickBreaksScreen} />
        <Stack.Screen name={NAVIGATION.ManageBlocklist} component={ManageBlocklist} />
        <Stack.Screen name={NAVIGATION.Subscription} component={Subscription} />
        <Stack.Screen name={NAVIGATION.AccountSettingsScreen} component={AccountSettings} />
        <Stack.Screen name={NAVIGATION.FrictionSettingsScreen} component={FrictionSettings} />
        <Stack.Screen name={NAVIGATION.PermissionsScreen} component={PermissionsScreen} />
        <Stack.Screen name={NAVIGATION.LanguageSettings} component={LanguageSettings} />
        <Stack.Screen name={NAVIGATION.BearsonaSettings} component={BearsonaSettings} />
        <Stack.Screen name={NAVIGATION.AppsBlockList} component={AppsBlockList} />
        <Stack.Screen name={NAVIGATION.DoNotDisturb} component={DoNotDisturbSettings} />
        <Stack.Screen name={NAVIGATION.PrivacyTerms} component={PrivacyTerms} />
        <Stack.Screen name={NAVIGATION.BlockUrl} component={BlockUrl} />
        <Stack.Screen name={NAVIGATION.BreathingExercise} component={BreathingExercise} />
        <Stack.Screen name={NAVIGATION.LateNoMore} component={LateNoMoreScreen} />
        <Stack.Screen name={NAVIGATION.PermissionExplanation} component={PermissionExplanationScreen} />
        <Stack.Screen name={NAVIGATION.GrantPermission} component={GrantPermissionScreen} />
        <Stack.Screen name={NAVIGATION.Blocklist} component={BlockList} />
        <Stack.Screen name={NAVIGATION.AskForHelp} component={AskForHelp} />
        <Stack.Screen name={NAVIGATION.SearchTodosScreen} component={SearchTodosScreen} />
        <Stack.Screen name={NAVIGATION.HelpScreen} component={HelpScreen} />
        <Stack.Screen name={NAVIGATION.CustomizeBlocking} component={CustomizeBlocking} />
      </Stack.Navigator>
      <FullPageLoading show={isLoading} />
      {checkIsIOS() && <ControlView style={{ height: 1, width: 1 }} />}
    </>
  );
};
