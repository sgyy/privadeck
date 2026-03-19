export function jsonToXml(json: string): string {
  const data = JSON.parse(json);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + objectToXml("root", data);
}

export function xmlToJson(xml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) throw new Error("Invalid XML: " + errorNode.textContent);
  const result = xmlNodeToObj(doc.documentElement);
  return JSON.stringify(result, null, 2);
}

function objectToXml(
  key: string,
  value: unknown,
  indent: string = ""
): string {
  const tag = sanitizeTagName(key);
  if (value === null || value === undefined) {
    return `${indent}<${tag}/>\n`;
  }
  if (Array.isArray(value)) {
    return value.map((item) => objectToXml(key, item, indent)).join("");
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    // Separate @attributes, #text, and child elements
    const attrs = entries.filter(([k]) => k.startsWith("@"));
    const textEntry = entries.find(([k]) => k === "#text");
    const children = entries.filter(([k]) => !k.startsWith("@") && k !== "#text");

    const attrStr = attrs
      .map(([k, v]) => ` ${sanitizeTagName(k.slice(1))}="${escapeXml(String(v))}"`)
      .join("");

    if (children.length === 0) {
      // Leaf with attributes (and possibly #text)
      const text = textEntry ? escapeXml(String(textEntry[1])) : "";
      if (!text) return `${indent}<${tag}${attrStr}/>\n`;
      return `${indent}<${tag}${attrStr}>${text}</${tag}>\n`;
    }

    const inner = children
      .map(([k, v]) => objectToXml(k, v, indent + "  "))
      .join("");
    // Include #text for mixed content (text alongside child elements)
    const mixedText = textEntry ? escapeXml(String(textEntry[1])) : "";
    return `${indent}<${tag}${attrStr}>\n${mixedText ? indent + "  " + mixedText + "\n" : ""}${inner}${indent}</${tag}>\n`;
  }
  return `${indent}<${tag}>${escapeXml(String(value))}</${tag}>\n`;
}

/** Replace characters invalid in XML tag names with underscores */
function sanitizeTagName(name: string): string {
  // XML tag names must start with a letter or underscore, and contain only
  // letters, digits, hyphens, underscores, or periods.
  let tag = name.replace(/[^a-zA-Z0-9_.\-]/g, "_");
  if (!/^[a-zA-Z_]/.test(tag)) tag = "_" + tag;
  return tag || "_";
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xmlNodeToObj(node: Element): unknown {
  const children = Array.from(node.children);
  const attrs = node.attributes;

  // Leaf node with no children and no attributes: return text
  if (children.length === 0 && attrs.length === 0) {
    return node.textContent || "";
  }

  const obj: Record<string, unknown> = {};

  // Include attributes with @ prefix
  for (let i = 0; i < attrs.length; i++) {
    obj[`@${attrs[i].name}`] = attrs[i].value;
  }

  // If node has no element children but has attributes, include text as #text
  if (children.length === 0) {
    const text = node.textContent || "";
    if (text) obj["#text"] = text;
    return obj;
  }

  for (const child of children) {
    const key = child.tagName;
    const value = xmlNodeToObj(child);
    if (obj[key] !== undefined) {
      if (Array.isArray(obj[key])) {
        (obj[key] as unknown[]).push(value);
      } else {
        obj[key] = [obj[key], value];
      }
    } else {
      obj[key] = value;
    }
  }

  // Preserve text content alongside element children (mixed content)
  const directText = Array.from(node.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent?.trim())
    .filter(Boolean)
    .join(" ");
  if (directText) obj["#text"] = directText;

  return obj;
}
