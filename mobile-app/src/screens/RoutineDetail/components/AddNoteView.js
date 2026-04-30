import React from "react";
import { View, KeyboardAvoidingView, Pressable, StyleSheet } from "react-native";
import { BodyMediumText } from "@/components";
import { useTranslation } from "react-i18next";
import { actions, RichEditor, RichToolbar } from "react-native-pell-rich-editor";
import { useRoutineDetailContext } from "../context/context";
import { checkIsIOS } from "@/utils/PlatformMethods";
import { useFontScale } from "@/hooks/use-font-scale";

// This component is used for adding and editing notes.
// The component shows up only when the taking note option during habit is true, and it auto-saves the note as the user types.
const AddNoteView = () => {
  const { noteText, setNoteText, richTextRef, shouldShowAddNoteViewDuringActivity } = useRoutineDetailContext();
  const { t } = useTranslation();
  const { isLargeFontScale } = useFontScale();

  const onChange = (text) => {
    setNoteText(text);
  };

  if (!shouldShowAddNoteViewDuringActivity) {
    return null;
  }

  return (
    <Pressable
      onPress={() => richTextRef.current.dismissKeyboard()}
      style={[styles.flex, isLargeFontScale ? styles.paddingTopScaled : styles.paddingTop]}
      testID="test:id/add-note-dismiss-keyboard"
    >
      <View style={styles.flex}>
        <BodyMediumText center style={isLargeFontScale ? styles.autoSaveScaled : styles.autoSave}>
          {t("addNoteModule.automaticallySave")}
        </BodyMediumText>
        <KeyboardAvoidingView style={styles.flex} behavior={checkIsIOS() ? "padding" : null}>
          <RichToolbar
            editor={richTextRef}
            actions={[
              actions.setBold,
              actions.setItalic,
              actions.setUnderline,
              actions.setStrikethrough,
              actions.undo,
              actions.redo,
              actions.keyboard,
            ]}
          />
          <RichEditor
            useContainer={false}
            placeholder={t("addNoteModule.placeholder")}
            ref={richTextRef}
            androidLayerType="software"
            initialContentHTML={noteText}
            onChange={onChange}
          />
        </KeyboardAvoidingView>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  paddingTop: {
    paddingTop: 12,
  },
  paddingTopScaled: {
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  autoSave: {
    marginBottom: 12,
  },
  autoSaveScaled: {
    marginBottom: 16,
  },
});

export default AddNoteView;
