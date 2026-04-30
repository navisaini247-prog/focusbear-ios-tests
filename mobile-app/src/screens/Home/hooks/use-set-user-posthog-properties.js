import { calculateDayOfUsage } from "@/utils/TimeMethods";
import { useSelector } from "react-redux";
import { userCreatedAtSelector, userIdSelector } from "@/selectors/UserSelectors";
import { posthogSetProperties, postHogCapture } from "@/utils/Posthog";
import DeviceInfo from "react-native-device-info";
import { useEffect } from "react";
import { POSTHOG_EVENT_NAMES, POSTHOG_PERSON_PROPERTIES } from "@/utils/Enums";
import { Dimensions } from "react-native";
import { useHomeContext } from "../context";

const { width, height, fontScale } = Dimensions.get("window");

export const useSetUserPosthogProperties = () => {
  const userId = useSelector(userIdSelector);
  const createdAt = useSelector(userCreatedAtSelector);
  const { isUsagePermissionGranted, isOverlayPermissionGranted, isScreenTimePermissionGranted } = useHomeContext();

  useEffect(() => {
    if (createdAt) {
      const dayOfUsage = calculateDayOfUsage(createdAt);
      posthogSetProperties(userId, { [POSTHOG_PERSON_PROPERTIES.DAY_OF_USAGE]: dayOfUsage });
      postHogCapture(`${POSTHOG_EVENT_NAMES.DAY_OF_USAGE}-${dayOfUsage}`);
    }
    posthogSetProperties(userId, {
      [POSTHOG_PERSON_PROPERTIES.APP_VERSION]: DeviceInfo.getVersion(),
      [POSTHOG_PERSON_PROPERTIES.USAGE_PERMISSION_GRANTED]: isUsagePermissionGranted,
      [POSTHOG_PERSON_PROPERTIES.OVERLAY_PERMISSION_GRANTED]: isOverlayPermissionGranted,
      [POSTHOG_PERSON_PROPERTIES.SCREEN_TIME_PERMISSION_GRANTED]: isScreenTimePermissionGranted,
      [POSTHOG_PERSON_PROPERTIES.DISPLAY_SIZE]: `${parseFloat(width.toFixed(2))} * ${parseFloat(height.toFixed(2))}`,
      [POSTHOG_PERSON_PROPERTIES.FONT_SIZE_USED]: parseFloat(fontScale.toFixed(2)),
    });
  }, [isOverlayPermissionGranted, isScreenTimePermissionGranted, isUsagePermissionGranted]);
};
