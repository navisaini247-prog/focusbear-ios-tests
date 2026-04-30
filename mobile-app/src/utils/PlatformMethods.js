import { Platform } from "react-native";

const checkIsAndroid = () => {
  return Platform.OS === "android";
};

const checkIsIOS = () => {
  return Platform.OS === "ios";
};

export { checkIsAndroid, checkIsIOS };
