import React, { useState, useRef, useMemo } from "react";
import { View, StyleSheet, Alert, Image, NativeModules } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { BigHeaderKeyboardAwareScrollView } from "@/components/AppHeader";
import { HeadingSmallText, HeadingMediumText, TextField, ConfirmationButton, Card, Button } from "@/components";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/Ionicons";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { normalizeUrl } from "@/utils/StringMethods";
import Toast from "react-native-toast-message";
import { checkIsIOS } from "@/utils/PlatformMethods";
import { userBlockedUrlsSelector } from "@/selectors/UserSelectors";
import { useSelector } from "@/reducers";
import { postUserLocalDeviceSettings } from "@/actions/UserActions";
import { PLATFORMS } from "@/constants/platforms";
import { useDispatch } from "react-redux";
import { checkIsBlockUrlLimitExceeded, showFreemiumAlert } from "@/hooks/use-is-freemium";
import { AccessibilityPermissionMenu } from "../Permissions/Permissions";
import { useHomeContext } from "../Home/context";
import { PermissionTutorialModal } from "../OnBoarding/GrantPermissionScreen";
import { AccessibilityPermissionTutorial } from "@/assets";
import { websiteFavicon } from "@/constants/url";

const { AccessibilityModule } = NativeModules;

const UNBLOCKABLE_URLS = ["focusbear.io"];
const DEFAULT_BLOCKED_URLS = [
  "facebook.com",
  "instagram.com",
  "x.com",
  "tiktok.com",
  "reddit.com",
  "cnn.com",
  "bbc.com",
];

