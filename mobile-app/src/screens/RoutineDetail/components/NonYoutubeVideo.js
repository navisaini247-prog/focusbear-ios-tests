import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import Video from "react-native-video";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

const NonYoutubeVideo = ({ url, isPlaying, isControls, player, onReady, setBuffering }) => {
  const { t } = useTranslation();

  const onBuffer = useCallback(
    (buffer) => {
      setBuffering(buffer?.isBuffering);
    },
    [setBuffering],
  );

  const onError = (e) => {
    Alert.alert(t("routineDetail.not_playable_video"));
  };

  return (
    <Video
      source={{ uri: url }}
      paused={!isPlaying}
      controls={isControls}
      repeat={false}
      style={styles.videoPlayerStyle}
      onBuffer={onBuffer}
      resizeMode="cover"
      onError={onError}
      ref={player}
      onReadyForDisplay={onReady}
    />
  );
};

const styles = StyleSheet.create({
  videoPlayerStyle: {
    width: "100%",
    height: 240,
    borderRadius: 8,
  },
});

export { NonYoutubeVideo };
