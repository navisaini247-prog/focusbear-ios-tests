import React, { useCallback, useState, useEffect, useImperativeHandle } from "react";
import { FlatListProps, ListRenderItemInfo, Platform } from "react-native";
import Animated, { SharedValue } from "react-native-reanimated";
import { useSharedValue, withSpring, useDerivedValue, cancelAnimation, scrollTo } from "react-native-reanimated";
import { useAnimatedScrollHandler, useScrollOffset, useAnimatedRef, clamp } from "react-native-reanimated";
import { runOnJS, runOnUI } from "react-native-worklets";
import { triggerHaptics, HapticTypes } from "react-native-turbo-haptics";

const VELOCITY_MULTIPLIER = Platform.select({ ios: 1, android: -1 }); // Inverted on Android

interface SnapFlatlistProps<ItemT> extends Omit<FlatListProps<ItemT>, "ref" | "renderItem" | "CellRendererComponent"> {
  itemSize: number;
  /**
   * - `scrollOffset`: `SharedValue<number>` Current offset of the scroll view.
   * - `currentIndex`: `SharedValue<number>` Could be >`data.length` if infinite mode is enabled.
   */
  renderItem: (props: ListRenderItemProps<ItemT>) => React.ReactElement;
  infinite?: boolean;
  onSnapToItem?: (props: { index: number }) => void;
  ref?: React.Ref<SnapFlatlistRef>;
  fallbackScrollViewSize?: number;
}

interface ListRenderItemProps<ItemT> extends ListRenderItemInfo<ItemT> {
  scrollOffset: SharedValue<number>;
  currentIndex: SharedValue<number>;
}

type SnapFlatlistRef = {
  scrollToNext: () => void;
  scrollToPrev: () => void;
  scrollToRelativeIndex: (index: number) => void;
  scrollToIndex: (index: number) => void;
};

/**
 * Flatlist that snaps to items. Supports infinite scrolling. Can be horizontal. Unique props include:
 * @param itemSize - Required. Length of items in the direction of scroll. Must be constant.
 * @param renderItem - Render function. Receives the following extra props: `scrollOffset`, `currentIndex`
 * @param infinite - Whether the flatlist should be able to scroll infinitely. Default is false.
 * @param onSnapToItem - Is called when the user releases their finger.
 * @param fallbackScrollViewSize - Optional optimization. Value used until it can be calculated from the layout.
 * @param ref - Exposes the following methods: `scrollToNext`, `scrollToPrev`, `scrollToIndex`, `scrollToRelativeIndex`
 */
