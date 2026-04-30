import { showStreakCelebrationModal } from "@/actions/ModalActions";
import { eveningStreakSelector, focusStreakSelector, morningStreakSelector } from "@/selectors/UserSelectors";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

export const STREAK_TYPES = {
  MORNING: "morning",
  EVENING: "evening",
  FOCUS: "focus",
} as const;

export type StreakType = (typeof STREAK_TYPES)[keyof typeof STREAK_TYPES];

export const useStreakCelebration = () => {
  const dispatch = useDispatch();

  const morningStreak = useSelector(morningStreakSelector);
  const eveningStreak = useSelector(eveningStreakSelector);
  const focusStreak = useSelector(focusStreakSelector);

  const prevMorningStreak = useRef(morningStreak);
  const prevEveningStreak = useRef(eveningStreak);
  const prevFocusStreak = useRef(focusStreak);

  useEffect(() => {
    const morningIncreased = morningStreak > prevMorningStreak.current;
    const eveningIncreased = eveningStreak > prevEveningStreak.current;
    const focusIncreased = focusStreak > prevFocusStreak.current;

    if (morningIncreased || eveningIncreased || focusIncreased) {
      setTimeout(() => {
        if (morningIncreased) {
          dispatch(showStreakCelebrationModal({ streakCount: morningStreak, streakType: STREAK_TYPES.MORNING }));
        } else if (eveningIncreased) {
          dispatch(showStreakCelebrationModal({ streakCount: eveningStreak, streakType: STREAK_TYPES.EVENING }));
        } else {
          dispatch(showStreakCelebrationModal({ streakCount: focusStreak, streakType: STREAK_TYPES.FOCUS }));
        }
      }, 300);
    }
    prevMorningStreak.current = morningStreak;
    prevEveningStreak.current = eveningStreak;
    prevFocusStreak.current = focusStreak;
  }, [morningStreak, eveningStreak, focusStreak, dispatch]);
};
