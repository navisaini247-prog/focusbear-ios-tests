import React from "react";
import { NAVIGATION } from "@/constants";
import { UserAchievementGoals } from "@/screens/OnBoarding/UserAchievementGoals";
import { RoutineSuggestion } from "@/screens/RoutineSuggestion";
import { CaptainBearIntro } from "@/screens/OnBoarding/CaptainBearIntro";
import { AppsBlockList, BlockUrl } from "@/screens";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HabitSettingScreen } from "@/screens/HabitSettingScreen/HabitSettingScreen";
import { BlockingPermissionIntro } from "@/screens/BlockingPermissionIntro/BlockingPermissionIntro";
import { BlockingSchedule } from "@/screens/BlockingSchedule/BlockingSchedule";
import { BlockingScheduleList } from "@/screens/BlockingSchedule/BlockingScheduleList";

const Stack = createNativeStackNavigator();

export function OnBoardingNavigator() {
  return (
    <>
      <Stack.Navigator initialRouteName={NAVIGATION.OnboardingIntro} screenOptions={{ headerShown: false }}>
        <Stack.Screen component={CaptainBearIntro} name={NAVIGATION.OnboardingIntro} />
        <Stack.Screen component={UserAchievementGoals} name={NAVIGATION.UserAchievement} />
        <Stack.Screen component={RoutineSuggestion} name={NAVIGATION.RoutineSuggestion} />
        <Stack.Screen component={BlockingPermissionIntro} name={NAVIGATION.BlockingPermissionIntro} />
        <Stack.Screen component={HabitSettingScreen} name={NAVIGATION.HabitSetting} />
        <Stack.Screen component={AppsBlockList} name={NAVIGATION.AppsBlockList} />
        <Stack.Screen component={BlockingScheduleList} name={NAVIGATION.BlockingScheduleList} />
        <Stack.Screen component={BlockingSchedule} name={NAVIGATION.BlockingSchedule} />
        <Stack.Screen component={BlockUrl} name={NAVIGATION.BlockUrl} />
      </Stack.Navigator>
    </>
  );
}
