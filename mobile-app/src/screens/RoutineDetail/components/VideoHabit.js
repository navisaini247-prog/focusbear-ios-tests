import React from "react";
import { useRoutineDetailContext } from "../context/context";
import { NonYoutubeVideo } from "./NonYoutubeVideo";
import { YoutubeVideo } from "./YoutubeVideo";
import { VimeoVideo } from "./VimeoVideo";
import { VIDEO_TYPES } from "@/constants/videos";

const VideoHabit = () => {
  const {
    activityInfo: { videoUrls },
    videoType,
    isPlaying,
    isControls,
    player,
    setBuffering,
    onReady,
    setPlaying,
    videoId,
    isNonVideoHabit,
  } = useRoutineDetailContext();

  if (isNonVideoHabit) {
    return null;
  }

  if (videoType === VIDEO_TYPES.YOUTUBE) {
    return (
      <YoutubeVideo videoId={videoId} isPlaying={isPlaying} player={player} onReady={onReady} setPlaying={setPlaying} />
    );
  }

  if (videoType === VIDEO_TYPES.VIMEO) {
    return <VimeoVideo videoId={videoId} isPlaying={isPlaying} onReady={onReady} setPlaying={setPlaying} />;
  }

  return (
    <NonYoutubeVideo
      url={videoUrls[0]}
      isPlaying={isPlaying}
      isControls={isControls}
      player={player}
      setBuffering={setBuffering}
      onReady={onReady}
    />
  );
};

export { VideoHabit };
