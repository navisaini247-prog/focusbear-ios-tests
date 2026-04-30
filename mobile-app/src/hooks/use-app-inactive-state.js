import { addInfoLog } from "@/utils/FileLogger";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

const useAppInactiveState = (callback, shouldLogAppState = false) => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" && appState.current === "active") {
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

export { useAppInactiveState };
