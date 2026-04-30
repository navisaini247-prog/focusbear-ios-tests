import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Button } from "@/components";
import { HABITS_AND_ROUTINE_CAROUSEL } from "../HowFocusBearWorkScreen";
import Icon from "react-native-vector-icons/Ionicons";
import { Pagination } from "./Pagination";

export const CarouselPagination = ({ carouselRef, activeSlide }) => {
  const { colors } = useTheme();

  const numberOfSlides = HABITS_AND_ROUTINE_CAROUSEL.length;
  const isLastSlide = activeSlide >= numberOfSlides - 1;
  const isFirstSlide = activeSlide === 0;

  return (
    <View style={[styles.footer, styles.row]}>
      <Button
        primary
        onPress={() => {
          carouselRef.current.scrollToPrev();
        }}
        testID="test:id/carousel-back"
        style={[styles.arrowButton, isFirstSlide && styles.hiddenButton]}
        disabled={isFirstSlide}
        renderLeftIcon={<Icon name="arrow-back" size={24} color={colors.white} />}
      />
      <Pagination dotsLength={numberOfSlides} activeDotIndex={activeSlide} />
      <Button
        primary
        onPress={() => {
          carouselRef.current.scrollToNext();
        }}
        testID="test:id/carousel-forward"
        style={[styles.arrowButton, isLastSlide && styles.hiddenButton]}
        disabled={isLastSlide}
        renderRightIcon={<Icon name="arrow-forward" size={24} color={colors.white} />}
      />
    </View>
  );
};

export const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  footer: {
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 12,
  },
  arrowButton: {
    width: 48,
    height: 48,
    borderRadius: 1000,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  hiddenButton: {
    opacity: 0,
  },
});