export const SnapFlatlist = <ItemT,>({
  data: inputData,
  itemSize,
  infinite,
  onSnapToItem,
  contentContainerStyle,
  renderItem,
  horizontal,
  initialScrollIndex,
  disableIntervalMomentum,
  fallbackScrollViewSize,
  ref,
  ...props
}: SnapFlatlistProps<ItemT>) => {
  if (!itemSize) throw new Error("SnapFlatlist: itemSize is required");

  const [scrollViewSize, setScrollViewSize] = useState(fallbackScrollViewSize || 0);

  const nItems = inputData.length;
  const initialScrollOffset = (initialScrollIndex || 0) * itemSize;
  const padding = Math.max(0, (scrollViewSize - itemSize) / 2);

  const scrollViewRef = useAnimatedRef<Animated.FlatList<ItemT>>();

  const currentIndex = useSharedValue(initialScrollIndex || 0);
  const animatedScroll = useSharedValue(initialScrollOffset);
  const shift = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const isScrolling = useSharedValue(false);

  const swipeVelocityFactor = 0.2;
  const edgeThreshold = 4;

  const nRepeats = (() => {
    if (!infinite) return 1;
    let n = 2;
    while (nItems * (n - 1) < edgeThreshold * 2) n++;
    return n;
  })();

  // Trying to be memory efficient by creating an iterable that repeats the data without creating a new array
  // Won't properly support methods like `map` and `forEach`, but if it works it works :)
  const data = new Proxy([], {
    get(_, prop) {
      if (prop === "length") return inputData.length * nRepeats;
      const i = Number(prop);
      if (!Number.isNaN(i)) return inputData[i % inputData.length];
      return inputData[prop];
    },
  });

  useEffect(() => {
    const [x, y] = horizontal ? [initialScrollOffset, 0] : [0, initialScrollOffset];
    setTimeout(() => runOnUI(scrollTo)(scrollViewRef, x, y, false), 0);
  }, [horizontal, initialScrollOffset, scrollViewRef]);

  const scrollOffset = useScrollOffset(scrollViewRef);

  const animatedScrollTo = useCallback(
    (newOffset: number, currentOffset?: number) => {
      "worklet";
      shift.value = 0; // reset shift
      animatedScroll.value = currentOffset || scrollOffset.value;
      animatedScroll.value = withSpring(newOffset, undefined, (finished) => {
        if (finished) isScrolling.value = false;
      });
    },
    [animatedScroll, scrollOffset, shift, isScrolling],
  );

  // Animate ScrollView offset. `animatedScroll` and `shift` are consumed here
  useDerivedValue(() => {
    if (!isDragging.value) {
      const shiftOffset = shift.value * nItems * itemSize;
      const newOffset = animatedScroll.value + shiftOffset;
      const [x, y] = horizontal ? [newOffset, 0] : [0, newOffset];
      scrollTo(scrollViewRef, x, y, false);
    }
  });

  // ScrollView event handlers
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      let offset = horizontal ? event.contentOffset.x : event.contentOffset.y;
      if (!infinite) offset = clamp(offset, 0, (nItems - 1) * itemSize);

      const newIndex = Math.round(offset / itemSize);

      const isScrollingToNewItem = newIndex % nItems !== currentIndex.value % nItems;
      if (isScrollingToNewItem && isScrolling.value) triggerHaptics(HapticTypes.selection);

      currentIndex.value = newIndex; // this is the only place where currentIndex is set

      // To achieve infinite scrolling, the list is repeated `nRepeats` times. When it is <`edgeThreshold` items away
      // from the start/end, it is scrolled imperceptibly to another instance in the opposite direction
      if (infinite) {
        const isAtStart = newIndex <= edgeThreshold - 1;
        const isAtEnd = newIndex >= nItems * nRepeats - edgeThreshold;

        if (isAtStart || isAtEnd) {
          if (isDragging.value) {
            const shiftOffset = (isAtStart ? 1 : -1) * nItems * itemSize;
            const newOffset = offset + shiftOffset;
            const [x, y] = horizontal ? [newOffset, 0] : [0, newOffset];
            scrollTo(scrollViewRef, x, y, false);
          } else {
            // When not dragging the scroll might be animated, in which case the offset is handled by `useDerivedValue`
            shift.value += isAtStart ? 1 : -1;
          }
        }
      }
    },
    onBeginDrag: () => {
      isDragging.value = true;
      isScrolling.value = true; // set false when animation completes or when scrolling programmatically
      cancelAnimation(animatedScroll);
    },
    onEndDrag: (event) => {
      // Velocity seems to be expressed in multiples of ScrollView size. I can't find documentation on this.
      const baseVelocity = (horizontal ? event?.velocity.x : event?.velocity.y) || 0;
      const velocity = baseVelocity * VELOCITY_MULTIPLIER * scrollViewSize;

      const offset = horizontal ? event.contentOffset.x : event.contentOffset.y;

      let newIndex = Math.round((offset + velocity * swipeVelocityFactor) / itemSize);
      if (!infinite) newIndex = clamp(newIndex, 0, nItems - 1);
      if (disableIntervalMomentum) newIndex = clamp(newIndex, currentIndex.value - 1, currentIndex.value + 1);

      const newOffset = newIndex * itemSize;

      animatedScrollTo(newOffset, offset);
      isDragging.value = false;

      const normalizedIndex = ((newIndex % nItems) + nItems) % nItems; // modulo
      onSnapToItem && runOnJS(onSnapToItem)({ index: normalizedIndex });
    },
  });

  const scrollToIndex = useCallback(
    (index: number) => {
      const newIndex = clamp(index, 0, nItems - 1);
      const currentShift = Math.floor(currentIndex.value / nItems);
      const newOffset = (currentShift * nItems + newIndex) * itemSize;

      isScrolling.value = false;
      runOnUI(animatedScrollTo)(newOffset);
      onSnapToItem && onSnapToItem({ index: newIndex });
    },
    [animatedScrollTo, currentIndex, itemSize, nItems, onSnapToItem, isScrolling],
  );

  const scrollToRelativeIndex = useCallback(
    (index: number) => {
      let newIndex = currentIndex.value + index;
      if (!infinite) newIndex = clamp(newIndex, 0, nItems - 1);
      const newOffset = newIndex * itemSize;

      isScrolling.value = false;
      runOnUI(animatedScrollTo)(newOffset);
      onSnapToItem && onSnapToItem({ index: newIndex });
    },
    [animatedScrollTo, itemSize, onSnapToItem, currentIndex, nItems, infinite, isScrolling],
  );

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex,
      scrollToRelativeIndex,
      scrollToNext: () => scrollToRelativeIndex(1),
      scrollToPrev: () => scrollToRelativeIndex(-1),
    }),
    [scrollToRelativeIndex, scrollToIndex],
  );

  return (
    <Animated.FlatList
      ref={scrollViewRef}
      data={data}
      horizontal={horizontal}
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      onScroll={scrollHandler}
      onLayout={({ nativeEvent: { layout } }) => setScrollViewSize(horizontal ? layout.width : layout.height)}
      renderItem={(_props) => renderItem({ ..._props, scrollOffset, currentIndex })}
      getItemLayout={(_, index) => ({ length: itemSize, offset: index * itemSize, index })}
      initialScrollIndex={initialScrollIndex}
      contentContainerStyle={[
        contentContainerStyle,
        horizontal ? { paddingHorizontal: padding } : { paddingVertical: padding },
      ]}
      {...props}
    />
  );
};
