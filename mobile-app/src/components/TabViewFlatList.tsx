import React, { useCallback, useRef, useImperativeHandle, useEffect } from "react";
import { StyleSheet, View, FlatListProps, useWindowDimensions } from "react-native";
import Animated, { SharedValue, useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

export interface Route {
  key: string;
  titleKey: string;
  testID: string;
}

interface TabViewFlatListProps<T extends Route>
  extends Omit<FlatListProps<T>, "CellRendererComponent" | "data" | "renderItem"> {
  renderScene: ({ item }: { item: T }) => React.JSX.Element;
  onCurrentTabChange?: (index: number) => void;
  translateX: SharedValue<number>;
  ref?: React.Ref<{ goToTab: (index: number) => void }>;
  routes: T[];
}

/**
 * TabViewFlatList Component
 *
 * A horizontal paginated FlatList component designed for tab navigation with smooth animations.
 *
 * @param renderScene - Function to render each tab's content. Receives the route item.
 * @param onCurrentTabChange - Callback that recieves the current tab index whenever it changes.
 * @param translateX - Shared value from react-native-reanimated to track scroll position for synchronized animations.
 * @param ref - Ref with a goToTab function that can be used to switch to a different tab index.
 * @param routes - Array of route objects with at least `key` and `titleKey` properties.
 *
 * @example
 * ```tsx
 * const routes = [
 *   { key: 'overview', titleKey: 'Overview' },
 *   { key: 'schedule', titleKey: 'Schedule' },
 * ];
 *
 * const translateX = useSharedValue(0);
 * const [currentTabIndex, setCurrentTabIndex] = useState(0);
 *
 * <TabViewFlatList
 *   routes={routes}
 *   onCurrentTabChange(setCurrentTabIndex)
 *   translateX={translateX}
 *   renderScene={({ item }) => <YourTabContent route={item} />}
 * />
 * ```
 */
export const TabViewFlatList = <T extends Route>({
  renderScene,
  onCurrentTabChange,
  translateX,
  routes,
  ref,
  ...props
}: TabViewFlatListProps<T>) => {
  const flatListRef = useRef<Animated.FlatList<T>>(null);
  const currentIndex = useSharedValue(0);
  const { width: screenWidth } = useWindowDimensions();

  // Re-align scroll position when screenWidth changes
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex?.({ index: currentIndex.value, animated: false });
    }, 0);
  }, [currentIndex, screenWidth]);

  const scrollHandler = useAnimatedScrollHandler<{ isDragging: boolean }>({
    onScroll: (event) => {
      translateX.value = event.contentOffset.x;
      const newIndex = Math.round(event.contentOffset.x / screenWidth);
      if (currentIndex.value !== newIndex) {
        currentIndex.value = newIndex;
        onCurrentTabChange && runOnJS(onCurrentTabChange)(newIndex);
      }
    },
  });

  const goToTab = useCallback((index: number) => {
    flatListRef.current && flatListRef.current.scrollToIndex({ index, animated: true });
  }, []);

  useImperativeHandle(ref, () => ({ goToTab }), [goToTab]);

  return (
    <Animated.FlatList
      ref={flatListRef}
      data={routes}
      horizontal
      style={styles.flex}
      pagingEnabled
      removeClippedSubviews
      keyboardShouldPersistTaps="handled"
      initialNumToRender={1}
      scrollEventThrottle={16}
      onScroll={scrollHandler}
      getItemLayout={(_, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => <View style={[styles.flex, { width: screenWidth }]}>{renderScene({ item })}</View>}
      keyExtractor={(item) => item.key}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
