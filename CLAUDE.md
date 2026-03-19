# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm dev          # Start dev server (Next.js 16 + Turbopack)
pnpm build        # Static export to out/ directory (SSG)
pnpm lint         # ESLint
```

Build output goes to `out/` (~256 static HTML pages across 21 locales). Deploy to Cloudflare Pages with build command `pnpm build` and output directory `out`.

## Architecture

This is a browser-based media toolbox (like TinyWow/123Apps). All processing happens client-side — no server uploads. Built with Next.js 16 App Router in SSG mode (`output: "export"`).

### Tool Registry System

Central pattern: tools register metadata in `src/lib/registry/index.ts`, which imports definitions from `src/tools/{category}/{slug}/index.ts`. The registry provides `getAllTools()`, `getToolBySlug()`, `getToolsByCategory()`, `getAllSlugs()`.

**Adding a new tool requires exactly 3 steps:**
1. Create `src/tools/{category}/{slug}/` with `index.ts` (ToolDefinition), `{Name}.tsx` (client component), `logic.ts` (pure functions). Set `featured: true` for tools that should appear in the mega menu's featured column.
2. Add import + array entry in `src/lib/registry/index.ts`
3. Add translation keys in all `messages/*.json` files under `tools.{category}.{slug}`

**Adding a new category** requires adding to `src/lib/registry/categories.ts` and `ToolCategory` type in `types.ts`, plus `categories.{key}` translations in all locale files.

### Server/Client Boundary

Tool pages have a critical split at `src/app/[locale]/tools/[category]/[slug]/`:
- `page.tsx` (server) — handles `generateStaticParams`, `generateMetadata`, `setRequestLocale`. Passes only primitive strings (category, slug) to client.
- `ToolPageClient.tsx` (client) — looks up the `ToolDefinition` (which contains the `component` function) and renders via `lazy()` + `<Suspense>`.

**Never pass `ToolDefinition` objects from server to client components** — the `component` field is a function and will cause serialization errors.

### i18n

Uses `next-intl` with 21 locales including regional variants (zh-Hans/zh-Hant, pt-BR/pt-PT). Default is English. No middleware (incompatible with static export) — language detection is client-side in `src/app/page.tsx`. Arabic (ar) is RTL. `/zh` URLs redirect to `/zh-Hans` via `public/_redirects`.

Translation files are in `messages/{locale}.json`. Tool translations follow the namespace pattern `tools.{category}.{slug}.{key}` with keys: name, description, metaTitle, metaDescription, keywords, faq.q1/a1, etc.

### Styling

Tailwind CSS v4 with CSS-based config (no `tailwind.config.ts`). Theme defined via CSS custom properties in `src/app/globals.css`. Dark mode uses `next-themes` with `class` strategy. Custom variant: `@custom-variant dark (&:where(.dark, .dark *))`.

### SEO

Each tool page gets unique metadata via `src/lib/seo/metadata.ts` (`generateToolMetadata`). FAQ components include JSON-LD structured data. Hreflang tags auto-generated for all locales.

### Key Directories

- `src/tools/` — Tool modules (each has index.ts + component + logic.ts)
- `src/lib/registry/` — Tool registry and types
- `src/lib/seo/` — Metadata and JSON-LD generators
- `src/components/tool/` — Tool page shell components (ToolPageShell, ToolBreadcrumb, RelatedTools, ToolFAQ)
- `src/components/shared/` — Reusable components (FileDropzone, DownloadButton, CopyButton, SearchDialog, etc.)
- `src/components/ui/` — Primitive UI atoms (Button, Card, Badge, Tabs, Accordion)
- `messages/` — i18n translation JSON files

### Tool Module Convention

Each tool in `src/tools/{category}/{slug}/`:
- `index.ts` — Exports `ToolDefinition` with slug, category, icon (Lucide name), `featured` (boolean), `component: () => import("./Component")`, seo config, faq keys, related slugs
- `{Name}.tsx` — `"use client"` component, default export, uses `useTranslations()` for all text
- `logic.ts` — Pure processing functions, no React imports

### Cloudflare Headers

`public/_headers` pre-configures `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` for future FFmpeg.wasm support.
