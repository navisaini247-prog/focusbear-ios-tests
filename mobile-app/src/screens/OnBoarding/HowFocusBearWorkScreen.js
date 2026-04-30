import React, { useRef, useState, Fragment, useEffect } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useNavigation, useTheme, useRoute } from "@react-navigation/native";
import OnboardingProgress from "./OnboardingProgress";
import { ONBOARDING_STEPS, getOnboardingIndex } from "./onboardingSteps";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { ConfirmationButton, DisplaySmallText, Separator, HeadingMediumText } from "@/components";
import {
  ImgBlockingAndroid,
  ImgBlockingIOS,
  ImgOnboardingHabitList,
  ImgOnboardingTodoList,
  ImgOnboardingHabitAI,
} from "@/assets";
import { CarouselItem } from "./components/CarouselItem";
import { checkIsIOS } from "@/utils/PlatformMethods";
import { NAVIGATION } from "@/constants";
import { Carousel } from "./components/Carousel";
import { CarouselPagination } from "./components/CarouselPagination";
import { useDispatch } from "react-redux";
import { setFirstAppOpenPostHogCaptured, setHasGoneThroughIntroduction } from "@/actions/GlobalActions";
import { useSelector } from "@/reducers";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";

const AndMuchMoreContent = () => {
  const { t } = useTranslation();
  return (
    <View style={[styles.andMuchMoreContainer, styles.gap12]}>
      {t("onboarding.andMuchMorePoints", { returnObjects: true }).map((point, index) => (
        <Fragment key={index}>
          {index !== 0 && <Separator />}
          <View style={[styles.row, styles.gap12]}>
            <View>
              <HeadingMediumText>•</HeadingMediumText>
            </View>
            <View style={styles.flex}>
              <HeadingMediumText>{point}</HeadingMediumText>
            </View>
          </View>
        </Fragment>
      ))}
    </View>
  );
};

export const HABITS_AND_ROUTINE_CAROUSEL = [
  {
    titleKey: "onboarding.distractionBlocking",
    descriptionKey: "onboarding.distractionBlockingDescription",
    illustration: checkIsIOS() ? ImgBlockingIOS : ImgBlockingAndroid,
  },
  {
    titleKey: "onboarding.habitAndRoutine",
    descriptionKey: "onboarding.habitAndRoutineDescription",
    illustration: ImgOnboardingHabitList,
  },
  {
    titleKey: "onboarding.todoList",
    descriptionKey: "onboarding.todoListDescription",
    illustration: ImgOnboardingTodoList,
  },
  {
    titleKey: "onboarding.andMuchMore",
    descriptionKey: "onboarding.andMuchMoreDescription",
    content: AndMuchMoreContent,
  },
];

export const FEATURES_CAROUSEL = [
  {
    titleKey: "onboarding.distractionBlocking",
    descriptionKey: "onboarding.distractionBlockingDescription",
    illustration: checkIsIOS() ? ImgBlockingIOS : ImgBlockingAndroid,
  },
  {
    titleKey: "onboarding.habitAndRoutine",
    descriptionKey: "onboarding.habitAndRoutineDescription",
    illustration: ImgOnboardingHabitList,
  },
  {
    titleKey: "onboarding.habitAI",
    descriptionKey: "onboarding.habitAIDescription",
    illustration: ImgOnboardingHabitAI,
  },
  {
    titleKey: "onboarding.andMuchMore",
    descriptionKey: "onboarding.andMuchMoreDescription",
    content: AndMuchMoreContent,
  },
];

export const CAROUSEL_VARIANTS = {
  ONBOARDING: "ONBOARDING",
  FEATURES: "FEATURES",
};

export const HowFocusBearWorkScreen = () => {
  const { t } = useTranslation();
  const { width: itemWidth } = useWindowDimensions();
  const [activeSlide, setActiveSlide] = useState(0);
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const carouselRef = useRef();
  const dispatch = useDispatch();

  const variant = route.params?.variant || CAROUSEL_VARIANTS.ONBOARDING;

  const carouselData = variant === CAROUSEL_VARIANTS.FEATURES ? FEATURES_CAROUSEL : HABITS_AND_ROUTINE_CAROUSEL;

  const isLastSlide = activeSlide === carouselData.length - 1;

  const isFirstAppOpenPostHogCaptured = useSelector((state) => state.global.isFirstAppOpenPostHogCaptured);

  useEffect(() => {
    if (!isFirstAppOpenPostHogCaptured) {
      postHogCapture(POSTHOG_EVENT_NAMES.USER_OPEN_THE_APP_FOR_THE_FIRST_TIME);
      dispatch(setFirstAppOpenPostHogCaptured(true));
    }
  }, [isFirstAppOpenPostHogCaptured, dispatch]);

  return (
    <>
      {getOnboardingIndex(route.name) >= 0 && (
        <OnboardingProgress
          totalSteps={ONBOARDING_STEPS.length}
          activeIndex={getOnboardingIndex(route.name)}
          activeColor={colors.primary}
          inactiveColor={colors.border}
        />
      )}
      <SafeAreaView style={styles.flex}>
        <View style={styles.titleContainer}>
          <DisplaySmallText center>
            {t(carouselData[activeSlide]?.titleKey || "onboarding.howFocusBearWork")}
          </DisplaySmallText>
        </View>
        <Carousel
          style={styles.flex}
          ref={carouselRef}
          data={carouselData}
          itemWidth={itemWidth}
          onSnapToItem={({ index }) => {
            setActiveSlide(index);
          }}
          renderItem={({ item, index }) => <CarouselItem key={index} {...item} />}
        />
        <CarouselPagination carouselRef={carouselRef} activeSlide={activeSlide} setActiveSlide={setActiveSlide} />
      </SafeAreaView>
      <ConfirmationButton
        style={[styles.confirmationButton, !isLastSlide && styles.displayNone]}
        confirmTestID="test:id/complete-how-focus-bear-work"
        confirmTitle={t("onboarding.letsDoIt")}
        onConfirm={() => {
          if (variant === CAROUSEL_VARIANTS.FEATURES) {
            navigation.goBack();
          } else {
            navigation.replace(NAVIGATION.BearOnboarding);
            dispatch(setHasGoneThroughIntroduction(true));
          }
        }}
      />
    </>
  );
};

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  displayNone: { display: "none" },
  row: { flexDirection: "row" },
  gap12: { gap: 12 },
  titleContainer: {
    paddingTop: 64,
  },
  andMuchMoreContainer: {
    marginBottom: 16,
    paddingHorizontal: 48,
  },
  confirmationButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
