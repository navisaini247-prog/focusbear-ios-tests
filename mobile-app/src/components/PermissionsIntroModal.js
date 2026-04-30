import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { icFocusBear, icFocusBearWhite } from "@/assets";
import { useTheme } from "@react-navigation/native";
import { useTranslation, Trans } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { HeadingLargeText, BodyMediumText, ConfirmationButton, Modal, Separator, BodyLargeText, Card } from ".";
import { PermissionWarningInfoTile } from "./PermissionWarningInfoTile";

export const PermissionsIntroModal = ({ isVisible, onConfirm, onCancel }) => {
  const { colors, isDarkTheme } = useTheme();
  const { t } = useTranslation();

  const ICON_TYPE = "negation";

  return (
    <Modal isVisible={isVisible} onCancel={onCancel} fullScreen backdropColor={colors.background}>
      <SafeAreaView edges={["top"]} style={styles.contentContainer}>
        <Image source={isDarkTheme ? icFocusBearWhite : icFocusBear} style={styles.logoImage} />
        <HeadingLargeText center>{t("permissions.privacyFirst")}</HeadingLargeText>
        <Card>
          <View style={styles.infoContainer}>
            <BodyMediumText>
              <Trans
                i18nKey="permissions.notTracked"
                components={{
                  bold: <BodyMediumText weight="700" />,
                }}
              />
            </BodyMediumText>
            <Separator />
            <PermissionWarningInfoTile
              type={ICON_TYPE}
              colors={colors}
              title={t("permissions.anythingType")}
              description={t("permissions.anythingTypeDescription")}
            />
            <Separator />
            <PermissionWarningInfoTile
              type={ICON_TYPE}
              colors={colors}
              title={t("permissions.browserHistory")}
              description={t("permissions.browserHistoryDescription")}
            />
          </View>
        </Card>
        <BodyLargeText style={styles.marginVertical10} center>
          {t("permissions.helpStayFocused")}
        </BodyLargeText>
      </SafeAreaView>
      <ConfirmationButton
        onConfirm={onConfirm}
        confirmTestID={"test:id/confirm-privacy-first"}
        confirmTitle={t("common.continue")}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  marginVertical10: {
    marginVertical: 10,
  },
  contentContainer: {
    flex: 1,
    padding: 32,
    gap: 38,
  },
  logoImage: {
    alignSelf: "center",
    height: 70,
    width: 180,
    resizeMode: "contain",
  },
  infoContainer: {
    padding: 20,
    gap: 25,
    alignItems: "center",
  },
});
