import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "extract",
  category: "audio",
  icon: "Music",
  featured: false,
  component: () => import("./AudioExtract"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.audio.extract.faq.q1",
      answerKey: "tools.audio.extract.faq.a1",
    },
    {
      questionKey: "tools.audio.extract.faq.q2",
      answerKey: "tools.audio.extract.faq.a2",
    },
  ],
  relatedSlugs: ["trim", "convert"],
};

export default definition;
