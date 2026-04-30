import React from "react";
import { Image, View, StyleSheet, Pressable } from "react-native";
import { ConfirmationButton, HeadingXLargeText, HeadingMediumText } from "@/components";
import {
  AndroidPushNotiPermissionEnglish,
  AndroidPushNotiPermissionSpanish,
  HandDrawArrow,
  IOSPushNotiPermissionEnglish,
  IOSPushNotiPermissionSpanish,
} from "@/assets";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import notifee from "@notifee/react-native";
import { NAVIGATION } from "@/constants";
import { addInfoLog } from "@/utils/FileLogger";
import { useDispatch } from "react-redux";
import { updateIsPushNotificationAskedStatus } from "@/actions/GlobalActions";
import { checkIsIOS } from "@/utils/PlatformMethods";
import PropTypes from "prop-types";
import { DEFAULT_PLATFORMS } from "@/utils/Enums";
import { HorizontalAppLogo } from "@/components/AppLogo";

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  permissionImage: { height: checkIsIOS() ? 200 : 250, width: checkIsIOS() ? 280 : 290, resizeMode: "contain" },
  permissionContainer: {
    padding: checkIsIOS() ? 0 : 4,
    borderRadius: 20,
    paddingHorizontal: checkIsIOS() ? 0 : 8,
  },
  handDrawArrowStyle: { height: 150, width: 150, bottom: 24 },
  contentContainer: {
    padding: 32,
    paddingTop: 16,
    alignItems: "center",
    gap: 10,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

const pushNotificationImageObject = {
  en: {
    ios: IOSPushNotiPermissionEnglish,
    android: AndroidPushNotiPermissionEnglish,
  },
  es: {
    ios: IOSPushNotiPermissionSpanish,
    android: AndroidPushNotiPermissionSpanish,
  },
};

const PushNotificationPermission = ({ isFromSignin }) => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const deviceLanguage = Object.keys(pushNotificationImageObject).includes(i18n?.language)
    ? i18n.language
    : Object.keys(pushNotificationImageObject)[0];
  const deviceOS = checkIsIOS() ? DEFAULT_PLATFORMS.IOS : DEFAULT_PLATFORMS.ANDROID;

  const onRequestPermission = async () => {
    const status = await notifee.requestPermission();
    addInfoLog(`notification permission: ${JSON.stringify(status)}`);
    dispatch(updateIsPushNotificationAskedStatus(true));
    navigation.replace(isFromSignin ? NAVIGATION.TabNavigator : NAVIGATION.UserAchievement, {});
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.flex}>
      <View style={styles.contentContainer}>
        <HorizontalAppLogo />
        <HeadingXLargeText center>{t("pushNotiPermission.title")}</HeadingXLargeText>
        <HeadingMediumText center>{t("pushNotiPermission.description")}</HeadingMediumText>
      </View>
      <View style={styles.imageContainer}>
        <Pressable
          onPress={onRequestPermission}
          style={styles.permissionContainer}
          testID="test:id/push-notification-image-press"
        >
          <Image source={pushNotificationImageObject[deviceLanguage][deviceOS]} style={styles.permissionImage} />
        </Pressable>
        {checkIsIOS() && <Image source={HandDrawArrow} style={styles.handDrawArrowStyle} />}
      </View>
      <ConfirmationButton
        confirmTestID="test:id/confirm-push-notification-permission"
        onConfirm={onRequestPermission}
        confirmTitle={t("common.continue")}
      />
    </SafeAreaView>
  );
};

PushNotificationPermission.propTypes = {
  isFromSignin: PropTypes.bool,
};

export { PushNotificationPermission };
