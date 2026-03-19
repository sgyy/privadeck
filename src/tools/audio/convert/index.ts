import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "convert",
  category: "audio",
  icon: "Music",
  featured: true,
  component: () => import("./AudioConvert"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.audio.convert.faq.q1",
      answerKey: "tools.audio.convert.faq.a1",
    },
    {
      questionKey: "tools.audio.convert.faq.q2",
      answerKey: "tools.audio.convert.faq.a2",
    },
  ],
  relatedSlugs: ["trim", "extract"],
};

export default definition;
