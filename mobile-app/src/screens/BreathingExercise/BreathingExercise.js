import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Image, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import LinearGradient from "react-native-linear-gradient";
import { Button, DisplayMediumText } from "@/components";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NAVIGATION } from "@/constants";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { store } from "@/store";
import { setRecentBreathingExercise } from "@/actions/GlobalActions";
import { useHomeContext } from "../Home/context";
import { useAppInactiveState } from "@/hooks/use-app-inactive-state";
import { setBlockedApp } from "@/actions/UserActions";
import { OverlayModule, LauncherKit } from "@/nativeModule";
import { BypassPickerModal } from "./components/BypassPickerModal";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { icFocusBear, icFocusBearWhite } from "@/assets";
import { useTheme } from "@react-navigation/native";

const gradients = [
  ["#FF9A9E", "#FAD0C4"], // pink to peach
  ["#A18CD1", "#FBC2EB"], // purple to pink
  ["#FDCB6E", "#E17055"], // yellow to orange
  ["#00C9FF", "#92FE9D"], // blue to green
  ["#43C6AC", "#F8FFAE"], // teal to light yellow
  ["#667EEA", "#764BA2"], // blue-purple
];

const getRandomGradient = (excludeIndex) => {
  let index;
  do {
    index = Math.floor(Math.random() * gradients.length);
  } while (index === excludeIndex);
  return { gradient: gradients[index], index };
};

const getRandomBackgroundAndCardGradients = () => {
  const { gradient: backgroundGradient, index } = getRandomGradient();
  const { gradient: cardGradient } = getRandomGradient(index);
  return { backgroundGradient, cardGradient };
};

const SLIDE_UP_DURATION = 5000;
const SLIDE_DOWN_DURATION = 5000;
const SLIDE_DOWN_DELAY = 500;

export default function BreathingScreen() {
  const { t } = useTranslation();
  const { height: screenHeight } = useWindowDimensions();
  const [showButtons, setShowButtons] = useState(false);
  const translateY = useSharedValue(screenHeight);
  const navigation = useNavigation();
  const route = useRoute();
  const { bearsona } = useHomeContext();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const { isDarkTheme } = useTheme();

  useAppInactiveState(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: NAVIGATION.TabNavigator }],
      });
    }
  });

  const { backgroundGradient, cardGradient } = useMemo(() => {
    return getRandomBackgroundAndCardGradients();
  }, []);

  const appName = route.params?.appName;
  const packageName = route.params?.packageName;

  useEffect(() => {
    store.dispatch(setBlockedApp(packageName));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowButtons(true);
    }, SLIDE_UP_DURATION);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    slideUp();
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const slideUp = () => {
    translateY.value = withSequence(
      withTiming(0, { duration: SLIDE_UP_DURATION }),
      withDelay(SLIDE_DOWN_DELAY, withTiming(screenHeight, { duration: SLIDE_DOWN_DURATION })),
    );
  };

  const onCancel = () => {
    if (checkIsAndroid()) {
      OverlayModule.goBackToDeviceHome();
    } else {
      // TODO: Implement logic for iOS
    }
  };

  const onContinue = (durationMs, unblockingReason) => {
    if (checkIsAndroid()) {
      const bypassUntil = Date.now() + durationMs;

      const bypassUntilIso = new Date(bypassUntil).toISOString();
      const pauseDurationMinutes = durationMs / 60000;

      postHogCapture(POSTHOG_EVENT_NAMES.PAUSE_SOFTBLOCKING_DETAILS, {
        appName,
        packageName,
        pauseDurationMinutes,
        bypassUntilIso,
        unblockingReason,
      });
      store.dispatch(setRecentBreathingExercise(appName, packageName, bypassUntil, unblockingReason));
      LauncherKit.launchApplication(packageName);
    } else {
      // TODO: Implement logic for iOS
    }
  };

  const openSheet = () => setShowTimePicker(true);
  const closeSheet = () => setShowTimePicker(false);

  const ProfilePicture = bearsona.profilePictures.og;

  return (
    <LinearGradient colors={backgroundGradient} style={styles.container}>
      <Image source={isDarkTheme ? icFocusBearWhite : icFocusBear} style={styles.logoImage} />
      {!showButtons ? (
        <View style={styles.profilePictureContainer}>
          <ProfilePicture style={styles.profilePicture} />
          <DisplayMediumText center style={styles.paddingHorizontal}>
            {t("breathingExercise.description")}
          </DisplayMediumText>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <View style={styles.motivationalContainer}>
            <DisplayMediumText center style={styles.paddingHorizontal}>
              {t("breathingExercise.motivational", { appName: appName })}
            </DisplayMediumText>
          </View>
          <View style={styles.buttonContainer}>
            <Button
              primary
              title={t("breathingExercise.dontWantToOpen", { appName: appName })}
              onPress={onCancel}
              testID="test:id/breathing-dont-open-button"
            />
            <Button
              title={t("breathingExercise.wantToOpen", { appName: appName })}
              onPress={openSheet}
              testID="test:id/breathing-want-open-button"
            />
          </View>
        </View>
      )}

      <Animated.View style={[styles.cardContainer, { height: screenHeight }, animatedCardStyle]}>
        <LinearGradient colors={cardGradient} style={styles.card} />
      </Animated.View>
      <BypassPickerModal
        isVisible={showTimePicker}
        onCancel={closeSheet}
        onConfirm={(durationMs, unblockingReason) => {
          onContinue(durationMs, unblockingReason);
          closeSheet();
        }}
        app={appName}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  profilePicture: {
    width: 200,
    height: 200,
  },
  profilePictureContainer: {
    flex: 1,
    alignContent: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  paddingHorizontal: {
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
    paddingBottom: 40,
  },
  motivationalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    gap: 20,
    paddingHorizontal: 20,
  },
  cardContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  card: {
    flex: 1,
  },
  logoImage: {
    alignSelf: "center",
    height: 90,
    width: 210,
    resizeMode: "contain",
    marginTop: 30,
  },
});
