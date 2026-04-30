import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, Modal as RNModal, View, Keyboard, ScrollViewProps, useWindowDimensions } from "react-native";
import { TouchableWithoutFeedback, ViewStyle, StyleProp } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView, State as GestureState } from "react-native-gesture-handler";
import Animated, { useSharedValue, withSpring, withTiming, Easing } from "react-native-reanimated";
import { runOnJS, runOnUI } from "react-native-worklets";
import { useAnimatedRef, measure, useAnimatedStyle } from "react-native-reanimated";
import { KeyboardAwareScrollView, useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import COLOR from "@/constants/color";
import { useTheme } from "@react-navigation/native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

export interface ModalProps {
  isVisible: boolean;
  onCancel?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  backdropColor?: string;
  fullScreen?: boolean;
}

interface SheetModalProps extends Omit<ModalProps, "fullScreen"> {
  contentContainerStyle?: StyleProp<ViewStyle>;
  HeaderComponent?: React.ReactNode;
  FooterComponent?: React.ReactNode;
  CustomScrollView?: React.ReactElement<ScrollViewProps>;
  fullHeight?: boolean;
}

/**
 ** Simple modal component.
 ** Provides a modal body with style and animation, but doesn't add any content or interactivity.
 */
export const Modal: React.FC<ModalProps> = ({ children, isVisible, onCancel, style, backdropColor, fullScreen }) => {
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const animatedOpacity = useSharedValue(0);
  const animatedTranslateY = useSharedValue(100);
  const duration = 200; // Animation duration

  // So we can delay the modal from hiding until the animation is complete
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isVisible && !visible) {
      setVisible(true);
      animatedTranslateY.value = withSpring(0, { mass: 1.2 });
      animatedOpacity.value = withTiming(1, { duration });
    } else if (!isVisible && visible) {
      setTimeout(() => setVisible(false), duration - 50);
      Keyboard.dismiss();
      animatedTranslateY.value = withTiming(100, { duration, easing: Easing.in(Easing.ease) });
      animatedOpacity.value = withTiming(0, { duration });
    }
  }, [isVisible, visible, animatedOpacity, animatedTranslateY]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({ opacity: animatedOpacity.value }));
  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: animatedOpacity.value,
    transform: [{ translateY: animatedTranslateY.value + keyboardHeight.value / 2 }],
  }));

  return (
    <RNModal visible={isVisible || visible} transparent statusBarTranslucent onRequestClose={() => onCancel?.()}>
      <SafeAreaProvider>
        <View style={styles.modalContainer}>
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={() => onCancel?.()}>
            <Animated.View
              style={[styles.backdrop, animatedBackdropStyle, backdropColor && { backgroundColor: backdropColor }]}
            />
          </TouchableWithoutFeedback>

          {/* Modal */}
          <Animated.View
            style={[fullScreen ? styles.fullScreenModal : styles.modal, animatedModalStyle, style]}
            pointerEvents={fullScreen ? "box-none" : "auto"}
          >
            {children}
          </Animated.View>
        </View>
      </SafeAreaProvider>
    </RNModal>
  );
};

/**
 ** Swipeable and optionally scrollable sheet modal component.
 ** Use HeaderComponent to add content above the scrollable area
 */
