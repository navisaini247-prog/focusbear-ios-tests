import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { BodyMediumText, Button, ModalHeader, SheetModal, TextField } from "@/components";
import { useFontScale } from "@/hooks/use-font-scale";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { addErrorLog } from "@/utils/FileLogger";
import { useSelector } from "@/reducers";
import { userNicknameSelector } from "@/selectors/UserSelectors";
import { useTheme } from "@react-navigation/native";
import { updateUserNickname } from "@/actions/UserActions";

export const EditNicknameModal = ({ setIsVisible, isVisible }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { isLargeFontScale } = useFontScale();
  const userNickname = useSelector(userNicknameSelector);

  const [nickname, setNickname] = useState(userNickname);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const onSave = async () => {
    if (!nickname?.trim()) return;
    setIsSaving(true);

    try {
      setErrorMessage("");
      await dispatch(updateUserNickname(nickname?.trim()));
      setIsVisible(false);
    } catch (error) {
      setErrorMessage(
        error?.response?.status === 409 ? t("settings.nicknameAlreadyExists") : t("settings.nicknameError"),
      );
      addErrorLog("Fail to update nickname", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SheetModal
      isVisible={isVisible}
      onCancel={() => setIsVisible(false)}
      HeaderComponent={<ModalHeader title={t("settings.editNickname")} />}
    >
      <View style={[styles.modalContentContainer, styles.gap12]}>
        <TextField
          value={nickname}
          onChangeText={setNickname}
          errorMessage={Boolean(errorMessage)}
          submitBehavior="blurAndSubmit"
          onSubmitEditing={onSave}
          clearable
          autoFocus
        />
        {errorMessage && <BodyMediumText color={colors.danger}>{errorMessage}</BodyMediumText>}

        <View style={[isLargeFontScale ? styles.column : styles.row, styles.gap12]}>
          <Button
            title={t("common.cancel")}
            style={styles.flex}
            onPress={() => setIsVisible(false)}
            testID="test:id/cancel-button"
          />
          <Button
            primary
            title={t("common.save")}
            style={styles.flex}
            onPress={onSave}
            isLoading={isSaving}
            disabled={!nickname?.trim()}
            testID="test:id/save-button"
          />
        </View>
      </View>
    </SheetModal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap12: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  column: {
    flexDirection: "column",
  },
  modalContentContainer: {
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },
});
