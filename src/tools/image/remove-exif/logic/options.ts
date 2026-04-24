export interface RemoveExifOptions {
  gps: boolean;
  cameraLens: boolean;
  shooting: boolean;
  dateTime: boolean;
  author: boolean;
  description: boolean;
  thumbnail: boolean;
  xmp: boolean;
}

export type RemoveExifCategory = keyof RemoveExifOptions;

export const ALL_CATEGORIES: RemoveExifOptions = {
  gps: true,
  cameraLens: true,
  shooting: true,
  dateTime: true,
  author: true,
  description: true,
  thumbnail: true,
  xmp: true,
};

export const NONE_CATEGORIES: RemoveExifOptions = {
  gps: false,
  cameraLens: false,
  shooting: false,
  dateTime: false,
  author: false,
  description: false,
  thumbnail: false,
  xmp: false,
};

export function isAllSelected(opts: RemoveExifOptions): boolean {
  return Object.values(opts).every(Boolean);
}

export function isNoneSelected(opts: RemoveExifOptions): boolean {
  return Object.values(opts).every((v) => !v);
}
