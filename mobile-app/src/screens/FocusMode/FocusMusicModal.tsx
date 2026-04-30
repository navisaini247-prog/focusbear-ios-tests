import React, { memo, useEffect, useState, useCallback, useRef } from "react";
import { View, StyleSheet, Image, FlatList } from "react-native";
import {
  BodyMediumText,
  BodySmallText,
  BodyXSmallText,
  HeadingMediumText,
  Card,
  PressableWithFeedback,
  SheetModal,
  ModalHeader,
  AnimatedHeightView,
  FullPageLoading,
  HeadingSmallText,
} from "@/components";
import Video, { OnProgressData, VideoRef, OnVideoErrorData } from "react-native-video";
import Icon from "react-native-vector-icons/Ionicons";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { getFocusMusicTrackList } from "@/actions/FocusModeActions";
import { addInfoLog, addErrorLog } from "@/utils/FileLogger";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
const PI2 = Math.PI * 2;

const formatTime = (time: Date) => {
  const [h, m, s] = [time.getUTCHours(), time.getUTCMinutes(), time.getUTCSeconds()];
  return (h > 0 ? [h, m, s] : [m, s]).map((value) => String(value).padStart(2, "0")).join(":");
};

interface FocusMusicModalProps {
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
  setShowPlaybackIndicators: (isPlaying: boolean) => void;
}

type Track = {
  id: string;
  name: string;
  artist?: string;
  description?: string;
  download_url: string;
  thumbnail_download_url: string;
  duration: number;
};

type PlaybackStatus = OnProgressData & {
  track?: Track;
  isLoading: boolean;
  isPlaying: boolean;
};

const INITAL_PLAYBACK_STATUS: PlaybackStatus = {
  currentTime: 0,
  playableDuration: 0,
  seekableDuration: 0,
  isLoading: false,
  isPlaying: false,
};

export const FocusMusicModal = React.memo(function FocusMusicModal({
  isVisible,
  setIsVisible,
  setShowPlaybackIndicators,
}: FocusMusicModalProps) {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const playerRef = useRef<VideoRef>(null);
  const [trackList, setTrackList] = useState<Track[]>([]);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>(INITAL_PLAYBACK_STATUS);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState<boolean>(false);

  // TODO: fix the return type for all redux-thunk dispatch calls
  useEffect(() => {
    (async () => setTrackList(await dispatch(getFocusMusicTrackList())))();
  }, [dispatch]);

  const playTrack = useCallback((track: Track) => {
    if (!track?.download_url) return;

    addInfoLog("Playing focus music track", track?.name);
    postHogCapture(POSTHOG_EVENT_NAMES.PLAY_FOCUS_MUSIC_TRACK, { trackName: track?.name });

    try {
      setPlaybackStatus(() => {
        setTimeout(() => playerRef.current && playerRef.current.resume(), 0);
        return { ...INITAL_PLAYBACK_STATUS, track };
      });

      // Show loading indicator if still loading the same track after 2 seconds
      setTimeout(() => {
        setPlaybackStatus((prev) => {
          if (prev.isLoading && prev.track?.id === track?.id) setShowLoadingIndicator(true);
          return prev;
        });
      }, 2000);
    } catch (error) {
      addErrorLog("Error playing focus music track:", error);
    }
  }, []);

  // Video component callbacks
  const onLoadStart = () => {
    addInfoLog("Loading focus music track", playbackStatus.track?.name);
    setPlaybackStatus((prev) => ({ ...prev, isLoading: true }));
  };

  const onPlaybackStateChanged = ({ isPlaying }) => {
    setPlaybackStatus((prev) => ({ ...prev, isPlaying, ...(isPlaying && { isLoading: false }) }));
    setShowPlaybackIndicators(isPlaying);
    if (isPlaying) setShowLoadingIndicator(false);
  };

  const onProgress = (progress: OnProgressData) =>
    setPlaybackStatus((prev) => (prev.isPlaying ? { ...prev, ...progress } : prev));

  const onError = (error: OnVideoErrorData) => {
    addErrorLog("Error playing focus music track:", error);
    Toast.show({
      type: "error",
      text1: t("focusMode.focusMusicError"),
      text2: error?.error?.error,
    });
  };

  return (
    <>
      {/* Video player should render nothing when playing audio */}
      {Boolean(playbackStatus?.track) && (
        <Video
          ref={playerRef}
          source={{ uri: playbackStatus.track?.download_url }}
          onLoadStart={onLoadStart}
          onPlaybackStateChanged={onPlaybackStateChanged}
          onProgress={onProgress}
          onError={onError}
          progressUpdateInterval={1000}
          playInBackground={true}
          ignoreSilentSwitch="ignore"
          hideShutterView={true}
        />
      )}

      <SheetModal
        isVisible={isVisible}
        onCancel={() => setIsVisible(false)}
        style={styles.modal}
        HeaderComponent={<ModalHeader title={t("focusMode.focusMusic")} />}
        FooterComponent={
          <PlayerHeader
            playbackStatus={playbackStatus}
            playerRef={playerRef}
            showLoadingIndicator={showLoadingIndicator}
          />
        }
        CustomScrollView={
          <FlatList
            data={trackList}
            renderItem={({ item }) => (
              <TrackItem
                track={item}
                playTrack={playTrack}
                isPlaying={item.id === playbackStatus?.track?.id && playbackStatus.isPlaying}
                isSelected={item.id === playbackStatus?.track?.id}
              />
            )}
            ListEmptyComponent={<ListEmptyComponent setTrackList={setTrackList} />}
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
          />
        }
      />
    </>
  );
});

