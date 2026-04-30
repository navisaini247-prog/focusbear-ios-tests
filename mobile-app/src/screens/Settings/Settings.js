import React, { useState } from "react";
import { StyleSheet, View, Linking } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useFontScale } from "@/hooks/use-font-scale";
import { styles as settingsStyles } from "@/screens/Settings/Settings.styles";
import {
  BodySmallText,
  HeadingSmallText,
  HeadingXLargeText,
  PressableWithFeedback,
  SmallButton,
  ScalableIcon,
} from "@/components";
import { Button, Dot, BodyMediumText, MenuItemFlatlist, BigHeaderScrollView, Modal } from "@/components";
import { GuestWidget } from "./GuestWidget";
import { EditNicknameModal } from "./EditNicknameModal";
import { useTranslation } from "react-i18next";
import { NAVIGATION } from "@/constants";
import DeviceInfo from "react-native-device-info";
import { useSelector } from "react-redux";
import { emailVerifiedSelector, userEmailSelector, userNicknameSelector } from "@/selectors/UserSelectors";
import { checkIsAndroid, checkIsIOS } from "@/utils/PlatformMethods";
import { useHomeContext } from "../Home/context";
import { macPasswordSelector, passwordRequiredForChangeSettingsSelector } from "@/selectors/UserSelectors";
import { showPasswordModal } from "@/actions/ModalActions";
import { useDispatch } from "react-redux";
import { STATUS } from "@/constants";
import { ENTITLEMENT_ID_TRIAL, POSTHOG_EVENT_NAMES, WEB_URL } from "@/utils/Enums";
import { useIsGuestAccount } from "@/hooks/useIsGuestAccount";
import { postHogCapture } from "@/utils/Posthog";
import FocusGameWebView from "@/screens/SimpleHome/FocusGameWebView";
import { setAppTheme, setFocusGameCompletedFlag } from "@/actions/GlobalActions";
import { appThemeSelector } from "@/selectors/GlobalSelectors";

