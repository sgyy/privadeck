import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "to-webp",
  category: "video",
  icon: "Video",
  featured: false,
  component: () => import("./VideoToWebp"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.video.to-webp.faq.q1",
      answerKey: "tools.video.to-webp.faq.a1",
    },
    {
      questionKey: "tools.video.to-webp.faq.q2",
      answerKey: "tools.video.to-webp.faq.a2",
    },
  ],
  relatedSlugs: ["to-gif", "trim", "mute"],
};

export default definition;
