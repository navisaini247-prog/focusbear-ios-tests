import React, { useMemo, useState, useEffect } from "react";
import { View, ViewProps, FlatList, StyleSheet } from "react-native";
import { Button, Card, CardProps } from "@/components";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";

const AnimatedView = Animated.createAnimatedComponent(View);

interface CircleMenuItemProps extends ViewProps {
  content: React.ReactNode;
  onPress: () => void;
  isSelected: boolean;
}

const CircleMenuItem: React.FC<CircleMenuItemProps> = ({ content, onPress, isSelected, style }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => customStyles(colors), [colors]);
  const [pressed, setPressed] = useState(false);
  const pressAnimation = useSharedValue(1);

  useEffect(() => {
    pressAnimation.value = withTiming(pressed ? 0.9 : 1, { duration: 200, easing: Easing.out(Easing.poly(4)) });
  }, [pressed]);

  const pressAnimationStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressAnimation.value }] }));

  return (
    <AnimatedView style={[styles.item, styles.circular, pressAnimationStyle, style]}>
      <Button
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[styles.button, styles.circular, isSelected && styles.selectedItem]}
        data-test-skip
      >
        {content}
      </Button>
    </AnimatedView>
  );
};

interface CircleGridMenuProps extends CardProps {
  data: CircleMenuItemProps[];
}

export const CircleGridMenu: React.FC<CircleGridMenuProps> = ({ data, ...props }) => (
  <Card {...props}>
    <FlatList
      numColumns={4}
      data={data}
      renderItem={({ item }) => <CircleMenuItem {...item} style={{ width: `${100 / 4}%` }} />}
    />
  </Card>
);

const customStyles = (colors) => {
  const styles = StyleSheet.create({
    item: {
      aspectRatio: 1,
      padding: 8,
      borderColor: colors.transparent,
    },
    button: {
      flexDirection: "column",
      paddingHorizontal: 3,
      paddingVertical: 3,
    },
    selectedItem: {
      borderColor: colors.primary,
      borderWidth: 4,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    circular: {
      borderRadius: 1000,
    },
  });
  return styles;
};
