import { useCallback, useEffect, useRef } from "react";

export const usePolling = (callback, ms) => {
  const interval = useRef(null);

  const startPolling = useCallback(() => {
    interval.current = setInterval(() => {
      callback();
    }, ms);
  }, [callback, ms]);

  const stopPolling = useCallback(() => {
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
  }, []);

  useEffect(() => {
    return stopPolling;
  }, [stopPolling]);

  return {
    startPolling,
    stopPolling,
  };
};
