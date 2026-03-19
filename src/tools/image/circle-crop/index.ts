import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "circle-crop",
  category: "image",
  icon: "Circle",
  featured: false,
  component: () => import("./CircleCrop"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.image.circle-crop.faq.q1",
      answerKey: "tools.image.circle-crop.faq.a1",
    },
    {
      questionKey: "tools.image.circle-crop.faq.q2",
      answerKey: "tools.image.circle-crop.faq.a2",
    },
  ],
  relatedSlugs: ["crop", "resize", "remove-exif"],
};

export default definition;
