import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "json-editor",
  category: "developer",
  icon: "FilePenLine",
  featured: true,
  component: () => import("./JsonEditor"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    { questionKey: "tools.developer.json-editor.faq.q1", answerKey: "tools.developer.json-editor.faq.a1" },
    { questionKey: "tools.developer.json-editor.faq.q2", answerKey: "tools.developer.json-editor.faq.a2" },
    { questionKey: "tools.developer.json-editor.faq.q3", answerKey: "tools.developer.json-editor.faq.a3" },
    { questionKey: "tools.developer.json-editor.faq.q4", answerKey: "tools.developer.json-editor.faq.a4" },
    { questionKey: "tools.developer.json-editor.faq.q5", answerKey: "tools.developer.json-editor.faq.a5" },
  ],
  relatedSlugs: ["json-formatter", "yaml-json", "json-xml"],
};

export default definition;
