import { useEffect } from "react";
import { useSelector } from "react-redux";
import { addInfoLog } from "@/utils/FileLogger";
import { setFrictionMode } from "@/utils/NativeModuleMethods";
import { checkIsAndroid } from "@/utils/PlatformMethods";

export const useToggleFrictionMode = () => {
  const isEasySkipModeEnabled = useSelector(
    (state) => state.user?.userLocalDeviceSettingsData?.MacOS?.kIsEasySkipEnabled,
  );

  const toggleIosFrictionMode = (status) => {
    try {
      setFrictionMode(status);
      return true;
    } catch (error) {
      addInfoLog(`Error toggling friction mode: ${error.message}`);
      return false;
    }
  };

  useEffect(() => {
    if (checkIsAndroid()) {
      return;
    }
    toggleIosFrictionMode(isEasySkipModeEnabled);
  }, [isEasySkipModeEnabled]);
};
