# Repository Guidelines

## 项目结构与模块组织
本仓库是基于 Next.js 16 App Router 的浏览器端多媒体工具箱，使用 TypeScript、pnpm、SSG 静态导出。主要代码在 `src/`：`app/` 为路由与布局，`components/` 为共享 UI 与页面壳，`tools/` 按 `image`、`video`、`audio`、`pdf`、`developer` 分组，`lib/` 放注册表、i18n、SEO、FFmpeg 和通用工具。多语言文案位于 `messages/<locale>/`，静态资源在 `public/`。更完整的架构说明见 `CLAUDE.md`。

## 构建、检查与开发命令
- `pnpm dev`：启动本地开发服务器。
- `pnpm build`：构建并导出静态站点到 `out/`。
- `pnpm lint`：运行 ESLint 检查。

提交前至少执行 `pnpm lint`。涉及媒体处理、导出文件或页面交互的修改，需在浏览器中手动验证一个真实流程。

## 编码风格与命名约定
遵循现有 TypeScript 严格模式与 Next.js 约定。保持 2 空格缩进、双引号、分号、尾随逗号，并优先使用 `@/` 别名导入。React 组件文件使用 PascalCase，如 `ImageResize.tsx`；工具函数使用 camelCase，如 `formatFileSize.ts`。

新增工具统一放在 `src/tools/<category>/<slug>/`，包含：
- `index.ts`：导出 `ToolDefinition`
- `<Name>.tsx`：`"use client"` 组件
- `logic.ts`：纯处理逻辑，不导入 React

## 工具注册与国际化
新增工具时，同时更新 `src/lib/registry/index.ts`。如新增分类，还需修改 `src/lib/registry/categories.ts` 与相关类型定义。

所有 i18n 变更必须同步更新全部 locale。至少确保：
- `messages/<locale>/common.json`
- `messages/<locale>/tools-<category>.json`

以 `en` 为源语言；其他语言可临时使用英文占位，但键必须完整存在。具体规则以 `CLAUDE.md` 为准。

## 服务端/客户端边界
工具页位于 `src/app/[locale]/tools/[category]/[slug]/`。不要把 `ToolDefinition` 直接从服务端组件传到客户端组件，因为其中的 `component` 函数字段不可序列化。这是本仓库的硬性约束，详见 `CLAUDE.md`。

## 提交与合并请求
提交信息遵循现有前缀风格，如 `feat(video): ...`、`refactor(tool): ...`、`i18n(video): ...`。PR 应包含变更摘要、影响范围、验证步骤；UI 变更附截图或录屏。若修改工具、翻译或注册表，说明已同步更新相关文件。

## 安全与配置
本项目强调隐私优先，文件处理必须保持在浏览器端完成，不得引入服务端上传、文件日志或外发行为。环境变量只保存在本地 `.env`，新增变量时同步更新 `.env.example`。
