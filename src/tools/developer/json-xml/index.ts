import type { ToolDefinition } from "@/lib/registry/types";

const definition: ToolDefinition = {
  slug: "json-xml",
  category: "developer",
  icon: "FileCode",
  featured: false,
  component: () => import("./JsonXmlTool"),
  seo: { structuredDataType: "WebApplication" },
  faq: [
    {
      questionKey: "tools.developer.json-xml.faq.q1",
      answerKey: "tools.developer.json-xml.faq.a1",
    },
    {
      questionKey: "tools.developer.json-xml.faq.q2",
      answerKey: "tools.developer.json-xml.faq.a2",
    },
  ],
  relatedSlugs: ["json-formatter", "csv-json", "base64"],
};

export default definition;
