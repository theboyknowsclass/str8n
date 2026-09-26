// Exports the detection-calibration dataset from the str8n web app's own
// browser storage (localStorage's `calibration_samples` key + the
// `str8n-calibration-photos` IndexedDB database - see
// CalibrationPhotoStorageService.ts) to real files served by server.js in
// this folder, which must already be running (`node server.js`).
//
// Run this by pasting it into the browser console, or evaluating it via any
// tool that can run JS in the page, while the str8n web app
// (localhost:8081 in dev) is loaded and has samples to export. Idempotent -
// safe to re-run any time to pick up newly-added samples; it always
// re-sends everything currently in browser storage.
//
// Returns { totalSamples, uploaded, missingPhoto } - missingPhoto is
// nonzero only for a sample whose metadata survived in localStorage but
// whose photo was never saved to IndexedDB (shouldn't normally happen; see
// CalibrationSampleService.saveCalibrationSample's docs).
(async function exportCalibrationDataset() {
  const SERVER = 'http://localhost:5680';

  const samplesJson = localStorage.getItem('calibration_samples');
  const samples = samplesJson ? JSON.parse(samplesJson) : [];

  const openPhotoDb = () =>
    new Promise((resolve, reject) => {
      const request = indexedDB.open('str8n-calibration-photos', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

  const getPhoto = (db, id) =>
    new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readonly');
      const req = tx.objectStore('photos').get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

  const db = await openPhotoDb();
  const manifest = [];
  let uploaded = 0;
  let missingPhoto = 0;

  for (const sample of samples) {
    const photo = await getPhoto(db, sample.id);
    if (!photo) {
      missingPhoto++;
      continue;
    }
    await fetch(`${SERVER}/photos/${encodeURIComponent(sample.id)}`, {
      method: 'POST',
      headers: { 'Content-Type': photo.type || 'application/octet-stream' },
      body: photo,
    });
    manifest.push({
      id: sample.id,
      width: sample.width,
      height: sample.height,
      groundTruthPoints: sample.groundTruthPoints,
      features: sample.features,
      photoContentType: photo.type || 'application/octet-stream',
    });
    uploaded++;
  }

  // Close explicitly rather than leaving the connection open - an open
  // IndexedDB connection blocks any later attempt to delete or upgrade
  // this database (deleteDatabase queues and waits indefinitely for every
  // open connection to close first, wedging every subsequent request to
  // this database behind it until the page reloads).
  db.close();

  await fetch(`${SERVER}/manifest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(manifest),
  });

  return { totalSamples: samples.length, uploaded, missingPhoto };
})();
