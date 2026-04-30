import React, { memo } from "react";
import { SnapFlatlist } from "@/components";
import Animated from "react-native-reanimated";
import { useAnimatedStyle } from "react-native-reanimated";

export const Carousel = ({ renderItem, itemWidth, ...props }) => {
  return (
    <SnapFlatlist
      horizontal
      disableIntervalMomentum
      itemSize={itemWidth}
      renderItem={({ item, index, scrollOffset }) => (
        <AnimatedCarouselItem index={index} itemWidth={itemWidth} scrollOffset={scrollOffset}>
          {renderItem({ item, index })}
        </AnimatedCarouselItem>
      )}
      {...props}
    />
  );
};

const AnimatedCarouselItem = memo(function AnimatedCarouselItem({ index, itemWidth, children, scrollOffset }) {
  const style = useAnimatedStyle(() => {
    const scrollFactor = Math.abs((index * itemWidth - scrollOffset.value) / itemWidth);
    return {
      transform: [{ scale: Math.max(0.8, 1 - scrollFactor * 0.2) }],
      opacity: Math.max(0, 1 - scrollFactor),
    };
  });

  return <Animated.View style={[style, { width: itemWidth }]}>{children}</Animated.View>;
});
