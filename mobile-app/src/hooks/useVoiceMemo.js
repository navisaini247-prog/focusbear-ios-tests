/* eslint-disable react-native/split-platform-components */
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PermissionsAndroid } from "react-native";
import Sound from "react-native-nitro-sound";

export function useVoiceMemo() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTimeMs, setRecordTimeMs] = useState(0);
  const [audioPath, setAudioPath] = useState(null);

  const [intervalId, setIntervalId] = useState(null);

  const requestPermissionIfNeeded = useCallback(async () => {
    if (checkIsAndroid()) {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }, []);

  const startRecording = useCallback(async () => {
    const ok = await requestPermissionIfNeeded();
    if (!ok) return null;

    try {
      const path = await Sound.startRecorder();
      setRecordTimeMs(0);
      setIsRecording(true);
      setAudioPath(null);
      return path;
    } catch {
      return null;
    }
  }, [requestPermissionIfNeeded]);

  const stopRecording = useCallback(async () => {
    try {
      const resultPath = await Sound.stopRecorder();
      setIsRecording(false);
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      setAudioPath(resultPath || null);
      return resultPath || null;
    } catch {
      setIsRecording(false);
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      return null;
    }
  }, [intervalId]);

  // Manage interval based on isRecording state
  useEffect(() => {
    if (isRecording) {
      const id = setInterval(() => {
        setRecordTimeMs((prev) => prev + 100);
      }, 100);
      setIntervalId(id);
      return () => clearInterval(id);
    }
    return undefined;
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (isRecording) {
        Sound.stopRecorder().catch(() => {});
      }
    };
  }, []);

  const formattedTime = useMemo(() => {
    const seconds = Math.floor(recordTimeMs / 1000);
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [recordTimeMs]);

  return {
    isRecording,
    recordTimeMs,
    formattedTime,
    audioPath,
    startRecording,
    stopRecording,
    setAudioPath,
  };
}

export default useVoiceMemo;
