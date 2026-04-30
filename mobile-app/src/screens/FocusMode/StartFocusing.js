import React, { memo } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { HeadingWithInfo, Space, TextField, Group, Card } from "@/components";
import { useTranslation } from "react-i18next";
import { TimePicker } from "./TimePicker";
import { StrictnessToggle } from "./FocusSettings";
import { styles } from "./FocusMode.styles";
import { useDispatch } from "react-redux";

const StartFocusing = ({ setFocusTime, focusNotes, setFocusModeNotes, isSuperStrict, setIsSuperStrict }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const setFocusIntention = (intention) => dispatch(setFocusModeNotes({ ...focusNotes, intention }));

  return (
    <KeyboardAwareScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContentContainer, styles.scrollContentContainerEnd, styles.padding16]}
    >
      <View>
        <HeadingWithInfo infoTestID="test:id/focus-intention-tooltip" infoText={t("focusMode.focusIntentionTooltip")}>
          {t("focusMode.userIntention")}
        </HeadingWithInfo>
        <Space height={8} />
        <Group>
          <TextField
            testID="test:id/enter-an-intention"
            placeholder={t("focusMode.userIntentionTextInputPlaceholder")}
            value={focusNotes?.intention || ""}
            onChangeText={setFocusIntention}
            clearable
          />
          <StrictnessToggle {...{ isSuperStrict, setIsSuperStrict }} />
        </Group>
      </View>

      <Space height={32} />
      <Card style={styles.timePickerCard}>
        <TimePicker onTimePickerChange={setFocusTime} />
      </Card>
      <Space height={8} />
    </KeyboardAwareScrollView>
  );
};

export default memo(StartFocusing);