export const BlockUrl = ({ route }) => {
  const blockedUrls = useSelector(userBlockedUrlsSelector);
  const initialUrls = useRef(route.params?.blockedUrls || blockedUrls || DEFAULT_BLOCKED_URLS).current;
  const dispatch = useDispatch();
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [currentUrl, setCurrentUrl] = useState("");
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [isSaving, setIsSaving] = useState(false);

  const [openTutorial, setOpenTutorial] = useState(false);

  const { isAccessibilityPermissionGranted } = useHomeContext();

  const suggestedUrls = DEFAULT_BLOCKED_URLS.filter((url) => !urls.includes(url));

  const handleAddUrl = (url: string) => {
    const normalizedUrl = normalizeUrl(url);

    if (UNBLOCKABLE_URLS.includes(normalizedUrl)) {
      Alert.alert(t("blockUrl.unblockableUrlTitle"), t("blockUrl.unblockableUrlMessage"));
      return;
    }

    if (urls.includes(normalizedUrl)) {
      Alert.alert(t("blockUrl.urlExistsTitle"), t("blockUrl.urlExistsMessage"));
      return;
    }

    if (checkIsBlockUrlLimitExceeded(urls?.length ?? 0)) {
      showFreemiumAlert(t("blockUrl.freemiumLimit"), t("blockUrl.freemiumLimitDescription"), navigation);
      return;
    }

    if (normalizedUrl) {
      setUrls([...urls, normalizedUrl]);
      setCurrentUrl("");
    } else {
      Alert.alert(t("blockUrl.invalidUrlTitle"), t("blockUrl.invalidUrlMessage"));
    }
  };

  const handleRemoveUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const hasChanges = useMemo(() => {
    if (urls.length !== initialUrls.length) return true;

    return urls.some((url) => !initialUrls.includes(url));
  }, [urls, initialUrls]);

  const handleSave = async () => {
    const onSave = route.params?.onSave;
    if (onSave) {
      onSave(urls);
      navigation.goBack();
      return;
    }

    setIsSaving(true);
    AccessibilityModule.setRestrictedAddresses(urls);
    dispatch(
      postUserLocalDeviceSettings({ kArrBlockedUrls: urls }, PLATFORMS.MACOS, (isSuccess: boolean) => {
        Toast.show({
          type: isSuccess ? "success" : "error",
          text1: t(isSuccess ? "common.Success" : "common.error"),
          text2: t(isSuccess ? "blockUrl.saveSuccess" : "blockUrl.saveError"),
        });
        if (isSuccess) {
          navigation.goBack();
        }
        setIsSaving(false);
      }),
    );
  };

  if (!isAccessibilityPermissionGranted) {
    return (
      <BigHeaderKeyboardAwareScrollView title={t("blockUrl.title")} contentContainerStyle={styles.content}>
        <View style={[styles.flex, styles.gap12]}>
          <View style={styles.gap8}>
            <HeadingMediumText>{t("accessibility.permissionRequired")}</HeadingMediumText>
            <HeadingSmallText color={colors.subText}>{t("accessibility.permissionDescription")}</HeadingSmallText>
          </View>
          <AccessibilityPermissionMenu showIntroModal />

          <TouchableOpacity testID="test:id/need-help" hitSlop={16} onPress={() => setOpenTutorial(true)}>
            <HeadingSmallText color={colors.primary}>{t("grantPermission.needHelp")}</HeadingSmallText>
          </TouchableOpacity>

          <PermissionTutorialModal
            openTutorial={openTutorial}
            setOpenTutorial={setOpenTutorial}
            title={t("accessibility.howToEnableAccessibility")}
            videoSource={AccessibilityPermissionTutorial}
          />
        </View>
      </BigHeaderKeyboardAwareScrollView>
    );
  }

  return (
    <View style={styles.flex}>
      <BigHeaderKeyboardAwareScrollView
        title={t("blockUrl.title")}
        contentContainerStyle={[styles.content, styles.gap12]}
      >
        <HeadingSmallText>{t("blockUrl.description")}</HeadingSmallText>

        <View style={[styles.row, styles.gap8]}>
          <TextField
            type="url"
            style={styles.flex}
            value={currentUrl}
            onChangeText={setCurrentUrl}
            placeholder={t("blockUrl.inputPlaceholder")}
            clearable
            autoComplete={checkIsIOS() ? "url" : "off"}
            textContentType="URL"
            autoCorrect={false}
            onSubmitEditing={(e) => handleAddUrl(e.nativeEvent.text)}
          />
        </View>

        <View style={styles.gap8}>
          {urls.map((url, index) => (
            <Card key={index} style={[styles.row, styles.gap12]}>
              <Image source={{ uri: websiteFavicon(url) }} style={styles.image} />
              <HeadingSmallText style={styles.flex}>{url}</HeadingSmallText>
              <TouchableOpacity
                onPress={() => handleRemoveUrl(index)}
                hitSlop={16}
                testID={`test:id/remove-url-${index}`}
              >
                <Icon name="close" size={20} color={colors.subText} />
              </TouchableOpacity>
            </Card>
          ))}
        </View>

        {urls === DEFAULT_BLOCKED_URLS && (
          <HeadingSmallText color={colors.subText}>{t("blockUrl.addSomeSuggestedUrls")}</HeadingSmallText>
        )}

        <View style={[styles.suggestedUrlsContainer, styles.gap8]}>
          {suggestedUrls.length > 0 && (
            <HeadingSmallText color={colors.subText}>{t("blockingSchedule.suggestedUrls")}</HeadingSmallText>
          )}
          {suggestedUrls.map((url, index) => (
            <Button
              subtle
              key={index}
              style={[styles.row, styles.gap12]}
              onPress={() => handleAddUrl(url)}
              testID={`test:id/add-suggested-url-${index}`}
            >
              <MaterialIcon name="add" size={20} color={colors.text} />

              <Image source={{ uri: websiteFavicon(url) }} style={styles.image} />
              <HeadingSmallText style={styles.flex}>{url}</HeadingSmallText>
            </Button>
          ))}
        </View>
      </BigHeaderKeyboardAwareScrollView>
      <ConfirmationButton
        confirmTitle={t("common.save")}
        onConfirm={handleSave}
        isLoading={isSaving}
        disabled={!hasChanges}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    padding: 16,
  },
  image: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  suggestedUrlsContainer: {
    marginTop: 16,
  },
});
