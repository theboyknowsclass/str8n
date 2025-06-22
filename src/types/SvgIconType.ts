// Array of SVG Icons supported in the application
// Using 'as const' to make the array readonly and enable literal type inference
const svgIconNameArray = ['mouse-scroll', 'transform'] as const;

// Set for O(1) lookup performance when checking if a string is a valid SVG Icon
export const SvgIconNames = new Set(svgIconNameArray);

// Type that represents all possible SVG Icon names
// Uses indexed access type to get union of all array elements
export type SvgIconType = (typeof svgIconNameArray)[number];

// Type guard function to check if a string is a valid SVG Icon
// Returns true if the name exists in the SvgIconNames set
export const isSvgIcon = (name: string): name is SvgIconType => {
  return SvgIconNames.has(name as SvgIconType);
};
