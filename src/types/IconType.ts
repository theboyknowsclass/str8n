import { MaterialIconType } from './MaterialIconType';
import { MaterialCommunityIconType } from './MaterialCommunityIconType';
import { SvgIconType } from './SvgIconType';

// Union type that represents all possible icon types in the application
export type IconType =
  | MaterialIconType
  | MaterialCommunityIconType
  | SvgIconType;

// Re-export all icon types and utilities for convenience
export * from './MaterialIconType';
export * from './MaterialCommunityIconType';
export * from './SvgIconType';
