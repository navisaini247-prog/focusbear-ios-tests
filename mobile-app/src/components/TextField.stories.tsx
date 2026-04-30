import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { View, StyleSheet } from "react-native";
import { TextField } from "./TextField";

const styles = StyleSheet.create({
  decorator: {
    padding: 16,
    gap: 16,
  },
  variantsContainer: {
    gap: 12,
  },
});

const meta: Meta<typeof TextField> = {
  title: "Components/TextField",
  component: TextField,
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    type: {
      control: "select",
      options: ["password", "email", "numeric", "url", "search"],
      description: "Input type",
    },
    clearable: {
      control: "boolean",
      description: "Show clear button when text is entered",
    },
    editable: {
      control: "boolean",
      description: "Whether the input is editable",
    },
    multiline: {
      control: "boolean",
      description: "Allow multiple lines of text",
    },
    small: {
      control: "boolean",
      description: "Use smaller input size",
    },
    transparent: {
      control: "boolean",
      description: "Use transparent background",
    },
  },
  decorators: [
    (Story) => (
      <View style={styles.decorator}>
        <Story />
      </View>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof TextField>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const WithValue: Story = {
  args: {
    placeholder: "Enter text...",
    value: "Hello World",
  },
};

export const Clearable: Story = {
  args: {
    placeholder: "Type something...",
    value: "Clear me!",
    clearable: true,
  },
};

export const Password: Story = {
  args: {
    placeholder: "Enter password...",
    type: "password",
  },
};

export const Email: Story = {
  args: {
    placeholder: "Enter email...",
    type: "email",
  },
};

export const URL: Story = {
  args: {
    placeholder: "Enter URL...",
    type: "url",
  },
};

export const Search: Story = {
  args: {
    placeholder: "Search...",
    type: "search",
  },
};

export const Numeric: Story = {
  args: {
    placeholder: "Enter number...",
    type: "numeric",
  },
};

export const Multiline: Story = {
  args: {
    placeholder: "Enter multiple lines of text...",
    multiline: true,
  },
};

export const Small: Story = {
  args: {
    placeholder: "Small input...",
    small: true,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    value: "Cannot edit this",
    editable: false,
  },
};

export const WithError: Story = {
  args: {
    placeholder: "Enter text...",
    value: "Invalid input",
    errorMessage: "This field has an error",
  },
};

export const Transparent: Story = {
  args: {
    placeholder: "Transparent input...",
    transparent: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <TextField placeholder="Default" />
      <TextField placeholder="Password" type="password" />
      <TextField placeholder="Email" type="email" />
      <TextField placeholder="Search" type="search" />
      <TextField placeholder="URL" type="url" />
      <TextField placeholder="Clearable" clearable value="Clear me" />
      <TextField placeholder="Small" small />
      <TextField placeholder="Multiline" multiline />
      <TextField placeholder="Disabled" editable={false} value="Cannot edit" />
      <TextField placeholder="With error" errorMessage="Error message" />
    </View>
  ),
};
