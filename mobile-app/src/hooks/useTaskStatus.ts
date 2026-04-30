import { useState, useEffect, useCallback, useRef } from "react";
import { getTaskStatus } from "@/actions/UserActions";

export interface TaskStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  metadata?: {
    deviceId: string;
    endDate: string;
    imageKey: string;
    platform: string;
    processingStarted: string;
    startDate: string;
    taskType: string;
    userId: string;
    result?: unknown;
  };
  createdAt: string;
  updatedAt: string;
}

interface UseTaskStatusReturn {
  taskStatus: TaskStatus | null;
  isLoading: boolean;
  error: string | null;
  startPolling: (taskId: string) => void;
  stopPolling: () => void;
  isPolling: boolean;
}

export const useTaskStatus = (onSuccess: (statusData: TaskStatus) => void): UseTaskStatusReturn => {
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const fetchTaskStatus = useCallback(
    async (taskId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await getTaskStatus(taskId);

        const statusData = response.data as TaskStatus;

        setTaskStatus(statusData);

        // Stop polling if task is completed or failed
        if (statusData.status === "completed" || statusData.status === "failed") {
          stopPolling();
          onSuccess(statusData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch task status");
        console.error("Error fetching task status:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, stopPolling],
  );

  const startPolling = useCallback(
    (taskId: string) => {
      if (isPolling) {
        stopPolling();
      }

      setIsPolling(true);
      setError(null);

      // Fetch immediately
      fetchTaskStatus(taskId);

      // Then set up polling every 5 seconds
      intervalRef.current = setInterval(() => {
        fetchTaskStatus(taskId);
      }, 5000);
    },
    [fetchTaskStatus, isPolling, stopPolling],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    taskStatus,
    isLoading,
    error,
    startPolling,
    stopPolling,
    isPolling,
  };
};