interface PlayerHeaderProps {
  playbackStatus: PlaybackStatus;
  playerRef: React.RefObject<VideoRef>;
  showLoadingIndicator: boolean;
}

const PlayerHeader: React.FC<PlayerHeaderProps> = ({ playbackStatus, playerRef, showLoadingIndicator }) => {
  const { colors, shadowStyles } = useTheme();

  const { track } = playbackStatus;
  const current = Math.max(1, (playbackStatus.currentTime / playbackStatus.seekableDuration) * 100) || 0;
  const buffer = Math.max(1, (playbackStatus.playableDuration / playbackStatus.seekableDuration) * 100) || 0;

  const togglePlay = () => {
    if (playerRef.current) {
      if (playbackStatus.isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.resume();
      }
    }
  };

  return (
    <AnimatedHeightView style={styles.overflowVisible}>
      {track?.id && (
        <Card noPadding style={[styles.row, styles.gap12, styles.playerCard, shadowStyles.bigShadow]}>
          <View style={[styles.thumbnailContainer, styles.largeThumbnailSize, { backgroundColor: colors.secondary }]}>
            <Image
              source={{ uri: track?.thumbnail_download_url }}
              style={styles.largeThumbnailSize}
              tintColor={colors.text}
            />
            <FullPageLoading show={showLoadingIndicator} />
          </View>

          <View style={[styles.gap4, styles.flex]}>
            <HeadingMediumText size={15} color={colors.text} numberOfLines={1}>
              {playbackStatus.track?.name}
            </HeadingMediumText>

            <View style={[styles.progressBarContainer, { backgroundColor: colors.separator }]}>
              <View style={[styles.progressBar, { backgroundColor: colors.secondaryBorder, width: `${buffer}%` }]} />
              <View style={[styles.progressBar, { backgroundColor: colors.primary, width: `${current}%` }]} />
            </View>

            <BodyXSmallText color={colors.subText}>
              {formatTime(new Date((playbackStatus?.currentTime || 0) * 1000))}
            </BodyXSmallText>
          </View>

          <PressableWithFeedback onPress={togglePlay} style={styles.pressable} testID="focus-music-modal-play-toggle">
            <Icon
              name={playbackStatus.isPlaying || playbackStatus.isLoading ? "pause" : "play"}
              size={28}
              color={colors.subText}
            />
          </PressableWithFeedback>
        </Card>
      )}
    </AnimatedHeightView>
  );
};

