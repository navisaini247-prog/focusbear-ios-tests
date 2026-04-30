import React from "react";
import { View, ViewStyle, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { BodyMediumText, HeadingMediumText, TextProps } from "@/components";
import { useTheme } from "@react-navigation/native";
import BaseTooltip from "rn-tooltip";
import { ViewProps } from "react-native";
import { ScalableIcon } from "./ScalableIcon";

interface HeadingWithInfoProps extends TextProps {
  infoText?: string;
  containerStyle?: ViewStyle;
  infoTestID?: string;
}

export const HeadingWithInfo: React.FC<HeadingWithInfoProps> = ({
  infoText,
  center,
  containerStyle,
  infoTestID,
  ...props
}) => (
  <View style={[styles.container, center && styles.centerContainer, containerStyle]}>
    <View style={styles.flexShrink}>
      <HeadingMediumText center={center} {...props} />
    </View>
    {infoText && (
      <Tooltip popover={<BodyMediumText>{infoText}</BodyMediumText>}>
        <InfoIcon testID={infoTestID} />
      </Tooltip>
    )}
  </View>
);

export const Tooltip = ({ children, popover, ...props }: any) => {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();

  return (
    <BaseTooltip
      containerStyle={{
        backgroundColor: colors.background,
        borderColor: colors.separator,
        ...styles.tooltipContainer,
      }}
      pointerColor={colors.separator}
      actionType="press"
      width="60%"
      height={null}
      toggleWrapperProps={{ hitSlop: 16 }}
      overlayColor={colors.overlay}
      popover={
        <ScrollView
          showsVerticalScrollIndicator
          bounces={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          style={[styles.tooltipScrollView, { maxHeight: Math.min(height * 0.5, 320) }]}
          contentContainerStyle={styles.tooltipScrollContent}
        >
          {popover}
        </ScrollView>
      }
      {...props}
    >
      {children}
    </BaseTooltip>
  );
};

export const InfoIcon = (props: ViewProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.iconButton, { borderColor: colors.separator }]} {...props}>
      <ScalableIcon name="information" size={18} color={colors.primary} iconType="Ionicons" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  centerContainer: {
    justifyContent: "center",
  },
  flexShrink: {
    flexShrink: 1,
  },
  iconButton: {
    borderRadius: 100,
    borderWidth: 1,
    padding: 1,
  },
  tooltipContainer: {
    borderRadius: 8,
    borderWidth: 1,
  },
  tooltipScrollView: {
    alignSelf: "stretch",
    width: "100%",
  },
  tooltipScrollContent: {
    flexGrow: 1,
  },
});
