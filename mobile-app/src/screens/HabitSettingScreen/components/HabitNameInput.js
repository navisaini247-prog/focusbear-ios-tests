import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { TextField } from "@/components";
import { EmojiPicker } from "@/screens/EditQuickBreaksScreen/components/EmojiPicker";
import { useFontScale } from "@/hooks/use-font-scale";

export const NameAndEmojiInput = memo(function NameAndEmojiInput({ name, setName, emoji, setEmoji, ...props }) {
  const { isLargeFontScale } = useFontScale();

  return (
    <View style={styles.row}>
      <TextField
        multiline
        style={styles.flex}
        inputStyle={isLargeFontScale ? styles.inputScaled : styles.input}
        testID="test:id/habit-name"
        value={name}
        onChangeText={setName}
        {...props}
      />
      <View style={styles.emojiPickerContaier}>
        <EmojiPicker value={emoji} onChange={setEmoji} compact />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row", alignItems: "flex-start" },
  input: {
    fontSize: 18,
    paddingLeft: 56,
    minHeight: 48,
    textAlignVertical: "center",
  },
  inputScaled: {
    fontSize: 22,
    paddingLeft: 56,
    minHeight: 60,
    textAlignVertical: "center",
  },
  emojiPickerContaier: {
    position: "absolute",
    top: 3,
    left: 4,
    zIndex: 20,
  },
});
