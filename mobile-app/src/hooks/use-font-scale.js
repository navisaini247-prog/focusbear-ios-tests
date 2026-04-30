import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { isLargeFontScale, scaleByFontScale } from "@/utils/FontScaleUtils";

/**
 * Returns font scale info for responsive layout adjustments.
 * Uses FontScaleUtils and useWindowDimensions (consistent with ScalableIcon).
 *
 * @returns {{ fontScale: number, isLargeFontScale: boolean, scaleSize: (base: number) => number }}
 *   - fontScale: The device's font scale factor (e.g. 1.0 = default, 1.5 = 150%)
 *   - isLargeFontScale: True when font scale exceeds threshold, indicating larger fonts
 *   - scaleSize: Scales a base size by font scale (uses FontScaleUtils.scaleByFontScale)
 */
export const useFontScale = () => {
  const { fontScale } = useWindowDimensions();

  return useMemo(
    () => ({
      fontScale,
      isLargeFontScale: isLargeFontScale(fontScale),
      scaleSize: (base) => scaleByFontScale(base, fontScale),
    }),
    [fontScale],
  );
};
