import { useTheme } from "@react-navigation/native";
import { ACTIVITY_TYPE } from "@/constants/routines";
import type { ActivityType } from "@/types/Routine";
import { theme } from "@/theme";

export const getRoutineTheme = (type: ActivityType, colors: typeof theme.light.colors) => {
  switch (type) {
    case ACTIVITY_TYPE.MORNING:
      return { icon: "sunny", color: colors.pink, backgroundColor: colors.pinkBg };
    case ACTIVITY_TYPE.EVENING:
      return { icon: "moon", color: colors.blue, backgroundColor: colors.blueBg };
    case ACTIVITY_TYPE.STANDALONE:
      return { icon: null, color: colors.violet, backgroundColor: colors.violetBg };
    default:
      return {};
  }
};

export const useRoutineTheme = (type: ActivityType) => {
  const { colors } = useTheme();
  return getRoutineTheme(type, colors);
};
