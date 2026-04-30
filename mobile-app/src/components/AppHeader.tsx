import React, { memo, useState } from "react";
import { View, StyleSheet, StyleProp, ViewStyle, LayoutRectangle, ScrollViewProps } from "react-native";
import { HeadingMediumText, PressableWithFeedback, DisplayMediumText } from "@/components";
import { PressableWithFeedbackProps } from "./Button";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedRef,
  useScrollOffset,
  SharedValue,
} from "react-native-reanimated";
import { KeyboardAwareScrollView, KeyboardAwareScrollViewProps } from "react-native-keyboard-controller";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "@react-navigation/native";
import { NAVIGATION } from "@/constants/navigation";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScalableIcon } from "./ScalableIcon";
import { FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";

const AnimatedKeyboardAwareScrollView = Animated.createAnimatedComponent(KeyboardAwareScrollView);

const HEADER_HEIGHT = 50;
const TALL_HEADER_HEIGHT = 65;
const MODAL_HEADER_HEIGHT = 36;
export const BIG_TITLE_HEIGHT = 70;
const CLAMP_RIGHT = { extrapolateLeft: Extrapolation.EXTEND, extrapolateRight: Extrapolation.CLAMP };
const HEADER_TITLE_SIZE = 17;
const DEFAULT_HEADER_ICON_SIZE = 22;

export interface AppHeaderProps {
  title: string;
  extraTall?: boolean;
  hideBackButton?: boolean;
  onBackPress?: () => void;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  secondaryRowContent?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const AppHeader = memo(function AppHeader({
  title,
  extraTall,
  hideBackButton,
  onBackPress,
  leftContent,
  rightContent,
  secondaryRowContent,
  style,
  testID,
}: AppHeaderProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={["top"]} style={style}>
      <View style={[styles.background, { borderColor: colors.separator, backgroundColor: colors.card }]} />

      <View style={[styles.headerRow, { height: extraTall ? TALL_HEADER_HEIGHT : HEADER_HEIGHT }]}>
        {!hideBackButton && <BackButton onPress={onBackPress} style={styles.headerBackButton} testID={testID} />}
        {leftContent && <View style={styles.centerContent}>{leftContent}</View>}
        <View style={[styles.justifyCenter, styles.flex]}>
          <DisplayMediumText
            numberOfLines={1}
            size={HEADER_TITLE_SIZE}
            maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI}
          >
            {title}
          </DisplayMediumText>
        </View>
        {rightContent && <View style={styles.centerContent}>{rightContent}</View>}
      </View>
      <View>{secondaryRowContent}</View>
    </SafeAreaView>
  );
});

interface BigAppHeaderProps extends AppHeaderProps {
  scrollY?: SharedValue<number>;
}

/**
 * A header that is taller than the default header and has a big title that shrinks as you scroll.
 * @param scrollY - Pass an animated value to sync with scroll. Omit only if the screen does not scroll.
 * @param secondaryRowContent - A row displayed below the bar.
 */
export const BigAppHeader = memo(function BigAppHeader({
  title,
  extraTall,
  hideBackButton,
  scrollY,
  onBackPress,
  leftContent,
  rightContent,
  secondaryRowContent,
  style,
  testID,
}: BigAppHeaderProps) {
  const fallbackScrollY = useSharedValue(0);
  scrollY ??= fallbackScrollY;

  const { colors, shadowStyles } = useTheme();
  const [centreAreaLayout, setCentreAreaLayout] = useState<LayoutRectangle>({ x: 0, y: 0, width: 0, height: 0 });

  const titleShrinkFactor = 0.61; // eyeballed for font size 17
  const titlePaddingBottom = extraTall ? 22 : 15; // eyeballed for vertical alignment when small

  const BTH = BIG_TITLE_HEIGHT;
  const titleXOffset = centreAreaLayout.x - 16;

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [BTH, BTH + 100], [0, 1], Extrapolation.CLAMP),
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [0, BTH], [BTH, 0], CLAMP_RIGHT) }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(scrollY.value, [0, BTH], [0, titleXOffset], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [0, BTH], [1, titleShrinkFactor], Extrapolation.CLAMP) },
    ] as [{ translateX: number }, { scale: number }],
  }));

  return (
    // Note the zIndex10
    <SafeAreaView edges={["top"]} style={[style, styles.zIndex10]}>
      <Animated.View
        style={[
          styles.background,
          shadowStyles.shadow,
          { borderColor: colors.separator, backgroundColor: colors.card },
          backgroundAnimatedStyle,
        ]}
      />

      <View style={[styles.headerRow, { height: extraTall ? TALL_HEADER_HEIGHT : HEADER_HEIGHT }]}>
        {!hideBackButton && <BackButton onPress={onBackPress} style={styles.headerBackButton} testID={testID} />}
        {leftContent && <View style={styles.centerContent}>{leftContent}</View>}
        <View style={styles.flex} onLayout={(event) => setCentreAreaLayout(event.nativeEvent.layout)} />
        {rightContent && <View style={styles.centerContent}>{rightContent}</View>}
      </View>

      <Animated.View style={headerAnimatedStyle}>
        <View style={styles.noHeight}>
          <View style={[styles.titleContainerContainer, { paddingBottom: titlePaddingBottom }]}>
            <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
              <DisplayMediumText
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI}
              >
                {title}
              </DisplayMediumText>
            </Animated.View>
          </View>
        </View>

        <View>{secondaryRowContent}</View>
      </Animated.View>
    </SafeAreaView>
  );
});