interface TrackItemProps {
  track: Track;
  playTrack: (track: Track) => void;
  isSelected: boolean;
  isPlaying: boolean;
}

const TrackItem = memo(function TrackItem({ track, playTrack, isSelected, isPlaying }: TrackItemProps) {
  const { colors } = useTheme();

  return (
    <PressableWithFeedback
      key={track?.id}
      style={[styles.row, styles.gap4, styles.trackItem]}
      onPress={() => (!isPlaying ? playTrack(track) : null)}
      testID={`focus-music-modal-track-${track?.id}`}
    >
      <View style={[styles.flex, styles.row, styles.gap12]}>
        <View style={[styles.thumbnailContainer, styles.thumbnailSize, { backgroundColor: colors.secondary }]}>
          {isPlaying ? (
            <WaveAnimation />
          ) : (
            <Image
              source={{ uri: track?.thumbnail_download_url }}
              style={styles.thumbnailSize}
              tintColor={colors.subText}
            />
          )}
        </View>

        <BodyMediumText color={isSelected ? colors.primary : colors.text}>{track?.name}</BodyMediumText>
      </View>

      <BodySmallText color={colors.subText}>{formatTime(new Date((track?.duration || 0) * 1000))}</BodySmallText>
    </PressableWithFeedback>
  );
});

const ListEmptyComponent = ({ setTrackList }: { setTrackList: (trackList: Track[]) => void }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const fetchTracks = async () => setTrackList(await dispatch(getFocusMusicTrackList()));

  return (
    <View style={[styles.gap12, styles.emptyContainer]}>
      <BodyMediumText color={colors.subText} center>
        {t("networkError.apiError")}
      </BodyMediumText>
      <PressableWithFeedback onPress={fetchTracks} style={styles.pressable} testID="focus-music-modal-retry-button">
        <HeadingSmallText>{t("common.retry")}</HeadingSmallText>
      </PressableWithFeedback>
    </View>
  );
};

export const WaveAnimation = memo(function WaveAnimation() {
  const { colors } = useTheme();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(PI2, { duration: 5000, easing: Easing.linear }), -1);
  }, [pulse]);

  const animatedSparkleStyles = [
    useAnimatedStyle(() => ({ transform: [{ scaleY: 0.8 + 0.4 * Math.cos(pulse.value) }] })),
    useAnimatedStyle(() => ({ transform: [{ scaleY: 0.8 + 0.4 * Math.cos(pulse.value + PI2 * 0.33) }] })),
    useAnimatedStyle(() => ({ transform: [{ scaleY: 0.8 + 0.4 * Math.cos(pulse.value + PI2 * 0.66) }] })),
  ];

  return (
    <>
      {animatedSparkleStyles.map((animatedStyle, index) => (
        <Animated.View
          key={index}
          style={[styles.waveBar, { left: 15 + index * 6, backgroundColor: colors.primary }, animatedStyle]}
        />
      ))}
    </>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap4: { gap: 4 },
  gap12: { gap: 12 },
  overflowVisible: { overflow: "visible" },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  modal: {
    height: 500,
  },
  scrollView: {
    zIndex: -10, // put it behind the playerCard shadow
  },
  contentContainer: {
    paddingVertical: 12,
    gap: 4,
  },
  trackItem: {
    padding: 4,
    marginHorizontal: 12,
    borderRadius: 8,
  },
  thumbnailContainer: {
    borderRadius: 4,
  },
  thumbnailSize: {
    width: 45,
    height: 45,
  },
  largeThumbnailSize: {
    width: 60,
    height: 60,
  },
  playerCard: {
    padding: 8,
    paddingRight: 12,
    marginHorizontal: 8,
    marginBottom: 24,
  },
  progressBarContainer: {
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  progressBar: {
    position: "absolute",
    height: 4,
  },
  pressable: {
    padding: 8,
  },
  waveBar: {
    position: "absolute",
    bottom: 14,
    width: 3,
    height: 14,
    transformOrigin: "bottom left",
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
});
