import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, View } from "react-native";
import { useVimeoPlayer, VimeoView, useVimeoEvent } from "react-native-vimeo-bridge";
import { VIMEO_PLAYER_EVENT } from "@/constants/videos";

const VimeoVideo = ({ videoId, onReady, isPlaying, setPlaying }) => {
  const { t } = useTranslation();
  const isPlayingRef = useRef(isPlaying);
  // Guard against calling play()/pause() before the player has fired "loaded"
  const isReadyRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const player = useVimeoPlayer(`https://player.vimeo.com/video/${videoId}`, {
    autoplay: isPlaying,
    controls: true,
    loop: true, // handles restart
    playsinline: true,
  });

  // Sync play/pause with isPlaying — only after the player is ready.
  // `player` is included in deps; it is stable across renders (returned by useVimeoPlayer)
  // but including it keeps exhaustive-deps honest.
  useEffect(() => {
    if (!isReadyRef.current) return;
    isPlaying ? player.play() : player.pause();
  }, [isPlaying, player]);

  useVimeoEvent(player, VIMEO_PLAYER_EVENT.PLAY, () => {
    if (!isPlayingRef.current) {
      setPlaying(true);
    }
  });

  useVimeoEvent(player, VIMEO_PLAYER_EVENT.PAUSE, () => {
    if (isPlayingRef.current) {
      setPlaying(false);
    }
  });

  // Edge case: habit is paused when the video finishes, and pauses again before the loop auto-plays
  useVimeoEvent(player, VIMEO_PLAYER_EVENT.ENDED, () => {
    if (!isPlayingRef.current) {
      player.pause();
    }
  });

  useVimeoEvent(player, VIMEO_PLAYER_EVENT.LOADED, () => {
    isReadyRef.current = true;
    onReady?.();
    // Sync initial state after load (autoplay may not match isPlaying if state changed before load)
    if (!isPlayingRef.current) player.pause();
  });

  useVimeoEvent(player, VIMEO_PLAYER_EVENT.ERROR, () => {
    Alert.alert(t("routineDetail.not_playable_video"));
  });

  return (
    <View style={styles.container}>
      <VimeoView player={player} height={240} width="100%" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
});

export { VimeoVideo };
