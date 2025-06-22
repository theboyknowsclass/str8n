// Array of Material Icons supported in the application
// Using 'as const' to make the array readonly and enable literal type inference
const materialIconNameArray = [
  'file-download',
  'arrow-back',
  'arrow-forward',
  'done',
  'share',
  'light-mode',
  'dark-mode',
  'settings',
  'home',
  'close',
  'zoom-in',
  'zoom-out',
  'photo-library',
] as const;

// Set for O(1) lookup performance when checking if a string is a valid Material Icon
export const MaterialIconNames = new Set(materialIconNameArray);

// Type that represents all possible Material Icon names
// Uses indexed access type to get union of all array elements
export type MaterialIconType = (typeof materialIconNameArray)[number];

// Type guard function to check if a string is a valid Material Icon
// Returns true if the name exists in the MaterialIconNames set
export const isMaterialIcon = (name: string): name is MaterialIconType => {
  return MaterialIconNames.has(name as MaterialIconType);
};
