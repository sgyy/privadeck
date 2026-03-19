import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "trim",
  category: "audio",
  icon: "Music",
  featured: true,
  component: () => import("./AudioTrim"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.audio.trim.faq.q1",
      answerKey: "tools.audio.trim.faq.a1",
    },
    {
      questionKey: "tools.audio.trim.faq.q2",
      answerKey: "tools.audio.trim.faq.a2",
    },
  ],
  relatedSlugs: ["convert", "extract"],
};

export default definition;
