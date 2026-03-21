import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "remove-exif",
  category: "image",
  icon: "Image",
  featured: false,
  component: () => import("./RemoveExif"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.image.remove-exif.faq.q1",
      answerKey: "tools.image.remove-exif.faq.a1",
    },
    {
      questionKey: "tools.image.remove-exif.faq.q2",
      answerKey: "tools.image.remove-exif.faq.a2",
    },
  
    {
      questionKey: "tools.image.remove-exif.faq.q3",
      answerKey: "tools.image.remove-exif.faq.a3",
    },
    {
      questionKey: "tools.image.remove-exif.faq.q4",
      answerKey: "tools.image.remove-exif.faq.a4",
    },
    {
      questionKey: "tools.image.remove-exif.faq.q5",
      answerKey: "tools.image.remove-exif.faq.a5",
    },
  ],
  relatedSlugs: ["compress", "format-converter"],
};

export default definition;
