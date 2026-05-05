import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "markdown-preview",
  category: "developer",
  icon: "BookOpen",
  featured: false,
  component: () => import("./MarkdownPreview"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.markdown-preview.faq.q1",
      answerKey: "tools.developer.markdown-preview.faq.a1",
    },
    {
      questionKey: "tools.developer.markdown-preview.faq.q2",
      answerKey: "tools.developer.markdown-preview.faq.a2",
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
      questionKey: "tools.developer.markdown-preview.faq.q5",
      answerKey: "tools.developer.markdown-preview.faq.a5",
    },
  ],
  relatedSlugs: ["json-formatter", "csv-json", "base64"],
};

export default definition;
