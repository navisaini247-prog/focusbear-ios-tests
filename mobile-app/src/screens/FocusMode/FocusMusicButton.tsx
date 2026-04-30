import React, { useEffect, useState } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Button, ScalableIcon } from "@/components";
import { FocusMusicModal, WaveAnimation } from "./FocusMusicModal";
import Animated, { withSpring, useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";

interface FocusMusicButtonProps {
  containerStyle?: ViewStyle;
}

export const FocusMusicButton = ({ containerStyle }: FocusMusicButtonProps) => {
  const { colors } = useTheme();
  const [isFocusMusicModalVisible, setIsFocusMusicModalVisible] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const showMusicPlaybackIndicator = isMusicPlaying && !isFocusMusicModalVisible;
  const musicButtonTranslateX = useSharedValue(40);

  useEffect(() => {
    musicButtonTranslateX.value = withSpring(showMusicPlaybackIndicator ? 0 : 40);
  }, [showMusicPlaybackIndicator]);

  const musicButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: musicButtonTranslateX.value }],
  }));

  return (
    <>
      <View style={containerStyle}>
        <Animated.View style={musicButtonAnimatedStyle}>
          <Button
            onPress={() => setIsFocusMusicModalVisible(true)}
            style={[styles.row, styles.focusMusicButton]}
            testID="test:id/focus-music-button"
          >
            <ScalableIcon
              name="musical-notes"
              size={30}
              color={colors.text}
              iconType="Ionicons"
              scaleOptions={{ maxFontScale: 1.2 }}
            />
            <View style={styles.waveAnimationContainer}>{showMusicPlaybackIndicator && <WaveAnimation />}</View>
          </Button>
        </Animated.View>
      </View>
      <FocusMusicModal
        isVisible={isFocusMusicModalVisible}
        setIsVisible={setIsFocusMusicModalVisible}
        setShowPlaybackIndicators={setIsMusicPlaying}
      />
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  focusMusicButton: {
    borderRadius: 0,
    borderTopLeftRadius: 100,
    borderBottomLeftRadius: 100,
    borderRightWidth: 0,
    paddingLeft: 24,
    minHeight: 64,
    paddingRight: 30,
  },
  waveAnimationContainer: {
    width: 40,
    height: 40,
  },
});
