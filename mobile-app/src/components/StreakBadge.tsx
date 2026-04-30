import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import { ScalableIcon, SmallButton } from "@/components";
import { useTheme } from "@react-navigation/native";
import { getStreakIconState, STREAK_STATES } from "@/utils/StreakStatus";
import { View } from "react-native";
import { FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";

export type StreakBadgeProps = {
  morningStreak: number;
  eveningStreak: number;
  focusStreak: number;
  morningDoneToday: boolean;
  eveningDoneToday: boolean;
  focusDoneToday: boolean;
  onPress?: () => void;
};

export const StreakBadge = ({
  morningStreak,
  eveningStreak,
  focusStreak,
  morningDoneToday,
  eveningDoneToday,
  focusDoneToday,
  onPress,
}: StreakBadgeProps) => {
  const { colors, shadowStyles } = useTheme();

  const focusState = getStreakIconState(focusStreak, focusDoneToday);
  const morningState = getStreakIconState(morningStreak, morningDoneToday);
  const eveningState = getStreakIconState(eveningStreak, eveningDoneToday);

  const { state, count } = useMemo(() => {
    const candidates = [
      { count: morningStreak, state: morningState },
      { count: eveningStreak, state: eveningState },
      { count: focusStreak, state: focusState },
    ];

    return candidates.sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;

      // Sort by state: active comes first, then inactive
      if (a.state !== b.state) return a.state === STREAK_STATES.ACTIVE ? -1 : 1;
      return 0;
    })[0];
  }, [morningStreak, eveningStreak, focusStreak, morningState, eveningState, focusState]);

  const fireColor = state === STREAK_STATES.ACTIVE ? colors.primary : colors.subText;

  return (
    <View>
      <SmallButton
        subtle
        title={`${count}`}
        testID="test:id/streak-button"
        onPress={onPress}
        style={[styles.button, shadowStyles.shadow]}
        maxFontSizeMultiplier={FONT_SCALE_LIMIT.FIXED_LAYOUT}
        renderRightIcon={
          <ScalableIcon
            name="whatshot"
            iconType="MaterialIcons"
            size={18}
            color={fireColor}
            scaleOptions={{ maxFontScale: FONT_SCALE_LIMIT.CONSTRAINED_UI }}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    bottom: -10,
    left: -16,
    borderRadius: 100,
    paddingLeft: 12,
  },
});
