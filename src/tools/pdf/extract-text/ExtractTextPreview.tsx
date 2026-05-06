"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  Code2,
  FileText,
} from "lucide-react";
import { CopyButton } from "@/components/shared/CopyButton";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { markdownToHtml } from "@/tools/developer/markdown-preview/logic";
import type { ExtractResult, OutputFormat } from "./logic";

interface Props {
  result: ExtractResult;
  format: OutputFormat;
  output: string;
  downloadFilename: string;
  downloadBlob: Blob;
}

const PROSE_STYLES =
  "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-5 [&_h1]:mb-3 " +
  "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 " +
  "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 " +
  "[&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-2 " +
  "[&_p]:my-2 [&_p]:leading-relaxed " +
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 " +
  "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 " +
  "[&_li]:my-1 [&_li]:leading-relaxed " +
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 " +
  "[&_strong]:font-semibold [&_strong]:text-foreground " +
  "[&_em]:italic " +
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.875em] " +
  "[&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:my-3 " +
  "[&_pre>code]:bg-transparent [&_pre>code]:p-0 " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-3 " +
  "[&_hr]:my-4 [&_hr]:border-border";

export function ExtractTextPreview({
  result,
  format,
  output,
  downloadFilename,
  downloadBlob,
}: Props) {
  const t = useTranslations("tools.pdf.extract-text");
  const tc = useTranslations("common");
  const [search, setSearch] = useState("");
  const [activeMatch, setActiveMatch] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewRaw, setViewRaw] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = previewRef.current;
    if (!root) return;
    const count = applyHighlights(root, search, activeMatch);
    setMatchCount(count);
    if (search && count > 0) {
      const active = root.querySelector(
        "mark.search-match-active",
      ) as HTMLElement | null;
      active?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [search, activeMatch, output, viewRaw, format, isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsFullscreen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  function jumpMatch(delta: number) {
    if (matchCount === 0) return;
    setActiveMatch(
      (prev) => (((prev + delta) % matchCount) + matchCount) % matchCount,
    );
  }

  function jumpToPage(pageNum: number) {
    const target = previewRef.current?.querySelector(
      `[data-page="${pageNum}"]`,
    );
    target?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  const isJson = format === "json";
  const showPageJump = result.pages.length > 5 && !isJson;
  const useRawView = viewRaw || isJson;

  const wrapperClass = isFullscreen
    ? "fixed inset-0 z-50 flex flex-col gap-2 bg-background p-4 sm:p-6"
    : "space-y-2";

  return (
    <div className={wrapperClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {t("extractedText")}
          <span className="ml-2 text-xs text-muted-foreground">
            {t("pagesCount", { count: result.pages.length })}
          </span>
        </span>
        <div className="flex items-center gap-1.5">
          {!isJson && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewRaw((v) => !v)}
              title={viewRaw ? t("viewRendered") : t("viewRaw")}
              aria-label={viewRaw ? t("viewRendered") : t("viewRaw")}
            >
              {viewRaw ? (
                <FileText className="h-4 w-4" />
              ) : (
                <Code2 className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen((f) => !f)}
            title={isFullscreen ? tc("exitFullscreen") : tc("fullscreen")}
            aria-label={isFullscreen ? tc("exitFullscreen") : tc("fullscreen")}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <CopyButton text={output} />
          <DownloadButton data={downloadBlob} filename={downloadFilename} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-2 py-1.5">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setActiveMatch(0);
          }}
          placeholder={t("searchPlaceholder")}
          className="h-8 flex-1 min-w-[160px] rounded border-none bg-transparent px-2 text-sm focus:outline-none"
        />
        {search && (
          <>
            <span className="text-xs text-muted-foreground">
              {matchCount === 0
                ? tc("noMatches")
                : t("matchCount", {
                    current: activeMatch + 1,
                    total: matchCount,
                  })}
            </span>
            <button
              type="button"
              onClick={() => jumpMatch(-1)}
              disabled={matchCount === 0}
              aria-label={t("prevMatch")}
              className="rounded p-1 hover:bg-muted disabled:opacity-40"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => jumpMatch(1)}
              disabled={matchCount === 0}
              aria-label={t("nextMatch")}
              className="rounded p-1 hover:bg-muted disabled:opacity-40"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </>
        )}
        {showPageJump && (
          <Select
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) jumpToPage(parseInt(v, 10));
              e.target.value = "";
            }}
            className="h-8 text-xs"
          >
            <option value="">{t("jumpToPage")}</option>
            {result.pages
              .filter((p) => p.text.trim())
              .map((p) => (
                <option key={p.page} value={p.page}>
                  {`Page ${p.page}`}
                </option>
              ))}
          </Select>
        )}
      </div>

      <div
        ref={previewRef}
        className={cn(
          "overflow-auto rounded-lg border border-border bg-card",
          isFullscreen ? "flex-1" : "h-[640px]",
        )}
      >
        {useRawView ? (
          isJson ? (
            <pre className="whitespace-pre-wrap break-words p-4 font-mono text-sm leading-relaxed">
              <code
                dangerouslySetInnerHTML={{ __html: highlightJson(output) }}
              />
            </pre>
          ) : (
            <pre className="whitespace-pre-wrap break-words p-4 font-mono text-sm leading-relaxed">
              {output}
            </pre>
          )
        ) : format === "markdown" ? (
          <div className="mx-auto max-w-3xl p-6">
            {result.pages
              .filter((p) => p.text.trim())
              .map((p) => (
                <section
                  key={p.page}
                  data-page={p.page}
                  className="scroll-mt-4 border-b border-border/40 pb-6 mb-6 last:border-b-0 last:mb-0 last:pb-0"
                >
                  <PageBadge page={p.page} />
                  <div
                    className={PROSE_STYLES}
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(p.text) }}
                  />
                </section>
              ))}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl p-6 leading-relaxed text-[15px]">
            {result.pages
              .filter((p) => p.text.trim())
              .map((p) => (
                <section
                  key={p.page}
                  data-page={p.page}
                  className="scroll-mt-4 border-b border-border/40 pb-6 mb-6 last:border-b-0 last:mb-0 last:pb-0"
                >
                  <PageBadge page={p.page} />
                  {p.text
                    .split(/\n{2,}/)
                    .filter((para) => para.trim())
                    .map((para, i) => (
                      <p key={i} className="mb-3 whitespace-pre-line">
                        {para}
                      </p>
                    ))}
                </section>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PageBadge({ page }: { page: number }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
        Page {page}
      </span>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  );
}

function highlightJson(json: string): string {
  const escaped = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(
      /"((?:[^"\\]|\\.)*)"(\s*:)/g,
      '<span class="text-blue-700 dark:text-cyan-400">"$1"</span>$2',
    )
    .replace(
      /(:\s*)"((?:[^"\\]|\\.)*)"/g,
      '$1<span class="text-emerald-700 dark:text-emerald-400">"$2"</span>',
    )
    .replace(
      /\b(true|false|null)\b/g,
      '<span class="text-purple-700 dark:text-purple-400">$1</span>',
    )
    .replace(
      /(:\s*)(-?\d+(?:\.\d+)?)/g,
      '$1<span class="text-orange-700 dark:text-orange-400">$2</span>',
    );
}

