import React, { memo, useState, useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { BodySmallText, TextField, AnimatedHeightView } from "@/components";
import { VideoPreview } from "./VideoPreview";
import { useTheme } from "@react-navigation/native";
import { isValidVideoUrl } from "@/utils/GlobalMethods";
import { useTranslation } from "react-i18next";

export const VideoUrlInput = memo(function VideoUrlInput({ videoUrl, setVideoUrl }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [inputValue, setInputValue] = useState(videoUrl || "");
  const [showInvalidVideoError, setShowInvalidVideoError] = useState(false);
  const showErrorDebounceRef = useRef(0);
  const isUrlValid = isValidVideoUrl(videoUrl);

  useEffect(() => {
    isUrlValid && setInputValue(videoUrl || "");
  }, [videoUrl, isUrlValid]);

  const onChangeText = (text) => {
    setInputValue(text);
    clearTimeout(showErrorDebounceRef.current);

    if (!text.trim()) {
      setShowInvalidVideoError(false);
      return;
    }

    const isNewUrlValid = isValidVideoUrl(text);
    if (isNewUrlValid) {
      setShowInvalidVideoError(false);
      setVideoUrl(text);
    } else {
      // Only show errors after a small delay
      showErrorDebounceRef.current = setTimeout(() => setShowInvalidVideoError(true), 500);
      setVideoUrl(""); // Don't allow for invalid URLs to be set
    }
  };

  return (
    <AnimatedHeightView style={styles.container}>
      <View style={styles.gap8}>
        <TextField
          small
          testID="test:id/video-url"
          type="url"
          value={inputValue}
          onChangeText={onChangeText}
          placeholder="https://..."
          errorMessage={showInvalidVideoError}
        />
        {showInvalidVideoError && <BodySmallText color={colors.danger}>{t("error.invalidVideoUrl")}</BodySmallText>}

        <VideoPreview videoUrl={videoUrl} />
      </View>
    </AnimatedHeightView>
  );
});

const styles = StyleSheet.create({
  gap8: { gap: 8 },
  container: {
    overflow: "visible",
  },
});
