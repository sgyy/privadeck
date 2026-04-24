declare module "piexifjs" {
  type IfdTable = Record<number, unknown>;
  interface ExifObject {
    "0th"?: IfdTable;
    Exif?: IfdTable;
    GPS?: IfdTable;
    Interop?: IfdTable;
    "1st"?: IfdTable;
    thumbnail?: string | null;
  }

  export function load(jpegData: string): ExifObject;
  export function dump(exifObj: ExifObject): string;
  export function insert(exifStr: string, jpegData: string): string;
  export function remove(jpegData: string): string;

  export const ImageIFD: Record<string, number>;
  export const ExifIFD: Record<string, number>;
  export const GPSIFD: Record<string, number>;
  export const InteropIFD: Record<string, number>;

  export const TagValues: {
    ImageIFD: Record<string, number>;
    ExifIFD: Record<string, number>;
    GPSIFD: Record<string, number>;
  };

  export const GPSHelper: {
    degToDmsRational(deg: number): [[number, number], [number, number], [number, number]];
    dmsRationalToDeg(
      dmsArray: [[number, number], [number, number], [number, number]],
      ref: string,
    ): number;
  };

  const piexif: {
    load: typeof load;
    dump: typeof dump;
    insert: typeof insert;
    remove: typeof remove;
    ImageIFD: typeof ImageIFD;
    ExifIFD: typeof ExifIFD;
    GPSIFD: typeof GPSIFD;
    InteropIFD: typeof InteropIFD;
    TagValues: typeof TagValues;
    GPSHelper: typeof GPSHelper;
  };

  export default piexif;
}
