function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function markdownToHtml(md: string): string {
  let html = md;

  // Code blocks (``` ... ```) — escape HTML inside
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_, lang, code) => `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`
  );
  // Inline code — escape HTML inside
  html = html.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);
  // Headings
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");
  // Bold and italic
  html = html.replace(
    /\*\*\*(.+?)\*\*\*/g,
    "<strong><em>$1</em></strong>"
  );
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Images (must come before links to avoid ![alt](url) being matched as link)
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_, alt, url) => {
      if (/^\s*(javascript|data):/i.test(url)) return escapeHtml(`![${alt}](${url})`);
      return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" />`;
    }
  );
  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, text, url) => {
      if (/^\s*(javascript|data):/i.test(url)) return escapeHtml(`[${text}](${url})`);
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${text}</a>`;
    }
  );
  // Ordered lists (must come before unordered to avoid <li> overlap)
  html = html.replace(/^\d+\.\s+(.+)$/gm, "<oli>$1</oli>");
  html = html.replace(/(<oli>.*<\/oli>\n?)+/g, (m) =>
    "<ol>" + m.replace(/<\/?oli>/g, (t) => t.replace("oli", "li")) + "</ol>"
  );
  // Unordered lists
  html = html.replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");
  // Horizontal rule
  html = html.replace(/^---$/gm, "<hr />");
  // Blockquote
  html = html.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");
  // Paragraphs (remaining lines not wrapped in tags)
  html = html.replace(
    /^(?!<[a-z])((?!<\/)[^\n]+)$/gm,
    "<p>$1</p>"
  );

  // Sanitize dangerous tags (script, iframe, object, embed, event handlers)
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<script\b[^>]*>/gi, "");
  html = html.replace(/<(iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  html = html.replace(/<(iframe|object|embed|form)\b[^>]*\/?>/gi, "");
  html = html.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  return html;
}
