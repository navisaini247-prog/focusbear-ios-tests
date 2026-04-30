import React, { memo, useState, useCallback, useEffect } from "react";
import { ConfirmationModal, Card } from "@/components";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import Svg, { Defs, Rect, Use, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { DisplayLargeText, DisplaySmallText, SnapFlatlist } from "@/components";
import { FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";

const MINUTE_ITEMS = Array.from({ length: 60 }, (_, i) => i); // 0-59 minutes
const HOUR_ITEMS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const ITEM_HEIGHT = 60;
const PICKER_HEIGHT = ITEM_HEIGHT * 5;
const PICKER_WIDTH_PERCENTAGE = 75;

const EditFocusSessionModalComponent = ({
  isVisible,
  onCancel,
  onConfirm = () => {},
  currentRemainingTime, // in milliseconds
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  // Convert currentRemainingTime to hours and minutes
  const currentHours = Math.floor(currentRemainingTime / (1000 * 60 * 60));
  const currentMinutes = Math.floor((currentRemainingTime % (1000 * 60 * 60)) / (1000 * 60));

  const [hours, setHours] = useState(currentHours);
  const [minutes, setMinutes] = useState(currentMinutes);

  // Update state when currentRemainingTime changes
  useEffect(() => {
    if (isVisible) {
      const newHours = Math.floor(currentRemainingTime / (1000 * 60 * 60));
      const newMinutes = Math.floor((currentRemainingTime % (1000 * 60 * 60)) / (1000 * 60));
      setHours(newHours);
      setMinutes(newMinutes);
    }
  }, [currentRemainingTime, isVisible]);

  const handleConfirm = useCallback(() => {
    // Convert hours and minutes to milliseconds
    const totalTimeMs = (hours * 60 + minutes) * 60 * 1000;
    onConfirm(totalTimeMs);
  }, [hours, minutes, onConfirm]);

  // Find initial scroll indices
  const initialHourIndex = HOUR_ITEMS.indexOf(currentHours) !== -1 ? HOUR_ITEMS.indexOf(currentHours) : 0;

  const initialMinuteIndex = MINUTE_ITEMS.indexOf(currentMinutes) !== -1 ? MINUTE_ITEMS.indexOf(currentMinutes) : 0;

  return (
    <ConfirmationModal
      isVisible={isVisible}
      title={t("focusMode.editFocusDuration")}
      text={t("")}
      onCancel={onCancel}
      confirmTitle={t("common.done")}
      onConfirm={handleConfirm}
      disableSwipe
    >
      <Card style={styles.timePickerCard}>
        <View style={[styles.row, styles.justifyCenter, { height: PICKER_HEIGHT }]}>
          {/* Underlay (h + m text) */}
          <View style={[StyleSheet.absoluteFill, styles.justifyCenter, styles.alignCenter]}>
            <View style={[styles.row, styles.alignCenter, { width: `${PICKER_WIDTH_PERCENTAGE}%` }]}>
              {["h", "m"].map((text) => (
                <React.Fragment key={text}>
                  <View style={styles.flex} />
                  <View style={[styles.flex, styles.row, styles.alignCenter]}>
                    <DisplayLargeText
                      style={styles.invisibleText}
                      maxFontSizeMultiplier={FONT_SCALE_LIMIT.FIXED_LAYOUT}
                    >
                      {"0"}
                    </DisplayLargeText>
                    <DisplaySmallText maxFontSizeMultiplier={FONT_SCALE_LIMIT.FIXED_LAYOUT}>{text}</DisplaySmallText>
                  </View>
                </React.Fragment>
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
              initialScrollIndex={initialHourIndex}
              onSnapToItem={({ index }) => setHours(HOUR_ITEMS[index])}
              renderItem={({ index, item, currentIndex }) => (
                <PickerItem {...{ index, currentIndex }} text={item.toString().padStart(2, "0")} />
              )}
            />
            <SnapFlatlist
              style={styles.flex}
              data={MINUTE_ITEMS}
              itemSize={ITEM_HEIGHT}
              fallbackScrollViewSize={PICKER_HEIGHT}
              initialScrollIndex={initialMinuteIndex}
              onSnapToItem={({ index }) => setMinutes(MINUTE_ITEMS[index])}
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
      </Card>
    </ConfirmationModal>
  );
};

EditFocusSessionModalComponent.displayName = "EditFocusSessionModal";

export const EditFocusSessionModal = memo(EditFocusSessionModalComponent);

const PickerItem = memo(function PickerItem({ text }) {
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
  invisibleText: { opacity: 0 },
  timePickerCard: {
    padding: 16,
  },
});
