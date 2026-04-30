import type { Meta, StoryObj } from "@storybook/react-native";
import { StreakBadge, StreakBadgeProps } from "./StreakBadge";

const meta: Meta<StreakBadgeProps> = {
  title: "Streak/StreakBadge",
  component: StreakBadge,
  argTypes: {
    morningStreak: { control: { type: "number", min: 0, max: 365 } },
    eveningStreak: { control: { type: "number", min: 0, max: 365 } },
    focusStreak: { control: { type: "number", min: 0, max: 365 } },
    morningDoneToday: { control: "boolean" },
    eveningDoneToday: { control: "boolean" },
    focusDoneToday: { control: "boolean" },
    onPress: { action: "pressed" },
  },
  args: {
    morningStreak: 5,
    eveningStreak: 3,
    focusStreak: 7,
    morningDoneToday: true,
    eveningDoneToday: false,
    focusDoneToday: true,
  },
};

export default meta;

type Story = StoryObj<StreakBadgeProps>;

export const Default: Story = {};

export const NoStreaks: Story = {
  name: "No Streaks (New User)",
  args: {
    morningStreak: 0,
    eveningStreak: 0,
    focusStreak: 0,
    morningDoneToday: false,
    eveningDoneToday: false,
    focusDoneToday: false,
  },
};

export const SingleDayStreak: Story = {
  name: "Single Day Streak",
  args: {
    morningStreak: 1,
    eveningStreak: 0,
    focusStreak: 0,
    morningDoneToday: true,
    eveningDoneToday: false,
    focusDoneToday: false,
  },
};

export const ActiveStreak: Story = {
  name: "Active Streak (Completed Today)",
  args: {
    morningStreak: 15,
    eveningStreak: 12,
    focusStreak: 20,
    morningDoneToday: true,
    eveningDoneToday: true,
    focusDoneToday: true,
  },
};

export const AtRiskStreak: Story = {
  name: "At Risk Streak (Not Completed Today)",
  args: {
    morningStreak: 10,
    eveningStreak: 8,
    focusStreak: 5,
    morningDoneToday: false,
    eveningDoneToday: false,
    focusDoneToday: false,
  },
};

export const MixedStreakStates: Story = {
  name: "Mixed Streak States",
  args: {
    morningStreak: 7,
    eveningStreak: 0,
    focusStreak: 14,
    morningDoneToday: false,
    eveningDoneToday: false,
    focusDoneToday: true,
  },
};

export const LongStreak: Story = {
  name: "Long Streak (100+ days)",
  args: {
    morningStreak: 150,
    eveningStreak: 120,
    focusStreak: 180,
    morningDoneToday: true,
    eveningDoneToday: true,
    focusDoneToday: true,
  },
};

export const FocusOnlyUser: Story = {
  name: "Focus-Only User",
  args: {
    morningStreak: 0,
    eveningStreak: 0,
    focusStreak: 25,
    morningDoneToday: false,
    eveningDoneToday: false,
    focusDoneToday: true,
  },
};

export const RoutineOnlyUser: Story = {
  name: "Routine-Only User (No Focus)",
  args: {
    morningStreak: 30,
    eveningStreak: 28,
    focusStreak: 0,
    morningDoneToday: true,
    eveningDoneToday: true,
    focusDoneToday: false,
  },
};
