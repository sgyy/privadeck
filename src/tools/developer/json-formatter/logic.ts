export interface JsonResult {
  output: string;
  valid: boolean;
  error?: string;
  parsed?: unknown;
}

export function formatJson(input: string, indent: number | string = 2): JsonResult {
  try {
    const parsed = JSON.parse(input);
    return { output: JSON.stringify(parsed, null, indent), valid: true, parsed };
  } catch (e) {
    return { output: input, valid: false, error: (e as Error).message };
  }
}

export function minifyJson(input: string): JsonResult {
  try {
    const parsed = JSON.parse(input);
    return { output: JSON.stringify(parsed), valid: true, parsed };
  } catch (e) {
    return { output: input, valid: false, error: (e as Error).message };
  }
}

export function validateJson(input: string): JsonResult {
  try {
    const parsed = JSON.parse(input);
    return { output: input, valid: true, parsed };
  } catch (e) {
    return { output: input, valid: false, error: (e as Error).message };
  }
}

/**
 * Evaluate a simple JSON path expression like `.address.city` or `.hobbies[0]`
 * Supports: dot notation, bracket notation for arrays
 */
export function evaluateJsonPath(data: unknown, path: string): unknown {
  if (!path || path === "$" || path === ".") return data;

  // Normalize: remove leading "$." or "$"
  let normalized = path.startsWith("$.") ? path.slice(2) : path.startsWith("$") ? path.slice(1) : path;
  // Remove leading dot
  if (normalized.startsWith(".")) normalized = normalized.slice(1);
  if (!normalized) return data;

  const segments = normalized.match(/([^.[]+)|\[(\d+)\]/g);
  if (!segments) return undefined;

  let current: unknown = data;
  for (const seg of segments) {
    if (current == null) return undefined;
    if (seg.startsWith("[") && seg.endsWith("]")) {
      const index = parseInt(seg.slice(1, -1), 10);
      if (Array.isArray(current)) {
        current = current[index];
      } else {
        return undefined;
      }
    } else {
      if (typeof current === "object" && current !== null) {
        current = (current as Record<string, unknown>)[seg];
      } else {
        return undefined;
      }
    }
  }
  return current;
}

// ---- Syntax highlighting tokenizer ----

export type TokenType = "key" | "string" | "number" | "boolean" | "null" | "punctuation";

export interface Token {
  type: TokenType;
  value: string;
}

/**
 * Tokenize a formatted JSON string into typed tokens for syntax highlighting.
 */
export function tokenizeJson(json: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = json.length;

  while (i < len) {
    const ch = json[i];

    // Whitespace — skip (will be preserved as-is in rendering by splitting lines)
    if (ch === " " || ch === "\n" || ch === "\r" || ch === "\t") {
      let ws = "";
      while (i < len && (json[i] === " " || json[i] === "\n" || json[i] === "\r" || json[i] === "\t")) {
        ws += json[i];
        i++;
      }
      tokens.push({ type: "punctuation", value: ws });
      continue;
    }

    // Punctuation
    if (ch === "{" || ch === "}" || ch === "[" || ch === "]" || ch === "," || ch === ":") {
      tokens.push({ type: "punctuation", value: ch });
      i++;
      continue;
    }

    // String (key or value)
    if (ch === '"') {
      let str = '"';
      i++;
      while (i < len) {
        if (json[i] === "\\") {
          str += json[i] + (json[i + 1] || "");
          i += 2;
        } else if (json[i] === '"') {
          str += '"';
          i++;
          break;
        } else {
          str += json[i];
          i++;
        }
      }
      // Determine if this is a key or value by looking ahead for ':'
      let j = i;
      while (j < len && (json[j] === " " || json[j] === "\t")) j++;
      const isKey = json[j] === ":";
      tokens.push({ type: isKey ? "key" : "string", value: str });
      continue;
    }

    // Number
    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      let num = "";
      while (i < len && /[\d.eE+\-]/.test(json[i])) {
        num += json[i];
        i++;
      }
      tokens.push({ type: "number", value: num });
      continue;
    }

    // true/false/null
    if (json.startsWith("true", i)) {
      tokens.push({ type: "boolean", value: "true" });
      i += 4;
      continue;
    }
    if (json.startsWith("false", i)) {
      tokens.push({ type: "boolean", value: "false" });
      i += 5;
      continue;
    }
    if (json.startsWith("null", i)) {
      tokens.push({ type: "null", value: "null" });
      i += 4;
      continue;
    }

    // Fallback
    tokens.push({ type: "punctuation", value: ch });
    i++;
  }

  return tokens;
}
