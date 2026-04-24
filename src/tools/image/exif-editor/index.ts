import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "exif-editor",
  category: "image",
  icon: "ScanText",
  featured: false,
  component: () => import("./ExifEditor"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    { questionKey: "tools.image.exif-editor.faq.q1", answerKey: "tools.image.exif-editor.faq.a1" },
    { questionKey: "tools.image.exif-editor.faq.q2", answerKey: "tools.image.exif-editor.faq.a2" },
    { questionKey: "tools.image.exif-editor.faq.q3", answerKey: "tools.image.exif-editor.faq.a3" },
    { questionKey: "tools.image.exif-editor.faq.q4", answerKey: "tools.image.exif-editor.faq.a4" },
    { questionKey: "tools.image.exif-editor.faq.q5", answerKey: "tools.image.exif-editor.faq.a5" },
  ],
  relatedSlugs: ["remove-exif", "format-converter", "compress"],
};

export default definition;