function applyHighlights(
  container: HTMLElement,
  query: string,
  activeIdx: number,
): number {
  container.querySelectorAll("mark.search-match").forEach((m) => {
    const parent = m.parentNode;
    if (!parent) return;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
  });
  container.normalize();

  if (!query) return 0;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (/^(SCRIPT|STYLE|MARK)$/.test(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);

  const lowerQuery = query.toLowerCase();
  let matchCount = 0;

  for (const textNode of nodes) {
    const text = textNode.nodeValue ?? "";
    if (!text) continue;
    const lower = text.toLowerCase();
    if (!lower.includes(lowerQuery)) continue;

    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    let i = lower.indexOf(lowerQuery);
    while (i !== -1) {
      if (i > lastIdx) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx, i)));
      }
      const mark = document.createElement("mark");
      const isActive = matchCount === activeIdx;
      mark.className = isActive
        ? "search-match search-match-active rounded px-0.5 bg-amber-300 text-foreground dark:bg-amber-500/70"
        : "search-match rounded px-0.5 bg-yellow-200 text-foreground dark:bg-yellow-500/40";
      mark.textContent = text.slice(i, i + query.length);
      frag.appendChild(mark);
      matchCount++;
      lastIdx = i + query.length;
      i = lower.indexOf(lowerQuery, lastIdx);
    }
    if (lastIdx < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIdx)));
    }
    textNode.parentNode?.replaceChild(frag, textNode);
  }

  return matchCount;
}
