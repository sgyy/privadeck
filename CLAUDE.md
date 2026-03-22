# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指导。

## 构建与开发命令

```bash
pnpm dev          # 启动开发服务器 (Next.js 16 + Turbopack)
pnpm build        # 静态导出到 out/ 目录 (SSG)
pnpm lint         # ESLint 代码检查
```

构建产物输出到 `out/`（21 个 locale 约 1500 个静态 HTML 页面）。部署到 Cloudflare Pages，构建命令 `pnpm build`，输出目录 `out`。

## 架构

这是一个浏览器端多媒体工具箱（类似 TinyWow/123Apps）。所有处理在客户端完成——不上传服务器。基于 Next.js 16 App Router 的 SSG 模式（`output: "export"`）。

### 工具注册系统

核心模式：工具在 `src/lib/registry/index.ts` 中注册元数据，从 `src/tools/{category}/{slug}/index.ts` 导入定义。注册表提供 `getAllTools()`、`getToolBySlug()`、`getToolsByCategory()`、`getAllSlugs()`。

**添加新工具只需 3 步：**
1. 创建 `src/tools/{category}/{slug}/`，包含 `index.ts`（ToolDefinition）、`{Name}.tsx`（客户端组件）、`logic.ts`（纯函数）。需要在 mega menu 特色列显示的工具设置 `featured: true`。
2. 在 `src/lib/registry/index.ts` 中添加 import 和数组条目
3. 在全部 21 个 locale 的翻译文件中添加 `tools.{category}.{slug}` 下的翻译键

**添加新分类**需要在 `src/lib/registry/categories.ts` 和 `types.ts` 的 `ToolCategory` 类型中添加，以及所有 locale 文件中的 `categories.{key}` 翻译。

### 服务端/客户端边界

工具页面在 `src/app/[locale]/tools/[category]/[slug]/` 处有关键分离：
- `page.tsx`（服务端）— 处理 `generateStaticParams`、`generateMetadata`、`setRequestLocale`。只向客户端传递原始字符串（category, slug）。
- `ToolPageClient.tsx`（客户端）— 查找 `ToolDefinition`（包含 `component` 函数）并通过 `lazy()` + `<Suspense>` 渲染。

**绝不要将 `ToolDefinition` 对象从服务端组件传递到客户端组件** — `component` 字段是函数，会导致序列化错误。

### 国际化 (i18n)

使用 `next-intl`，支持 21 个 locale，包括地区变体（zh-Hans/zh-Hant、pt-BR/pt-PT）。默认英语。无中间件（与静态导出不兼容）。根路径 `/` 通过 Route Group `(home)` 直接渲染英文首页（可索引），语言建议由 `src/components/shared/LocaleSuggestionBanner.tsx` + `src/lib/i18n/detectLocale.ts` 在客户端完成（不自动跳转）。阿拉伯语 (ar) 为 RTL。`/zh` URL 通过 `public/_redirects` 重定向到 `/zh-Hans`。

翻译文件位于 `messages/{locale}/`。工具翻译遵循命名空间模式 `tools.{category}.{slug}.{key}`，键包括：name、description、metaTitle、metaDescription、keywords、faq.q1/a1 等。

**任何涉及 i18n 的内容变更（添加工具、分类、UI 文案等）必须一次性更新全部 21 个 locale 文件。** 每个 locale 有拆分的消息文件：`messages/{locale}/common.json`（导航用 toolNames）+ `messages/{locale}/tools-{category}.json`（工具专用文案）。两者都必须更新。以 `en` 为源语言；`zh-Hans` 应有完整中文翻译；其他 locale 可用英文占位，但键必须存在以避免运行时错误。

### 样式

Tailwind CSS v4，基于 CSS 配置（无 `tailwind.config.ts`）。主题通过 CSS 自定义属性定义在 `src/app/globals.css` 中。暗色模式使用 `next-themes` 的 `class` 策略。自定义变体：`@custom-variant dark (&:where(.dark, .dark *))`。

### SEO

每个工具页面通过 `src/lib/seo/metadata.ts`（`generateToolMetadata`）获取唯一元数据。FAQ 组件包含 JSON-LD 结构化数据。所有 locale 自动生成 hreflang 标签。

### 关键目录

- `src/tools/` — 工具模块（每个包含 index.ts + 组件 + logic.ts）
- `src/lib/registry/` — 工具注册表和类型
- `src/lib/seo/` — 元数据和 JSON-LD 生成器
- `src/components/tool/` — 工具页面外壳组件（ToolPageShell、ToolBreadcrumb、RelatedTools、ToolFAQ）
- `src/components/shared/` — 复用组件（FileDropzone、DownloadButton、CopyButton、SearchDialog 等）
- `src/components/ui/` — 基础 UI 原子（Button、Card、Badge、Tabs、Accordion）
- `messages/` — i18n 翻译 JSON 文件

### 工具模块约定

每个工具位于 `src/tools/{category}/{slug}/`：
- `index.ts` — 导出 `ToolDefinition`，包含 slug、category、icon（Lucide 图标名）、`featured`（布尔值）、`component: () => import("./Component")`、seo 配置、faq 键、related slugs
- `{Name}.tsx` — `"use client"` 组件，默认导出，所有文案使用 `useTranslations()`
- `logic.ts` — 纯处理函数，不导入 React

### 数据分析

`src/lib/analytics.ts` 通过 `window.gtag` 提供类型安全的 GA4 事件追踪。关键导出：
- `trackEvent(event, params)` — 发送 GA4 事件；GA 未加载时静默无操作
- `createToolTracker(slug, category)` — 工厂函数，返回 `trackProcessComplete(duration_ms)` 和 `trackProcessError(error_message)` 辅助方法

共享组件（FileDropzone、DownloadButton、CopyButton）接受可选的 `analyticsSlug`/`analyticsCategory` props 来启用追踪。要为工具添加 `process_complete`/`process_error` 追踪，在工具组件中调用 `createToolTracker` 并在处理后调用返回的辅助方法。

### Cloudflare Headers

`public/_headers` 预配置了 `Cross-Origin-Embedder-Policy: require-corp` 和 `Cross-Origin-Opener-Policy: same-origin`，用于支持 FFmpeg.wasm。
