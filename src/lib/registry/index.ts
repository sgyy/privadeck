import type { ToolDefinition, ToolCategory } from "./types";

// Tool definitions are registered here - import only metadata, not components
import wordCounter from "@/tools/text/word-counter";
import caseConverter from "@/tools/text/case-converter";
import loremIpsum from "@/tools/text/lorem-ipsum";
import jsonFormatter from "@/tools/developer/json-formatter";
import base64 from "@/tools/developer/base64";
import urlEncoder from "@/tools/developer/url-encoder";
import formatConverter from "@/tools/image/format-converter";
import pdfMerge from "@/tools/pdf/merge";
import pdfSplit from "@/tools/pdf/split";
import pdfDeletePages from "@/tools/pdf/delete-pages";
import pdfToImage from "@/tools/pdf/to-image";
import imageCompress from "@/tools/image/compress";
import imageCrop from "@/tools/image/crop";
import imageResize from "@/tools/image/resize";
import imageWatermark from "@/tools/image/watermark";
import imageRemoveExif from "@/tools/image/remove-exif";
import videoMute from "@/tools/video/mute";
import videoTrim from "@/tools/video/trim";
import videoRotate from "@/tools/video/rotate";
import videoToGif from "@/tools/video/to-gif";
import videoToWebp from "@/tools/video/to-webp";
import videoCompress from "@/tools/video/compress";
import videoFormatConvert from "@/tools/video/format-convert";
import audioTrim from "@/tools/audio/trim";
import audioConvert from "@/tools/audio/convert";
import audioExtract from "@/tools/audio/extract";
import ocr from "@/tools/developer/ocr";
import archive from "@/tools/developer/archive";
import csvJson from "@/tools/developer/csv-json";
import hashGenerator from "@/tools/developer/hash-generator";
import colorConverter from "@/tools/developer/color-converter";
import imageFlip from "@/tools/image/flip";
import imageGrayscale from "@/tools/image/grayscale";
import imagePixelate from "@/tools/image/pixelate";
import imageAddBorder from "@/tools/image/add-border";
import imageCircleCrop from "@/tools/image/circle-crop";
import imageSvgToPng from "@/tools/image/svg-to-png";
import pdfImagesToPdf from "@/tools/pdf/images-to-pdf";
import pdfRotate from "@/tools/pdf/rotate";
import pdfAddPageNumbers from "@/tools/pdf/add-page-numbers";
import pdfExtractText from "@/tools/pdf/extract-text";
import pdfRearrange from "@/tools/pdf/rearrange";
import pdfCompress from "@/tools/pdf/compress";
import pdfAddWatermark from "@/tools/pdf/add-watermark";
import pdfCrop from "@/tools/pdf/crop";
import pdfEsign from "@/tools/pdf/esign";
import pdfExtractImages from "@/tools/pdf/extract-images";
import imageAddText from "@/tools/image/add-text";
import imageCombine from "@/tools/image/combine";
import imageSplit from "@/tools/image/split";
import videoResize from "@/tools/video/resize";
import jsonXml from "@/tools/developer/json-xml";
import markdownPreview from "@/tools/developer/markdown-preview";
import regexTester from "@/tools/developer/regex-tester";
import timestamp from "@/tools/developer/timestamp";
import yamlJson from "@/tools/developer/yaml-json";
import textDiff from "@/tools/developer/text-diff";
import imageHeicConvert from "@/tools/image/heic-convert";
import imageCollage from "@/tools/image/collage";

const ALL_TOOLS: ToolDefinition[] = [
  wordCounter,
  caseConverter,
  loremIpsum,
  jsonFormatter,
  base64,
  urlEncoder,
  ocr,
  archive,
  csvJson,
  hashGenerator,
  colorConverter,
  jsonXml,
  markdownPreview,
  regexTester,
  timestamp,
  yamlJson,
  textDiff,
  formatConverter,
  imageCompress,
  imageCrop,
  imageResize,
  imageWatermark,
  imageRemoveExif,
  imageFlip,
  imageGrayscale,
  imagePixelate,
  imageAddBorder,
  imageCircleCrop,
  imageSvgToPng,
  imageAddText,
  imageCombine,
  imageSplit,
  imageHeicConvert,
  imageCollage,
  pdfMerge,
  pdfSplit,
  pdfDeletePages,
  pdfToImage,
  pdfImagesToPdf,
  pdfRotate,
  pdfAddPageNumbers,
  pdfExtractText,
  pdfRearrange,
  pdfCompress,
  pdfAddWatermark,
  pdfCrop,
  pdfEsign,
  pdfExtractImages,
  videoMute,
  videoTrim,
  videoRotate,
  videoToGif,
  videoToWebp,
  videoCompress,
  videoFormatConvert,
  videoResize,
  audioTrim,
  audioConvert,
  audioExtract,
];

export function getAllTools(): ToolDefinition[] {
  return ALL_TOOLS;
}

export function getToolBySlug(
  slug: string,
  category?: ToolCategory,
): ToolDefinition | undefined {
  if (category) {
    return ALL_TOOLS.find((t) => t.slug === slug && t.category === category);
  }
  return ALL_TOOLS.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return ALL_TOOLS.filter((t) => t.category === category);
}

export function getAllSlugs() {
  return ALL_TOOLS.map((t) => ({ category: t.category, slug: t.slug }));
}

export function getFeaturedTools(category: ToolCategory): ToolDefinition[] {
  return ALL_TOOLS.filter((t) => t.category === category && t.featured);
}

export function getNonFeaturedTools(category: ToolCategory): ToolDefinition[] {
  return ALL_TOOLS.filter((t) => t.category === category && !t.featured);
}
