import React, { useState } from "react";
import { View, StyleSheet, ViewStyle, LayoutChangeEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import { BodyLargeText } from "@/components";
import COLOR from "@/constants/color";

type TailSide = "left" | "right" | "none";

interface Props {
  text: string;
  style?: ViewStyle;
  tailSide?: TailSide;
}

const TAIL_PATH_D =
  "M0 40C0 17.9086 17.9086 0 40 0H242.441C259.045 0 272.505 13.4602 272.505 30.0642C272.505 39.6795 277.104 48.7147 284.879 54.3726L309.44 72.2476C315.899 76.9481 312.812 87.1592 304.83 87.493L286.765 88.2486C278.795 88.5819 272.505 95.1405 272.505 103.118C272.505 111.337 265.842 118 257.623 118H238.442H221.232H204.379H136.253H40C17.9086 118 0 100.091 0 78V40Z";

const SpeechBubble: React.FC<Props> = ({ text, style, tailSide = "right" }) => {
  const [bubbleHeight, setBubbleHeight] = useState(0);

  const handleBubbleLayout = (event: LayoutChangeEvent) => {
    setBubbleHeight(event.nativeEvent.layout.height);
  };

  const tailHeight = Math.max(24, Math.min(bubbleHeight || 48, 120));
  const tailWidth = (40 * tailHeight) / 120;

  return (
    <View style={[styles.container, style]}>
      {tailSide === "left" && (
        <Svg
          style={styles.tailLeft}
          width={tailWidth}
          height={tailHeight}
          viewBox="272 20 41 78"
          transform="scale(-1,1)"
        >
          <Path d={TAIL_PATH_D} fill={COLOR.WHITE} />
        </Svg>
      )}

      <View style={styles.bubble} onLayout={handleBubbleLayout}>
        <BodyLargeText color={COLOR.BLACK} center>
          {text}
        </BodyLargeText>
      </View>

      {tailSide === "right" && (
        <Svg style={styles.tailRight} width={tailWidth} height={tailHeight} viewBox="272 20 41 78">
          <Path d={TAIL_PATH_D} fill={COLOR.WHITE} />
        </Svg>
      )}
    </View>
  );
};

export { SpeechBubble };

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    flexDirection: "row",
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: COLOR.WHITE,
    borderRadius: 16,
    borderColor: COLOR.GRAY[200],
  },
  tailRight: {
    right: 0,
  },
  tailLeft: {
    left: 0,
  },
});
