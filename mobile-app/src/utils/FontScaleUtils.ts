export const FONT_SCALE_LIMIT = {
  DEFAULT_TEXT: 2,
  TEXT_INPUT: 2,
  CONSTRAINED_UI: 1.2,
  FIXED_LAYOUT: 1,
} as const;

const DEFAULT_MAX_FONT_SCALE = FONT_SCALE_LIMIT.DEFAULT_TEXT;

/** Threshold above which layout should adapt (e.g. fewer columns, larger touch targets). */
export const LARGE_FONT_THRESHOLD = 1.4;

export const isLargeFontScale = (fontScale: number) => fontScale > LARGE_FONT_THRESHOLD;

export const clampFontScale = (fontScale = 1, maxFontScale = DEFAULT_MAX_FONT_SCALE) =>
  Math.min(fontScale, maxFontScale);

interface ScaleByFontScaleOptions {
  maxFontScale?: number;
  round?: boolean;
}

export const scaleByFontScale = (
  baseSize: number,
  fontScale = 1,
  { maxFontScale = DEFAULT_MAX_FONT_SCALE, round = true }: ScaleByFontScaleOptions = {},
) => {
  const scaledSize = baseSize * clampFontScale(fontScale, maxFontScale);
  return round ? Math.round(scaledSize) : scaledSize;
};
