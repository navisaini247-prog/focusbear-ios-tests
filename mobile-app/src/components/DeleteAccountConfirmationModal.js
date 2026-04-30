import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { TextField, Checkbox, BodyMediumText, ConfirmationModal, PressableWithFeedback } from "@/components";
import { useFontScale } from "@/hooks/use-font-scale";
import { StyleSheet, View } from "react-native";
import { useDispatch } from "react-redux";
import { deleteAccountData } from "@/actions/UserActions";
import { addErrorLog } from "@/utils/FileLogger";

export const DeleteAccountConfirmationModal = ({ isVisible, setIsVisible, setLoading }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { isLargeFontScale } = useFontScale();

  const [reason, setReason] = useState("");
  const [isError, setIsError] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const onPressOK = async () => {
    if (!reason) {
      setIsError(true);
      return;
    }

    setIsDeleting(true);
    setLoading(true);
    setIsVisible(false);

    try {
      await dispatch(deleteAccountData(isChecked, reason));
    } catch (error) {
      addErrorLog("Fail to delete account", error);
      setIsDeleting(false);
      setLoading(false);
      setIsVisible(true);
    }
  };

  const onHide = () => {
    if (isDeleting) return; // Prevent closing while deleting
    setIsVisible(false);
    setIsError(false);
    setReason("");
    setIsChecked(false);
  };

  return (
    <ConfirmationModal
      isVisible={isVisible}
      onCancel={onHide}
      cancelTitle={t("common.cancel")}
      onConfirm={onPressOK}
      confirmTitle={t("common.proceed")}
      confirmTestID={"test:id/delete-account"}
      title={t("home.deleteAccount")}
      isLoading={isDeleting}
    >
      <TextField
        placeholder={t("settings.enter_a_reason")}
        value={reason}
        onChangeText={(value) => {
          if (/^\s*$/.test(value)) {
            setReason(value.trim());
          } else {
            setReason(value);
          }
        }}
        multiline
        style={isError && { borderColor: colors.danger }}
        autoFocus
      />
      {isError && <BodyMediumText color={colors.danger}>{t("settings.reason_required")}</BodyMediumText>}
      <PressableWithFeedback
        style={[styles.checkboxContainer, isLargeFontScale && styles.checkboxContainerColumn]}
        onPress={() => setIsChecked(!isChecked)}
        testID="test:id/delete-account-contact-toggle"
      >
        <Checkbox small value={isChecked} testID="test:id/delete-account-contact-checkbox" />
        <View style={styles.flex}>
          <BodyMediumText>{t("settings.contact_desc")}</BodyMediumText>
        </View>
      </PressableWithFeedback>
    </ConfirmationModal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  checkboxContainerColumn: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
});
