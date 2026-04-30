import React, { useEffect, useState, useRef } from "react";
import { View, Image, StyleSheet } from "react-native";
import { BodySmallText, BodyXSmallText, Card, FullPageLoading } from "@/components";
import { useTheme } from "@react-navigation/native";
import { fetchVideoMetadata } from "@/actions/UserActions";
import { isYoutubeUrl } from "@/utils/GlobalMethods";
import { addErrorLog } from "@/utils/FileLogger";
import COLOR from "@/constants/color";
import { useTranslation } from "react-i18next";

export const VideoPreview = ({ videoUrl }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const requestDebounceRef = useRef(0);
  const [isLoading, setIsLoading] = useState(isYoutubeUrl(videoUrl));
  const [isRequestError, setIsRequestError] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState({});
  const { id, title, duration, thumbnailUrl } = videoMetadata;

  useEffect(() => {
    // Metadata API only supports YouTube URLs for now
    if (!isYoutubeUrl(videoUrl)) return;

    const loadMetadata = async () => {
      if (!videoUrl) return setVideoMetadata({});
      setIsLoading(true);

      try {
        setVideoMetadata(await fetchVideoMetadata([videoUrl]));
        setIsRequestError(false);
      } catch (err) {
        addErrorLog("Failed to load video metadata");
        setIsRequestError(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce so we don't spam requests
    clearTimeout(requestDebounceRef.current);
    requestDebounceRef.current = setTimeout(loadMetadata, 200);
  }, [videoUrl]);

  // Show nothing if there is no video URL, the URL is invalid, or there was a request error
  if (!videoUrl || !isYoutubeUrl(videoUrl) || isRequestError) return null;

  // If the request didn't fail but there is no video ID, assume the video doesn't exist
  if (!isLoading && !id) return <BodySmallText color={colors.subText}>{t("error.videoNotFound")}</BodySmallText>;

  return (
    <Card noPadding style={styles.container}>
      <View style={{ backgroundColor: colors.secondary }}>
        <Image source={{ uri: thumbnailUrl }} style={styles.videoThumbnail} height={60} width={(60 / 9) * 16} />
        {Boolean(duration) && (
          <View style={[styles.durationContainer, { backgroundColor: COLOR.DARKER_OVERLAY }]}>
            <BodyXSmallText color={colors.white} weight="700">
              {duration}
            </BodyXSmallText>
          </View>
        )}
      </View>
      <View style={[styles.textContainer, styles.flex]}>
        {Boolean(title) && <BodyXSmallText numberOfLines={3}>{title}</BodyXSmallText>}
      </View>
      <FullPageLoading show={isLoading} />
    </Card>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    overflow: "hidden",
  },
  durationContainer: {
    position: "absolute",
    bottom: 4,
    right: 4,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  textContainer: {
    padding: 8,
  },
});
