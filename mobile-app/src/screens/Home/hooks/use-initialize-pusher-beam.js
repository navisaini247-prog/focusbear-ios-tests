import { isPushNotificationAskedStatusSelector } from "@/selectors/GlobalSelectors";
import { userIdSelector } from "@/selectors/UserSelectors";
import { initializePushNotifications } from "@/utils/PusherMethods";
import { useCallback, useEffect } from "react";
import { useSelector } from "@/reducers";

/**
 * Custom hook to initialize Firebase push notifications.
 */
const useInitializePushNotifications = () => {
  const userId = useSelector(userIdSelector, true);
  const isPushNotifAsked = useSelector(isPushNotificationAskedStatusSelector);
  const syncPushRegistration = useCallback(() => {
    if (userId) {
      initializePushNotifications(userId);
    }
  }, [userId]);

  useEffect(() => {
    syncPushRegistration();
  }, [syncPushRegistration, isPushNotifAsked]);
};

export { useInitializePushNotifications };
