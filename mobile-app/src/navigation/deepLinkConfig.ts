import { NAVIGATION } from "@/constants";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { LinkingOptions } from "@react-navigation/native";
import moment from "moment";
import { Linking } from "react-native";
import { NativeModules } from "react-native";

const { Window } = NativeModules;

export const prefixes = ["focusbear://"];

const parseDuration = (duration: string) => {
  if (duration?.startsWith("PT")) {
    const mins = moment.duration(duration).minutes();
    if (Number.isFinite(mins) && mins > 0) {
      return mins;
    }
    return 25;
  }
  // Handle numeric duration from other shortcuts
  return parseInt(duration, 10) || 25;
};

export const linking: LinkingOptions<any> = {
  prefixes: prefixes,
  config: {
    screens: {
      [NAVIGATION.TabNavigator]: {
        screens: {
          [NAVIGATION.Home]: {
            path: "home",
            parse: {
              action: (action: string) => action,
              duration: parseDuration,
              intention: (intention: string) => decodeURIComponent(intention || ""),
              name: (name: string) => decodeURIComponent(name || ""),
            },
          },
          [NAVIGATION.Focus]: {
            path: "focus",
          },
        },
      },
      [NAVIGATION.BreathingExercise]: {
        path: "breathing-exercise/:appName?/:packageName?",
      },
      [NAVIGATION.LateNoMore]: {
        path: "late-no-more",
      },
      [NAVIGATION.PermissionsScreen]: {
        path: "permissions",
      },
      [NAVIGATION.CustomizeBlocking]: {
        path: "settings/custom-blocked-message",
      },
    },
  },
};

export const openBreathingExercise = (appName: string, packageId: string) => {
  const deepLinkUrl = `focusbear://breathing-exercise/${appName}/${packageId}`;

  if (checkIsAndroid()) {
    Window.openDeepLinkOverlay(deepLinkUrl);
  } else {
    Linking.openURL(deepLinkUrl);
  }
};
