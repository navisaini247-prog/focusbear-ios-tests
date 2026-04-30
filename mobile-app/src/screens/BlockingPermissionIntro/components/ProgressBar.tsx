import React from "react";
import { View, StyleSheet } from "react-native";
import COLOR from "@/constants/color";

type Props = {
  currentStep: number;
  totalSteps: number;
};

export const ProgressBar: React.FC<Props> = ({ currentStep, totalSteps }) => {
  const safeTotal = Math.max(totalSteps, 1);
  const safeCurrent = Math.min(Math.max(currentStep, 1), safeTotal);

  return (
    <View style={styles.container}>
      {Array.from({ length: safeTotal }).map((_, index) => {
        const isActive = index < safeCurrent;
        return <View key={index} style={[styles.step, isActive ? styles.stepActive : styles.stepInactive]} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  step: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    marginHorizontal: 4,
  },
  stepActive: {
    backgroundColor: COLOR.AMBER[500],
  },
  stepInactive: {
    backgroundColor: COLOR.AMBER[900],
  },
});

export default ProgressBar;
