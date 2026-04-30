import Timer from "react-native-background-timer-android";
import BackgroundTimer from "react-native-background-timer";
import { checkIsAndroid } from "./PlatformMethods";

export const customSetInterval = (intervalFunc, milliseconds, interval) => {
  if (interval.current) {
    return;
  }

  return checkIsAndroid()
    ? Timer.setInterval(intervalFunc, milliseconds) // Use it to avoid timer Delay issue in android countdown timer
    : BackgroundTimer.setInterval(intervalFunc, milliseconds);
};

export const customClearInterval = (interval) => {
  checkIsAndroid() ? Timer.clearInterval(interval.current) : BackgroundTimer.clearInterval(interval.current);
  interval.current = null;
};
