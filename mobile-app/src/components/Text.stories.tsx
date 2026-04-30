import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  DisplayXXLargeText,
  DisplayXLargeText,
  DisplayLargeText,
  DisplayMediumText,
  DisplaySmallText,
  HeadingXLargeText,
  HeadingLargeText,
  HeadingMediumText,
  HeadingSmallText,
  BodyXLargeText,
  BodyLargeText,
  BodyMediumText,
  BodySmallText,
  BodyXSmallText,
} from "./Text";

const styles = StyleSheet.create({
  decorator: {
    padding: 16,
    gap: 8,
  },
  variantsContainer: {
    gap: 8,
  },
  allVariantsContainer: {
    gap: 16,
  },
  sectionHeader: {
    marginBottom: 8,
  },
});

const meta: Meta<typeof Text> = {
  title: "Components/Text",
  component: Text,
  argTypes: {
    color: {
      control: "color",
      description: "Text color",
    },
    size: {
      control: "number",
      description: "Font size",
    },
    weight: {
      control: "select",
      options: ["normal", "300", "400", "700"],
      description: "Font weight",
    },
    italic: {
      control: "boolean",
      description: "Italicize the text",
    },
    center: {
      control: "boolean",
      description: "Center the text",
    },
    underline: {
      control: "boolean",
      description: "Underline the text",
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

type Story = StoryObj<typeof Text>;

export const Default: Story = {
  args: {
    children: "Default Text",
  },
};

export const Colored: Story = {
  args: {
    children: "Colored Text",
    color: "#FF5722",
  },
};

export const Bold: Story = {
  args: {
    children: "Bold Text",
    weight: "700",
  },
};

export const Italic: Story = {
  args: {
    children: "Italic Text",
    italic: true,
  },
};

export const Centered: Story = {
  args: {
    children: "Centered Text",
    center: true,
  },
};

export const Underlined: Story = {
  args: {
    children: "Underlined Text",
    underline: true,
  },
};

export const DisplayTextVariants: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <DisplayXXLargeText>Display XXLarge (48px)</DisplayXXLargeText>
      <DisplayXLargeText>Display XLarge (40px)</DisplayXLargeText>
      <DisplayLargeText>Display Large (32px)</DisplayLargeText>
      <DisplayMediumText>Display Medium (28px)</DisplayMediumText>
      <DisplaySmallText>Display Small (24px)</DisplaySmallText>
    </View>
  ),
};

export const HeadingTextVariants: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <HeadingXLargeText>Heading XLarge (20px)</HeadingXLargeText>
      <HeadingLargeText>Heading Large (18px)</HeadingLargeText>
      <HeadingMediumText>Heading Medium (16px)</HeadingMediumText>
      <HeadingSmallText>Heading Small (14px)</HeadingSmallText>
    </View>
  ),
};

export const BodyTextVariants: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <BodyXLargeText>Body XLarge (18px)</BodyXLargeText>
      <BodyLargeText>Body Large (16px)</BodyLargeText>
      <BodyMediumText>Body Medium (14px)</BodyMediumText>
      <BodySmallText>Body Small (13px)</BodySmallText>
      <BodyXSmallText>Body XSmall (12px)</BodyXSmallText>
    </View>
  ),
};

export const AllTypographyVariants: Story = {
  render: () => (
    <View style={styles.allVariantsContainer}>
      <View>
        <HeadingMediumText style={styles.sectionHeader}>Display Variants</HeadingMediumText>
        <DisplayXXLargeText>XXLarge</DisplayXXLargeText>
        <DisplayXLargeText>XLarge</DisplayXLargeText>
        <DisplayLargeText>Large</DisplayLargeText>
        <DisplayMediumText>Medium</DisplayMediumText>
        <DisplaySmallText>Small</DisplaySmallText>
      </View>
      <View>
        <HeadingMediumText style={styles.sectionHeader}>Heading Variants</HeadingMediumText>
        <HeadingXLargeText>XLarge</HeadingXLargeText>
        <HeadingLargeText>Large</HeadingLargeText>
        <HeadingMediumText>Medium</HeadingMediumText>
        <HeadingSmallText>Small</HeadingSmallText>
      </View>
      <View>
        <HeadingMediumText style={styles.sectionHeader}>Body Variants</HeadingMediumText>
        <BodyXLargeText>XLarge</BodyXLargeText>
        <BodyLargeText>Large</BodyLargeText>
        <BodyMediumText>Medium</BodyMediumText>
        <BodySmallText>Small</BodySmallText>
        <BodyXSmallText>XSmall</BodyXSmallText>
      </View>
    </View>
  ),
};
