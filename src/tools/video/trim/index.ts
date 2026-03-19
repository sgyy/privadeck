import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "trim",
  category: "video",
  icon: "Video",
  featured: true,
  component: () => import("./VideoTrim"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.video.trim.faq.q1",
      answerKey: "tools.video.trim.faq.a1",
    },
    {
      questionKey: "tools.video.trim.faq.q2",
      answerKey: "tools.video.trim.faq.a2",
    },
  ],
  relatedSlugs: ["mute", "rotate", "to-gif"],
};

export default definition;
