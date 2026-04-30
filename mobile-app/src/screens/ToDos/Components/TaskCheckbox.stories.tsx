import React from "react";
import type { Meta, StoryObj } from "@storybook/react-native";
import { StyleSheet, View } from "react-native";
import { TaskCheckbox } from "./TaskCheckbox";

const meta: Meta<typeof TaskCheckbox> = {
  title: "ToDos/TaskCheckbox",
  component: TaskCheckbox,
  argTypes: {
    value: { control: "boolean" },
    small: { control: "boolean" },
  },
  args: {
    value: false,
    small: false,
  },
  decorators: [
    (Story) => (
      <View style={styles.container}>
        <Story />
      </View>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof TaskCheckbox>;

export const Unchecked: Story = {
  name: "Unchecked (Default)",
  args: { value: false },
};

export const Checked: Story = {
  name: "Checked",
  args: { value: true },
};

export const SmallUnchecked: Story = {
  name: "Small — Unchecked",
  args: { value: false, small: true },
};

export const SmallChecked: Story = {
  name: "Small — Checked",
  args: { value: true, small: true },
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
  },
});
