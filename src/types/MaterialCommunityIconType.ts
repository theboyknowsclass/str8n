// Array of Material Community Icons supported in the application
// Using 'as const' to make the array readonly and enable literal type inference
const materialCommunityIconNameArray = [
  'gesture-tap-hold',
  'gesture-spread',
  'gesture-swipe',
  'information-variant',
] as const;

// Set for O(1) lookup performance when checking if a string is a valid Material Community Icon
export const MaterialCommunityIconNames = new Set(
  materialCommunityIconNameArray
);

// Type that represents all possible Material Community Icon names
// Uses indexed access type to get union of all array elements
export type MaterialCommunityIconType =
  (typeof materialCommunityIconNameArray)[number];

// Type guard function to check if a string is a valid Material Community Icon
// Returns true if the name exists in the MaterialCommunityIconNames set
export const isMaterialCommunityIcon = (
  name: string
): name is MaterialCommunityIconType => {
  return MaterialCommunityIconNames.has(name as MaterialCommunityIconType);
};
