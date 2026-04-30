import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { useAnimatedRef, useScrollOffset } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Toast from "react-native-toast-message";

import { ConfirmationButton, Space, HeadingSmallText, BodyMediumText, Tooltip, InfoIcon } from "@/components";
import { BigAppHeader, BIG_TITLE_HEIGHT } from "@/components/AppHeader";
import { postUserLocalDeviceSettings } from "@/actions/UserActions";
import { PLATFORMS } from "@/constants";
import { addErrorLog } from "@/utils/FileLogger";
import { checkIsAndroid, checkIsIOS } from "@/utils/PlatformMethods";
import { OverlayModule, ControlFunctionModule } from "@/nativeModule";

import { CustomBlockedMessage } from "./components/CustomBlockedMessage";
import { GentleCustomisation } from "./components/GentleCustomisation";
import { DEFAULT_PAUSE_BASE_DELAY_SECONDS } from "@/constants/blockingSchedule";

const DEFAULT_UNLOCK_MINUTES = 5; //minutes

function storedMinutesToParts(storedMinutes) {
  const totalSeconds = Math.round((storedMinutes ?? DEFAULT_UNLOCK_MINUTES) * 60);
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
  };
}

function partsToStoredMinutes(minutes, seconds) {
  return minutes + seconds / 60;
}

export function CustomizeBlocking({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { userLocalDeviceSettingsData } = useSelector((state) => state.user);
  const platform = checkIsAndroid() ? PLATFORMS.ANDROID : PLATFORMS.IOS;
  const platformSettings = userLocalDeviceSettingsData?.[platform] ?? {};

  const [customMessage, setCustomMessage] = useState(platformSettings.customBlockedPageMessage ?? "");

  const { minutes: initMinutes, seconds: initSeconds } = storedMinutesToParts(platformSettings.unlockDurationMinutes);
  const [unlockMinutes, setUnlockMinutes] = useState(initMinutes);
  const [unlockSeconds, setUnlockSeconds] = useState(initSeconds);

  const [pauseBaseDelay, setPauseBaseDelay] = useState(
    platformSettings.pauseBaseDelaySeconds ?? DEFAULT_PAUSE_BASE_DELAY_SECONDS,
  );

  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useAnimatedRef();
  const scrollY = useScrollOffset(scrollRef);

  const syncToAndroidNative = () => {
    OverlayModule.saveCustomBlockedMessage?.(customMessage.trim());
  };

  const syncToIOSNative = () => {
    ControlFunctionModule.saveCustomBlockedMessage?.(customMessage.trim());
    ControlFunctionModule.saveUnlockDuration?.(unlockMinutes, unlockSeconds);
    ControlFunctionModule.saveBaseDelay?.(pauseBaseDelay);
  };

  const syncToNative = () => {
    // Push to native layer immediately so the shield reflects changes
    // without waiting for a full app restart.
    if (checkIsAndroid()) {
      syncToAndroidNative();
    } else {
      syncToIOSNative();
    }
  };

  const getServerPayload = () => {
    const sharedPayload = {
      customBlockedPageMessage: customMessage.trim(),
    };

    const iosPayload = {
      unlockDurationMinutes: partsToStoredMinutes(unlockMinutes, unlockSeconds),
      pauseBaseDelaySeconds: pauseBaseDelay,
    };

    return {
      ...sharedPayload,
      ...(checkIsIOS() && iosPayload),
    };
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      syncToNative();
      await dispatch(postUserLocalDeviceSettings(getServerPayload()));
      Toast.show({
        type: "success",
        text1: t("common.Success"),
        text2: t("customizeBlocking.saveSuccess", {
          defaultValue: "Settings saved successfully.",
        }),
      });
      navigation.goBack();
    } catch (error) {
      addErrorLog("Error saving customize blocking settings:", error);
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: t("customizeBlocking.saveError", {
          defaultValue: "Failed to save settings. Please try again.",
        }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BigAppHeader title={t("customizeBlocking.title")} scrollY={scrollY} />

      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.body, { paddingTop: BIG_TITLE_HEIGHT }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <HeadingSmallText>{t("customizeBlocking.customBlockedMessage.title")}</HeadingSmallText>
          <Tooltip popover={<BodyMediumText>{t("customizeBlocking.customBlockedMessage.tooltip")}</BodyMediumText>}>
            <InfoIcon />
          </Tooltip>
        </View>
        <Space height={8} />
        <CustomBlockedMessage value={customMessage} onChangeText={setCustomMessage} />

        <Space height={28} />

        {checkIsIOS() && (
          <>
            <View style={styles.sectionHeader}>
              <HeadingSmallText>{t("customizeBlocking.gentleCustomisation.title")}</HeadingSmallText>
            </View>
            <Space height={8} />
            <GentleCustomisation
              unlockMinutes={unlockMinutes}
              setUnlockMinutes={setUnlockMinutes}
              unlockSeconds={unlockSeconds}
              setUnlockSeconds={setUnlockSeconds}
              pauseBaseDelay={pauseBaseDelay}
              setPauseBaseDelay={setPauseBaseDelay}
            />
          </>
        )}
        <Space height={100} />
      </Animated.ScrollView>

      <ConfirmationButton
        confirmTitle={t("common.save")}
        onConfirm={saveSettings}
        isLoading={isLoading}
        confirmTestID="test:id/save-customize-blocking"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
