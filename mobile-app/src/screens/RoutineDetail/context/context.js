import React, { createContext, useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useKeepAwake } from "@sayem314/react-native-keep-awake";
import { StackActions, useNavigation, useRoute } from "@react-navigation/native";
import { isPostPoneFlowFromDistractionAlertSelector } from "@/selectors/ActivitySelectors";
import { routineProcessSelector } from "@/selectors/RoutineSelectors";
import { useSelector } from "@/reducers";
import { NAVIGATION } from "@/constants";
import { completeActivityAPI, updateCompletedActivities } from "@/actions/ActivityActions";
import { addInfoLog } from "@/utils/FileLogger";
import { useTranslation } from "react-i18next";
import { clearSpecificActivityCompletionProgress } from "@/actions/RoutineActions";
import { playRandomCompleteHabitSound } from "@/utils/SoundPlayer";
import { hideFloatingView, sendDataToWatchApp, setActivitySpecificAllowedApps } from "@/utils/NativeModuleMethods";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { getVideoType, extractVideoId, isValidVideoUrl } from "@/utils/GlobalMethods";
import { POSTHOG_EVENT_NAMES, TAKE_LOGS } from "@/utils/Enums";
import { logSentryError, postHogCapture } from "@/utils/Posthog";
import { setOnboardingMicroBreakFlag } from "@/actions/GlobalActions";
import { VIDEO_TYPES } from "@/constants/videos";
const Context = createContext({});

