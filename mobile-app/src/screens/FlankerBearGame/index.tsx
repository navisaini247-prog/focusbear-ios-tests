import React, { useState, useEffect, useCallback } from "react";
import { GameExplanation } from "./GameExplanation";
import { GameTransition } from "./GameTransition";
import { GameComplete } from "./GameComplete";
import { GamePlay } from "./GamePlay";
import { calculateFlankerScore } from "./utils/scoring";
import {
  GameState,
  Direction,
  StimulusType,
  TrialResult,
  PRACTICE_TRIALS,
  MAIN_TRIALS,
  TRIAL_TIMEOUT,
  FEEDBACK_DURATION,
  OK_DURATION,
} from "./types";
import { useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import {
  postUserLocalDeviceSettings,
  saveFlankerTestResult,
  setHasCompletedAfterStudyFlanker,
  setHasCompletedFlanker,
} from "@/actions/UserActions";
import { useDispatch } from "react-redux";
import { PLATFORMS } from "@/constants";
import { useNavigation, useRoute } from "@react-navigation/native";

const FlankerBearGame = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute() as {
    params: {
      isAfterStudy: boolean;
    };
  };
  const isAfterStudy = route.params?.isAfterStudy;

  // State
  const [gameState, setGameState] = useState<GameState>("explanation");
  const [isPractice, setIsPractice] = useState(true);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [trialStartTime, setTrialStartTime] = useState<number | null>(null);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [trials, setTrials] = useState<
    Array<{
      stimulusType: StimulusType;
      correctDirection: Direction;
    }>
  >([]);
  const [showOk, setShowOk] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [hasProcessedResponse, setHasProcessedResponse] = useState(false);

  // Animation values
  const feedbackOpacity = useSharedValue(0);

  const startNewTrial = useCallback(() => {
    setTrialStartTime(null);
    setFeedback(null);
    setIsTimeout(false);
    setHasProcessedResponse(false);
    setTrialStartTime(performance.now());
  }, []);

  const generateTrials = useCallback((count: number) => {
    const newTrials = [];
    const congruentCount = Math.floor(count / 2);

    // Generate congruent trials
    for (let i = 0; i < congruentCount; i++) {
      const direction: Direction = Math.random() < 0.5 ? "left" : "right";
      newTrials.push({
        stimulusType: "congruent",
        correctDirection: direction,
      });
    }

    // Generate incongruent trials
    for (let i = 0; i < count - congruentCount; i++) {
      const direction: Direction = Math.random() < 0.5 ? "left" : "right";
      newTrials.push({
        stimulusType: "incongruent",
        correctDirection: direction,
      });
    }

    // Shuffle trials
    return newTrials.sort(() => Math.random() - 0.5);
  }, []);

  // Initialize trials
  useEffect(() => {
    const trialCount = isPractice ? PRACTICE_TRIALS : MAIN_TRIALS;
    setTrials(generateTrials(trialCount));
  }, [isPractice, generateTrials]);

  const onComplete = () => {
    const score = calculateFlankerScore(results);

    const params = {
      totalTrials: score.totalTrials,
      missedTrials: score.missedTrials,
      overallAccuracy: score.overallAccuracy,
      congruentAccuracy: score.congruentAccuracy,
      incongruentAccuracy: score.incongruentAccuracy,
      meanRtCongruent: score.meanRTCongruent,
      meanRtIncongruent: score.meanRTIncongruent,
      trialResults: results,
      isEndOfStudy: isAfterStudy || false,
    };

    const key = isAfterStudy ? "hasCompletedAfterStudyFlanker" : "hasCompletedFlanker";

    saveFlankerTestResult(params);
    if (isAfterStudy) {
      dispatch(setHasCompletedAfterStudyFlanker(true));
    } else {
      dispatch(setHasCompletedFlanker(true));
    }
    dispatch(postUserLocalDeviceSettings({ [key]: true }, PLATFORMS.MACOS));
    navigation.goBack();
  };

  const handleResponse = useCallback(
    (response: Direction | null) => {
      if (trialStartTime === null || hasProcessedResponse) {
        return;
      }

      setHasProcessedResponse(true);

      // If user clicked a button, clear timeout state
      if (response !== null) {
        setIsTimeout(false);
      }

      const reactionTime = response ? performance.now() - trialStartTime : null;
      const isCorrect = response === trials[currentTrial].correctDirection;

      if (!isPractice) {
        setResults((prev) => [
          ...prev,
          {
            trialIndex: currentTrial,
            stimulusType: trials[currentTrial].stimulusType,
            correctDirection: trials[currentTrial].correctDirection,
            userResponse: response,
            isCorrect,
            reactionTimeMs: reactionTime,
          },
        ]);
      }

      setFeedback(isCorrect ? "correct" : "incorrect");
      setShowOk(true);

      feedbackOpacity.value = withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(0, { duration: FEEDBACK_DURATION }),
      );

      setTimeout(() => {
        setShowOk(false);
        if (currentTrial + 1 < trials.length) {
          setCurrentTrial((prev) => prev + 1);
          startNewTrial();
        } else if (isPractice) {
          setIsPractice(false);
          setGameState("transition");
        } else {
          setIsComplete(true);
        }
      }, OK_DURATION);
    },
    [trialStartTime, trials, currentTrial, isPractice, feedbackOpacity, startNewTrial, hasProcessedResponse],
  );

  // Handle trial timeout
  useEffect(() => {
    if (trialStartTime === null || isPractice) {
      return;
    }

    const timeout = setTimeout(() => {
      // Only trigger timeout if we haven't processed any response yet
      if (trialStartTime !== null && !hasProcessedResponse) {
        setIsTimeout(true);
        handleResponse(null);
      }
    }, TRIAL_TIMEOUT);

    return () => {
      clearTimeout(timeout);
    };
  }, [trialStartTime, isPractice, handleResponse, hasProcessedResponse]);

  // Start first trial
  useEffect(() => {
    if (gameState !== "explanation") {
      startNewTrial();
    }
  }, [startNewTrial, gameState]);

  const handleStartGame = () => {
    setGameState("practice");
  };

  const handleStartMainTrials = () => {
    setGameState("main");
    setCurrentTrial(0);
    startNewTrial();
  };

  if (gameState === "explanation") {
    return <GameExplanation onStartGame={handleStartGame} />;
  }

  if (gameState === "transition") {
    return <GameTransition onStartMainTrials={handleStartMainTrials} />;
  }

  if (isComplete) {
    return <GameComplete results={results} onComplete={onComplete} />;
  }

  return (
    <GamePlay
      key={currentTrial}
      isPractice={isPractice}
      currentTrial={currentTrial}
      totalTrials={trials.length}
      showOk={showOk}
      feedback={feedback}
      isTimeout={isTimeout}
      feedbackOpacity={feedbackOpacity}
      currentTrialData={trials[currentTrial]}
      onResponse={handleResponse}
    />
  );
};

export { FlankerBearGame };
