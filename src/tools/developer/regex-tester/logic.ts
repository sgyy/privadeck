export interface RegexMatch {
  match: string;
  index: number;
  groups?: Record<string, string>;
}

export function testRegex(
  pattern: string,
  flags: string,
  text: string
): { matches: RegexMatch[]; error: string | null } {
  if (!pattern) return { matches: [], error: null };

  try {
    const regex = new RegExp(pattern, flags);
    const matches: RegexMatch[] = [];

    if (flags.includes("g")) {
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.groups ? { ...match.groups } : undefined,
        });
        if (!match[0]) regex.lastIndex++; // Prevent infinite loop on zero-width matches
      }
    } else {
      const match = regex.exec(text);
      if (match) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.groups ? { ...match.groups } : undefined,
        });
      }
    }

    return { matches, error: null };
  } catch (e) {
    return {
      matches: [],
      error: e instanceof Error ? e.message : "Invalid regex",
    };
  }
}

export function highlightMatches(
  pattern: string,
  flags: string,
  text: string
): string {
  if (!pattern || !text) return escapeHtml(text);

  try {
    const regex = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
    let result = "";
    let lastIndex = 0;

    let match;
    while ((match = regex.exec(text)) !== null) {
      result += escapeHtml(text.slice(lastIndex, match.index));
      result += `<mark class="bg-yellow-200 dark:bg-yellow-800">${escapeHtml(match[0])}</mark>`;
      lastIndex = match.index + match[0].length;
      if (!match[0]) {
        result += escapeHtml(text[regex.lastIndex - 1] || "");
        lastIndex = regex.lastIndex;
      }
    }
    result += escapeHtml(text.slice(lastIndex));
    return result;
  } catch {
    return escapeHtml(text);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
