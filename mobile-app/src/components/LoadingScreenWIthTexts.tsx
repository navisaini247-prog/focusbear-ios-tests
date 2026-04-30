import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { LoadingDots } from "./LoadingScreen";

interface LoadingScreenWithTextsProps {
  isLoading: boolean;
  loadingMessages: string[];
  messageInterval: number;
  messageSize?: "small" | "medium" | "large" | number;
}

export const LoadingScreenWithTexts: React.FC<LoadingScreenWithTextsProps> = ({
  isLoading,
  loadingMessages,
  messageInterval,
  messageSize,
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setCurrentMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= loadingMessages.length) {
          return prev;
        }
        return nextIndex;
      });
    }, messageInterval);

    return () => clearInterval(interval);
  }, [isLoading, loadingMessages.length, messageInterval]);

  if (!isLoading) {
    return null;
  }

  return (
    <View style={[styles.loadingContainer, StyleSheet.absoluteFill]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        alwaysBounceVertical={false}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <LoadingDots loadingText={loadingMessages[currentMessageIndex]} size={messageSize} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  scroll: {
    width: "100%",
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
});
