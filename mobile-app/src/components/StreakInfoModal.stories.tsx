import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import { StreakInfoModal } from "./StreakInfoModal";

type StreakInfoModalStoryProps = {
  morningStreak: number;
  eveningStreak: number;
  focusStreak: number;
  morningDoneToday: boolean;
  eveningDoneToday: boolean;
  focusDoneToday: boolean;
};

const StreakInfoModalWrapper = (props: StreakInfoModalStoryProps) => {
  const [isVisible, setIsVisible] = useState(true);
  return <StreakInfoModal {...props} isVisible={isVisible} onConfirm={() => setIsVisible(false)} />;
};

const meta: Meta<StreakInfoModalStoryProps> = {
  title: "Streak/StreakInfoModal",
  component: StreakInfoModalWrapper,
  argTypes: {
    morningStreak: { control: { type: "number", min: 0, max: 365 } },
    eveningStreak: { control: { type: "number", min: 0, max: 365 } },
    focusStreak: { control: { type: "number", min: 0, max: 365 } },
    morningDoneToday: { control: "boolean" },
    eveningDoneToday: { control: "boolean" },
    focusDoneToday: { control: "boolean" },
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

type Story = StoryObj<StreakInfoModalStoryProps>;

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

export const AllActiveStreaks: Story = {
  name: "All Active Streaks",
  args: {
    morningStreak: 15,
    eveningStreak: 12,
    focusStreak: 20,
    morningDoneToday: true,
    eveningDoneToday: true,
    focusDoneToday: true,
  },
};

export const AllAtRiskStreaks: Story = {
  name: "All At Risk Streaks",
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
  name: "Mixed States (Active, Risk, Inactive)",
  args: {
    morningStreak: 7,
    eveningStreak: 0,
    focusStreak: 14,
    morningDoneToday: false,
    eveningDoneToday: false,
    focusDoneToday: true,
  },
};

export const SingleDayStreaks: Story = {
  name: "Single Day Streaks",
  args: {
    morningStreak: 1,
    eveningStreak: 1,
    focusStreak: 1,
    morningDoneToday: true,
    eveningDoneToday: true,
    focusDoneToday: true,
  },
};

export const LongStreaks: Story = {
  name: "Long Streaks (100+ days)",
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
  name: "Routine-Only User",
  args: {
    morningStreak: 30,
    eveningStreak: 28,
    focusStreak: 0,
    morningDoneToday: true,
    eveningDoneToday: true,
    focusDoneToday: false,
  },
};

export const MorningOnlyUser: Story = {
  name: "Morning Routine Only",
  args: {
    morningStreak: 45,
    eveningStreak: 0,
    focusStreak: 0,
    morningDoneToday: true,
    eveningDoneToday: false,
    focusDoneToday: false,
  },
};

export const AboutToLoseStreak: Story = {
  name: "About to Lose Streak",
  args: {
    morningStreak: 50,
    eveningStreak: 50,
    focusStreak: 50,
    morningDoneToday: false,
    eveningDoneToday: false,
    focusDoneToday: false,
  },
};
