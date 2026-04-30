import React, { useState } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Button } from "@/components";
import Icon from "react-native-vector-icons/Ionicons";
import { FocusNotesModal } from "./FocusNotesModal";
import { useTheme } from "@react-navigation/native";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";

interface FocusNotesButtonProps {
  containerStyle?: ViewStyle;
}

export const FocusNotesButton = ({ containerStyle }: FocusNotesButtonProps) => {
  const { colors } = useTheme();
  const [isFocusNotesModalVisible, setIsFocusNotesModalVisible] = useState(false);

  return (
    <>
      <View style={containerStyle}>
        <Button
          onPress={() => {
            postHogCapture(POSTHOG_EVENT_NAMES.FOCUS_NOTES_MODAL_OPENED);
            setIsFocusNotesModalVisible(true);
          }}
          style={[styles.row, styles.focusNotesButton]}
          testID="test:id/focus-notes-button"
        >
          <Icon name="document-text" size={30} color={colors.text} />
        </Button>
      </View>
      <FocusNotesModal isVisible={isFocusNotesModalVisible} setIsVisible={setIsFocusNotesModalVisible} />
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  focusNotesButton: {
    borderRadius: 0,
    borderTopLeftRadius: 100,
    borderBottomLeftRadius: 100,
    borderRightWidth: 0,
    paddingLeft: 24,
    minHeight: 64,
    paddingRight: 30,
  },
});
