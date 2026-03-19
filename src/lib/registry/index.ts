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
import audioTrim from "@/tools/audio/trim";
import audioConvert from "@/tools/audio/convert";
import audioExtract from "@/tools/audio/extract";
import ocr from "@/tools/developer/ocr";
import archive from "@/tools/developer/archive";

const ALL_TOOLS: ToolDefinition[] = [
  wordCounter,
  caseConverter,
  loremIpsum,
  jsonFormatter,
  base64,
  urlEncoder,
  ocr,
  archive,
  formatConverter,
  imageCompress,
  imageCrop,
  imageResize,
  imageWatermark,
  imageRemoveExif,
  pdfMerge,
  pdfSplit,
  pdfDeletePages,
  pdfToImage,
  videoMute,
  videoTrim,
  videoRotate,
  videoToGif,
  videoToWebp,
  audioTrim,
  audioConvert,
  audioExtract,
];

export function getAllTools(): ToolDefinition[] {
  return ALL_TOOLS;
}

export function getToolBySlug(slug: string): ToolDefinition | undefined {
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
