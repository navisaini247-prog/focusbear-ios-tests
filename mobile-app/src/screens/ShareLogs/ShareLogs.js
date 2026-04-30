import React, { useEffect, useState, useMemo, useRef } from "react";
import { View, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { styles as customStyles } from "@/screens/ShareLogs/ShareLogs.styles";
import { SmallButton, BodyMediumText, ConfirmationModal, UserIdCopy, TextField } from "@/components";
import { BigHeaderKeyboardAwareScrollView } from "@/components/AppHeader";
import { ConfirmationButton } from "@/components";
import { Group, Card } from "@/components";
import { useDispatch, useSelector } from "react-redux";
import { uploadAppLogs, getAppLogsUploadUrl } from "@/actions/UserActions";
import { PLATFORM_SPECIFIC, LOG_ZIP_NAME } from "@/utils/Enums";
import { launchImageLibrary } from "react-native-image-picker";
import { deleteImagesInFolder, zipLogFilesAndReturnPath } from "@/utils/GlobalMethods";
import { copyFile, unlink } from "react-native-fs";
import { addErrorLog, addInfoLog } from "@/utils/FileLogger";
import Icon from "react-native-vector-icons/Ionicons";
import { userSelector } from "@/selectors/UserSelectors";

export const ShareLogs = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => customStyles(colors), [colors]);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const user = useSelector(userSelector);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const zipPath = useRef("");
  const uploadUrl = useRef("");
  const [uploadError, setUploadError] = useState(false);
  const [zipError, setZipError] = useState(false);
  const [missingFeedbackError, setMissingFeedbackError] = useState(false);
  const [pickedImages, setPickedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPickingImages, setIsPickingImages] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const resetScreen = () => {
    deleteImagesInFolder(PLATFORM_SPECIFIC.LOG_PATH);
    setFeedbackMsg("");
    setUploadError("");
    setPickedImages([]);
    setShowSuccessModal(false);
    zipPath.current = "";
    uploadUrl.current = "";
  };

  useEffect(() => {
    return () => resetScreen();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      try {
        zipPath.current = await zipLogFilesAndReturnPath();
      } catch (error) {
        // Fail silently and wait until the user presses submit to try again
        zipPath.current = "";
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [pickedImages]);

  const onPressSubmit = async () => {
    setUploadError(false);
    if (!feedbackMsg.trim()) {
      setMissingFeedbackError(true);
    } else {
      try {
        addInfoLog(`Submitting logs with user id: ${user.id}`);

        setIsLoading(true);
        if (!zipPath.current) {
          try {
            zipPath.current = await zipLogFilesAndReturnPath();
          } catch (error) {
            setZipError(true);
            return;
          }
        }

        if (!uploadUrl.current) {
          uploadUrl.current = await dispatch(getAppLogsUploadUrl());
        }

        // Upload the logs
        try {
          await dispatch(uploadAppLogs({ zipPath: zipPath.current, uploadUrl: uploadUrl.current, feedbackMsg }));
          setShowSuccessModal(true);
        } catch (error) {
          setUploadError(true);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const launchGallery = async () => {
    if (isPickingImages) return;

    setIsPickingImages(true);
    try {
      const pickedImageResult = await launchImageLibrary({ mediaType: "photo", selectionLimit: 0 });
      const copySelectedImagesToCacheDir = pickedImageResult?.assets?.map(async (image) => {
        const sourcePath = image.uri;
        const destinationPath = PLATFORM_SPECIFIC.GET_FULL_PATH(
          `${PLATFORM_SPECIFIC.LOG_PATH}${Date.now()}${image.fileName}`,
        );

        try {
          await copyFile(sourcePath, destinationPath);
          addInfoLog(`Successfully copied to cache path ${destinationPath}`);
          return destinationPath;
        } catch (err) {
          addErrorLog(`Error on copyFile ${err}`);
        }
      });

      const newPickedImages = await Promise.all(copySelectedImagesToCacheDir);
      setPickedImages((prev) => [...prev, ...newPickedImages]);
    } catch (error) {
      addErrorLog(`Error picking image ${error}`);
    } finally {
      setIsPickingImages(false);
    }
  };

  const deleteImage = (image, index) => {
    unlink(image)
      .then(() => setPickedImages((prev) => prev.filter((_, i) => i !== index)))
      .catch((err) => addErrorLog(`There is some error removing the image ${err}`));
  };
  return (
    <View style={styles.container}>
      <BigHeaderKeyboardAwareScrollView
        title={t("settings.shareLogsWithSupport")}
        contentContainerStyle={styles.subContainer}
        scrollViewProps={{ keyboardShouldPersistTaps: "handled" }}
      >
        <Group>
          <TextField
            inputStyle={styles.textField}
            editable={!isLoading}
            multiline
            value={feedbackMsg}
            placeholder={t("shareLogs.enterFeedBack")}
            onChangeText={(text) => {
              setMissingFeedbackError(false);
              setFeedbackMsg(text);
            }}
          />
          {missingFeedbackError && (
            <Card>
              <BodyMediumText>{t("shareLogs.pleaseWriteFeedback")}</BodyMediumText>
            </Card>
          )}
          {zipError && (
            <Card>
              <BodyMediumText>{t("shareLogs.errorZipCreation")}</BodyMediumText>
            </Card>
          )}
          <Card>
            <Card style={styles.uploadTxtContainer}>
              <Icon name="attach" size={20} color={colors.primary} />
              <BodyMediumText color={colors.primary}>{LOG_ZIP_NAME}</BodyMediumText>
            </Card>

            <View style={styles.imageCollectionContainer}>
              <SmallButton
                style={styles.addImageButton}
                onPress={launchGallery}
                disabled={isLoading || isPickingImages}
                isLoading={isPickingImages}
              >
                <Icon name="images-outline" size={28} color={colors.text} />
              </SmallButton>
              {!pickedImages.length > 0 && <BodyMediumText>{t("common.uploadScreenShots")}</BodyMediumText>}
              {pickedImages?.map((imageURI, index) => (
                <SmallButton
                  style={styles.imageItem}
                  onPress={() => deleteImage(imageURI, index)}
                  key={index}
                  disabled={isLoading}
                >
                  <Image source={{ uri: imageURI }} style={styles.pickedImage} />
                  <Icon style={styles.deleteOverlay} name="trash" size={20} color={colors.danger} />
                </SmallButton>
              ))}
            </View>
          </Card>
        </Group>

        <UserIdCopy />
      </BigHeaderKeyboardAwareScrollView>

      <ConfirmationButton isLoading={isLoading} onConfirm={onPressSubmit} confirmTitle={t("common.submit")} />

      {/* Error modal */}
      <ConfirmationModal
        isVisible={uploadError}
        title={t("common.error")}
        text={t("shareLogs.errorUploading")}
        confirmTitle={t("common.retry")}
        onConfirm={onPressSubmit}
        onCancel={() => setUploadError("")}
      />

      {/* Success modal */}
      <ConfirmationModal
        isVisible={showSuccessModal}
        title={t("common.Success")}
        text={t("shareLogs.logsShared")}
        confirmTitle={t("common.continue")}
        onConfirm={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
        cancelTitle={t("shareLogs.submitAnother")}
        onCancel={() => resetScreen()}
      />
    </View>
  );
};
