// ** Pages **
// These are the pages that are available in the app.
// They are used to navigate to the different pages.
// They are also used to store the state of the app.

// Array of non-modal page names supported in the application
// Using 'as const' to make the array readonly and enable literal type inference
const nonModalPageNameArray = ['import', 'edit', 'export'] as const;

// Array of modal page names supported in the application
// Using 'as const' to make the array readonly and enable literal type inference
const modalPageNameArray = [
  'transform',
  'instructions',
  'settings',
  'about',
] as const;

// Set for O(1) lookup performance when checking if a string is a valid non-modal page name
export const NonModalPageNames = new Set(nonModalPageNameArray);

// Set for O(1) lookup performance when checking if a string is a valid modal page name
export const ModalPageNames = new Set(modalPageNameArray);

// Type that represents all possible non-modal page names
// Uses indexed access type to get union of all array elements
export type NonModalPage = (typeof nonModalPageNameArray)[number];

// Type that represents all possible modal page names
// Uses indexed access type to get union of all array elements
export type ModalPage = (typeof modalPageNameArray)[number];

// Type that represents all possible page names (union of non-modal and modal pages)
export type Page = NonModalPage | ModalPage;

// Type guard function to check if a string is a valid non-modal page name
// Returns true if the name exists in the NonModalPageNames set
export const isNonModalPage = (name: string): name is NonModalPage => {
  return NonModalPageNames.has(name as NonModalPage);
};

// Type guard function to check if a string is a valid modal page name
// Returns true if the name exists in the ModalPageNames set
export const isModalPage = (name: string): name is ModalPage => {
  return ModalPageNames.has(name as ModalPage);
};

// Type guard function to check if a string is a valid page name
// Returns true if the name exists in either the NonModalPageNames or ModalPageNames set
export const isPage = (name: string): name is Page => {
  return isNonModalPage(name) || isModalPage(name);
};
