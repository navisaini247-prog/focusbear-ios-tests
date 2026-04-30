import React, { memo, useMemo, useState, useEffect } from "react";
import { ViewStyle, StyleProp, TransformsStyle } from "react-native";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useDerivedValue,
  SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { HapticTypes, triggerHaptics } from "react-native-turbo-haptics";
import { useTheme } from "@react-navigation/native";
import { runOnJS } from "react-native-worklets";

export const ANIM_DURATION = 400;

export type AnimatedOffsets = SharedValue<{ [offsetIndex: number]: number }>;

interface DraggableItemProps {
  index: number;
  itemHeight: number;
  animatedOffsets: AnimatedOffsets;
  onReorder: (fromIndex: number, toIndex: number) => void;
  minTranslateY: number;
  maxTranslateY: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export const DraggableItem = ({
  index,
  itemHeight,
  animatedOffsets,
  onReorder,
  minTranslateY,
  maxTranslateY,
  style,
  children,
}: DraggableItemProps) => {
  const { shadowStyles } = useTheme();
  const bigBoxShadow = shadowStyles.bigShadow.boxShadow[0];

  const translateX = useSharedValue(0);
  const [translateY, setTranslateY] = useState(null);
  const isDragging = useSharedValue(false);
  const grabAnimation = useSharedValue(0);
  const prevDragIndex = useSharedValue(-1);

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activateAfterLongPress(250)
      .enabled(Boolean(translateY))
      .onStart(() => {
        triggerHaptics(HapticTypes.impactHeavy);
        isDragging.value = true;
        grabAnimation.value = withSpring(1, { duration: ANIM_DURATION });
      })
      .onUpdate((event) => {
        translateX.value = event.translationX;
        // Apply a soft clamp to the vertical translation
        const clamped = Math.max(Math.min(event.translationY, maxTranslateY), minTranslateY);
        const overage = Math.abs(clamped - event.translationY);
        translateY.value = clamped + (Math.sign(event.translationY) * (overage * 20)) / (overage + 20);

        const dragIndex = index + Math.round(clamped / itemHeight);

        if (prevDragIndex.value !== dragIndex) {
          prevDragIndex.value = dragIndex;

          // Add the offset before the item when dragging up, or after when dragging down
          if (dragIndex < index) {
            animatedOffsets.value = { [index]: -itemHeight, [dragIndex]: itemHeight };
          } else if (dragIndex > index) {
            animatedOffsets.value = { [index + 1]: -itemHeight, [dragIndex + 1]: itemHeight };
          } else {
            animatedOffsets.value = {};
          }
        }
      })
      .onEnd(() => {
        isDragging.value = false;
        grabAnimation.value = withSpring(0, { duration: ANIM_DURATION });

        const targetIndex = prevDragIndex.value !== -1 ? prevDragIndex.value : index;
        const targetTranslation = (targetIndex - index) * itemHeight;

        animatedOffsets.value = null;
        translateX.value = withSpring(0, { duration: ANIM_DURATION });
        // Shorten the vertical animation duration so we can finalize the reorder sooner
        translateY.value = withSpring(targetTranslation, { duration: ANIM_DURATION / 2 });

        // Run the onReorder callback, giving a little extra time for the animation to complete
        if (targetIndex !== index) setTimeout(() => runOnJS(onReorder)(index, targetIndex), ANIM_DURATION / 2 + 50);
      });
  }, [
    translateY,
    isDragging,
    grabAnimation,
    maxTranslateY,
    minTranslateY,
    translateX,
    index,
    itemHeight,
    prevDragIndex,
    animatedOffsets,
    onReorder,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    zIndex: isDragging.value ? 100 : 0,
    boxShadow: [{ ...bigBoxShadow, offsetY: grabAnimation.value * 12, blurRadius: grabAnimation.value * 16 }],
  }));
  const additionalTransforms = useDerivedValue(
    () => [{ translateX: translateX.value }, { scale: 1 + grabAnimation.value * 0.08 }] as TransformsStyle["transform"],
  );

  return (
    <GestureDetector gesture={panGesture}>
      <AnimatedItemPosition
        animatedOffsets={animatedOffsets}
        index={index}
        setTranslateY={setTranslateY}
        style={[style, animatedStyle]}
        additionalTransforms={additionalTransforms}
        key={index}
      >
        {children}
      </AnimatedItemPosition>
    </GestureDetector>
  );
};

interface AnimatedItemPositionProps {
  animatedOffsets: AnimatedOffsets;
  /** It is compulsory to set the key prop to `index`. See my comment in the component for why. */
  index: number;
  setTranslateY: (translateY: SharedValue<number>) => void;
  /** The shared value is also optionally passed to the parent, so that translations it applies are also cleared. */
  additionalTransforms?: SharedValue<TransformsStyle["transform"]>;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Consumer of the `animatedOffsets` shared value. Used in lists for animated accordions and drag-and-drop reordering.
 * - An offset is effectively like a spacer between items in the list.
 * - Multiple offsets (both positive and negative) can be inserted.
 *
 * This component is used to animate items before they get repositioned in the list. A key part of how this works is
 * that the animated translateY is reset to 0 when the item is actually repositioned. This is done by re-mounting
 * the component. Otherwise, no matter what, you cannot update the animated style in the same instant as the physical
 * relocation of the item, resulting in visible flicker. Using key={index} is a convenient way to do this.
 * An important benefit is that all other state, animations and gestures can be placed in the parent component, which
 * won't get remounted. Then, pass the visible portion of the item (as simple JSX) as children of this component.
 */
export const AnimatedItemPosition = memo(function AnimatedOffset({
  setTranslateY,
  animatedOffsets,
  index,
  additionalTransforms,
  style,
  ...props
}: AnimatedItemPositionProps) {
  const translateY = useSharedValue(0);
  const additionalTranslateY = useSharedValue(0);

  useEffect(() => {
    setTranslateY?.(additionalTranslateY);
  }, [setTranslateY, additionalTranslateY]);

  useAnimatedReaction(
    () => animatedOffsets.value,
    (offsets) => {
      if (!offsets) return;

      const totalOffset = Object.entries(offsets).reduce((acc, [offsetIndex, offset]) => {
        return Number(offsetIndex) <= index ? acc + offset : acc;
      }, 0);

      if (translateY.value !== totalOffset) {
        translateY.value = withSpring(totalOffset, { duration: ANIM_DURATION });
      }
    },
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value + additionalTranslateY.value },
      ...(additionalTransforms?.value || []),
    ] as TransformsStyle["transform"],
  }));

  return <Animated.View style={[animatedStyle, style]} {...props} />;
});
