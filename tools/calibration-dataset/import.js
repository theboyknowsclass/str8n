// Imports the detection-calibration dataset from server.js's saved files
// (in this folder, must already be running - `node server.js`) into the
// str8n web app's browser storage (localStorage + the
// `str8n-calibration-photos` IndexedDB database), overwriting whatever's
// currently saved there.
//
// Run this by pasting it into the browser console, or evaluating it via any
// tool that can run JS in the page, while the str8n web app (localhost:8081
// in dev) is loaded. Use this to seed a fresh browser/profile/session with
// a dataset built up previously - e.g. after clearing browser storage, in
// a freshly-restarted dev server's tab, or to reproduce a specific dataset
// for a regression check.
//
// Each imported sample's imageUri is intentionally left blank - it's
// regenerated as a fresh blob: URL the next time useCalibrationStore's
// loadSamples() runs, the same way it already handles every normal reload
// (see that store's docs) - a blob: URL from a previous page load is never
// valid here anyway.
//
// Returns { imported: number }.
(async function importCalibrationDataset() {
  const SERVER = 'http://localhost:5680';

  const manifest = await fetch(`${SERVER}/manifest.json`).then((r) =>
    r.json()
  );

  const openPhotoDb = () =>
    new Promise((resolve, reject) => {
      const request = indexedDB.open('str8n-calibration-photos', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('photos');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

  const putPhoto = (db, id, blob) =>
    new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readwrite');
      tx.objectStore('photos').put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

  const db = await openPhotoDb();
  const samples = [];

  for (const entry of manifest) {
    const response = await fetch(
      `${SERVER}/photos/${encodeURIComponent(entry.id)}`
    );
    const rawBlob = await response.blob();
    const typedBlob =
      rawBlob.type === entry.photoContentType
        ? rawBlob
        : new Blob([rawBlob], { type: entry.photoContentType });
    await putPhoto(db, entry.id, typedBlob);
    samples.push({
      id: entry.id,
      imageUri: '',
      width: entry.width,
      height: entry.height,
      groundTruthPoints: entry.groundTruthPoints,
      features: entry.features,
    });
  }

  // Close explicitly rather than leaving the connection open - an open
  // IndexedDB connection blocks any later attempt to delete or upgrade
  // this database (deleteDatabase queues and waits indefinitely for every
  // open connection to close first, wedging every subsequent request to
  // this database behind it until the page reloads).
  db.close();

  localStorage.setItem('calibration_samples', JSON.stringify(samples));

  return { imported: samples.length };
})();
