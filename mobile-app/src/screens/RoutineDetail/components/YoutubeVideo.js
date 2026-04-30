import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import YoutubePlayer, { PLAYER_STATES } from "react-native-youtube-iframe";

const YoutubeVideo = ({ videoId, onReady, isPlaying, player, setPlaying }) => {
  const { t } = useTranslation();

  const onError = () => {
    Alert.alert(t("routineDetail.not_playable_video"));
  };

  //Restarts the video when it ends and the habit is going
  const onStateChange = useCallback(
    (state) => {
      if (state === PLAYER_STATES.ENDED && isPlaying && player?.current) {
        setTimeout(() => {
          if (player?.current && isPlaying) {
            player.current.seekTo(0, true);
          }
        }, 100);
      } else if (state === PLAYER_STATES.PLAYING) {
        setPlaying(true);
      } else if (state === PLAYER_STATES.PAUSED) {
        setPlaying(false);
      }
    },
    [isPlaying, player, setPlaying],
  );

  return (
    <YoutubePlayer
      ref={player}
      height="100%"
      allowWebViewZoom
      width="100%"
      videoId={videoId}
      onReady={onReady}
      onError={onError}
      play={isPlaying}
      onChangeState={onStateChange}
      isFullScreen
      initialPlayerParams={{
        controls: true,
      }}
      // react-native-youtube-iframe includes some weird default styles including a 56.25% bottom padding
      webViewProps={{
        injectedJavaScript: `
        var element = document.getElementsByClassName('container')[0];
        element.style.position = 'unset';
        element.style.paddingBottom = '0px';
        true;
      `,
      }}
    />
  );
};

export { YoutubeVideo };
