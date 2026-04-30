/* eslint-disable react/display-name */

import { useTheme } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, InteractionManager, View, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

// waits for animations to finish before launching component
export const withAfterAnimation =
  (Component, Skeleton) =>
  ({ ...props }) => {
    const [animationsDone, setAnimationsDone] = useState(false);
    const [isFirstTime, setIsFirstTime] = useState(true);
    const { colors } = useTheme();

    useEffect(() => {
      setAnimationsDone(false);
      InteractionManager.runAfterInteractions(() => {
        setAnimationsDone(true);
        setIsFirstTime(false);
      });
    }, []);

    if (!animationsDone && isFirstTime) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      );
    }

    return <Component {...props} />;
  };

export const withDelayRender =
  (Component) =>
  ({ ...props }) => {
    const [renderComponent, setRenderComponent] = useState(false);
    const { colors } = useTheme();

    useEffect(() => {
      setRenderComponent(true);
    }, []);

    if (!renderComponent) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      );
    }

    return <Component {...props} />;
  };
