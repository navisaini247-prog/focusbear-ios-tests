import React, { useEffect, useState } from "react";
import { StyleSheet, Platform, ScrollView, View } from "react-native";
import { VerticalAppLogo } from "@/components/AppLogo";
import { BodyLargeText, BodyMediumText, HeadingLargeText } from "@/components/Text";
import { Trans } from "react-i18next";
import { useTranslation } from "react-i18next";
import { AppHeader, Button, Card, Space } from "@/components";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { checkIsAndroid, checkIsIOS } from "@/utils/PlatformMethods";
import { launchImageLibrary } from "react-native-image-picker";
import { addErrorLog, addInfoLog } from "@/utils/FileLogger";
import { NAVIGATION } from "@/constants";
import COLOR from "@/constants/color";
import { useSyncUsageStats } from "@/hooks/useSyncUsageStats";
import { getDeviceId } from "react-native-device-info";
import { generateUploadImageUrl, processUploadedImage } from "@/actions/UserActions";
import { navigationReplace } from "@/navigation/root.navigator";
import { useAppActiveState } from "@/hooks/use-app-active-state";
import { useTaskStatus } from "@/hooks/useTaskStatus";
import Toast from "react-native-toast-message";
import { useHomeContext } from "../Home/context";
import { AppActivationStatus, useParticipantCode } from "@/hooks/useParticipantCode";

const CollectDataScreen = () => {
  const { colors } = useTheme();

  const params = useRoute().params as {
    showBackButton: boolean;
    fromMain: boolean;
  };

  const showBackButton = params?.showBackButton;

  const [codeActivationStatus, setCodeActivationStatus] = useState<AppActivationStatus | null>(null);

  const { getCodeActivationStatus } = useParticipantCode();

  useEffect(() => {
    getCodeActivationStatus().then((data) => {
      setCodeActivationStatus(data);
    });
  }, []);

  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);

  useAppActiveState(() => {
    setIsUploaded(false);
  });

  const {
    isUsagePermissionGranted,
    isPhysicalPermissionGranted,
    isHealthPermissionGranted,
    isScreenTimePermissionGranted,
  } = useHomeContext();

  const navigation = useNavigation();

  const { t } = useTranslation();
  const { lastSyncedDate, setLastSyncedDate } = useSyncUsageStats();
  const {
    taskStatus,
    isLoading: isTaskLoading,
    startPolling,
    isPolling,
  } = useTaskStatus(() => {
    Toast.show({
      type: "success",
      text1: t("participantCode.screenshotUploadSuccess"),
    });
  });

  useEffect(() => {
    if ((!isUsagePermissionGranted || !isPhysicalPermissionGranted) && checkIsAndroid()) {
      navigation.replace(NAVIGATION.PermissionRequest);
    } else if ((!isHealthPermissionGranted || !isScreenTimePermissionGranted) && checkIsIOS()) {
      navigation.replace(NAVIGATION.PermissionRequest);
    }
  }, [isUsagePermissionGranted, isPhysicalPermissionGranted, isHealthPermissionGranted]);

  const getButtonTitle = () => {
    if (isUploading) {
      return t("participantCode.uploadingScreenshot");
    }

    if (isPolling) {
      if (isTaskLoading) {
        return t("participantCode.imageProcessing");
      }

      switch (taskStatus?.status) {
        case "processing":
          return t("participantCode.imageProcessing");
        case "completed":
          return t("participantCode.imageProcessed");
        case "failed":
          return t("participantCode.imageProcessingFailed");
        default:
          return t("participantCode.checkingStatus");
      }
    }

    return t("participantCode.uploadScreenshot");
  };

  const launchGallery = async () => {
    try {
      setIsUploading(true);

      const pickedImageResult = await launchImageLibrary({
        mediaType: "photo",
        selectionLimit: 1,
        includeBase64: true,
      });

      if (!pickedImageResult?.assets?.length) {
        return;
      }

      const now = new Date();

      // Adjust to Monday (start of week)
      const day = now.getDay(); // 0 (Sun) to 6 (Sat)
      const diffToMonday = (day + 6) % 7; // 0 => 6, 1 => 0, ..., 6 => 5

      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      // Adjust to Sunday (end of week)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      Toast.show({
        type: "info",
        text1: t("participantCode.imageProcessing"),
      });

      for (const image of pickedImageResult.assets) {
        try {
          const { uploadUrl, imageKey } = await generateUploadImageUrl();

          const response = await fetch(image.uri);
          const imgBlob = await response.blob();

          const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            body: imgBlob,
            headers: {
              "Content-Type": response.headers.get("content-type"),
            },
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload image: ${uploadResponse.statusText}`);
          }

          const data = await processUploadedImage({
            imageKey,
            usageStartDate: startOfWeek.toISOString(),
            usageEndDate: endOfWeek.toISOString(),
            platform: Platform.OS,
            deviceId: getDeviceId(),
          });

          // Start polling for task status
          startPolling(data.data.asyncTaskId);

          if (codeActivationStatus !== AppActivationStatus.DATA_COLLECTION_MODE) {
            navigationReplace(NAVIGATION.TabNavigator);
          }

          setIsUploaded(true);
          setLastSyncedDate(new Date());
          addInfoLog(`Successfully uploaded and processed image: ${image.fileName}`);
        } catch (error) {
          addErrorLog(`Error processing image ${image.fileName}: ${error.message}`);
        }
      }
    } catch (error) {
      addErrorLog(`Error picking image ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title={t("participantCode.unicasStudy")} hideBackButton={!showBackButton} />
      <ScrollView>
        <VerticalAppLogo style={styles.logoContainer} iconSize={120} />
        <View style={styles.padding}>
          {checkIsIOS() && (
            <HeadingLargeText center style={styles.titleContainer}>
              {t("participantCode.screenTime")}
            </HeadingLargeText>
          )}
          <Card>
            {checkIsAndroid() || isUploaded ? (
              <Trans
                i18nKey="participantCode.thankYouForJoining"
                parent={BodyLargeText}
                style={styles.description}
                components={{
                  hereLink: <BodyLargeText center size={16} color={COLOR.BLUE[500]} underline onPress={() => {}} />,
                  email: <BodyLargeText center size={16} color={COLOR.BLUE[500]} underline onPress={() => {}} />,
                }}
              />
            ) : (
              <Trans
                i18nKey="participantCode.screenshotUploadReminder"
                parent={BodyLargeText}
                style={styles.description}
              />
            )}
          </Card>
          <Space height={16} />
          {checkIsIOS() && (
            <Button
              primary
              title={getButtonTitle()}
              onPress={launchGallery}
              disabled={isUploading || isPolling}
              isLoading={isUploading || isPolling}
              testID="test:id/upload-screenshot-button"
            />
          )}
          <Space height={16} />
          <BodyMediumText color={colors.subText}>
            {t("participantCode.usageDataLastSynced", {
              date: lastSyncedDate ? "N/A" : lastSyncedDate?.toDateString(),
            })}
          </BodyMediumText>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    lineHeight: 22,
  },
  padding: {
    padding: 24,
  },
  logoContainer: {
    height: 200,
  },
  titleContainer: {
    marginBottom: 16,
  },
});

export { CollectDataScreen };
