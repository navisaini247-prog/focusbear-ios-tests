import { checkIsIOS } from "@/utils/PlatformMethods";
import { useEffect, useState } from "react";
import { Keyboard } from "react-native";

export const useKeyboardVisible = () => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const onKeyboardShow = (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    };
    const onKeyboardHide = () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    };
    if (checkIsIOS()) {
      const keyboardWillShowListener = Keyboard.addListener("keyboardWillShow", onKeyboardShow);
      const keyboardWillHideListener = Keyboard.addListener("keyboardWillHide", onKeyboardHide);

      return () => {
        keyboardWillShowListener.remove();
        keyboardWillHideListener.remove();
      };
    }
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", onKeyboardShow);
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", onKeyboardHide);

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);
  return { isKeyboardVisible, keyboardHeight };
};
