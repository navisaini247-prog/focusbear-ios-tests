import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { View, StyleSheet } from "react-native";
import { Button, SmallButton, SelectableButton } from "./Button";
import Icon from "react-native-vector-icons/Ionicons";

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
});

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  argTypes: {
    onPress: { action: "pressed" },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    title: "Default Button",
    testID: "default-button",
  },
};

export const Primary: Story = {
  args: {
    title: "Primary Button",
    primary: true,
    testID: "primary-button",
  },
};

export const Subtle: Story = {
  args: {
    title: "Subtle Button",
    subtle: true,
    testID: "subtle-button",
  },
};

export const Disabled: Story = {
  args: {
    title: "Disabled Button",
    disabled: true,
    testID: "disabled-button",
  },
};

export const Loading: Story = {
  args: {
    title: "Loading Button",
    isLoading: true,
    testID: "loading-button",
  },
};

export const WithLeftIcon: Story = {
  args: {
    title: "With Left Icon",
    renderLeftIcon: <Icon name="add-circle-outline" size={20} color="#333" />,
    testID: "left-icon-button",
  },
};

export const WithRightIcon: Story = {
  args: {
    title: "With Right Icon",
    renderRightIcon: <Icon name="arrow-forward" size={20} color="#333" />,
    testID: "right-icon-button",
  },
};

export const CustomColors: Story = {
  args: {
    title: "Custom Colors",
    backgroundColor: "#4CAF50",
    textColor: "#FFFFFF",
    borderColor: "#388E3C",
    testID: "custom-colors-button",
  },
};

export const Small: StoryObj<typeof SmallButton> = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <View style={styles.row}>
      <SmallButton title="Small Button" testID="small-button" />
      <SmallButton title="Small Primary" primary testID="small-primary-button" />
    </View>
  ),
};

export const Selectable: StoryObj<typeof SelectableButton> = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <View style={styles.row}>
      <SelectableButton title="Selectable" testID="selectable-button" />
      <SelectableButton title="Selected" selected testID="selected-button" />
    </View>
  ),
};

export const AllVariants: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => (
    <View style={styles.container}>
      <Button title="Default" testID="all-default" />
      <Button title="Primary" primary testID="all-primary" />
      <Button title="Subtle" subtle testID="all-subtle" />
      <Button title="Disabled" disabled testID="all-disabled" />
      <Button title="Loading" isLoading testID="all-loading" />
    </View>
  ),
};
