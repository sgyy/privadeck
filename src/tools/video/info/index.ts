import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "info",
  category: "video",
  icon: "FileVideo",
  featured: false,
  component: () => import("./VideoInfo"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    { questionKey: "tools.video.info.faq.q1", answerKey: "tools.video.info.faq.a1" },
    { questionKey: "tools.video.info.faq.q2", answerKey: "tools.video.info.faq.a2" },
    { questionKey: "tools.video.info.faq.q3", answerKey: "tools.video.info.faq.a3" },
    { questionKey: "tools.video.info.faq.q4", answerKey: "tools.video.info.faq.a4" },
    { questionKey: "tools.video.info.faq.q5", answerKey: "tools.video.info.faq.a5" },
  ],
  relatedSlugs: ["compress", "format-convert", "trim"],
};

export default definition;