export const SheetModal: React.FC<SheetModalProps> = ({
  isVisible,
  onCancel,
  children,
  style,
  contentContainerStyle,
  HeaderComponent,
  FooterComponent,
  CustomScrollView,
  fullHeight,
}) => {
  const { colors } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const swipeBeginThreshold = 5;
  const initialTranslateY = screenHeight / 2;
  const duration = 200; // Animation duration

  const animatedTranslateY = useSharedValue(initialTranslateY);
  const animatedOpacity = useSharedValue(0);

  const modalViewRef = useAnimatedRef();
  const scrollIsAtTop = useSharedValue(true);
  const firstTouchY = useSharedValue(0);
  const isClosing = useSharedValue(!isVisible);

  const [visible, setVisible] = useState(false);

  const closeModal = useCallback(() => {
    if (!isClosing.value) {
      runOnUI(() => {
        const modalHeight = measure(modalViewRef)?.height || screenHeight;
        animatedTranslateY.value = withTiming(modalHeight, { duration, easing: Easing.out(Easing.ease) });
        animatedOpacity.value = withTiming(0, { duration });
      })();
      onCancel?.();
      Keyboard.dismiss();
      setTimeout(() => setVisible(false), duration);
    }
    isClosing.value = true;
  }, [onCancel, isClosing, screenHeight, modalViewRef, animatedTranslateY, animatedOpacity]);

  useEffect(() => {
    if (isVisible && !visible) {
      setVisible(true);
      animatedTranslateY.value = withSpring(0, { mass: 1.2 });
      animatedOpacity.value = withTiming(1, { duration });
      scrollIsAtTop.value = true;
      isClosing.value = false;
    } else if (!isVisible && !isClosing.value) {
      closeModal();
    }
  }, [isVisible, visible, animatedOpacity, animatedTranslateY, isClosing, closeModal, scrollIsAtTop]);

  const onScroll = ({ nativeEvent }) => (scrollIsAtTop.value = nativeEvent.contentOffset.y <= 0);

  const onPanUpdate = (event) => {
    "worklet";
    animatedTranslateY.value = Math.max(0, event.translationY);
  };

  // Swipe to dismiss
  const onPanEnd = (event) => {
    "worklet";
    if (event.translationY > 200 || event.velocityY > 1000) {
      const modalHeight = measure(modalViewRef)?.height || screenHeight;
      animatedTranslateY.value = withSpring(modalHeight, { velocity: event.velocityY, mass: 1.2 });
      animatedOpacity.value = withTiming(0, { duration });
      runOnJS(onCancel)();
      setTimeout(() => runOnJS(setVisible)(false), duration);
      isClosing.value = true;
    } else {
      animatedTranslateY.value = withSpring(0, { velocity: event.velocityY });
    }
  };

  const panGesture = Gesture.Pan().onUpdate(onPanUpdate).onEnd(onPanEnd);

  // Scrollview pan gesture with extra activation conditions
  const panScrollGesture = Gesture.Pan()
    .onUpdate(onPanUpdate)
    .onEnd(onPanEnd)
    .manualActivation(true)
    .onTouchesDown((event) => {
      // Used to determine direction of swipe
      firstTouchY.value = event.changedTouches[0]?.y || 0;
    })
    .onTouchesMove((event, manager) => {
      // Only activate gesture if scrollview is at top
      if (!scrollIsAtTop.value) return;
      if (event.state === GestureState.ACTIVE) return;

      // Only activate gesture if dragging down
      const newTouchY = event.changedTouches[0]?.y || 0;
      const isDraggingDown = newTouchY - firstTouchY.value > swipeBeginThreshold;

      if (isDraggingDown) {
        manager.activate();
      }
    });

  const animatedBackdropStyle = useAnimatedStyle(() => ({ opacity: animatedOpacity.value }));
  const animatedModalStyle = useAnimatedStyle(() => ({ transform: [{ translateY: animatedTranslateY.value }] }));

  const isCustomScrollView = React.isValidElement(CustomScrollView) && CustomScrollView.type !== React.Fragment;

  return (
    <RNModal visible={isVisible || visible} transparent statusBarTranslucent onRequestClose={closeModal}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={StyleSheet.absoluteFill}>
          <View style={styles.sheetModalContainer}>
            {/* Backdrop */}
            <TouchableWithoutFeedback onPress={closeModal}>
              <Animated.View style={[styles.backdrop, animatedBackdropStyle]} />
            </TouchableWithoutFeedback>

            {/* Sheet modal */}
            <Animated.View
              ref={modalViewRef}
              collapsable={false}
              style={[
                styles.sheetModal,
                fullHeight && styles.flex,
                { backgroundColor: colors.card, borderColor: colors.separator },
                animatedModalStyle,
                style,
              ]}
            >
              {/* Header */}
              <GestureDetector gesture={panGesture}>
                <View>
                  <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
                  {HeaderComponent}
                </View>
              </GestureDetector>

              {/* Scrollable content */}
              <GestureDetector gesture={panScrollGesture}>
                {isCustomScrollView ? (
                  React.cloneElement<ScrollViewProps>(CustomScrollView, {
                    scrollEventThrottle: 16,
                    onScroll,
                    contentContainerStyle: [
                      CustomScrollView.props?.contentContainerStyle,
                      !FooterComponent && { paddingBottom: insets.bottom },
                    ],
                    children,
                  })
                ) : (
                  <KeyboardAwareScrollView
                    extraKeyboardSpace={-insets.bottom}
                    scrollEventThrottle={16}
                    onScroll={onScroll}
                    style={fullHeight && styles.flex}
                    contentContainerStyle={[
                      contentContainerStyle,
                      !FooterComponent && { paddingBottom: insets.bottom },
                    ]}
                    keyboardShouldPersistTaps="handled"
                    bottomOffset={50}
                    alwaysBounceVertical={false}
                  >
                    {children}
                  </KeyboardAwareScrollView>
                )}
              </GestureDetector>

              {/* Footer */}
              {FooterComponent && <View style={{ paddingBottom: insets.bottom }}>{FooterComponent}</View>}
            </Animated.View>
          </View>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
  },
  modal: {
    margin: 16,
  },
  fullScreenModal: StyleSheet.absoluteFillObject,
  sheetModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingTop: 120, // Space at the top to tap the backdrop
  },
  sheetModal: {
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
    flexShrink: 1,
  },
  dragHandle: {
    alignSelf: "center",
    width: 48,
    height: 3,
    marginVertical: -1.5,
    borderRadius: 1.5,
    transform: [{ translateY: -10 }],
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLOR.DARK_OVERLAY,
  },
});
