import { useCallback, useEffect, useRef, useState } from "react";
import { WEBVIEW_READY_TIMEOUT_MS } from "@/constants";
import { addInfoLog, addWarnLog, addErrorLog } from "@/utils/FileLogger";

export type WebviewLoadingStatus = "initializing" | "loading" | "ready" | "error" | "timeout";

type Options = {
  timeoutMs?: number;
  onTimeout?: () => void;
  onError?: () => void;
};

type UseWebviewLoadingResult = {
  status: WebviewLoadingStatus;
  isLoading: boolean;
  handleLoadStart: () => void;
  handleLoadEnd: () => void;
  handleReadyMessage: (rawData: unknown) => boolean;
  handleError: () => void;
  reset: () => void;
};

export function useWebviewLoading(options: Options = {}): UseWebviewLoadingResult {
  const { timeoutMs = WEBVIEW_READY_TIMEOUT_MS, onTimeout, onError } = options;

  const [status, setStatus] = useState<WebviewLoadingStatus>("initializing");

  // Log status changes
  useEffect(() => {
    addInfoLog(`[useWebviewLoading] Status changed: "${status}"`);
  }, [status]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  const startTimer = useCallback(() => {
    if (timeoutRef.current) {
      return;
    }

    addInfoLog(`[useWebviewLoading] Starting timeout timer (${timeoutMs}ms)`);
    timeoutRef.current = setTimeout(() => {
      setStatus((prev) => {
        if (prev === "ready") {
          addInfoLog(`[useWebviewLoading] Timeout fired but status already ready, ignoring`);
          return prev;
        }
        addWarnLog(`[useWebviewLoading] ⚠️ TIMEOUT - Status changed to "timeout"`);
        if (onTimeout) {
          onTimeout();
        }
        return "timeout";
      });
    }, timeoutMs);
  }, [timeoutMs, onTimeout]);

  const handleLoadStart = useCallback(() => {
    setStatus((prev) => {
      if (prev === "ready") {
        return prev;
      }
      addInfoLog(`[useWebviewLoading] Load started - Status: "loading"`);
      return "loading";
    });
    startTimer();
  }, [startTimer]);

  const handleLoadEnd = useCallback(() => {
    setStatus((prev) => {
      if (prev === "ready") {
        return prev;
      }
      addInfoLog(`[useWebviewLoading] Load ended - Status: "loading" (waiting for READY)`);
      return "loading";
    });
  }, []);

  const handleReadyMessage = useCallback(
    (rawData: unknown) => {
      if (rawData == null) {
        return false;
      }

      let parsed = rawData as Record<string, unknown>;

      if (typeof rawData === "string") {
        try {
          parsed = JSON.parse(rawData);
        } catch {
          return false; // Not JSON or not our protocol – ignore.
        }
      }

      if (parsed && typeof parsed === "object" && parsed.type === "READY") {
        addInfoLog(`[useWebviewLoading] ✅ READY message received - Status: "ready"`, parsed);
        clearTimer();
        setStatus("ready");
        return true;
      }

      return false;
    },
    [clearTimer],
  );

  const handleError = useCallback(() => {
    addErrorLog(`[useWebviewLoading] ❌ ERROR - Status changed to "error"`);
    clearTimer();
    setStatus("error");
    if (onError) {
      onError();
    }
  }, [clearTimer, onError]);

  const reset = useCallback(() => {
    addInfoLog(`[useWebviewLoading] 🔄 RESET - Status: "initializing"`);
    clearTimer();
    setStatus("initializing");
    startTimer();
  }, [clearTimer, startTimer]);

  const isLoading = status === "initializing" || status === "loading";

  return {
    status,
    isLoading,
    handleLoadStart,
    handleLoadEnd,
    handleReadyMessage,
    handleError,
    reset,
  };
}
