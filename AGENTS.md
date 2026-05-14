# Repository Guidelines

## 项目结构与模块组织
本仓库是基于 Next.js 16 App Router 的浏览器端多媒体工具箱，使用 TypeScript、pnpm、SSG 静态导出（`output: "export"`，仅 `NODE_ENV=production` 启用）。部署到 Cloudflare Pages，输出目录 `out`，构建产物约 1500 个静态 HTML 页面。

主要代码在 `src/`：`app/` 为路由与布局，`components/` 为共享 UI 与页面壳，`tools/` 按 `image`、`video`、`audio`、`pdf`、`developer` 分组，`lib/` 放注册表、i18n、SEO、数据分析、FFmpeg 和通用工具。多语言文案位于 `messages/<locale>/`，静态资源在 `public/`。更完整的架构说明见 `CLAUDE.md`。

### 关键目录
- `src/tools/` — 工具模块（每个包含 index.ts + 组件 + logic.ts）
- `src/lib/registry/` — 工具注册表和类型定义
- `src/lib/seo/` — 元数据和 JSON-LD 生成器
- `src/lib/i18n/` — 消息加载器（`loadMessages.ts`）和 locale 检测
- `src/components/tool/` — 工具页面外壳组件（ToolPageShell、ToolBreadcrumb、RelatedTools、ToolFAQ）
- `src/components/shared/` — 复用组件（FileDropzone、DownloadButton、CopyButton、SearchDialog、DynamicToolIcon 等）
- `src/components/ui/` — 基础 UI 原子（Button、Card、Badge、Tabs、Accordion）
- `messages/` — i18n 翻译 JSON 文件（21 个 locale，含地区变体 zh-Hans/zh-Hant、pt-BR/pt-PT）

## 构建、检查与开发命令
- `pnpm dev`：启动开发服务器（Next.js 16 + Turbopack，非静态导出模式）
- `pnpm build`：静态导出到 `out/` 目录（使用 webpack）
- `pnpm lint`：运行 ESLint 检查

提交前至少执行 `pnpm lint`。涉及媒体处理、导出文件或页面交互的修改，需在浏览器中手动验证一个真实流程。

## 编码风格与命名约定
遵循现有 TypeScript 严格模式与 Next.js 约定。保持 2 空格缩进、双引号、分号、尾随逗号，并优先使用 `@/` 别名导入。React 组件文件使用 PascalCase，如 `ImageResize.tsx`；工具函数使用 camelCase，如 `formatFileSize.ts`。

样式使用 Tailwind CSS v4，基于 CSS 配置（无 `tailwind.config.ts`）。主题通过 CSS 自定义属性定义在 `src/app/globals.css`。暗色模式使用 `next-themes` 的 `class` 策略。

## 服务端/客户端边界
工具页位于 `src/app/[locale]/tools/[category]/[slug]/`，有关键分离：
- `page.tsx`（服务端）— 处理 `generateStaticParams`、`generateMetadata`、`setRequestLocale`。只向客户端传递原始字符串（category, slug）。
- `ToolPageClient.tsx`（客户端）— 查找 `ToolDefinition`（包含 `component` 函数）并通过 `lazy()` + `<Suspense>` 渲染。

**绝不要将 `ToolDefinition` 对象从服务端组件传递到客户端组件** — `component` 字段是函数，会导致序列化错误。这是本仓库的硬性约束。

## 工具注册系统

### 添加新工具（3 步）
1. 创建 `src/tools/<category>/<slug>/`，包含：
   - `index.ts`：导出 `ToolDefinition`，包含 slug、category、icon（Lucide 图标名字符串）、`featured`（布尔值，决定是否在 mega menu 特色列显示）、`component: () => import("./Component")`、seo 配置、faq 键、related slugs
   - `<Name>.tsx`：`"use client"` 组件，默认导出，所有文案使用 `useTranslations()`
   - `logic.ts`：纯处理逻辑，不导入 React
2. 在 `src/lib/registry/index.ts` 中添加 import 和数组条目
3. 在全部 21 个 locale 的翻译文件中添加 `tools.<category>.<slug>` 下的翻译键

**添加新图标时，必须同步将图标加到 `src/components/shared/DynamicToolIcon.tsx` 的 import 和 `ICON_MAP` 中**，否则 UI 会静默 fallback 成 `•`。

### 添加新分类
需修改 `src/lib/registry/categories.ts`、`types.ts` 中的 `ToolCategory` 类型，以及所有 locale 文件中的 `categories.<key>` 翻译。

## 国际化 (i18n)

使用 `next-intl`，支持 21 个 locale。默认英语。无中间件（与静态导出不兼容）。阿拉伯语 (ar) 为 RTL。`public/_redirects` 配置了短链兜底：`/zh*` → `/zh-Hans/`、`/pt*` → `/pt-BR/`。

### 消息文件结构
每个 locale 有拆分的消息文件：
- `messages/<locale>/common.json` — 通用 UI 文案、分类信息、导航 toolNames
- `messages/<locale>/tools-<category>.json` — 工具专用文案（name、description、metaTitle、metaDescription、keywords、faq 等）

### 消息加载机制
`src/lib/i18n/loadMessages.ts` 导出三个加载器：
- `loadCommonMessages(locale)` — 加载 common.json，用于 layout Provider
- `loadCategoryMessages(locale, category)` — 加载单分类工具消息，用于工具/分类页
- `loadAllToolMessages(locale)` — 合并所有分类的工具消息，用于首页和 /tools 列表页

所有加载器对非英文 locale 执行 `deepMerge(enFallback, localeMessages)`——缺失键会静默回退成英文。调试时如果某文案显示为英文，可能是源语言键缺失而非展示错误。

### 翻译要求（硬性规定）
**任何涉及 i18n 的内容变更（添加工具、分类、UI 文案等）必须一次性更新全部 21 个 locale 文件。** 以 `en` 为源语言。**所有 21 个 locale 必须提供对应语言的完整翻译，不得仅用英文占位。** 添加、修改翻译键时，须一次性完成全部语言的翻译并提交，不能依赖 deepMerge 回退机制。

## 数据分析

`src/lib/analytics.ts` 通过 `window.gtag` 提供类型安全的 GA4 事件追踪：
- `trackEvent(event, params)` — 发送 GA4 事件；GA 未加载时静默无操作
- `createToolTracker(slug, category)` — 工厂函数，返回 `trackProcessComplete(duration_ms)` 和 `trackProcessError(error_message)` 辅助方法

共享组件（FileDropzone、DownloadButton、CopyButton）接受可选的 `analyticsSlug`/`analyticsCategory` props 来启用追踪。要为工具添加 `process_complete`/`process_error` 追踪，在工具组件中调用 `createToolTracker` 并在处理后调用返回的辅助方法。

## 提交与合并请求
提交信息遵循现有前缀风格，如 `feat(video): ...`、`refactor(tool): ...`、`i18n(video): ...`。PR 应包含变更摘要、影响范围、验证步骤；UI 变更附截图或录屏。若修改工具、翻译或注册表，说明已同步更新相关文件。

## 安全与配置
本项目强调隐私优先，文件处理必须保持在浏览器端完成，不得引入服务端上传、文件日志或外发行为。环境变量只保存在本地 `.env`，新增变量时同步更新 `.env.example`。

`public/_headers` 预配置了 `Cross-Origin-Embedder-Policy: require-corp` 和 `Cross-Origin-Opener-Policy: same-origin`，用于支持 FFmpeg.wasm。不要移除或修改这些安全头。
