import React from "react";
import { StyleSheet, View } from "react-native";
import YoutubePlayer, { YoutubeIframeRef } from "react-native-youtube-iframe";

import COLOR from "@/constants/color";
import { LoadingDots } from "@/components/LoadingScreen";
import { BodyLargeText } from "@/components/Text";
import { BearWithSpeechBubble } from "@/screens/BlockingPermissionIntro/components/BearWithSpeechBubble";
import IntroBear from "@/assets/bears/intro_bear.png";

const LOADING_VIDEO_ID = "ZRbrfTWa8AI";

type LoadingStateProps = {
  t: (key: string, defaultValue?: string) => string;
  colors: { [key: string]: string };
  videoPlayerRef: React.RefObject<YoutubeIframeRef>;
};

export const LoadingState: React.FC<LoadingStateProps> = ({ t, colors, videoPlayerRef }) => {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingTop}>
        <LoadingDots loadingText={t("routineSuggestion.generatingRoutine")} />
        <BodyLargeText center style={styles.loadingSubtitle} color={colors.subText}>
          {t("routineSuggestion.breathingExercise")}
        </BodyLargeText>
        <View style={styles.videoWrapper}>
          <YoutubePlayer
            ref={videoPlayerRef}
            height={220}
            play
            videoId={LOADING_VIDEO_ID}
            onReady={() => {
              try {
                if (videoPlayerRef.current) {
                  videoPlayerRef.current.seekTo(0, true);
                }
              } catch (e) {
                console.warn("Failed to initialize loading video", e);
              }
            }}
            initialPlayerParams={{ controls: true, mute: true, rel: 0 }}
          />
        </View>
      </View>

      <View style={styles.loadingBearWrapper}>
        <BearWithSpeechBubble
          text={t(
            "routineSuggestion.loadingBearText",
            "Thanks captain Brainbeard! I’m really excited to see my habits!",
          )}
          bearSource={IntroBear}
          tailSide="right"
          bubbleMaxWidth={260}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 0,
  },
  loadingTop: {
    width: "100%",
    alignItems: "center",
  },
  loadingSubtitle: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
  },
  videoWrapper: {
    width: "100%",
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLOR.BLACK,
  },
  loadingBearWrapper: {
    width: "100%",
    alignItems: "center",
  },
});
