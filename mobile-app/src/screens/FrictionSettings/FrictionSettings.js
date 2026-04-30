import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { TextField, MenuItemFlatlist, ConfirmationButton, Space, BigHeaderScrollView } from "@/components";
import { HeadingWithInfo, BodyMediumText, MenuItem, Group, Card } from "@/components";
import { useDispatch, useSelector } from "react-redux";
import { postUserLocalDeviceSettings } from "@/actions/UserActions";
import { PLATFORMS } from "@/constants";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { PASSWORD_RULES_DATA } from "@/constants/passwordRules";
import Base64 from "@/utils/Base64";
import { NormalAlert } from "@/utils/GlobalMethods";
import { macPasswordSelector } from "@/selectors/UserSelectors";
import { postHogCapture } from "@/utils/Posthog";
import { setFrictionMode } from "@/utils/NativeModuleMethods";
import { addErrorLog } from "@/utils/FileLogger";
import { styles } from "@/screens/Settings/Settings.styles";

export function FrictionSettings({ navigation }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { userLocalDeviceSettingsData } = useSelector((state) => state.user);
  const prevIsEasySkipEnabled = userLocalDeviceSettingsData?.MacOS?.kIsEasySkipEnabled ?? false;
  const prevUserUnlockPassword = useSelector(macPasswordSelector);

  const [isEasySkipEnabled, setIsEasySkipEnabled] = useState(prevIsEasySkipEnabled);
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(Boolean(prevUserUnlockPassword));
  const [selectedPasswordRules, setSelectedPasswordRules] = useState(PASSWORD_RULES_DATA);
  const [credentials, setCredentials] = useState({
    password: prevUserUnlockPassword ? Base64.decode(prevUserUnlockPassword) : "",
    confirmPassword: prevUserUnlockPassword ? Base64.decode(prevUserUnlockPassword) : "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const onTogglePasswordRules = (isEnabled, index) => {
    setSelectedPasswordRules((prev) => {
      const updatedRules = [...prev];
      updatedRules[index] = { ...updatedRules[index], status: !isEnabled };
      return updatedRules;
    });
  };

  const saveSettings = async () => {
    if (isPasswordEnabled && credentials.password !== credentials.confirmPassword) {
      NormalAlert({ message: t("signUp.passwordMatchError") });
      return;
    }

    setIsLoading(true);
    try {
      if (isEasySkipEnabled !== prevIsEasySkipEnabled) {
        postHogCapture(isEasySkipEnabled ? POSTHOG_EVENT_NAMES.FRICTION_EASY : POSTHOG_EVENT_NAMES.FRICTION_HARD);
      }

      const updatedPasswordRules = selectedPasswordRules.reduce((allRules, rule) => {
        allRules[rule.key] = isPasswordEnabled ? rule.status : false;
        return allRules;
      }, {});

      const params = {
        [PLATFORMS.MACOS]: {
          kAppPassword: isPasswordEnabled ? Base64.encode(credentials.password) : null,
          kIsEasySkipEnabled: isEasySkipEnabled,
          ...updatedPasswordRules,
        },
      };

      setFrictionMode(isEasySkipEnabled);
      await dispatch(postUserLocalDeviceSettings(params, PLATFORMS.CURRENT_PLATFORM_COMBINED_WITH_MACOS));
      navigation.goBack();
    } catch (error) {
      addErrorLog("Error saving friction settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const frictionMenuItems = [
    {
      title: t("editFriction.reallyEasy"),
      isSelected: isEasySkipEnabled,
      onPress: () => setIsEasySkipEnabled(true),
      description: t("editFriction.reallyEasyDescription"),
      type: "radio",
      testID: "test:id/friction-radio-really-easy",
    },
    {
      title: t("editFriction.makeItHardToSkip"),
      isSelected: !isEasySkipEnabled,
      onPress: () => setIsEasySkipEnabled(false),
      description: t("editFriction.makeItHardToSkipDescription"),
      type: "radio",
      testID: "test:id/friction-radio-hard-to-skip",
    },
  ];

  const passwordRulesMenuItems = selectedPasswordRules.map((item, index) => ({
    title: item.title,
    isSelected: item.status,
    onPress: () => onTogglePasswordRules(item.status, index),
    type: "switch",
    testID: `test:id/friction-password-rule-${item.id}`,
  }));

  return (
    <>
      <BigHeaderScrollView
        title={t("settings.editFriction")}
        contentContainerStyle={[styles.bodyContainer, localStyles.scrollContent]}
      >
        <HeadingWithInfo infoText={t("editFriction.frictionTooltipDescription")}>
          {t("editFriction.frictionForSkippingHabits")}
        </HeadingWithInfo>
        <Space height={12} />
        <MenuItemFlatlist big data={frictionMenuItems} />

        <Space height={16} />
        <Group>
          <MenuItem
            big
            type="switch"
            isSelected={isPasswordEnabled}
            onPress={() => setIsPasswordEnabled(!isPasswordEnabled)}
            switchTestID="test:id/friction-password-switch"
          >
            <HeadingWithInfo infoText={t("strictness.setPasswordDescription")}>
              {t("strictness.setPassword")}
            </HeadingWithInfo>
          </MenuItem>

          {isPasswordEnabled && (
            <Card>
              <TextField
                type="password"
                placeholder={t("signIn.enterPasswordHint")}
                value={credentials.password}
                onChangeText={(password) => setCredentials((prev) => ({ ...prev, password }))}
                testID="test:id/friction-password-input"
              />
              <Space height={12} />
              <TextField
                type="password"
                placeholder={t("strictness.enterConfirmPasswordHint")}
                value={credentials.confirmPassword}
                onChangeText={(confirmPassword) => setCredentials((prev) => ({ ...prev, confirmPassword }))}
                testID="test:id/friction-confirm-password-input"
              />
              <Space height={24} />

              <BodyMediumText>{t("strictness.whenRequirePasswordDescription")}</BodyMediumText>
              <Space height={8} />
              <MenuItemFlatlist data={passwordRulesMenuItems} />
            </Card>
          )}
        </Group>
      </BigHeaderScrollView>
      <ConfirmationButton
        confirmTitle={t("common.save")}
        onConfirm={() => saveSettings()}
        isLoading={isLoading}
        confirmTestID="test:id/save-friction-settings"
        disabled={isPasswordEnabled && (!credentials.password || !credentials.confirmPassword)}
      />
    </>
  );
}

const localStyles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 96,
  },
});
