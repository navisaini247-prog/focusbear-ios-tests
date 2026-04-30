import React from "react";
import { View, ScrollView, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { icFocusBear, icFocusBearWhite } from "@/assets";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Modal } from "./Modal";
import {
  BodyMediumText,
  HeadingLargeText,
  Card,
  Separator,
  ConfirmationButton,
  PermissionWarningInfoTile,
} from "@/components";

export const AccessibilityPermissionModal = ({ isVisible, onConfirm, onCancel }) => {
  const { colors, isDarkTheme } = useTheme();
  const { t } = useTranslation();

  const ICON_TYPE = "check";

  return (
    <Modal isVisible={isVisible} onCancel={onCancel} fullScreen backdropColor={colors.background}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <Image source={isDarkTheme ? icFocusBearWhite : icFocusBear} style={styles.logoImage} />
          <HeadingLargeText center>{t("accessibility.permissionRequired")}</HeadingLargeText>
          <BodyMediumText center>{t("accessibility.permissionDescription")}</BodyMediumText>

          <Card>
            <View style={styles.infoContainer}>
              <BodyMediumText>{t("accessibility.whatWeDo")}</BodyMediumText>
              <Separator />
              <PermissionWarningInfoTile
                colors={colors}
                title={t("accessibility.checkSites")}
                description={t("accessibility.checkSitesDescription")}
                type={ICON_TYPE}
              />
            </View>
          </Card>

          <BodyMediumText center>{t("accessibility.zeroDataTracked")}</BodyMediumText>
        </ScrollView>
      </SafeAreaView>
      <ConfirmationButton
        onConfirm={onConfirm}
        onCancel={onCancel}
        cancelTitle={t("common.cancel")}
        confirmTitle={t("permissionWarning.grantAccess")}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 32,
    gap: 40,
  },
  logoImage: {
    alignSelf: "center",
    height: 70,
    width: 180,
    resizeMode: "contain",
  },
  infoContainer: {
    padding: 10,
    gap: 15,
    alignItems: "center",
  },
});
