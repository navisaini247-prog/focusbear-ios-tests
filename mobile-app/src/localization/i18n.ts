import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { findBestLanguageTag } from "react-native-localize";
import en from "./en";
import es from "./es";
import de from "./de";
import ja from "./ja";
import vi from "./vi";
import zh_CN from "./zh-CN";
import zh_TW from "./zh-TW";

// Bearsona languages
import en_pirate from "./en-pirate";
import en_jester from "./en-jester";
import en_sassy from "./en-sassy";
import en_cheer from "./en-cheer";

const languages = { en, es, de, ja, vi, zh_CN, en_pirate, en_jester, en_sassy, en_cheer, zh_TW };

export type LanguageKeys = keyof typeof languages;

const resources = Object.fromEntries(Object.entries(languages).map(([key, value]) => [key, { translation: value }]));

if (resources.zh_TW) {
  resources["zh-TW"] = resources.zh_TW;
}

export const baseLanguages = Object.values(languages)
  .map((lng) => lng.baseLanguage)
  .filter((lng, index, array) => index === array.indexOf(lng));

export const systemLanguage = findBestLanguageTag(baseLanguages)?.languageTag || "en";

i18n.use(initReactI18next).init({
  interpolation: {
    escapeValue: false,
    prefix: "{",
    suffix: "}",
  },
  resources,
  fallbackLng: Object.keys(languages),
  lng: systemLanguage,
});

export default i18n;
