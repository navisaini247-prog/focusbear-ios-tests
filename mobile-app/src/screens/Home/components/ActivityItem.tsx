import React, { memo } from "react";
import { View, StyleSheet, Text, useWindowDimensions, StyleProp, ViewStyle } from "react-native";
import { Button, HeadingMediumText, BodySmallText, Card, ButtonProps, CardProps } from "@/components";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { formatTime } from "@/utils/TimeMethods";
import { clampFontScale } from "@/utils/FontScaleUtils";
import type { FormattedActivity } from "@/hooks/use-routine-data";

export const ACTIVITY_CARD_HEIGHT = 64;

export interface ActivityItemButtonProps extends Partial<FormattedActivity> {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  buttonProps?: ButtonProps;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  hasDragHandle?: boolean;
}

export const ActivityItemButton = memo(function ActivityItemButton({
  onPress,
  style,
  testID,
  buttonProps,
  leftContent,
  rightContent,
  hasDragHandle,
  ...activity
}: ActivityItemButtonProps) {
  const { colors, shadowStyles } = useTheme();
  const height = ACTIVITY_CARD_HEIGHT * clampFontScale(useWindowDimensions().fontScale);

  return (
    <Button
      subtle
      style={[styles.row, styles.activityItem, shadowStyles.shadow, { height }, style]}
      onPress={onPress}
      testID={testID}
      {...buttonProps}
    >
      {hasDragHandle && <Icon name="ellipsis-vertical" size={16} color={colors.border} style={styles.dragHandleIcon} />}
      {leftContent}
      <View style={styles.flex}>
        <ActivityItemSkeleton {...activity} />
      </View>
      {rightContent}
    </Button>
  );
});

export interface ActivityItemCardProps extends Partial<FormattedActivity> {
  style?: StyleProp<ViewStyle>;
  cardProps?: CardProps;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  hasDragHandle?: boolean;
}

export const ActivityItemCard = memo(function ActivityItemCard({
  style,
  cardProps,
  leftContent,
  rightContent,
  hasDragHandle,
  ...activity
}: ActivityItemCardProps) {
  const { colors, shadowStyles } = useTheme();
  const height = ACTIVITY_CARD_HEIGHT * clampFontScale(useWindowDimensions().fontScale);

  return (
    <Card style={[styles.row, styles.activityItem, shadowStyles.shadow, { height }, style]} {...cardProps}>
      {hasDragHandle && <Icon name="ellipsis-vertical" size={16} color={colors.border} style={styles.dragHandleIcon} />}
      {leftContent}
      <View style={styles.flex}>
        <ActivityItemSkeleton {...activity} />
      </View>
      {rightContent}
    </Card>
  );
});

export const ActivityItemSkeleton = memo(function ActivityItemSkeleton(item: Partial<FormattedActivity>) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { name, completion_requirements, habit_icon, duration_seconds } = item;
  const { isSkipped, isLocked, isCompleted, aiGenerated } = item;

  return (
    <View style={[styles.row, styles.gap12]}>
      <View>
        {habit_icon && <Text style={styles.emoji}>{habit_icon}</Text>}
        {isLocked && (
          <View style={[StyleSheet.absoluteFill, styles.iconContainer, { backgroundColor: colors.card }]}>
            <Icon name="lock-closed" size={14} color={colors.text} />
          </View>
        )}
      </View>

      <View style={[styles.flex, styles.row, styles.gap8]}>
        {aiGenerated && <Icon name="sparkles" size={16} color={colors.primary} />}

        <HeadingMediumText size={15} numberOfLines={3} style={[isCompleted && styles.strikeThrough, styles.flex]}>
          {name}
        </HeadingMediumText>

        <View style={[styles.row, styles.gap4]}>
          {!completion_requirements && duration_seconds && (
            <BodySmallText color={colors.subText} weight="300">
              {formatTime(duration_seconds * 1000)}
            </BodySmallText>
          )}
          {isSkipped && (
            <BodySmallText color={colors.subText} italic>
              {t("habit.habitSkipForToday")}
            </BodySmallText>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap4: { gap: 4 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  absolute: { position: "absolute" },
  activityItem: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 0,
    paddingRight: 16,
  },
  strikeThrough: {
    textDecorationLine: "line-through",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.6,
  },
  emoji: {
    fontSize: 22,
  },
  dragHandleIcon: {
    width: 18,
    marginLeft: -12,
  },
});
