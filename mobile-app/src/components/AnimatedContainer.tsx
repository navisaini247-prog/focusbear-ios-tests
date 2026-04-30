import React from "react";
import { View, ViewProps, StyleSheet, LayoutChangeEvent } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";

interface AnimatedHeightViewProps extends ViewProps {
  align?: "top" | "bottom";
}

export const AnimatedHeightView: React.FC<AnimatedHeightViewProps> = ({ style, children, align = "top", ...props }) => {
  const animation = useSharedValue(0);
  const heightRef = useSharedValue(-1);
  const outerAnimatedStyle = useAnimatedStyle(() => ({ height: animation.value || "auto" }));

  const onLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    const isFirstTime = heightRef.value === -1;
    const difference = Math.abs(height - heightRef.value);
    heightRef.value = height;

    if (difference === 0) {
      return;
    } else if (isFirstTime) {
      animation.value = height;
    } else {
      animation.value = withTiming(height, { duration: 200, easing: Easing.out(Easing.circle) });
    }
  };

  return (
    <Animated.View style={[styles.outerContainer, style, outerAnimatedStyle]} {...props}>
      <View style={[styles.innerContainer, align === "top" ? styles.alignTop : styles.alignBottom]} onLayout={onLayout}>
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    overflow: "hidden",
    height: "auto",
  },
  innerContainer: {
    position: "absolute",
    width: "100%",
  },
  alignTop: {
    top: 0,
  },
  alignBottom: {
    bottom: 0,
  },
});
