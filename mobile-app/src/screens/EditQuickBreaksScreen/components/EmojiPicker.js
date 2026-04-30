import React, { memo, useState, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { View, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { BodyXSmallText, HeadingSmallText, SmallButton, ScalableIcon, Text } from "@/components";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import EmojiSelector from "react-native-emoji-selector";
import { useFontScale } from "@/hooks/use-font-scale";
import { scaleByFontScale, FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";

// All of the positive Material Icons emoticons (i.e. excludig "sick", "cry", "dead", "poop", "confused", "frown" and "sad")
const EMOJI_VARIATIONS = ["angry", "cool", "devil", "excited", "happy", "kiss", "lol", "neutral", "tongue", "wink"];

const getRandomItem = (items) => items[Math.floor(Math.random() * items.length)];

const MemoizedEmojiSelector = React.memo(EmojiSelector);

export const EmojiPicker = memo(function EmojiPicker({ value, onChange, compact }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPlaceholderVariation = useRef(getRandomItem(EMOJI_VARIATIONS)).current;

  const { isLargeFontScale, fontScale } = useFontScale();
  const buttonScaleOpts = compact ? { maxFontScale: FONT_SCALE_LIMIT.CONSTRAINED_UI } : undefined;
  const buttonSize = scaleByFontScale(compact ? 36 : 42, fontScale, buttonScaleOpts);
  const emojiButtonFontSize = scaleByFontScale(compact ? 18 : 24, fontScale, buttonScaleOpts);
  const selectedEmojiFontSize = scaleByFontScale(36, fontScale, { maxFontScale: FONT_SCALE_LIMIT.CONSTRAINED_UI });
  const columns = isLargeFontScale ? 6 : 8;

  const handleEmojiSelect = useCallback(
    (emoji) => {
      setShowEmojiPicker(false);
      setTimeout(() => onChange(emoji), 0);
    },
    [onChange],
  );

  return (
    <>
      <SmallButton
        style={[styles.emojiButton, { width: buttonSize, height: buttonSize }]}
        onPress={() => setShowEmojiPicker(true)}
      >
        <Text size={emojiButtonFontSize} maxFontSizeMultiplier={FONT_SCALE_LIMIT.FIXED_LAYOUT}>
          {value || (
            <ScalableIcon
              name={`emoticon-${emojiPlaceholderVariation}`}
              size={emojiButtonFontSize}
              color={colors.subText}
              iconType="MaterialCommunityIcons"
            />
          )}
        </Text>
      </SmallButton>

      <Modal
        visible={showEmojiPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowEmojiPicker(false)}
          testID="test:id/emoji-picker-close-button"
        >
          <HeadingSmallText color={colors.primary} maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI}>
            {t("common.done")}
          </HeadingSmallText>
        </TouchableOpacity>

        {Boolean(value) && (
          <View style={styles.currentSelectionContainer}>
            <Text center size={selectedEmojiFontSize} maxFontSizeMultiplier={FONT_SCALE_LIMIT.FIXED_LAYOUT}>
              {value}
            </Text>
            <BodyXSmallText center color={colors.subText} maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI}>
              {t("quickBreak.currentSelection")}
            </BodyXSmallText>
          </View>
        )}

        <MemoizedEmojiSelector
          onEmojiSelected={handleEmojiSelect}
          showTabs={true}
          showSearchBar={true}
          showSectionTitles={true}
          showHistory={true}
          columns={columns}
        />
      </Modal>
    </>
  );
});

EmojiPicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  compact: PropTypes.bool,
};

const styles = StyleSheet.create({
  emojiButton: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 12,
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  currentSelectionContainer: {
    paddingBottom: 24,
    alignItems: "center",
    gap: 4,
  },
});
