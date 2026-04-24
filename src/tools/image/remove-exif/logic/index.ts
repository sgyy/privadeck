import {
  ALL_CATEGORIES,
  isAllSelected,
  isNoneSelected,
  type RemoveExifOptions,
} from "./options";
import { outputFilenameFor, stripAll, type ExifResult } from "./stripAll";

export type { ExifResult } from "./stripAll";
export type { RemoveExifOptions, RemoveExifCategory } from "./options";
export {
  ALL_CATEGORIES,
  NONE_CATEGORIES,
  isAllSelected,
  isNoneSelected,
} from "./options";

export async function removeExif(
  file: File,
  options: RemoveExifOptions = ALL_CATEGORIES,
): Promise<ExifResult> {
  if (isNoneSelected(options)) {
    return {
      original: file,
      cleaned: file,
      outputFilename: outputFilenameFor(file),
    };
  }

  if (isAllSelected(options)) {
    return stripAll(file);
  }

  if (file.type === "image/avif" || file.type === "image/heic") {
    return stripAll(file);
  }

  switch (file.type) {
    case "image/jpeg": {
      const { selectiveJpeg } = await import("./selectiveJpeg");
      return selectiveJpeg(file, options);
    }
    case "image/png": {
      const { selectivePng } = await import("./selectivePng");
      return selectivePng(file, options);
    }
    case "image/webp": {
      const { selectiveWebp } = await import("./selectiveWebp");
      return selectiveWebp(file, options);
    }
    default:
      return stripAll(file);
  }
}
