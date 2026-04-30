import React, { useEffect } from "react";
import { Image, StyleProp, StyleSheet, ViewStyle } from "react-native";
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import IntroDoneMark from "@/assets/blocking_permission_intro/intro_done_mark.png";

type Props = {
  size?: number;
  durationMs?: number;
  style?: StyleProp<ViewStyle>;
};

export function CongratsMark({ size = 120, durationMs = 1500, style }: Props): React.JSX.Element {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: durationMs,
      easing: Easing.out(Easing.back(1.5)),
    });
  }, [durationMs, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0, 1]);
    const rotation = interpolate(progress.value, [0, 1], [0, 360]);

    return {
      transform: [{ scale }, { rotate: `${rotation}deg` }],
    } as ViewStyle;
  });

  return (
    <Animated.View style={[{ width: size, height: size }, styles.container, animatedStyle, style]}>
      <Image source={IntroDoneMark} style={styles.image} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