export function Settings() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isLargeFontScale } = useFontScale();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isGuestAccount = useIsGuestAccount();
  const version = DeviceInfo.getVersion();
  const buildNumber = DeviceInfo.getBuildNumber();
  const appTheme = useSelector(appThemeSelector) || "dark";
  const isDarkModeEnabled = appTheme === "dark";
  const isPasswordRequiredForChangingSettings = useSelector(passwordRequiredForChangeSettingsSelector);
  const getUserUnlockPassword = useSelector(macPasswordSelector);
  const userNickname = useSelector(userNicknameSelector);
  const { allBlockingPermissionsGranted, showBlockedAppsWarning, isUnicasStudyParticipant, bearsona } =
    useHomeContext();

  const ProfilePicture = bearsona.profilePictures.og;

  const [isEditNicknameModalVisible, setIsEditNicknameModalVisible] = useState(false);
  const [showGame, setShowGame] = useState(false);

  const requirePasswordVerification = (callback, enforce = false) => {
    if (getUserUnlockPassword !== STATUS.BLANK_PASSWORD && (isPasswordRequiredForChangingSettings || enforce)) {
      dispatch(showPasswordModal({ onPasswordVerified: callback, forceShow: enforce }));
    } else {
      callback();
    }
  };

  const quickActionsMenuItems = [
    {
      title: t("settings.help"),
      onPress: () => navigation.navigate(NAVIGATION.HelpScreen),
      icon: "chatbubble-ellipses",
    },
    {
      title: t("settings.account"),
      onPress: () => navigation.navigate(NAVIGATION.AccountSettingsScreen),
      icon: "person",
    },
  ];

  const personalizationMenuItems = [
    {
      title: t("blockingSchedule.title"),
      onPress: () => navigation.navigate(NAVIGATION.BlockingScheduleList),
      isWarning: showBlockedAppsWarning,
      icon: "apps",
      testID: "test:id/settings-blocking-schedule",
    },
    {
      title: t("lateNoMore.title"),
      onPress: () => navigation.navigate(NAVIGATION.LateNoMore),
      icon: "alarm",
    },
    ...(checkIsAndroid()
      ? [
          {
            title: t("blockUrl.title"),
            onPress: () => navigation.navigate(NAVIGATION.BlockUrl, {}),
            icon: "web-remove",
            iconType: "MaterialCommunityIcons",
          },
          {
            title: t("settings.DND"),
            onPress: () => navigation.navigate(NAVIGATION.DoNotDisturb, {}),
            icon: "moon",
          },
        ]
      : checkIsIOS()
        ? [
            {
              title: t("blockUrl.title"),
              onPress: () => navigation.navigate(NAVIGATION.ManageBlocklist, {}),
              icon: "web-remove",
              iconType: "MaterialCommunityIcons",
            },
          ]
        : []),
    {
      title: t("settings.editFriction"),
      onPress: () => requirePasswordVerification(() => navigation.navigate(NAVIGATION.FrictionSettingsScreen), true),
      icon: "lock-closed",
      testID: "test:id/settings-edit-friction",
    },
  ];

  const appPreferencesMenuItems = [
    {
      title: t("settings.permissions"),
      onPress: () => navigation.navigate(NAVIGATION.PermissionsScreen),
      isWarning: !allBlockingPermissionsGranted,
      icon: "shield",
      testID: "test:id/settings-permissions",
    },
    {
      title: t("settings.language"),
      subtitle: t("languageName"),
      onPress: () => navigation.navigate(NAVIGATION.LanguageSettings),
      icon: "language",
    },
    {
      title: t("settings.darkMode", { defaultValue: "Dark mode" }),
      icon: "moon",
      type: "switch",
      isSelected: isDarkModeEnabled,
      onPress: () => dispatch(setAppTheme(isDarkModeEnabled ? "light" : "dark")),
      hideChevron: true,
      testID: "test:id/settings-dark-mode-toggle",
    },
  ];

  const focusGamesMenuItems = [
    {
      title: t("simpleHome.focusGameTitle"),
      onPress: () => {
        postHogCapture(POSTHOG_EVENT_NAMES.SIMPLE_HOME_FOCUS_GAME_CLICKED);
        setShowGame(true);
      },
      icon: "game-controller",
      testID: "test:id/open-focus-game",
    },
  ];

  const moreMenuItems = [
    {
      title: t("settings.discord_server"),
      onPress: () => {
        postHogCapture(POSTHOG_EVENT_NAMES.NAVIGATE_TO_DISCORD_SERVER);
        Linking.openURL(WEB_URL.DISCORD);
      },
      icon: "logo-discord",
    },
    {
      title: t("common.privacyPolicy"),
      onPress: () =>
        navigation.navigate(NAVIGATION.PrivacyTerms, {
          isFrom: t("common.privacyPolicy"),
        }),
      icon: "document",
    },
    {
      title: t("common.termsOfUse"),
      onPress: () =>
        navigation.navigate(NAVIGATION.PrivacyTerms, {
          isFrom: t("common.termsOfUse"),
        }),
      icon: "document",
    },
    ...(isUnicasStudyParticipant
      ? [
          {
            title: t("participantCode.unicasStudy"),
            onPress: () => navigation.navigate(NAVIGATION.DataCollectionOnly, { showBackButton: true }),
            icon: "heart",
          },
        ]
      : []),
  ];

  return (
    <View style={styles.container}>
      <BigHeaderScrollView title={t("settings.title")} hideBackButton contentContainerStyle={styles.bodyContainer}>
        <View style={[isLargeFontScale ? styles.column : styles.row, styles.userAccountWidget, styles.flexWrap]}>
          <PressableWithFeedback
            onPress={() => navigation.navigate(NAVIGATION.BearsonaSettings)}
            style={[styles.userButton, { borderColor: colors.separator }]}
            testID="test:id/bearsona-settings-button"
          >
            <ProfilePicture style={styles.bearsonaImage} />
          </PressableWithFeedback>

          <View style={[styles.flex, styles.gap4, styles.userAccountText]}>
            <HeadingXLargeText>
              {isGuestAccount ? t("home.guestMode") : `${userNickname} `}
              {!isGuestAccount && (
                <PressableWithFeedback
                  onPress={() => setIsEditNicknameModalVisible(true)}
                  style={styles.editLink}
                  hitSlop={8}
                  testID="test:id/edit-nickname-button"
                >
                  <BodyMediumText underline color={colors.primary}>
                    {t("common.edit").toLowerCase()}
                  </BodyMediumText>
                </PressableWithFeedback>
              )}
            </HeadingXLargeText>
            {isGuestAccount ? <GuestWidget /> : <UserShortcutRow />}
          </View>
        </View>

        <View
          style={[
            styles.menuGroup,
            styles.quickActionsContainer,
            isLargeFontScale ? styles.column : styles.quickActionsRow,
          ]}
        >
          {quickActionsMenuItems.map((item) => (
            <Button
              subtle
              onPress={item.onPress}
              style={[styles.quickActionButton, styles.gap12, !isLargeFontScale && styles.quickActionButtonRow]}
              key={item.title}
              testID={`test:id/settings-quick-action-${item.title}`}
            >
              <View style={styles.quickActionContent}>
                <ScalableIcon name={item.icon} size={24} color={colors.primary} />
                <BodySmallText center style={styles.quickActionText}>
                  {item.title}
                </BodySmallText>
              </View>
            </Button>
          ))}
        </View>

        <BodySmallText color={colors.subText} style={styles.sectionLabel}>
          {t("settings.customization")}
        </BodySmallText>
        <MenuItemFlatlist
          big
          data={personalizationMenuItems}
          style={styles.menuGroup}
          isLargeFontScale={isLargeFontScale}
        />

        <BodySmallText color={colors.subText} style={styles.sectionLabel}>
          {t("settings.general")}
        </BodySmallText>
        <MenuItemFlatlist
          big
          data={appPreferencesMenuItems}
          style={styles.menuGroup}
          isLargeFontScale={isLargeFontScale}
        />

        <BodySmallText color={colors.subText} style={styles.sectionLabel}>
          {t("settings.focusGames")}
        </BodySmallText>
        <MenuItemFlatlist big data={focusGamesMenuItems} style={styles.menuGroup} isLargeFontScale={isLargeFontScale} />

        <BodySmallText color={colors.subText} style={styles.sectionLabel}>
          {t("common.more")}
        </BodySmallText>
        <MenuItemFlatlist big data={moreMenuItems} style={styles.menuGroup} isLargeFontScale={isLargeFontScale} />

        <BodySmallText center color={colors.subText}>{`${version} (${buildNumber})`}</BodySmallText>
      </BigHeaderScrollView>
      <EditNicknameModal isVisible={isEditNicknameModalVisible} setIsVisible={setIsEditNicknameModalVisible} />
      <Modal isVisible={showGame} onCancel={() => setShowGame(false)} fullScreen>
        <FocusGameWebView
          onClose={() => {
            setShowGame(false);
            dispatch(setFocusGameCompletedFlag(true));
          }}
        />
      </Modal>
    </View>
  );
}

