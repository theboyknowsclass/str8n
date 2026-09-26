# Detection-calibration dataset tooling

Exports/imports the detection-calibration ground-truth dataset (real photos
+ hand-placed corner points, built up via the app's Batch Calibration
screen) to/from real files on disk, instead of leaving it trapped in the
browser's `localStorage`/IndexedDB. This makes the dataset durable (survives
clearing browser storage, moving to a different machine, a different
browser profile) and lets a regression check be scripted end to end -
export once, then any later session can re-import the exact same dataset
and re-run the sweep, without needing to re-pick and re-correct every photo
by hand again.

The dataset itself (`calibration-data/` at the repo root) is git-ignored -
it's real photos and is local dev data, not something to ship or commit.

## Where the data actually lives day to day

Nothing changes about how you build the dataset up: keep using the app's
**Batch Calibration** screen (pick a folder, correct or Skip each photo,
"Save & Next"). That writes to the browser's own storage exactly as before.
This tooling is a bridge to and from that storage, not a replacement for it.

## Files here

- `server.js` - a small local HTTP server (port 5680) that reads/writes
  `calibration-data/manifest.json` and `calibration-data/photos/<id>`.
  Start it with `node tools/calibration-dataset/server.js`, or via
  `.claude/launch.json`'s `calibration-dataset-server` config.
- `export.js` - paste into the browser console (or run via any tool that
  can evaluate JS in the page) while the app is loaded, to push everything
  currently in browser storage to the server's files. Safe to re-run any
  time - always re-sends the current full set.
- `import.js` - paste into the browser console the same way, to pull the
  server's saved files back into a (possibly fresh) browser's storage,
  overwriting whatever's there. Use this to seed a new browser profile, a
  restarted dev server's fresh tab, or to reproduce an exact dataset for a
  regression run.

## Running a regression check without clicking through the UI

The Calibration screen (`__DEV__`-only, web) exposes
`window.__str8nCalibration = { runSweep, results, lineSegmentAverageIoU,
sampleCount }` for exactly this - so once a dataset is imported and the
screen is open, both detection strategies can be evaluated with:

```js
await window.__str8nCalibration.runSweep();
// then read the fresh numbers back off the same object:
window.__str8nCalibration.results; // contour strategy, best combo first
window.__str8nCalibration.lineSegmentAverageIoU; // line-segment strategy
```

A typical end-to-end flow for checking "did this change regress detection
accuracy":

1. Start `calibration-dataset-server` and `str8n-web`.
2. Open the app, navigate to Detection Calibration, run `import.js` in the
   console to load the saved dataset into this browser's storage, then
   reload the page so the screen picks up the freshly-imported samples.
3. Run `await window.__str8nCalibration.runSweep()` and record
   `results[0].averageIoU` and `lineSegmentAverageIoU`.
4. Make the code change under test, reload, repeat step 3, and compare.

## Format notes

- Photos are stored extensionless (`calibration-data/photos/<id>`) with no
  assumption about image format - each `manifest.json` entry carries its
  own `photoContentType`, and `import.js` reconstructs a `Blob` with that
  exact MIME type rather than guessing from a file extension.
- Each manifest entry mirrors `CalibrationSample` (see
  `src/types/CalibrationSample.ts`) minus `imageUri`, which isn't portable
  (a `blob:` URL only exists for the page load that created it) - it's
  regenerated fresh by `useCalibrationStore`'s existing `loadSamples()`
  logic the moment the photo exists in IndexedDB again, the same way it
  already handles every normal page reload.
