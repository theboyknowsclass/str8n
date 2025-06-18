export type IconType = MaterialIconType | MaterialCommunityIconType;

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

// Use Sets for fast lookup in type guards
export const MaterialIconNames = new Set(materialIconNameArray);

export type MaterialIconType = (typeof materialIconNameArray)[number];

export const isMaterialIcon = (name: string): name is MaterialIconType => {
  return MaterialIconNames.has(name as MaterialIconType);
};

const materialCommunityIconNameArray = [
  'gesture-tap-hold',
  'gesture-spread',
  'gesture-swipe',
] as const;

export const MaterialCommunityIconNames = new Set(
  materialCommunityIconNameArray
);

export type MaterialCommunityIconType =
  (typeof materialCommunityIconNameArray)[number];

export const isMaterialCommunityIcon = (
  name: string
): name is MaterialCommunityIconType => {
  return MaterialCommunityIconNames.has(name as MaterialCommunityIconType);
};