const RoutineDetailContextProvider = ({ children }) => {
  useKeepAwake();

  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const isPostPoneFlowFromDistractionAlert = useSelector(isPostPoneFlowFromDistractionAlertSelector);
  const routineProcess = useSelector(routineProcessSelector);
  const { item: selectedActivity, isQuickBreak } = route?.params || {};

  const activityInfo = useMemo(() => {
    return {
      id: selectedActivity?.id,
      activityName: selectedActivity?.name,
      checkList: selectedActivity?.check_list,
      completionRequirements: selectedActivity?.completion_requirements,
      videoUrls: selectedActivity?.video_urls,
      imageSources: selectedActivity?.image_urls,
      takeNotes: selectedActivity?.take_notes,
      durationInSecs: selectedActivity?.duration_seconds,
    };
  }, [selectedActivity]);

  const player = useRef(null);
  const richTextRef = useRef(null);

  const [noteText, setNoteText] = useState("");
  const saveNoteTextRef = useRef("");
  const [loading, setLoading] = useState(true);
  const [isPlaying, setPlaying] = useState(true);
  const [isControls, setIsControls] = useState(false);
  const [buffering, setBuffering] = useState(false);

  const togglePlaying = useCallback(async () => {
    setPlaying((prev) => {
      if (prev) {
        postHogCapture(POSTHOG_EVENT_NAMES.PAUSE_ACTIVITY);
      }
      return !prev;
    });
    setIsControls(true);
  }, []);

  const getCurrentHabit = () => {
    setLoading(true);
    setNoteText(routineProcess?.[activityInfo.id]?.savedLogs);
    setLoading(false);
  };

  useEffect(() => {
    if (isPostPoneFlowFromDistractionAlert) {
      setPlaying(false);
    }
  }, [isPostPoneFlowFromDistractionAlert]);

  // Determine video type from video URLs
  const videoType = useMemo(() => {
    if (!activityInfo?.videoUrls?.length) return VIDEO_TYPES.OTHER;
    return getVideoType(activityInfo.videoUrls[0]);
  }, [activityInfo?.videoUrls]);

  // Set activity-specific allowed apps when entering RoutineDetail; clear when leaving
  useEffect(() => {
    if (checkIsAndroid()) {
      setActivitySpecificAllowedApps(selectedActivity?.allowed_mobile_apps || []);
      return () => setActivitySpecificAllowedApps([]);
    }
  }, [selectedActivity?.allowed_mobile_apps]);

  useEffect(() => {
    hideFloatingView();
    getCurrentHabit();
    if (videoType === VIDEO_TYPES.YOUTUBE) {
      addInfoLog(`This activity contains Youtube Video`);
      postHogCapture(POSTHOG_EVENT_NAMES.PLAY_YOUTUBE_VIDEO);
    } else if (videoType === VIDEO_TYPES.VIMEO) {
      addInfoLog(`This activity contains Vimeo Video`);
      postHogCapture(POSTHOG_EVENT_NAMES.PLAY_VIMEO_VIDEO);
    } else {
      addInfoLog(`This is normal activity and do not contain any youtube or vimeo video`);
      setPlaying(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Updates the ref when note text changes (Fixes the issue of setInterval not getting updated state)
  useEffect(() => {
    saveNoteTextRef.current = noteText;
  }, [noteText]);

  const videoId = useMemo(() => {
    const videoUrls = activityInfo?.videoUrls;

    if (!videoUrls || videoUrls?.length <= 0) {
      return "";
    }

    // Filter for valid video URLs
    const validVideoUrls = videoUrls.filter((url) => {
      return isValidVideoUrl(url);
    });

    if (validVideoUrls.length <= 0) {
      return "";
    }

    // Select a random valid video URL
    const randomIndex = Math.floor(Math.random() * validVideoUrls.length);
    const videoUrl = validVideoUrls[randomIndex];

    // Extract and return the video ID
    return extractVideoId(videoUrl);
  }, [activityInfo?.videoUrls]);

  const imageUrls = useMemo(() => {
    return activityInfo?.imageSources?.map((image) => {
      return image.url;
    });
  }, [activityInfo?.imageSources]);

  const finishActivity = useCallback(
    async (wasSkipped = false) => {
      setPlaying(false);

      if (isQuickBreak) {
        dispatch(setOnboardingMicroBreakFlag(true));
        postHogCapture(POSTHOG_EVENT_NAMES.COMPLETE_MICROBREAK_ACTIVITY);

        navigation.navigate(NAVIGATION.TabNavigator);
        return;
      }

      dispatch(updateCompletedActivities(selectedActivity));

      addInfoLog(`Activity completed - ${selectedActivity?.name}`);
      sendDataToWatchApp({ text: t("common.finished") });
      dispatch(clearSpecificActivityCompletionProgress(selectedActivity.id));
      dispatch(completeActivityAPI(selectedActivity, [""], noteText));
      playRandomCompleteHabitSound();

      navigation.dispatch(
        StackActions.replace(NAVIGATION.CompleteScreen, {
          savedNoteText: saveNoteTextRef.current,
          item: selectedActivity,
          didAlready: true,
        }),
      );
    },
    [isQuickBreak, dispatch, selectedActivity, noteText, navigation, t],
  );

  const onReady = useCallback(() => {
    try {
      if (videoType === VIDEO_TYPES.YOUTUBE) {
        player?.current?.seekTo(activityInfo?.durationInSecs - routineProcess?.[activityInfo?.id]?.duration || 0);
      } else if (videoType !== VIDEO_TYPES.VIMEO) {
        // For non-YouTube, non-Vimeo videos (react-native-video)
        player?.current?.seek(activityInfo?.durationInSecs - routineProcess?.[activityInfo?.id]?.duration || 0);
      }
      setPlaying(true);
    } catch (e) {
      logSentryError(`Failed to initialize video routine ${e}`);
    }
  }, [videoType, activityInfo?.durationInSecs, activityInfo?.id, routineProcess]);

  const isNonVideoHabit = !activityInfo?.videoUrls || !activityInfo?.videoUrls?.length;

  const value = {
    loading,
    finishActivity,
    videoType,
    activityInfo,
    isQuickBreak,
    isPlaying,
    setPlaying,
    togglePlaying,
    shouldShowAddNoteViewDuringActivity: activityInfo?.takeNotes === TAKE_LOGS.DURING_ACTIVITY,
    richTextRef,
    isControls,
    player,
    buffering,
    setBuffering,
    onReady,
    videoId,
    imageUrls,
    isNonVideoHabit,
    noteText,
    setNoteText,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

const useRoutineDetailContext = () => React.useContext(Context);

export { RoutineDetailContextProvider, useRoutineDetailContext };
