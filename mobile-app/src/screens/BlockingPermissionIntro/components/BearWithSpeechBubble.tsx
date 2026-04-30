import React, { useMemo } from "react";
import { Image, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from "react-native";
import { SpeechBubble } from "./SpeechBubble";

type TailSide = "left" | "right";

const DEFAULT_BEAR_WIDTH = 170;
const DEFAULT_BEAR_HEIGHT = 200;
const HORIZONTAL_PADDING = 40;
const BEAR_LEFT_MARGIN = -12;

interface Props {
  text: string;
  bearSource: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  tailSide?: TailSide;
  bearWidth?: number;
  bearHeight?: number;
  bubbleMaxWidth?: number;
  bubbleStyle?: ViewStyle;
}

const BearWithSpeechBubble: React.FC<Props> = ({
  text,
  bearSource,
  style,
  tailSide = "right",
  bearWidth = DEFAULT_BEAR_WIDTH,
  bearHeight = DEFAULT_BEAR_HEIGHT,
  bubbleMaxWidth = 200,
  bubbleStyle,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const containerMaxWidth = screenWidth - 24;
  const maxWidth = bubbleMaxWidth || Math.max(120, screenWidth - bearWidth - HORIZONTAL_PADDING);

  const bubbleCombinedStyle = useMemo<ViewStyle>(
    () => ({
      maxWidth,
      flexShrink: 1,
      ...bubbleStyle,
    }),
    [maxWidth, bubbleStyle],
  );

  const bearImageStyle = useMemo(
    () => [styles.bear, { width: bearWidth, height: bearHeight }, tailSide === "left" && styles.bearLeftOffset],
    [bearWidth, bearHeight, tailSide],
  );

  const containerStyle = useMemo(
    () => [styles.container, style, { maxWidth: containerMaxWidth }],
    [style, containerMaxWidth],
  );

  const bubble = <SpeechBubble text={text} tailSide={tailSide} style={bubbleCombinedStyle} />;
  const bear = <Image source={bearSource} style={bearImageStyle} resizeMode="contain" />;

  return (
    <View style={containerStyle}>
      <View style={styles.content}>
        {tailSide === "left" ? (
          <>
            {bear}
            {bubble}
          </>
        ) : (
          <>
            {bubble}
            {bear}
          </>
        )}
      </View>
    </View>
  );
};

export { BearWithSpeechBubble };

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    flexDirection: "row",
  },
  bear: {
    width: 170,
    height: 220,
    marginTop: 8,
  },
  bearLeftOffset: {
    marginRight: BEAR_LEFT_MARGIN,
  },
});
