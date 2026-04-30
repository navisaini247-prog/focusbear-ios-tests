export type Direction = "left" | "right";
export type StimulusType = "congruent" | "incongruent";
export type GameState = "explanation" | "practice" | "transition" | "main" | "complete";

export interface TrialResult {
  trialIndex: number;
  stimulusType: StimulusType;
  correctDirection: Direction;
  userResponse: Direction | null;
  isCorrect: boolean;
  reactionTimeMs: number | null;
}

export interface FlankerBearGameProps {
  onComplete: (results: TrialResult[]) => void;
}

// Constants
export const PRACTICE_TRIALS = 3;
export const MAIN_TRIALS = 60;
export const TRIAL_TIMEOUT = 2000;
export const FEEDBACK_DURATION = 500;
export const OK_DURATION = 1000;

export interface FlankerTestResult {
  totalTrials: number;
  missedTrials: number;
  overallAccuracy: number;
  congruentAccuracy: number;
  incongruentAccuracy: number;
  meanRtCongruent: number;
  meanRtIncongruent: number;
  trialResults: TrialResult[];
}
