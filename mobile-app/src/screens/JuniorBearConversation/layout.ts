/**
 * Layout model for JuniorBearConversation
 *
 * The screen is split into two vertical regions:
 *
 *   ┌──────────────────────────┐ ← safe-area top
 *   │  Top row (Back / Skip)   │
 *   │  Speech bubble           │  ← topHalfHeight (target ≈ 74% of safe area)
 *   │  Bear image / Lottie     │
 *   ├──────────────────────────┤ ← border
 *   │  Action buttons (1-2)    │  ← remaining height (≥ minBottomHeight)
 *   │  "Already have account"  │
 *   └──────────────────────────┘ ← safe-area bottom
 *
 * topHalfHeight is computed so the top region never squeezes the buttons
 * off-screen on short devices, and never leaves too much empty space on
 * tall devices. The clamp keeps the value between minTopHeight (enough
 * room for bubble + ¾ of the bear) and maxTopHeight (screen minus the
 * minimum button area).
 */

export const TOP_HALF_RATIO = 0.74;
export const TOP_HALF_PADDING_TOP = 40;
export const BEAR_HEIGHT = 260;
export const BOTTOM_BUTTON_GAP = 12;
export const BOTTOM_BUTTONS_PADDING_TOP = 24;
export const BOTTOM_SECTION_PADDING_VERTICAL = 32;
export const MIN_BUTTON_HEIGHT = 48;
export const MIN_BUTTON_COUNT = 2;
export const TOP_ROW_HEIGHT = 44;
export const TOP_ROW_GAP = 12;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface TopHalfLayoutInput {
  screenHeight: number;
  safeAreaTop: number;
  safeAreaBottom: number;
}

/**
 * Returns the pixel height for the top half of the conversation screen.
 * Pure function — depends only on screen dimensions and safe-area insets.
 */
export function computeTopHalfHeight({ screenHeight, safeAreaTop, safeAreaBottom }: TopHalfLayoutInput): number {
  const availableHeight = Math.max(0, screenHeight - safeAreaTop - safeAreaBottom);
  const desiredTopHeight = availableHeight * TOP_HALF_RATIO;
  const estimatedBubbleHeight = clamp(availableHeight * 0.22, 130, 210);
  const minTopHeight = TOP_HALF_PADDING_TOP + TOP_ROW_HEIGHT + TOP_ROW_GAP + estimatedBubbleHeight + BEAR_HEIGHT * 0.75;
  const minBottomHeight =
    BOTTOM_SECTION_PADDING_VERTICAL * 2 +
    BOTTOM_BUTTONS_PADDING_TOP +
    MIN_BUTTON_COUNT * MIN_BUTTON_HEIGHT +
    (MIN_BUTTON_COUNT - 1) * BOTTOM_BUTTON_GAP;
  const maxTopHeight = Math.max(0, availableHeight - minBottomHeight);

  return clamp(Math.max(desiredTopHeight, minTopHeight), 0, maxTopHeight);
}
