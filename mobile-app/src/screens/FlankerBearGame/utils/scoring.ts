import { TrialResult } from "../types";

interface FlankerScore {
  totalTrials: number;
  missedTrials: number;
  overallAccuracy: number;
  congruentAccuracy: number;
  incongruentAccuracy: number;
  meanRTCongruent: number;
  meanRTIncongruent: number;
  flankerEffect: number;
}

export const calculateFlankerScore = (results: TrialResult[]): FlankerScore => {
  // Initialize counters
  let totalTrials = results.length;
  let missedTrials = 0;
  let correctTrials = 0;
  let correctCongruent = 0;
  let totalCongruent = 0;
  let correctIncongruent = 0;
  let totalIncongruent = 0;
  let rtCongruent: number[] = [];
  let rtIncongruent: number[] = [];

  // Process each trial
  results.forEach((trial) => {
    const isCongruent = trial.stimulusType === "congruent";

    if (isCongruent) {
      totalCongruent++;
    } else {
      totalIncongruent++;
    }

    if (trial.userResponse === null) {
      missedTrials++;
    } else if (trial.isCorrect) {
      correctTrials++;
      if (isCongruent) {
        correctCongruent++;
        if (trial.reactionTimeMs) {
          rtCongruent.push(trial.reactionTimeMs);
        }
      } else {
        correctIncongruent++;
        if (trial.reactionTimeMs) {
          rtIncongruent.push(trial.reactionTimeMs);
        }
      }
    }
  });

  // Calculate accuracies
  const overallAccuracy = correctTrials / totalTrials;
  const congruentAccuracy = correctCongruent / totalCongruent;
  const incongruentAccuracy = correctIncongruent / totalIncongruent;

  // Calculate mean reaction times
  const meanRTCongruent = rtCongruent.length > 0 ? rtCongruent.reduce((a, b) => a + b, 0) / rtCongruent.length : 0;
  const meanRTIncongruent =
    rtIncongruent.length > 0 ? rtIncongruent.reduce((a, b) => a + b, 0) / rtIncongruent.length : 0;

  // Calculate flanker effect
  const flankerEffect = meanRTIncongruent - meanRTCongruent;

  return {
    totalTrials,
    missedTrials,
    overallAccuracy,
    congruentAccuracy,
    incongruentAccuracy,
    meanRTCongruent: Math.round(meanRTCongruent),
    meanRTIncongruent: Math.round(meanRTIncongruent),
    flankerEffect: Math.round(flankerEffect),
  };
};
