import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { styles } from "./FocusMode.styles";
import {
  TextField,
  Group,
  Card,
  DisplaySmallText,
  HeadingSmallText,
  BodyMediumText,
  BodySmallText,
} from "@/components";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

const FinishFocusing = ({
  focusNotes,
  timeString,
  achievedInput,
  setAchievedInput,
  distractionInput,
  setDistractionInput,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView edges={["top"]} style={styles.flex}>
      <KeyboardAwareScrollView contentContainerStyle={[styles.scrollContentContainer, styles.padding16]}>
        <DisplaySmallText color={colors.success}>{t("focusMode.congratulations")}</DisplaySmallText>
        <HeadingSmallText style={styles.subHeader}>{t("focusMode.focusDoneTitle")}</HeadingSmallText>

        <Group>
          <Card>
            <BodySmallText style={styles.label}>{t("focusMode.focusDoneDescription")}</BodySmallText>
            <DisplaySmallText weight="300">{timeString}</DisplaySmallText>
          </Card>
          <Card>
            <BodySmallText style={styles.label}>{t("focusMode.focusDoneDescription1")}</BodySmallText>
            <BodyMediumText>{focusNotes.intention.trim() || t("focusMode.noIntentionWasFound")}</BodyMediumText>
          </Card>
          <Card>
            <BodySmallText style={styles.label}>{t("focusMode.focusDoneDescription4")}</BodySmallText>
            <BodyMediumText>
              {focusNotes.thoughts.trim() || t("focusMode.noDistractingThoughtsWasFound")}
            </BodyMediumText>
          </Card>
        </Group>

        <HeadingSmallText style={styles.subHeader}>{t("focusMode.focusDoneDescription2")}</HeadingSmallText>
        <TextField
          testID="test:id/enter-finish-focusing-desc2"
          placeholder={t("focusMode.focusDonePlaceholderDescription2")}
          value={achievedInput}
          onChangeText={setAchievedInput}
          multiline
        />

        <HeadingSmallText style={styles.subHeader}>{t("focusMode.focusDoneDescription3")}</HeadingSmallText>
        <TextField
          testID="test:id/enter-finish-focusing-desc3"
          placeholder={t("focusMode.focusDonePlaceholderDescription3")}
          value={distractionInput}
          onChangeText={setDistractionInput}
          multiline
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default memo(FinishFocusing);
