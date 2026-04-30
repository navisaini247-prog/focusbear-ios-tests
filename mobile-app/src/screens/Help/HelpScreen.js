import React, { useEffect, useMemo, useRef } from "react";
import { Linking, View, Alert } from "react-native";
import PropTypes from "prop-types";
import { MenuItemFlatlist, BigHeaderScrollView } from "@/components";
import { useTranslation } from "react-i18next";
import { NAVIGATION } from "@/constants";
import { styles } from "@/screens/Settings/Settings.styles";
import { POSTHOG_EVENT_NAMES, WEB_URL } from "@/utils/Enums";
import { postHogCapture } from "@/utils/Posthog";
import UserIdCopy from "@/components/UserIdCopy";
import { useDispatch, useSelector } from "react-redux";
import { debugLogPermissionSelector, isAwsBackendEndpointActivatedSelector } from "@/selectors/GlobalSelectors";
import { setActivateAwsBackendEndpoint, setDebugLogPermission } from "@/actions/GlobalActions";

export function HelpScreen({ navigation }) {
  const { t } = useTranslation();
  const timerRef = useRef(null);

  const isAwsBackendEndpointActivated = useSelector(isAwsBackendEndpointActivatedSelector);

  const dispatch = useDispatch();
  const debugLogPermission = useSelector(debugLogPermissionSelector);

  useEffect(() => {
    postHogCapture(POSTHOG_EVENT_NAMES.NAVIGATE_TO_HELP_SCREEN);
  }, []);

  const helpMenuItems = useMemo(
    () => [
      {
        title: t("settings.askForHelp"),
        onPress: () => {
          postHogCapture(POSTHOG_EVENT_NAMES.ASK_FOR_HELP);
          navigation.navigate(NAVIGATION.AskForHelp);
        },
        icon: "chatbubble-ellipses",
      },
      {
        title: t("settings.report_problem"),
        onPress: () => {
          postHogCapture(POSTHOG_EVENT_NAMES.NAVIGATE_TO_REPORT_PROBLEM);
          navigation.navigate(NAVIGATION.ShareLogs, {});
        },
        icon: "bug",
      },
      {
        title: t("settings.discord_server"),
        onPress: () => {
          postHogCapture(POSTHOG_EVENT_NAMES.NAVIGATE_TO_DISCORD_SERVER);
          Linking.openURL(WEB_URL.DISCORD);
        },
        icon: "logo-discord",
      },
      {
        title: t("settings.videoTutorials"),
        onPress: () => {
          postHogCapture(POSTHOG_EVENT_NAMES.NAVIGATE_TO_TUTORIALS);
          navigation.navigate(NAVIGATION.VideoTutorials);
        },
        icon: "logo-youtube",
      },
      {
        title: t("settings.debugLog"),
        onPressIn: () => {
          timerRef.current = setTimeout(() => {
            Alert.alert(t("settings.changedBackendEndpoint", { status: !isAwsBackendEndpointActivated }));
            dispatch(setActivateAwsBackendEndpoint({ status: !isAwsBackendEndpointActivated }));
          }, 5000);
        },
        onPressOut: () => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        },
        onPress: () => dispatch(setDebugLogPermission(!debugLogPermission)),
        icon: "bug",
        type: "switch",
        isSelected: debugLogPermission,
        description: t("settings.debugLogDescription"),
      },
    ],
    [t, debugLogPermission, navigation, dispatch, isAwsBackendEndpointActivated],
  );

  return (
    <View style={styles.container}>
      <BigHeaderScrollView title={t("settings.help")} contentContainerStyle={styles.bodyContainer}>
        <MenuItemFlatlist big data={helpMenuItems} />
        <UserIdCopy />
      </BigHeaderScrollView>
    </View>
  );
}

HelpScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};
