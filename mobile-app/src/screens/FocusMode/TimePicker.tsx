import React, { memo, useRef, useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useTheme } from "@react-navigation/native";
import Svg, { Defs, Rect, Use, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { DisplayLargeText, DisplaySmallText, SnapFlatlist } from "@/components";
import { DEFAULT_FOCUS_MINUTES } from "./FocusMode";
import COLOR from "@/constants/color";
import { FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";

const MINUTE_ITEMS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const DEFAULT_MINUTE_INDEX = MINUTE_ITEMS.indexOf(DEFAULT_FOCUS_MINUTES);

const HOUR_ITEMS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const ITEM_HEIGHT = 60;
const PICKER_HEIGHT = ITEM_HEIGHT * 5;
const PICKER_WIDTH_PERCENTAGE = 75;

interface TimePickerProps {
  onTimePickerChange: (date: Date) => void;
}

export const TimePicker = memo(function TimePicker({ onTimePickerChange }: TimePickerProps) {
  const { colors } = useTheme();

  const hoursRef = useRef<number>(0);
  const minutesRef = useRef<number>(DEFAULT_FOCUS_MINUTES);

  // Output default value on mount
  useEffect(() => onTimePickerChange(new Date(DEFAULT_FOCUS_MINUTES * 60 * 1000)), []);

  const onSelectorChange = ({ hours, minutes }: { hours?: number; minutes?: number }) => {
    hoursRef.current = hours ?? hoursRef.current;
    minutesRef.current = minutes ?? minutesRef.current;
    onTimePickerChange(new Date((hoursRef.current * 60 + minutesRef.current) * 60 * 1000));
  };

  return (
    <View style={[styles.row, styles.justifyCenter, { height: PICKER_HEIGHT }]}>
      {/* Underlay (h + m text) */}
      <View style={[StyleSheet.absoluteFill, styles.justifyCenter, styles.alignCenter]}>
        <View style={[styles.row, styles.alignCenter, { width: `${PICKER_WIDTH_PERCENTAGE}%` }]}>
          {["h", "m"].map((text) => (
            <>
              <View style={styles.flex} />
              <View style={[styles.flex, styles.row]}>
                <Text numberOfLines={1} maxFontSizeMultiplier={FONT_SCALE_LIMIT.FIXED_LAYOUT}>
                  <DisplayLargeText style={styles.invisibleText} maxFontSizeMultiplier={FONT_SCALE_LIMIT.FIXED_LAYOUT}>
                    {"0"}
                  </DisplayLargeText>
                  {/* Space */}
                  <Text> </Text>
                  <DisplaySmallText maxFontSizeMultiplier={FONT_SCALE_LIMIT.FIXED_LAYOUT}>{text}</DisplaySmallText>
                </Text>
              </View>
            </>
          ))}
        </View>
      </View>

      {/* Item pickers */}
      <View style={[{ width: `${PICKER_WIDTH_PERCENTAGE}%` }, styles.row]}>
        <SnapFlatlist
          style={styles.flex}
          data={HOUR_ITEMS}
          itemSize={ITEM_HEIGHT}
          fallbackScrollViewSize={PICKER_HEIGHT}
          onSnapToItem={({ index }) => onSelectorChange({ hours: HOUR_ITEMS[index] })}
          renderItem={({ index, item, currentIndex }) => (
            <PickerItem {...{ index, currentIndex }} text={item.toString().padStart(2, "0")} />
          )}
        />
        <SnapFlatlist
          infinite
          style={styles.flex}
          data={MINUTE_ITEMS}
          itemSize={ITEM_HEIGHT}
          initialScrollIndex={DEFAULT_MINUTE_INDEX}
          fallbackScrollViewSize={PICKER_HEIGHT}
          onSnapToItem={({ index }) => onSelectorChange({ minutes: MINUTE_ITEMS[index] })}
          renderItem={({ index, item, currentIndex }) => (
            <PickerItem {...{ index, currentIndex }} text={item.toString().padStart(2, "0")} />
          )}
        />
      </View>

      {/* Overlay (top and bottom fade) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg height={PICKER_HEIGHT} width="100%">
          <Defs>
            <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset={0} stopColor={colors.card} />
              <Stop offset={1} stopColor={colors.card} stopOpacity={0.5} />
            </SvgLinearGradient>
          </Defs>
          <Rect width="100%" height="20%" y="40%" rx={8} ry={8} fill={colors.text} opacity={0.1} />
          <Rect width="100%" height="40%" fill="url(#grad)" id="grad-rect" />
          <Use href="#grad-rect" x="-100%" y="-100%" transform={"rotate(180)"} />
        </Svg>
      </View>
    </View>
  );
});

const PickerItem = memo(function PickerItem({ text }: { text: string }) {
  return (
    <View style={[styles.row, styles.justifyCenter, styles.alignCenter, { height: ITEM_HEIGHT }]}>
      <DisplayLargeText maxFontSizeMultiplier={FONT_SCALE_LIMIT.FIXED_LAYOUT}>{text}</DisplayLargeText>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row" },
  justifyCenter: { justifyContent: "center" },
  alignCenter: { alignItems: "center" },
  invisibleText: { color: COLOR.TRANSPARENT },
});
