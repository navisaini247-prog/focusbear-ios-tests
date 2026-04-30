import { Vibration } from "react-native";
import { VIBRATION_PATTERNS } from "@/constants/vibration";
import { addInfoLog } from "./FileLogger";

export const vibrate = (pattern = VIBRATION_PATTERNS.DEFAULT) => {
  if (pattern == null) {
    addInfoLog("Vibrating with default pattern");
    Vibration.vibrate();
    return;
  }
  addInfoLog("Vibrating with pattern: " + JSON.stringify(pattern));
  Vibration.vibrate(pattern);
};

export const vibrateFocusTimerCompletion = () => {
  vibrate(VIBRATION_PATTERNS.FOCUS_TIMER_COMPLETED);
};
