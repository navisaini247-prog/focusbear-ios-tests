import React from "react";
import { useWindowDimensions } from "react-native";
import { Card, Group } from "@/components";
import { actions, RichEditor, RichToolbar } from "react-native-pell-rich-editor";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";

export const AddNote = ({ richTextRef, noteText, setNoteText }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { height: screenHeight } = useWindowDimensions();

  return (
    <Group>
      <Card noPadding style={{ height: screenHeight * 0.25 }}>
        <RichEditor
          useContainer={false}
          placeholder={t("addNoteModule.placeholder")}
          ref={richTextRef}
          androidLayerType="software"
          initialContentHTML={noteText}
          onChange={(descriptionText) => {
            setNoteText(descriptionText);
          }}
          editorStyle={{
            backgroundColor: colors.secondary,
            color: colors.text,
            placeholderColor: colors.subText,
          }}
        />
      </Card>
      <Card noPadding>
        <RichToolbar
          style={{ backgroundColor: colors.secondary }}
          iconTint={colors.subText}
          selectedIconTint={colors.primary}
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
      </Card>
    </Group>
  );
};
