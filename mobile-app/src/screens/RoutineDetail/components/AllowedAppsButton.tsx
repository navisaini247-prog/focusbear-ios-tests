import React, { useState } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Button, ScalableIcon } from "@/components";
import { AllowedAppsModal } from "./AllowedAppsModal";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";
import { checkIsAndroid } from "@/utils/PlatformMethods";

interface AllowedAppsButtonProps {
  containerStyle?: ViewStyle;
  allowedApps: string[];
}

export const AllowedAppsButton = ({ containerStyle, allowedApps }: AllowedAppsButtonProps) => {
  const { colors } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const buttonTranslateX = useSharedValue(0);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: buttonTranslateX.value }],
  }));

  if (!checkIsAndroid() || !allowedApps || allowedApps.length === 0) {
    return null;
  }

  return (
    <>
      <View style={containerStyle}>
        <Animated.View style={buttonAnimatedStyle}>
          <Button
            onPress={() => setIsModalVisible(true)}
            style={[styles.row, styles.allowedAppsButton]}
            testID="test:id/allowed-apps-button"
          >
            <ScalableIcon name="apps" size={30} color={colors.text} />
          </Button>
        </Animated.View>
      </View>
      <AllowedAppsModal isVisible={isModalVisible} setIsVisible={setIsModalVisible} allowedApps={allowedApps} />
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  allowedAppsButton: {
    borderRadius: 0,
    borderTopLeftRadius: 100,
    borderBottomLeftRadius: 100,
    borderRightWidth: 0,
    paddingLeft: 24,
    minHeight: 64,
  },
});
