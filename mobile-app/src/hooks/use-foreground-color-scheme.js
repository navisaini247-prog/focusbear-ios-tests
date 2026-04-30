import { useMemo, useRef } from "react";
import { useColorScheme, AppState, Platform } from "react-native";

export const useForegroundColorScheme = () => {
  const colorScheme = useColorScheme();
  const lastCorrectColorScheme = useRef(null);
  if (!lastCorrectColorScheme.current) {
    lastCorrectColorScheme.current = colorScheme;
  }

  return useMemo(() => {
    const appState = AppState.currentState;
    if (Platform.OS === "ios" && appState.match(/inactive|background/)) {
      return lastCorrectColorScheme.current;
    } else {
      lastCorrectColorScheme.current = colorScheme;
      return lastCorrectColorScheme.current;
    }
  }, [colorScheme]);
};
