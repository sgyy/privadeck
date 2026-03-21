import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "volume",
  category: "audio",
  icon: "Volume2",
  featured: true,
  component: () => import("./AudioVolume"),
  seo: {
    structuredDataType: "WebApplication",
  },
  faq: [
    { questionKey: "faq.q1", answerKey: "faq.a1" },
    { questionKey: "faq.q2", answerKey: "faq.a2" },
    { questionKey: "faq.q3", answerKey: "faq.a3" },
    { questionKey: "faq.q4", answerKey: "faq.a4" },
    { questionKey: "faq.q5", answerKey: "faq.a5" },
  ],
  relatedSlugs: ["trim", "convert", "extract"],
};

export default definition;
