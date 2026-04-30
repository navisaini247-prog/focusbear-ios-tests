import SoundPlayer from "react-native-sound-player";
import { SOUND_ALERTS } from "./Enums";
import { generateRandomInteger } from "./GlobalMethods";
import { addErrorLog, addInfoLog } from "./FileLogger";

const playSound = (fileName, fileType) => {
  addInfoLog("Playing sound file: " + fileName);
  try {
    // play files from local storage
    SoundPlayer.playSoundFile(fileName, fileType ?? "wav");
  } catch (error) {
    addErrorLog(`Unable to play the sound file:`, error);
  }
};

/**
 * Play Random Morning/Evening Start sound effect
 */
const playRandomStartMorningEveningRoutineSound = () => {
  switch (generateRandomInteger(1, 3)) {
    case 1:
      playSound(SOUND_ALERTS.START_MORNING_EVENING_ROUTINE_1);
      break;

    case 2:
      playSound(SOUND_ALERTS.START_MORNING_EVENING_ROUTINE_2);
      break;

    case 3:
      playSound(SOUND_ALERTS.START_MORNING_EVENING_ROUTINE_3);
      break;

    default:
      break;
  }
};

/**
 * Play Random Complete Habit sound effect
 */
const playRandomCompleteHabitSound = () => {
  switch (generateRandomInteger(1, 2)) {
    case 1:
      playSound(SOUND_ALERTS.COMPLETE_HABIT_1);
      break;

    case 2:
      playSound(SOUND_ALERTS.COMPLETE_HABIT_2);
      break;

    default:
      break;
  }
};

/**
 * Play Random Complete morning routine sound effect
 */

const playRandomCompleteMorningRoutineSound = () => {
  switch (generateRandomInteger(1, 3)) {
    case 1:
      playSound(SOUND_ALERTS.COMPLETE_MORNING_ROUTINE_1);
      break;

    case 2:
      playSound(SOUND_ALERTS.COMPLETE_MORNING_ROUTINE_2);
      break;

    case 3:
      playSound(SOUND_ALERTS.COMPLETE_MORNING_ROUTINE_3);
      break;

    default:
      break;
  }
};

/**
 * Play Random Complete evening routine sound effect
 */
const playRandomCompleteEveningRoutineSound = () => {
  switch (generateRandomInteger(1, 3)) {
    case 1:
      playSound(SOUND_ALERTS.COMPLETE_EVENING_ROUTINE_1);
      break;

    case 2:
      playSound(SOUND_ALERTS.COMPLETE_EVENING_ROUTINE_2);
      break;

    case 3:
      playSound(SOUND_ALERTS.COMPLETE_EVENING_ROUTINE_3);
      break;

    default:
      break;
  }
};

/**
 * Play timer completion sound effect
 */
const playTimerCompletionSound = () => {
  // Use existing habit completion sound for timer completion
  playRandomCompleteHabitSound();
};

export {
  playSound,
  playRandomStartMorningEveningRoutineSound,
  playRandomCompleteHabitSound,
  playRandomCompleteMorningRoutineSound,
  playRandomCompleteEveningRoutineSound,
  playTimerCompletionSound,
};
