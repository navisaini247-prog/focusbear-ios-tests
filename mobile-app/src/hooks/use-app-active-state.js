import { addInfoLog } from "@/utils/FileLogger";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

const useAppActiveState = (callback, shouldLogAppState = false) => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active" && appState.current === "background") {
        callback();
      }

      appState.current = nextAppState;
      if (shouldLogAppState) {
        addInfoLog("AppState", appState.current);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
};

export { useAppActiveState };