interface BigHeaderScrollViewProps extends AppHeaderProps {
  children?: React.ReactNode;
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
  scrollViewProps?: Omit<ScrollViewProps, "ref" | "contentContainerStyle">;
}

/**
 * A full-page layout combining BigAppHeader with a ScrollView.
 *
 * @example
 * <BigHeaderScrollView title="Settings">{content}</BigHeaderScrollView>
 */
export const BigHeaderScrollView = ({
  children,
  contentContainerStyle,
  scrollViewProps,
  ...props
}: BigHeaderScrollViewProps) => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useScrollOffset(scrollRef);

  return (
    <View style={styles.flex}>
      <BigAppHeader {...props} scrollY={scrollY} />
      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.headerScrollViewContentContainer, contentContainerStyle]}
        {...scrollViewProps}
      >
        {children}
      </Animated.ScrollView>
    </View>
  );
};

interface BigHeaderKeyboardAwareScrollViewProps extends BigHeaderScrollViewProps {
  scrollViewProps?: Omit<KeyboardAwareScrollViewProps, "ref" | "contentContainerStyle">;
}

export const BigHeaderKeyboardAwareScrollView = ({
  children,
  contentContainerStyle,
  scrollViewProps,
  ...props
}: BigHeaderKeyboardAwareScrollViewProps) => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useScrollOffset(scrollRef);

  return (
    <View style={styles.flex}>
      <BigAppHeader {...props} scrollY={scrollY} />
      <AnimatedKeyboardAwareScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.headerScrollViewContentContainer, contentContainerStyle]}
        {...scrollViewProps}
      >
        {children}
      </AnimatedKeyboardAwareScrollView>
    </View>
  );
};

export const ModalHeader = ({ onBackPress, style, rightContent, title, testID, ...props }: AppHeaderProps) => {
  return (
    <View style={[styles.headerRow, { height: MODAL_HEADER_HEIGHT }, style]} {...props}>
      {onBackPress && <BackButton onPress={onBackPress} style={styles.headerBackButton} size={18} testID={testID} />}
      <View style={styles.flex}>
        <HeadingMediumText numberOfLines={1} maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI}>
          {title}
        </HeadingMediumText>
      </View>
      {rightContent && <View style={styles.centerContent}>{rightContent}</View>}
    </View>
  );
};

export const BackButton = ({ style, onPress, size, ...props }: PressableWithFeedbackProps & { size?: number }) => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const navigateBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: NAVIGATION.TabNavigator as never }] });
    }
  };

  return (
    <PressableWithFeedback
      style={[styles.backButton, styles.centerContent, style]}
      onPress={onPress || navigateBack}
      hitSlop={8}
      {...props}
      testID="test:id/header-back-button"
    >
      <ScalableIcon
        name="chevron-back"
        size={size || DEFAULT_HEADER_ICON_SIZE}
        color={colors.text}
        iconType="Ionicons"
        scaleOptions={{ maxFontScale: FONT_SCALE_LIMIT.CONSTRAINED_UI }}
      />
    </PressableWithFeedback>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  justifyCenter: { justifyContent: "center" },
  noHeight: { height: 0, overflow: "visible" },
  zIndex10: { zIndex: 10 },
  headerRow: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    borderBottomWidth: 1,
  },
  headerBackButton: {
    marginLeft: -8,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
  },
  titleContainerContainer: {
    position: "absolute",
    bottom: 0,
    paddingHorizontal: 16,
    justifyContent: "flex-end",
    height: BIG_TITLE_HEIGHT,
  },
  titleContainer: {
    transformOrigin: "bottom left",
  },
  headerScrollViewContentContainer: {
    paddingTop: BIG_TITLE_HEIGHT + 12,
  },
});

export default AppHeader;
