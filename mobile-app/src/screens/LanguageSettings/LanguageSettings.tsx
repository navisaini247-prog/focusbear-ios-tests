import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { styles as settingsStyles } from "@/screens/Settings/Settings.styles";
import {
  MenuItemFlatlist,
  MenuItemProps,
  BodySmallText,
  BigHeaderScrollView,
  SheetModal,
  ModalHeader,
} from "@/components";
import { useFontScale } from "@/hooks/use-font-scale";
import { LanguageKeys } from "@/localization/i18n";
import { systemLanguage } from "@/localization";
import { appLanguageSelector } from "@/selectors/GlobalSelectors";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { setAppLanguage } from "@/actions/GlobalActions";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ENGLISH_VARIANTS = ["en_pirate", "en_jester", "en_sassy", "en_cheer"];

export const LanguageSettings = () => {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { isLargeFontScale } = useFontScale();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const appLanguage = useSelector(appLanguageSelector) || null;
  const [isEnglishModalVisible, setIsEnglishModalVisible] = useState(false);

  const systemLanguageOption: MenuItemProps = {
    title: t("settings.useSystemLanguage"),
    description: `(${t("languageName", { lng: systemLanguage })})`,
    onPress: () => setLanguage(null),
    isSelected: appLanguage === null,
  };

  const setLanguage = (language: LanguageKeys) => {
    dispatch(setAppLanguage(language));
    navigation.goBack();
  };

  const baseLanguages = [...i18n.languages].filter((lang) => !ENGLISH_VARIANTS.includes(lang)).sort();

  const englishVariants = [...i18n.languages].filter((lang) => ENGLISH_VARIANTS.includes(lang)).sort();

  const baseLanguageItems: MenuItemProps[] = baseLanguages.map((language) => {
    if (language === "en") {
      return {
        title: t("languageName", { lng: language }),
        onPress: () => setIsEnglishModalVisible(true),
        isSelected: appLanguage === language || ENGLISH_VARIANTS.includes(appLanguage as string),
        type: "checkmark",
        trailingIcon: "chevron-expand",
      };
    }
    return {
      title: t("languageName", { lng: language }),
      onPress: () => setLanguage(language as LanguageKeys),
      isSelected: appLanguage === language,
      type: "checkmark",
    };
  });

  const englishMainOption: MenuItemProps = {
    title: t("languageName", { lng: "en" }),
    description: t("bearsona.description.default"),
    onPress: () => setLanguage("en"),
    isSelected: appLanguage === "en",
  };

  const englishVariantItems: MenuItemProps[] = englishVariants.map((language) => ({
    title: t("languageName", { lng: language }),
    onPress: () => setLanguage(language as LanguageKeys),
    isSelected: appLanguage === language,
  }));

  return (
    <>
      <BigHeaderScrollView
        title={t("settings.language")}
        contentContainerStyle={[styles.bodyContainer, { paddingBottom: insets.bottom + 12 }]}
      >
        <MenuItemFlatlist
          type="checkmark"
          data={[systemLanguageOption]}
          style={styles.systemLanguageOption}
          isLargeFontScale={isLargeFontScale}
        />
        <BodySmallText color={colors.subText} style={styles.sectionLabel}>
          {t("settings.supportedLanguages")}
        </BodySmallText>
        <MenuItemFlatlist data={baseLanguageItems} style={styles.menuGroup} isLargeFontScale={isLargeFontScale} />
      </BigHeaderScrollView>

      <SheetModal
        isVisible={isEnglishModalVisible}
        onCancel={() => setIsEnglishModalVisible(false)}
        HeaderComponent={<ModalHeader title={t("settings.englishVariants", { defaultValue: "English Variants" })} />}
      >
        <View style={[styles.modalContent, styles.gap12]}>
          <MenuItemFlatlist type="checkmark" data={[englishMainOption]} isLargeFontScale={isLargeFontScale} />
          <MenuItemFlatlist type="checkmark" data={englishVariantItems} isLargeFontScale={isLargeFontScale} />
        </View>
      </SheetModal>
    </>
  );
};

const styles = StyleSheet.create({
  ...settingsStyles,
  gap12: { gap: 12 },
  systemLanguageOption: {
    marginBottom: 24,
  },

  modalContent: {
    padding: 16,
    paddingTop: 8,
  },
});
