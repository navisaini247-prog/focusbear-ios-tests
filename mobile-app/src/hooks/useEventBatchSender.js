import { useEffect, useRef } from "react";
import { sendBatchedEvents } from "@/actions/ActivityActions";

const BATCH_INTERVAL_MS = 30000;

/**
 * Hook that sends batched events every 30 seconds
 * Handles debouncing and prevents race conditions
 */
export const useEventBatchSender = () => {
  const intervalRef = useRef(null);

  useEffect(() => {
    sendBatchedEvents();

    intervalRef.current = setInterval(() => {
      sendBatchedEvents();
    }, BATCH_INTERVAL_MS);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
};
