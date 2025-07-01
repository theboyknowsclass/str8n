/**
 * Settings that are persisted across app sessions
 * @property cropToOverlay - Whether to automatically crop the transformed image to fit the overlay boundaries
 * @property maintainExifMetadata - Whether to preserve EXIF metadata (date, location, camera info, etc.) when transforming images
 * @property alwaysShowInstructions - Whether to always display instruction text to guide users on how to use the app
 * @property showZoomView - Whether to show the zoom view
 */
export type PersistedSettings = {
  cropToOverlay: boolean;
  maintainExifMetadata: boolean;
  alwaysShowInstructions: boolean;
  showZoomView: boolean;
};
