import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "resize",
  category: "video",
  icon: "Scaling",
  featured: false,
  component: () => import("./VideoResize"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.video.resize.faq.q1",
      answerKey: "tools.video.resize.faq.a1",
    },
    {
      questionKey: "tools.video.resize.faq.q2",
      answerKey: "tools.video.resize.faq.a2",
    },
  ],
  relatedSlugs: ["compress", "trim", "format-convert"],
};

export default definition;
