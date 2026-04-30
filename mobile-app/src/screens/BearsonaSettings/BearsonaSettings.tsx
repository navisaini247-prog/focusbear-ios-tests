import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { AppHeader, MenuItem, CircleGridMenu, DisplaySmallText, HeadingMediumText, BodyLargeText } from "@/components";
import { ConfirmationButton, HorizontalAppLogo, Group, HeadingWithInfo, Modal, Button } from "@/components";
import { SmallButton, Card, Or, Space } from "@/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { setAppLanguage, setIsOnboardingStatus } from "@/actions/GlobalActions";
import { postUserLocalDeviceSettings } from "@/actions/UserActions";
import { appLanguageSelector, isOnboardingStatusSelector } from "@/selectors/GlobalSelectors";
import { PLATFORMS, BEARSONAS } from "@/constants";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { useHomeContext } from "@/screens/Home/context";
import { ScreenNavigationProp } from "@/navigation/AppNavigator";
import { addErrorLog, addInfoLog } from "@/utils/FileLogger";

export const BearsonaSettings = () => {
  const { colors, shadowStyles } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<ScreenNavigationProp>();
  const dispatch = useDispatch();
  const isOnboarding = !useSelector(isOnboardingStatusSelector);
  const appLanguage = useSelector(appLanguageSelector);
  const { bearsona: currentBearsona } = useHomeContext();

  const [isLoading, setIsLoading] = useState(false);
  const [chosenBearsona, setChosenBearsona] = useState(currentBearsona);

  const [isCustomLanguageEnabled, setIsCustomLanguageEnabled] = useState(
    chosenBearsona.customLanguage && chosenBearsona.customLanguage === appLanguage,
  );

  const [isCustomLanguageConfirmationModalVisible, setIsCustomLanguageConfirmationModalVisible] = useState(false);

  const tCustomLanguage = useCallback(
    (key, options?) => t(key, { lng: isCustomLanguageEnabled && chosenBearsona.customLanguage, ...options }),
    [t, isCustomLanguageEnabled, chosenBearsona.customLanguage],
  );

  const menuItems = useMemo(
    () =>
      BEARSONAS.map((bearsona) => {
        const Thumbnail = bearsona.profilePictures.og;
        return {
          content: <Thumbnail testID={`test:id/bearsona-${bearsona.name}`} />,
          onPress: () => setChosenBearsona(bearsona),
          isSelected: chosenBearsona.name === bearsona.name,
        };
      }),
    [chosenBearsona.name],
  );

  const customLanguageOption = {
    title: tCustomLanguage("bearsona.useCustomLanguage", {
      customLanguage: t("languageName", { lng: chosenBearsona.customLanguage }),
    }),
    onPress: () => setIsCustomLanguageEnabled((prev) => !prev),
    isSelected: isCustomLanguageEnabled,
    type: "switch",
    testID: "test:id/custom-language-toggle",
  } as const;

  const onPressSave = () => {
    if (isCustomLanguageEnabled && chosenBearsona.customLanguage) {
      setIsCustomLanguageConfirmationModalVisible(true);
      return;
    } else if (
      (!isCustomLanguageEnabled && chosenBearsona.customLanguage === appLanguage) ||
      chosenBearsona.customLanguage === null
    ) {
      dispatch(setAppLanguage(null));
    }

    onContinue({ useCustomLanguage: false });
  };

  const onContinue = async ({ useCustomLanguage = false }) => {
    addInfoLog("Saving bearsona settings, chosen bearsona:", chosenBearsona.name);
    postHogCapture(POSTHOG_EVENT_NAMES.CHOOSE_BEARSONA, {
      chosen_bearsona: chosenBearsona.name,
      custom_language_enabled: useCustomLanguage || false,
    });

    if (useCustomLanguage) {
      dispatch(setAppLanguage(chosenBearsona.customLanguage));
    }

    setIsLoading(true);
    try {
      await dispatch(postUserLocalDeviceSettings({ bearsonaName: chosenBearsona.name }, PLATFORMS.MACOS));

      if (isOnboarding) {
        addInfoLog("onboarding complete!");
        dispatch(setIsOnboardingStatus(true));
      } else {
        navigation.goBack();
      }
    } catch (error) {
      addErrorLog("Error saving bearsona settings", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={isOnboarding ? ["top"] : []} style={styles.flex}>
      {!isOnboarding && <AppHeader title={tCustomLanguage("bearsona.title")} />}

      <View style={[styles.container, styles.flex]}>
        {isOnboarding && (
          <>
            <HorizontalAppLogo />
            <HeadingWithInfo center infoText={t("bearsona.explanation")} infoTestID="test:id/bearsona-explanation">
              {tCustomLanguage("bearsona.choose")}
            </HeadingWithInfo>
          </>
        )}

        <View style={[styles.profilePictureContainer, shadowStyles.bigShadow, { backgroundColor: colors.card }]}>
          {chosenBearsona.profilePictures.og()}
        </View>

        <DisplaySmallText center>{tCustomLanguage(`bearsona.name.${chosenBearsona.name}`)}</DisplaySmallText>

        <Space height={8} />
        <HeadingMediumText center italic color={colors.subText}>
          {tCustomLanguage(`bearsona.description.${chosenBearsona.name}`)}
        </HeadingMediumText>
        <Space height={16} />

        <Group style={styles.flex}>
          <CircleGridMenu data={menuItems} style={styles.flex} />
          {chosenBearsona.customLanguage && !isOnboarding && <MenuItem {...customLanguageOption} />}
        </Group>
      </View>

      <ConfirmationButton
        confirmTitle={isOnboarding ? tCustomLanguage("common.continue") : tCustomLanguage("common.save")}
        onConfirm={onPressSave}
        isLoading={isLoading}
      />

      <CustomLanguageConfirmationModal
        chosenBearsona={chosenBearsona}
        tCustomLanguage={tCustomLanguage}
        isVisible={isCustomLanguageConfirmationModalVisible}
        setIsVisible={setIsCustomLanguageConfirmationModalVisible}
        onContinue={onContinue}
      />
    </SafeAreaView>
  );
};

const CustomLanguageConfirmationModal = ({ chosenBearsona, isVisible, onContinue, setIsVisible, tCustomLanguage }) => {
  const { t } = useTranslation();

  const onConfirm = () => {
    setIsVisible(false);
    onContinue({ useCustomLanguage: true });
  };

  const onChangeMind = () => {
    setIsVisible(false);
    onContinue({ useCustomLanguage: false });
  };

  return (
    <Modal isVisible={isVisible} onCancel={() => setIsVisible(false)}>
      <Group>
        <Card style={styles.modalContainer}>
          <HeadingMediumText>
            {t("bearsona.useCustomLanguageConfirmation", {
              customLanguage: t("languageName", { lng: chosenBearsona.customLanguage }),
            })}
          </HeadingMediumText>
        </Card>
        <Card style={[styles.modalContainer, styles.gap12]}>
          <BodyLargeText>{t("bearsona.useCustomLanguageConfirmationDesc")}</BodyLargeText>
          <Space height={4} />
          <Button
            onPress={onChangeMind}
            title={t("bearsona.cancelUseCustomLanguage")}
            testID="test:id/custom-language-cancel"
          />
          <Or />
          <SmallButton
            onPress={onConfirm}
            title={tCustomLanguage("bearsona.confirmUseCustomLanguage")}
            testID="test:id/custom-language-continue"
          />
        </Card>
      </Group>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap12: { gap: 12 },
  container: {
    padding: 16,
  },
  modalContainer: {
    borderRadius: 16,
  },
  profilePictureContainer: {
    height: "25%",
    aspectRatio: 1,
    borderRadius: 1000,
    alignSelf: "center",
    overflow: "hidden",
    marginTop: 15,
    marginBottom: 20,
  },
});
