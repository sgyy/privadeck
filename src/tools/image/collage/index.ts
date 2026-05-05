import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "collage",
  category: "image",
  icon: "LayoutGrid",
  featured: false,
  component: () => import("./Collage"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.image.collage.faq.q1",
      answerKey: "tools.image.collage.faq.a1",
    },
    {
      questionKey: "tools.image.collage.faq.q2",
      answerKey: "tools.image.collage.faq.a2",
    },
  
    {
      questionKey: "common.sharedFaq.q3",
      answerKey: "common.sharedFaq.a3",
    },
    {
      questionKey: "common.sharedFaq.q4",
      answerKey: "common.sharedFaq.a4",
    },
    {
      questionKey: "tools.image.collage.faq.q5",
      answerKey: "tools.image.collage.faq.a5",
    },
  ],
  relatedSlugs: ["combine", "crop", "resize"],
};

export default definition;
