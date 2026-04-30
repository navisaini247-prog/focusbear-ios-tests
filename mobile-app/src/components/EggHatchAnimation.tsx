import React, { useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

interface EggHatchAnimationProps {
  stage?: number; // 1-8 for different hatching stages
  stages?: number[]; // optional list of stages to cycle through
  intervalMs?: number; // ms between stage changes when using stages[]
  autoPlay?: boolean;
  loop?: boolean;
  onAnimationFinish?: () => void;
  style?: any;
  size?: "small" | "medium" | "large";
  pixelSize?: number; // optional override for exact width/height
}

export const EggHatchAnimation: React.FC<EggHatchAnimationProps> = ({
  stage = 1,
  stages,
  intervalMs = 1200,
  autoPlay = true,
  loop = false,
  onAnimationFinish,
  style,
  size = "medium",
  pixelSize,
}) => {
  const animationRef = useRef<LottieView>(null);
  const [multiStageIndex, setMultiStageIndex] = React.useState(0);

  // Map size to dimensions (pixelSize takes precedence)
  const getSize = () => {
    if (typeof pixelSize === "number" && pixelSize > 0) {
      return { width: pixelSize, height: pixelSize };
    }
    switch (size) {
      case "small":
        return { width: 120, height: 120 };
      case "large":
        return { width: 300, height: 300 };
      case "medium":
      default:
        return { width: 200, height: 200 };
    }
  };

  // Static map for Metro bundler (no dynamic require)
  const animationSources: Record<number, any> = {
    1: require("../assets/egg_hatch/1.json"),
    2: require("../assets/egg_hatch/2.json"),
    3: require("../assets/egg_hatch/3.json"),
    4: require("../assets/egg_hatch/4.json"),
    5: require("../assets/egg_hatch/5.json"),
    6: require("../assets/egg_hatch/6.json"),
    7: require("../assets/egg_hatch/7.json"),
    8: require("../assets/egg_hatch/8.json"),
  };

  // Determine the current stage (single or multi-stage), clamped 1-8
  const getCurrentStage = () => {
    if (Array.isArray(stages) && stages.length > 0) {
      const s = stages[multiStageIndex % stages.length];
      return Math.max(1, Math.min(8, s || 1));
    }
    return Math.max(1, Math.min(8, stage));
  };

  // Get the animation file path based on stage (clamped 1-8)
  const getAnimationSource = () => {
    const clampedStage = getCurrentStage();
    return animationSources[clampedStage] || animationSources[1];
  };

  // Auto-advance when stages[] provided
  useEffect(() => {
    if (!Array.isArray(stages) || stages.length <= 1) {
      return;
    }
    let isMounted = true;
    const tickMs = Math.max(300, intervalMs);
    const id = setInterval(() => {
      if (!isMounted) return;
      setMultiStageIndex((prev) => {
        const next = prev + 1;
        if (next >= stages.length) {
          if (loop) {
            return 0; // wrap back to start
          }
          // stop advancing when loop is false; keep last index
          clearInterval(id);
          return prev;
        }
        return next;
      });
    }, tickMs);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [stages, intervalMs, loop]);

  useEffect(() => {
    if (autoPlay && animationRef.current) {
      animationRef.current.play();
    }
  }, [autoPlay, stage, stages, multiStageIndex]);

  const handleAnimationFinish = () => {
    if (onAnimationFinish) {
      onAnimationFinish();
    }
  };

  const sizeDimensions = getSize();

  return (
    <View style={[styles.container, style]}>
      <LottieView
        ref={animationRef}
        source={getAnimationSource()}
        autoPlay={autoPlay}
        loop={loop}
        enableSafeModeAndroid
        enableMergePathsAndroidForKitKatAndAbove
        cacheComposition={false}
        style={[
          styles.animation,
          {
            width: sizeDimensions.width,
            height: sizeDimensions.height,
          },
        ]}
        onAnimationFinish={handleAnimationFinish}
        resizeMode="contain"
      />
    </View>
  );
};

// Hook for managing egg hatching progression
export const useEggHatchProgression = (totalStages: number = 8) => {
  const [currentStage, setCurrentStage] = React.useState(1);
  const [isAnimating, setIsAnimating] = React.useState(false);

  const progressToNextStage = () => {
    if (currentStage < totalStages) {
      setIsAnimating(true);
      setCurrentStage((prev) => prev + 1);
      // Reset animation state after a short delay
      setTimeout(() => setIsAnimating(false), 100);
    }
  };

  const resetToFirstStage = () => {
    setCurrentStage(1);
    setIsAnimating(false);
  };

  const isComplete = currentStage >= totalStages;

  return {
    currentStage,
    isAnimating,
    progressToNextStage,
    resetToFirstStage,
    isComplete,
  };
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  animation: {
    alignSelf: "center",
  },
});

export default EggHatchAnimation;
