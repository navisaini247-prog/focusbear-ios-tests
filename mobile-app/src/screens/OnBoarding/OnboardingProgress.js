import React from "react";
import { View, StyleSheet, Image } from "react-native";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import EggHatchAnimation from "@/components/EggHatchAnimation";
import PirateOnboarding1 from "@/assets/ic_onboarding/pirate-onboarding-1.png";
import PirateOnboarding2 from "@/assets/ic_onboarding/pirate-onboarding-2.png";
import PirateOnboarding3 from "@/assets/ic_onboarding/pirate-onboarding-3.png";
import { useTheme } from "@react-navigation/native";
import { BodyXSmallText } from "@/components";

export function OnboardingProgress({
  totalSteps,
  activeIndex,
  activeColor,
  inactiveColor,
  labels = [],
  labelColor,
  dotSize = 18,
  progressColor = "#FFC107",
  activeEggStage,
  eggPixelSize = 80,
}) {
  const { colors } = useTheme();
  const juniorBearMode = useSelector((state) => state.global.juniorBearMode) || "normal";
  const isPirate = juniorBearMode === "pirate";

  const clampedActive = Math.max(0, Math.min(totalSteps - 1, activeIndex));
  const segments = totalSteps - 1;

  const fillPercent = segments > 0 ? (clampedActive / segments) * 100 : 0;

  const activeEggSize = typeof eggPixelSize === "number" ? eggPixelSize : 80;
  const trackHeight = 4;
  const rowPaddingTop = styles.stepDotsRow.paddingTop; // 2
  const rowPaddingBottom = styles.stepDotsRow.paddingBottom; // 4
  const maxDot = Math.max(dotSize, activeEggSize);
  const barTop = rowPaddingTop + maxDot / 2 - trackHeight / 2;
  const dynamicHeight = rowPaddingTop + maxDot + rowPaddingBottom;

  const resolvedActiveEggStage = (() => {
    if (activeEggStage !== undefined) return activeEggStage;
    if (clampedActive === 0) return 1;
    if (clampedActive === 1) return 2;
    return 3;
  })();

  const getPirateImage = (stage) => {
    if (stage === 1) return PirateOnboarding1;
    if (stage === 2) return PirateOnboarding2;
    return PirateOnboarding3;
  };

  return (
    <View style={[styles.progressContainer, { height: dynamicHeight }]}>
      <View style={[styles.stepTrack, { backgroundColor: inactiveColor, top: barTop }]}>
        <View
          style={[
            styles.stepTrackFill,
            {
              width: `${activeIndex === 0 ? 15 : fillPercent}%`,
              backgroundColor: progressColor,
            },
          ]}
        />
      </View>
      <View style={[styles.stepDotsRow, { minHeight: activeEggSize }]}>
        {Array.from({ length: totalSteps }).map((_, idx) => {
          const reached = idx <= clampedActive;
          return (
            <View key={`onboarding-step-dot-wrap-${idx}`} style={styles.stepDotWrap}>
              {idx === clampedActive ? (
                isPirate ? (
                  <Image
                    source={getPirateImage(resolvedActiveEggStage)}
                    style={[
                      idx === 0 && styles.pirateImage,
                      {
                        width: dotSize * 3,
                        height: dotSize * 3,
                        ...(idx === 0 && { backgroundColor: colors.background }),
                      },
                    ]}
                    resizeMode="contain"
                  />
                ) : Array.isArray(resolvedActiveEggStage) ? (
                  <EggHatchAnimation stages={resolvedActiveEggStage} pixelSize={eggPixelSize} autoPlay loop={false} />
                ) : (
                  <EggHatchAnimation stage={resolvedActiveEggStage} pixelSize={eggPixelSize} autoPlay loop={false} />
                )
              ) : (
                <View
                  style={[
                    styles.stepDot,
                    {
                      width: dotSize,
                      height: dotSize,
                      borderRadius: dotSize / 2,
                      backgroundColor: reached ? activeColor : inactiveColor,
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
      {!!labels.length && (
        <View style={styles.stepLabelRow}>
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <View key={`onboarding-step-label-${idx}`} style={styles.stepLabelWrap}>
              <BodyXSmallText numberOfLines={1} color={labelColor || inactiveColor}>
                {labels[idx] || ``}
              </BodyXSmallText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

OnboardingProgress.propTypes = {
  totalSteps: PropTypes.number,
  activeIndex: PropTypes.number,
  activeColor: PropTypes.string,
  inactiveColor: PropTypes.string,
  labels: PropTypes.arrayOf(PropTypes.string),
  labelColor: PropTypes.string,
  dotSize: PropTypes.number,
  progressColor: PropTypes.string,
  activeEggStage: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.number)]),
  eggPixelSize: PropTypes.number,
};

const styles = StyleSheet.create({
  progressContainer: {
    width: "100%",
    height: 40,
  },
  stepTrack: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 10,
    height: 4,
    borderRadius: 2,
  },
  stepTrackFill: {
    height: 4,
    borderRadius: 2,
  },
  stepDotsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 4,
  },
  stepDotWrap: {
    flex: 1,
    alignItems: "center",
  },
  stepDot: {},
  pirateImage: {
    marginTop: 6,
  },
  stepLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 4,
  },
  stepLabelWrap: {
    width: 0,
    flexGrow: 1,
    alignItems: "center",
  },
});

export default OnboardingProgress;
