import React, { memo, useCallback, useRef, useState } from "react";
import { FlatList, StyleSheet, View, useWindowDimensions, FlatListProps } from "react-native";
import { AnimatedOffsets, DraggableItem } from "@/components/AnimatedListItems";
import { ActivityItemPopup, ItemLayout } from "@/screens/Home/components/ActivityItemPopup";
import {
  ACTIVITY_CARD_HEIGHT,
  ActivityItemButton,
  ActivityItemButtonProps,
} from "@/screens/Home/components/ActivityItem";
import { useSharedValue } from "react-native-reanimated";
import { clampFontScale } from "@/utils/FontScaleUtils";
import { triggerHaptics } from "react-native-turbo-haptics";
import type { Activity } from "@/types/Routine";

interface EditActivitiesFlatListProps extends Omit<FlatListProps<Activity>, "renderItem"> {
  data: Activity[];
  onPressEdit?: (activity: Activity) => void;
  onPressDelete?: (activity: Activity) => void;
  onReorder?: DraggableActivityItemProps["onReorder"];
  itemProps?: Partial<DraggableActivityItemProps>;
  enableQuickDelete?: boolean;
}

export const EditActivitiesFlatList = ({
  data: activities,
  onPressEdit,
  onPressDelete,
  onReorder,
  itemProps,
  enableQuickDelete,
  ...props
}: EditActivitiesFlatListProps) => {
  const animatedOffsets = useSharedValue(null);

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isActivityPopupVisible, setIsActivityPopupVisible] = useState(false);
  const selectedItemLayout = useSharedValue<ItemLayout>({});

  const onItemPress = useCallback(
    async (activity: Activity, pendingItemLayout: Promise<ItemLayout>) => {
      triggerHaptics("soft");

      // Continue even if the .measure callback somehow doesn't resolve in under 500ms
      const itemLayout = await Promise.race([pendingItemLayout, new Promise((resolve) => setTimeout(resolve, 500))]);
      setSelectedActivity(activity);
      setIsActivityPopupVisible(true);
      selectedItemLayout.set(itemLayout || {});
    },
    [selectedItemLayout],
  );

  return (
    <>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contentContainer}
        renderItem={({ item, index }) => (
          <DraggableActivityItem
            index={index}
            itemCount={activities.length}
            animatedOffsets={animatedOffsets}
            onItemPress={onItemPress}
            isSelected={isActivityPopupVisible && selectedActivity?.id === item.id}
            onReorder={onReorder}
            itemProps={itemProps}
            {...item}
          />
        )}
        {...props}
      />

      <ActivityItemPopup
        isVisible={isActivityPopupVisible}
        setIsVisible={setIsActivityPopupVisible}
        activity={selectedActivity}
        itemLayout={selectedItemLayout}
        onPressEdit={onPressEdit}
        onPressDelete={onPressDelete}
        itemProps={{ hasDragHandle: true }}
        enableQuickDelete={enableQuickDelete}
      />
    </>
  );
};

interface DraggableActivityItemProps extends Activity {
  index: number;
  itemCount: number;
  animatedOffsets: AnimatedOffsets;
  onItemPress: (activity: Activity, pendingItemLayout: Promise<ItemLayout>) => void;
  isSelected: boolean;
  onReorder: (fromIndex: number, toIndex: number) => void;
  itemProps?: Partial<ActivityItemButtonProps>;
}

const DraggableActivityItem = memo(function DraggableActivityItem({
  index,
  itemCount,
  animatedOffsets,
  onItemPress,
  isSelected,
  onReorder,
  itemProps,
  ...activity
}: DraggableActivityItemProps) {
  const containerRef = useRef<View>(null);

  const cardHeight = ACTIVITY_CARD_HEIGHT * clampFontScale(useWindowDimensions().fontScale);
  const itemHeight = cardHeight + 8;

  const minTranslateY = -index * itemHeight;
  const maxTranslateY = (itemCount - index - 1) * itemHeight;

  const onPress = useCallback(() => {
    const pendingItemLayout = new Promise((resolve) => {
      containerRef.current?.measure?.((_x, _y, width, _height, pageX, pageY) => resolve({ x: pageX, y: pageY, width }));
    });
    onItemPress(activity, pendingItemLayout);
  }, [activity, onItemPress]);

  return (
    <View ref={containerRef}>
      <DraggableItem
        index={index}
        itemHeight={itemHeight}
        animatedOffsets={animatedOffsets}
        onReorder={onReorder}
        minTranslateY={minTranslateY}
        maxTranslateY={maxTranslateY}
        style={[styles.activityItemContainer, { height: cardHeight }]}
      >
        {!isSelected && (
          <ActivityItemButton
            hasDragHandle
            onPress={onPress}
            testID={`test:id/activity-${index}`}
            {...itemProps}
            {...activity}
          />
        )}
      </DraggableItem>
    </View>
  );
});

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
    paddingTop: 12,
  },
  activityItemContainer: {
    borderRadius: 16,
    marginBottom: 8,
  },
});
