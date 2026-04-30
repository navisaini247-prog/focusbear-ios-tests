import React from "react";
import { useTranslation } from "react-i18next";
import { HeadingWithInfo } from "@/components";
import { NAVIGATION } from "@/constants";
import { IconSunWakeUp, IconFinishWork, IconMoonSleep } from "@/assets";
import { SvgProps } from "react-native-svg";
import { ViewStyle, TextStyle } from "react-native";

type ScreenName = typeof NAVIGATION.TimeSetup | typeof NAVIGATION.Shutdown | typeof NAVIGATION.SleepSetup;

interface TimeSetupConfigItem {
  icon: React.FC<SvgProps>;
}

interface TimeSetupConfig {
  [key: string]: TimeSetupConfigItem;
}

interface TranslationParams {
  [key: string]: string | number;
}

// Constants
export const HEADING_IMAGE_HEIGHT = 40;

// Configuration object for different time setup screens
export const TIME_SETUP_CONFIG: TimeSetupConfig = {
  [NAVIGATION.TimeSetup]: {
    icon: IconSunWakeUp,
  },
  [NAVIGATION.Shutdown]: {
    icon: IconFinishWork,
  },
  [NAVIGATION.SleepSetup]: {
    icon: IconMoonSleep,
  },
};

interface TimeSetupIconProps {
  screenName: ScreenName;
  styles: {
    image_style: ViewStyle;
    moon_image_style: ViewStyle;
  };
}

/**
 * Icon component for the time setup screens
 */
export const TimeSetupIcon: React.FC<TimeSetupIconProps> = ({ screenName, styles }) => {
  const Icon = TIME_SETUP_CONFIG[screenName].icon;
  return (
    <Icon
      height={HEADING_IMAGE_HEIGHT}
      style={[styles.image_style, screenName !== NAVIGATION.TimeSetup && styles.moon_image_style]}
    />
  );
};

interface TimeSetupDescriptionProps {
  screenName: ScreenName;
  textKey: string;
  tooltipText: string;
  styles: {
    descriptionText: TextStyle;
  };
  translationParams?: TranslationParams;
  testID?: string;
}

/**
 * Description text component with tooltip wrapper
 */
export const TimeSetupDescription: React.FC<TimeSetupDescriptionProps> = ({
  textKey,
  tooltipText,
  translationParams,
  testID,
}) => {
  const { t } = useTranslation();
  return (
    <HeadingWithInfo center numberOfLines={10} ellipsizeMode="tail" infoText={t(tooltipText)} infoTestID={testID}>
      {t(textKey, translationParams)}
    </HeadingWithInfo>
  );
};
