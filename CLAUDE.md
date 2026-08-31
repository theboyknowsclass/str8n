# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

str8n is a React Native/Expo app (iOS, Android, web) that corrects perspective distortion in photos — the primary use case is squaring up photos of paintings/artwork taken at an angle in a gallery. There is no live camera pipeline: it's a post-capture correction step where the user picks an image, drags 4 corner handles onto the subject, and the app applies an OpenCV perspective warp.

## Commands

```bash
npm start                # Start the Expo dev server
npm run web               # Start the dev server for web
npm run android            # expo prebuild --clean && expo run:android
npm run ios                # expo prebuild --clean && expo run:ios
npm run build:web          # expo export --platform web (what CI runs)
npm run build:android      # expo prebuild --clean --platform android
npm run build:ios          # expo prebuild --clean --platform ios
npm run type-check         # tsc --noEmit
npm run type-check:strict  # tsc --noEmit --strict (what CI runs)
npm run lint                # eslint .
npm run check               # type-check:strict + lint (run this before considering a change done)
npm run upgrade:expo         # expo install expo@latest && expo install --fix
```

There is no test suite/framework configured in this project — don't assume `npm test` runs anything meaningful.

New dependencies must be added via `npx expo install <package>` rather than plain `npm install`, so the version resolved matches what the installed Expo SDK expects. After installing, run `npx expo-doctor` to confirm the dependency tree is still SDK-compatible — plain `npm install`/`npm audit fix` can silently pull in a transitively-mismatched version (this has happened before with `metro` and with a duplicated nested `react-native`).

## Architecture

### OpenCV: two bindings, chosen automatically by platform

There are two independent implementations of the perspective-warp logic, and Metro/webpack picks between them automatically via the `.native.ts` filename convention — there is no manual `Platform.OS` branch:

- `src/services/TransformService.native.ts` — iOS/Android, using `react-native-fast-opencv` (a native module, synchronous `OpenCV.invoke(...)` API over native `Mat` objects).
- `src/services/TransformService.ts` — web, using `@techstark/opencv-js` (the WASM build of OpenCV, run directly in-page, no WebView bridge).

Both export a `TransformService` class with an identical `transformImage(image, srcPoints, dstPoints, cropToRectangle, signal)` signature, re-exported from `src/services/index.ts`. When changing the warp behavior, the change generally needs to be made in both files in parallel.

There is no server-side/backend OpenCV — everything runs on-device or in-browser.

### Corner selection is fully manual — no auto-detection

The 4 correction corners are never inferred from the image (no contour/edge detection anywhere). The flow is:
1. `src/stores/useOverlayStore.ts` seeds a fixed centered rectangle (`initialPoints`, relative 0–1 coordinates).
2. `src/components/organisms/Edit/Overlay/PointGestureHandler.tsx` gives each corner an independent pan gesture (react-native-gesture-handler + reanimated) that the user drags; it blocks the parent pan/zoom gesture while active.
3. `src/components/organisms/Edit/Overlay/OverlayControl.tsx` renders the 4 handles plus a Skia-drawn selection polygon over the image.

### Transform pipeline

`src/hooks/useTransformImage.ts` orchestrates the actual correction: it reads the 4 points from `useOverlayStore`, converts them to absolute pixel coordinates, orders them by corner (`src/utils/transformUtils.ts`), computes a destination rectangle, and calls `TransformService.transformImage`. The output canvas size passed to `warpPerspective` is currently just the source image's width/height (not derived from the quad), and `cropToOverlay` (from `usePersistedSettingsStore`) controls whether the result is cropped to the destination rectangle afterward.

### Component hierarchy and path aliases

Components follow an atomic-design layout under `src/components/`: `atoms` → `molecules` → `organisms` → `pages`, each with a barrel `index.ts`. TypeScript path aliases (defined in `tsconfig.json`, mirrored by Metro) let you import by layer instead of relative path: `@atoms`, `@molecules`, `@organisms`, `@templates`, `@pages`, `@components/*`, plus `@services`, `@hooks`, `@utils`, `@types`, `@stores`, `@contexts`, and `@assets/*`. Prefer these aliases over deep relative imports, matching existing code.

State is managed with Zustand stores under `src/stores/` (overlay points, source/transformed image, persisted settings), and cross-cutting UI state (pan/zoom, edit control sizing) is threaded via React Context in `src/contexts/`.

### New Architecture is mandatory

As of Expo SDK 55, the New Architecture can no longer be disabled and the `newArchEnabled` app config key was removed (there is nothing to toggle in `app.json` anymore). Native-module dependencies (`react-native-fast-opencv`, `@shopify/react-native-skia`, reanimated, gesture-handler) all need New Architecture compatibility — check this specifically when bumping any of them.

### Theming uses `expo-router/react-navigation`, not `@react-navigation/*`

As of SDK 56, `expo-router` is no longer compatible with `@react-navigation/*` as direct dependencies. This app never used React Navigation for actual routing (routing is all `expo-router`) — it only used `@react-navigation/native`'s `ThemeProvider`/`useTheme`/`DarkTheme`/`DefaultTheme`/`Theme` for theming. Those are now imported from `'expo-router/react-navigation'` instead; do not add `@react-navigation/*` packages back as direct dependencies.

### Dependency upgrades must go through `expo install`

Add new dependencies with `npx expo install <package>`, not plain `npm install`, so the resolved version matches what the installed Expo SDK expects. After any dependency change, run `npx expo-doctor` — plain `npm install`/`npm audit fix` can silently pull in a transitively-mismatched version (this has previously caused a duplicated, mismatched `react-native` in the tree). When bumping the Expo SDK itself, do it one major version at a time (`npx expo install expo@<next-major>` then `npx expo install --fix`), verifying `expo-doctor`, `npm run check`, and `npm run build:web` at each step before moving to the next — SDK majors have repeatedly shipped breaking changes here (e.g. `expo-file-system`'s API rewrite in SDK 54, React Native's stricter `ColorValue` type, ESLint rule changes in `eslint-config-expo`).

### Build/release

- EAS (`eas.json`) handles native builds and store submission; there is no EAS build/submit step in GitHub Actions — that pipeline is run manually (`eas build`, `eas submit`). `.github/workflows/ci.yml` only does install/audit/type-check/lint/`build:web`, and `.github/workflows/deploy.yml` publishes the web export to GitHub Pages.
- iOS submission config (`eas.json` → `submit.production.ios`) targets App Store Connect app id `6747818231` under company "Ineffable Consulting Ltd".
