/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// ─── Event parameter interfaces ───

interface FileUploadParams {
  tool_slug: string;
  tool_category: string;
  file_type: string;
  file_count: number;
}

interface FileDownloadParams {
  tool_slug: string;
  tool_category: string;
  file_type: string;
}

interface CopyClickParams {
  tool_slug: string;
  tool_category: string;
}

interface SearchQueryParams {
  query: string;
  result_count: number;
}

interface SearchSelectParams {
  tool_slug: string;
  tool_category: string;
  query: string;
  position: number;
}

interface RelatedToolClickParams {
  from_slug: string;
  to_slug: string;
  to_category: string;
}

interface FaqExpandParams {
  tool_slug: string;
  tool_category: string;
  question_index: number;
}

interface ThemeChangeParams {
  theme: string;
}

interface LanguageChangeParams {
  from_locale: string;
  to_locale: string;
}

interface ShareClickParams {
  method: string;
}

interface ProcessCompleteParams {
  tool_slug: string;
  tool_category: string;
  duration_ms: number;
}

interface ProcessErrorParams {
  tool_slug: string;
  tool_category: string;
  error_message: string;
}

// ─── Event map ───

interface EventParams {
  file_upload: FileUploadParams;
  file_download: FileDownloadParams;
  copy_click: CopyClickParams;
  search_open: Record<string, never>;
  search_query: SearchQueryParams;
  search_select: SearchSelectParams;
  related_tool_click: RelatedToolClickParams;
  faq_expand: FaqExpandParams;
  theme_change: ThemeChangeParams;
  language_change: LanguageChangeParams;
  share_click: ShareClickParams;
  process_complete: ProcessCompleteParams;
  process_error: ProcessErrorParams;
}

export type AnalyticsEvent = keyof EventParams;

// ─── Privacy: truncate long strings ───

function truncate(str: string, max = 100): string {
  return str.length > max ? str.slice(0, max) : str;
}

// ─── Core tracking function ───

export function trackEvent<E extends AnalyticsEvent>(
  event: E,
  ...args: EventParams[E] extends Record<string, never> ? [] : [EventParams[E]]
): void {
  if (typeof window === "undefined" || !window.gtag) return;

  const params = args[0] as Record<string, unknown> | undefined;

  // Privacy: truncate sensitive fields, never record file names
  if (params) {
    if ("error_message" in params && typeof params.error_message === "string") {
      params.error_message = truncate(params.error_message);
    }
    if ("query" in params && typeof params.query === "string") {
      params.query = truncate(params.query);
    }
  }

  window.gtag("event", event, params ?? {});
}

// ─── Tool page convenience factory ───

export function createToolTracker(slug: string, category: string) {
  return {
    trackProcessComplete(duration_ms: number) {
      trackEvent("process_complete", { tool_slug: slug, tool_category: category, duration_ms });
    },
    trackProcessError(error_message: string) {
      trackEvent("process_error", { tool_slug: slug, tool_category: category, error_message });
    },
  };
}
