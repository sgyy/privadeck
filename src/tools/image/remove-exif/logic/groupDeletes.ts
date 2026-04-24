import piexif from "piexifjs";
import type { RemoveExifOptions } from "./options";

export type IfdTable = Record<number, unknown>;

export interface ExifObject {
  "0th"?: IfdTable;
  Exif?: IfdTable;
  GPS?: IfdTable;
  Interop?: IfdTable;
  "1st"?: IfdTable;
  thumbnail?: string | null;
}

export function createEmptyExif(): ExifObject {
  return {
    "0th": {},
    Exif: {},
    GPS: {},
    Interop: {},
    "1st": {},
    thumbnail: null,
  };
}

function deleteTags(ifd: IfdTable | undefined, tags: number[]): void {
  if (!ifd) return;
  for (const t of tags) delete ifd[t];
}

export function applyGroupDeletes(
  exif: ExifObject,
  opts: RemoveExifOptions,
): void {
  const ImageIFD = piexif.ImageIFD;
  const ExifIFD = piexif.ExifIFD;
  const zero = exif["0th"] ?? (exif["0th"] = {});
  const exifIfd = exif.Exif ?? (exif.Exif = {});

  if (opts.gps) exif.GPS = {};

  if (opts.cameraLens) {
    deleteTags(zero, [ImageIFD.Make, ImageIFD.Model, ImageIFD.Software]);
    deleteTags(exifIfd, [
      ExifIFD.LensMake,
      ExifIFD.LensModel,
      ExifIFD.LensSerialNumber,
      ExifIFD.LensSpecification,
      ExifIFD.BodySerialNumber,
      ExifIFD.CameraOwnerName,
    ]);
  }

  if (opts.shooting) {
    deleteTags(exifIfd, [
      ExifIFD.ISOSpeedRatings,
      ExifIFD.PhotographicSensitivity,
      ExifIFD.FNumber,
      ExifIFD.ExposureTime,
      ExifIFD.ApertureValue,
      ExifIFD.ShutterSpeedValue,
      ExifIFD.FocalLength,
      ExifIFD.FocalLengthIn35mmFilm,
      ExifIFD.Flash,
      ExifIFD.MeteringMode,
      ExifIFD.WhiteBalance,
      ExifIFD.ExposureProgram,
      ExifIFD.ExposureMode,
      ExifIFD.ExposureBiasValue,
      ExifIFD.SceneCaptureType,
      ExifIFD.SceneType,
      ExifIFD.SensingMethod,
      ExifIFD.CustomRendered,
      ExifIFD.DigitalZoomRatio,
    ]);
  }

  if (opts.dateTime) {
    deleteTags(zero, [ImageIFD.DateTime]);
    deleteTags(exifIfd, [
      ExifIFD.DateTimeOriginal,
      ExifIFD.DateTimeDigitized,
      ExifIFD.SubSecTime,
      ExifIFD.SubSecTimeOriginal,
      ExifIFD.SubSecTimeDigitized,
      ExifIFD.OffsetTime,
      ExifIFD.OffsetTimeOriginal,
      ExifIFD.OffsetTimeDigitized,
    ]);
  }

  if (opts.author) {
    deleteTags(zero, [
      ImageIFD.Artist,
      ImageIFD.Copyright,
      ImageIFD.XPAuthor,
    ]);
  }

  if (opts.description) {
    deleteTags(zero, [
      ImageIFD.ImageDescription,
      ImageIFD.XPTitle,
      ImageIFD.XPComment,
      ImageIFD.XPSubject,
      ImageIFD.XPKeywords,
    ]);
    deleteTags(exifIfd, [ExifIFD.UserComment]);
  }

  if (opts.thumbnail) {
    exif.thumbnail = null;
    exif["1st"] = {};
  }
}

export function isExifEffectivelyEmpty(exif: ExifObject): boolean {
  const hasEntries = (ifd: IfdTable | undefined): boolean =>
    !!ifd && Object.keys(ifd).length > 0;
  return (
    !hasEntries(exif["0th"]) &&
    !hasEntries(exif.Exif) &&
    !hasEntries(exif.GPS) &&
    !hasEntries(exif.Interop) &&
    !hasEntries(exif["1st"]) &&
    !exif.thumbnail
  );
}
