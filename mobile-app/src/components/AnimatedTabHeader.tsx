import React from "react";
import { HeadingSmallText, PressableWithFeedback } from "@/components";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import Animated, { SharedValue, interpolateColor, useAnimatedStyle } from "react-native-reanimated";
import { Route } from "./TabViewFlatList";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";

interface AnimatedTabHeaderProps {
  routes: Route[];
  onTabPress: (index: number) => void;
  translateX: SharedValue<number>;
  style?: any;
}

interface TabLabelProps extends Route {
  index: number;
  onPress: (index: number) => void;
  translateX: SharedValue<number>;
}

const TabLabel: React.FC<TabLabelProps> = ({ index, onPress, translateX, ...route }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { text: colorText, subText: colorSubText } = colors;
  const { width: screenWidth } = useWindowDimensions();

  // Animated text color based on scroll position
  const textStyle = useAnimatedStyle(() => {
    const distance = Math.abs(translateX.value - index * screenWidth);
    return { color: interpolateColor(distance, [0, screenWidth], [colorText, colorSubText]) };
  });

  return (
    <PressableWithFeedback style={styles.tab} onPress={() => onPress(index)} testID={route?.testID}>
      <HeadingSmallText center maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI}>
        <Animated.Text style={textStyle}>{t(route.titleKey)}</Animated.Text>
      </HeadingSmallText>
    </PressableWithFeedback>
  );
};

export const AnimatedTabHeader: React.FC<AnimatedTabHeaderProps> = ({ routes, onTabPress, translateX, style }) => {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const tabWidth = (screenWidth - 32) / Math.max(1, routes.length);

  // Sliding indicator style that moves under the active tab label
  const slidingIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (translateX.value / screenWidth) * tabWidth }],
  }));

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        {routes.map((route, index) => (
          <TabLabel index={index} onPress={onTabPress} translateX={translateX} {...route} key={route.key} />
        ))}
      </View>
      {/* Single sliding indicator under the labels */}
      <Animated.View style={[styles.indicatorHeight, { width: tabWidth }, slidingIndicatorStyle]}>
        <View style={[styles.indicator, styles.indicatorHeight, { backgroundColor: colors.primary }]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  container: {
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
  },
  indicatorHeight: {
    height: 3,
  },
  indicator: {
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    width: 60,
    alignSelf: "center",
  },
});
