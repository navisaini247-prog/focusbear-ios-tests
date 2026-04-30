import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NAVIGATION } from "@/constants";
import { SignIn, PrivacyTerms, Signup, Welcome, Goals } from "@/screens";
import { ForgotPassword } from "@/screens/ForgotPassword/ForgotPassword";
import { PrivacyNoticeScreen } from "@/components";
import { useHomeContext } from "@/screens/Home/context";
import { navigationReplace } from "@/navigation/root.navigator";
import { useDispatch } from "react-redux";
import { HowFocusBearWorkScreen } from "@/screens/OnBoarding/HowFocusBearWorkScreen";
import { JuniorBearConversation } from "@/screens/JuniorBearConversation/JuniorBearConversation";

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  const dispatch = useDispatch();
  const { isUnicasStudyParticipant } = useHomeContext();

  const initialRouteName = isUnicasStudyParticipant ? NAVIGATION.ParticipantCode : NAVIGATION.Welcome;

  useEffect(() => {
    if (isUnicasStudyParticipant) {
      navigationReplace(NAVIGATION.ParticipantCode);
    }
  }, [dispatch, isUnicasStudyParticipant]);

  return (
    <Stack.Navigator initialRouteName={NAVIGATION.BearOnboarding} screenOptions={{ headerShown: false }}>
      <Stack.Screen component={Goals} name={NAVIGATION.Goals} />
      <Stack.Screen component={Welcome} name={NAVIGATION.Welcome} />
      <Stack.Screen component={PrivacyNoticeScreen} name={NAVIGATION.PrivacyConsent} />
      <Stack.Screen component={SignIn} name={NAVIGATION.SignIn} />
      <Stack.Screen component={Signup} name={NAVIGATION.SignUp} />
      <Stack.Screen component={ForgotPassword} name={NAVIGATION.ForgotPassword} />
      <Stack.Screen component={PrivacyTerms} name={NAVIGATION.PrivacyTerms} />
      <Stack.Screen component={HowFocusBearWorkScreen} name={NAVIGATION.HowFocusBearWork} />
      <Stack.Screen component={JuniorBearConversation} name={NAVIGATION.BearOnboarding} />
    </Stack.Navigator>
  );
}
