import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { StreakAnimation } from "./StreakAnimation";

// Minimal Redux store stub for Storybook — StreakAnimation reads from the modal selectors
const makeStore = (overrides: Record<string, unknown> = {}) =>
  configureStore({
    reducer: {
      modal: () => ({
        isStreakCelebrationModalVisible: true,
        streakCelebrationCount: 7,
        streakCelebrationType: "morning",
        ...overrides,
      }),
    },
  });

const StreakAnimationStory = (args: { count: number; type: string }) => {
  const store = makeStore({
    streakCelebrationCount: args.count,
    streakCelebrationType: args.type,
  });
  return (
    <Provider store={store}>
      <StreakAnimation />
    </Provider>
  );
};

const meta: Meta<typeof StreakAnimationStory> = {
  title: "Streak/StreakAnimation",
  component: StreakAnimationStory,
  argTypes: {
    count: { control: { type: "number", min: 1, max: 365 } },
    type: {
      control: { type: "select" },
      options: ["morning", "evening", "focus"],
    },
  },
  args: {
    count: 7,
    type: "morning",
  },
};

export default meta;

type Story = StoryObj<typeof StreakAnimationStory>;

export const Default: Story = {};

export const SingleDay: Story = {
  name: "Single Day Milestone",
  args: { count: 1, type: "morning" },
};

export const WeekStreak: Story = {
  name: "7-Day Streak",
  args: { count: 7, type: "focus" },
};

export const MonthStreak: Story = {
  name: "30-Day Streak",
  args: { count: 30, type: "evening" },
};

export const LongStreak: Story = {
  name: "100-Day Streak",
  args: { count: 100, type: "morning" },
};

export const EveningCelebration: Story = {
  name: "Evening Routine Celebration",
  args: { count: 21, type: "evening" },
};

export const FocusCelebration: Story = {
  name: "Focus Session Celebration",
  args: { count: 14, type: "focus" },
};
