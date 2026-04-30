import React from "react";
import { View, StyleSheet } from "react-native";
import { BodyMediumText } from "@/components/Text";
import { useTranslation } from "react-i18next";
import { Button, Card } from "@/components";
import { useTheme } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { NAVIGATION } from "@/constants";

export const NoPermissionComponent = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();

  const onGrantPermission = () => {
    navigation.navigate(NAVIGATION.PermissionsScreen);
  };

  return (
    <View style={styles.container}>
      <Card>
        <BodyMediumText color={colors.danger}>{t("appUsage.noPermission")}</BodyMediumText>
        <Button onPress={onGrantPermission} style={styles.button} testID="test:id/no-permission-grant-button">
          <BodyMediumText>{t("appUsage.grantPermission")}</BodyMediumText>
        </Button>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  button: {
    marginTop: 16,
  },
});
