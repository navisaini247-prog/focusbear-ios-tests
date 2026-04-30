/*
https://reactnative.dev/docs/vibration
"On Android, the odd indices of the pattern array represent the vibration duration, while the even ones represent the separation time.
On iOS, the numbers in the pattern array represent the separation time, as the vibration duration is fixed."

iOS pattern array:
- [delay, delay, delay, ...]
- vibration duration is always approx 400ms, we can only control the gaps between vibrations since vibration is FIXED)

Note: iOS has a minimum separation threshold of approx 600ms between vibrations (anything below 600ms will default to vibrate 400ms once).

Example (iOS): [0,800] => wait 0ms, vibrate 400ms, wait 800ms, vibrate 400ms
Example (iOS): [0] => wait 0ms, vibrate 400ms
Example (iOS): [0, 500] => wait 0ms, vibrate 400ms
Example (iOS): [0, 400] => wait 0ms, vibrate 400ms
Example (iOS): [0, 300] => wait 0ms, vibrate 400ms
Example (iOS): [5000,5000,10000] => wait 5s, vibrate 400ms, wait 5s, vibrate 400ms, wait 10s, vibrate 400ms

android pattern array:
- [delay, vibrate, delay, vibrate, ...]
- Vibration.vibrate() accepts either a single duration (in ms) or an array pattern

Example (Android): [0, 400] => wait 0ms, vibrate 400ms
Example (Android): [0, 800] => wait 0ms, vibrate 800ms
*/

export const VIBRATION_PATTERNS = {
  DEFAULT: null,
  FOCUS_TIMER_COMPLETED: null,
};
