/**
 * Must be the very first import in index.ts, before expo-router/react/
 * react-dom are evaluated.
 *
 * React DOM 19.2 added a dev-only "Components" performance track (Chrome
 * DevTools Performance panel) that recursively walks every component's
 * props via `for...in` to log them through `console.timeStamp`. On web it
 * walks this app's Reanimated `SharedValue` props (a normal, unavoidable
 * prop type throughout the Skia-based overlay/gesture code) and throws
 * `RangeError: Invalid array length`. That throw happens inside a passive
 * effect, which corrupts React's work-loop scheduler for the rest of the
 * session ("Error: Should not already be working" on every subsequent
 * update) - in practice every button on the Edit screen stops responding
 * until a hard reload.
 *
 * React gates this entire feature behind a `supportsUserTiming` check
 * (`console.timeStamp` and `performance.measure` both existing) computed
 * once when react-dom's module first evaluates. Removing `console.timeStamp`
 * before that happens disables the feature at the source, so this file's
 * only job is to run first. The trade-off is losing the Chrome DevTools
 * "Components" profiling track in dev on web - a real but minor loss set
 * against the alternative of every button freezing. Production builds
 * never include this react-dom code path at all, and this is a no-op on
 * native (no `document`, and no `console.timeStamp` to begin with).
 */
if (__DEV__ && typeof document !== 'undefined') {
  delete (console as { timeStamp?: unknown }).timeStamp;
  (
    globalThis as { __disabledReactPerfTrack?: boolean }
  ).__disabledReactPerfTrack = true;
}
