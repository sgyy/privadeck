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
  
    {
      questionKey: "tools.developer.json-xml.faq.q3",
      answerKey: "tools.developer.json-xml.faq.a3",
    },
    {
      questionKey: "tools.developer.json-xml.faq.q4",
      answerKey: "tools.developer.json-xml.faq.a4",
    },
    {
      questionKey: "tools.developer.json-xml.faq.q5",
      answerKey: "tools.developer.json-xml.faq.a5",
    },
  ],
  relatedSlugs: ["json-formatter", "csv-json", "base64"],
};

export default definition;
