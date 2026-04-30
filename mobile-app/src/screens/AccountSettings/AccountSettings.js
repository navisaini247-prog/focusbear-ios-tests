import React, { useState, useMemo, useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import {
  FullPageLoading,
  MenuItemFlatlist,
  Card,
  Group,
  HeadingMediumText,
  BodySmallText,
  BigHeaderScrollView,
} from "@/components";
import { SmallButton } from "@/components";
import { EditNicknameModal } from "@/screens/Settings/EditNicknameModal";
import { useDispatch } from "react-redux";
import { getUserDetails, logout, sendEmailConfirmation } from "@/actions/UserActions";
import { styles as settingsStyles } from "@/screens/Settings/Settings.styles";
import { useTranslation } from "react-i18next";
import { NAVIGATION } from "@/constants";
import { NormalAlert } from "@/utils/GlobalMethods";
import { DeleteAccountConfirmationModal } from "@/components/DeleteAccountConfirmationModal";
import { saveAllowedAppsPreference, saveBlockedAppsPreference } from "@/utils/NativeModuleMethods";
import { addErrorLog, addInfoLog } from "@/utils/FileLogger";
import UserIdCopy from "@/components/UserIdCopy";
import { useSelector } from "@/reducers";
import { emailVerifiedSelector, userEmailSelector, userNicknameSelector } from "@/selectors/UserSelectors";
import Toast from "react-native-toast-message";
import { useIsGuestAccount } from "@/hooks/useIsGuestAccount";
import { usePolling } from "@/hooks/use-polling";
import { useTheme } from "@react-navigation/native";

export const AccountSettings = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const [showDeleteAccountConfirmation, setShowDeleteAccountConfirmation] = useState(false);
  const userEmail = useSelector(userEmailSelector);
  const emailVerified = useSelector(emailVerifiedSelector);
  const isGuestAccount = useIsGuestAccount();
  const userNickname = useSelector(userNicknameSelector);

  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isEditNicknameModalVisible, setIsEditNicknameModalVisible] = useState(false);

  const { startPolling, stopPolling } = usePolling(() => {
    dispatch(getUserDetails());
  }, 30 * 1000);

  useEffect(() => {
    startPolling();

    if (emailVerified) {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling, emailVerified]);

  const logOut = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      addInfoLog("User logging out in account settings!");
      await dispatch(logout());
    } catch (error) {
      addErrorLog("Fail to log out", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [dispatch]);

  const handleResendEmailConfirmation = useCallback(() => {
    setIsResendingVerification(true);
    dispatch(
      sendEmailConfirmation({ email: userEmail, lang: i18n.language, noToken: false }, (hasError) => {
        setIsResendingVerification(false);
        const toastMetadata = {
          type: hasError ? "error" : "success",
          text1: t(hasError ? "common.error" : "common.Success"),
          text2: t(
            hasError ? "common.couldNotProcessTheRequest" : "forgotPassword.weveEmailedYouALinkToResetYourPassword",
          ),
        };
        Toast.show(toastMetadata);
      }),
    );
  }, [dispatch, t]);

  const accountMenuItems = useMemo(
    () => [
      {
        title: t("bearsona.title"),
        onPress: () => navigation.navigate(NAVIGATION.BearsonaSettings),
        icon: "person-circle",
      },
      {
        title: t("subscription.subscription"),
        onPress: () => navigation.navigate(NAVIGATION.Subscription, { isNavigateHome: false }),
        icon: "receipt",
      },
      {
        title: t("common.logout"),
        onPress: () =>
          NormalAlert({
            message: t("home.wantLogout"),
            singleButton: false,
            yesText: t("common.logout"),
          }).then((response) => {
            if (response) {
              logOut();
              saveAllowedAppsPreference([]);
              saveBlockedAppsPreference([]);
            }
          }),
        icon: "log-out",
      },
      {
        title: t("home.deleteAccount"),
        onPress: () => setShowDeleteAccountConfirmation(true),
        icon: "trash",
      },
    ],
    [t, navigation, logOut],
  );

  return (
    <View style={styles.container}>
      <BigHeaderScrollView title={t("settings.account")} contentContainerStyle={styles.bodyContainer}>
        <Group style={styles.menuGroup}>
          <Card style={styles.gap8}>
            <View style={styles.row}>
              <BodySmallText color={colors.subText} style={styles.flex} weight={700}>
                {t("common.nickname")}
              </BodySmallText>
              <SmallButton
                style={styles.smallButton}
                title={t("common.edit")}
                onPress={() => setIsEditNicknameModalVisible(true)}
              />
            </View>
            <HeadingMediumText>{userNickname}</HeadingMediumText>
          </Card>
          <Card style={styles.gap8}>
            <View style={styles.row}>
              <BodySmallText color={colors.subText} weight={700} style={styles.flex}>
                {t("common.email")}
                {!emailVerified && !isGuestAccount && (
                  <BodySmallText color={colors.danger}>
                    {` (${t("settings.pendingVerification").toLowerCase()})`}
                  </BodySmallText>
                )}
              </BodySmallText>
              {!emailVerified && !isGuestAccount && (
                <SmallButton
                  style={styles.smallButton}
                  title={t("common.resend")}
                  onPress={() => handleResendEmailConfirmation()}
                  disabled={isResendingVerification}
                />
              )}
            </View>
            <HeadingMediumText>{userEmail}</HeadingMediumText>
          </Card>
        </Group>

        <MenuItemFlatlist big data={accountMenuItems} />

        <UserIdCopy />
      </BigHeaderScrollView>
      <DeleteAccountConfirmationModal
        isVisible={showDeleteAccountConfirmation}
        setIsVisible={setShowDeleteAccountConfirmation}
        setLoading={setIsDeletingAccount}
      />
      <FullPageLoading show={isLoggingOut || isDeletingAccount} />
      <EditNicknameModal isVisible={isEditNicknameModalVisible} setIsVisible={setIsEditNicknameModalVisible} />
    </View>
  );
};

const styles = StyleSheet.create({
  ...settingsStyles,
  flex: { flex: 1 },
  gap8: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  smallButton: {
    margin: -6,
  },
});