// Displays the user's email and a different button based on email verification and subscription status
const UserShortcutRow = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isLargeFontScale } = useFontScale();
  const navigation = useNavigation();
  const userEmail = useSelector(userEmailSelector);
  const emailVerified = useSelector(emailVerifiedSelector);
  const userSubscriptionDetails = useSelector((state) => state.user?.userSubscriptionDetails);
  const hasActiveSubscription = userSubscriptionDetails?.hasActiveSubscription;
  const hasTrialSubscription =
    hasActiveSubscription && userSubscriptionDetails?.activeEntitlements?.[0] === ENTITLEMENT_ID_TRIAL;

  const [text, onPress] = (() => {
    if (!emailVerified) {
      // Email not verified
      return [t("settings.verifyEmail"), () => navigation.navigate(NAVIGATION.AccountSettingsScreen)];
    } else if (hasTrialSubscription) {
      // Trial subscription
      const day = userSubscriptionDetails?.expirations?.trial?.days_left || "?";
      return [t("subscription.trialActiveShort", { day }), null];
    } else if (hasActiveSubscription) {
      // Active subscription
      return [t("subscription.thanksForSubscribingShort"), null];
    } else {
      // No subscription
      return [t("subscription.upgrade"), () => navigation.navigate(NAVIGATION.Subscription)];
    }
  })();

  const isImportant = !emailVerified;

  return (
    <>
      <HeadingSmallText color={colors.subText}>{`${userEmail}`}</HeadingSmallText>
      <View style={[isLargeFontScale ? styles.column : styles.row, styles.userShortcutRow, styles.flexWrap]}>
        {onPress ? (
          <SmallButton
            subtle={!isImportant}
            onPress={onPress}
            title={text}
            titleNumberOfLines={2}
            renderLeftIcon={isImportant && <Dot size={6} />}
            renderRightIcon={<ScalableIcon name="chevron-forward" size={14} color={colors.text} />}
          />
        ) : (
          <HeadingSmallText>{text}</HeadingSmallText>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  ...settingsStyles,
  flex: { flex: 1 },
  gap4: { gap: 4 },
  gap12: { gap: 12 },
  column: { flexDirection: "column" },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  flexWrap: {
    flexWrap: "wrap",
  },
  userAccountText: {
    flexShrink: 1,
    minWidth: 0,
  },
  userAccountWidget: {
    paddingBottom: 12,
    gap: 16,
    alignItems: "flex-start",
  },
  userButton: {
    width: 90,
    aspectRatio: 1,
    borderRadius: 1000,
    borderWidth: 1,
  },
  quickActionsContainer: {
    gap: 8,
  },
  quickActionButton: {
    minWidth: 0,
  },
  quickActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  quickActionButtonRow: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 150,
  },
  quickActionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
    maxWidth: "100%",
  },
  quickActionText: {
    flexShrink: 1,
    minWidth: 0,
  },
  bearsonaImage: {
    width: "100%",
    height: "100%",
  },
  userShortcutRow: {
    marginTop: 6,
  },
  editLink: {
    transform: [{ translateY: 4 }],
  },
});
