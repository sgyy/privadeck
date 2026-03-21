# PrivaDeck

浏览器端多媒体工具箱，所有文件处理均在本地完成，零上传、零服务器。

> 在线体验：[privadeck.app](https://privadeck.app)

## 特性

- **隐私优先** — 全部处理在浏览器端完成，文件绝不离开设备
- **60 个工具** — 覆盖图片、视频、音频、PDF、开发者 5 大分类
- **21 种语言** — 含简体中文、繁体中文、英语、日语、韩语等
- **暗色模式** — 自动跟随系统或手动切换
- **离线可用** — 页面加载后无需网络，支持 PWA 安装
- **SEO 友好** — 静态生成 1400+ 页面，含结构化数据和 hreflang

## 工具分类

| 分类 | 数量 | 示例 |
|------|------|------|
| 图片 | 17 | 格式转换、压缩、裁剪、去 EXIF、拼图、加水印 |
| 开发者 | 17 | JSON 格式化、Base64、正则测试、OCR、哈希生成 |
| PDF | 14 | 合并、拆分、压缩、转图片、提取文本、电子签名 |
| 视频 | 8 | 剪辑、压缩、转 GIF、格式转换、静音 |
| 音频 | 4 | 剪辑、格式转换、提取音频、音量调整 |

## 技术栈

- **框架**: Next.js 16 (App Router, SSG 静态导出)
- **语言**: TypeScript
- **样式**: Tailwind CSS v4
- **国际化**: next-intl (21 locales)
- **媒体处理**: FFmpeg.wasm (视频/音频)、pdf-lib + pdfjs-dist (PDF)、browser-image-compression (图片)
- **部署**: Cloudflare Pages

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器 (Turbopack)
pnpm dev

# 构建静态站点
pnpm build

# 代码检查
pnpm lint
```

开发服务器启动后访问 [http://localhost:3000](http://localhost:3000)。

构建产物输出到 `out/` 目录，可直接部署到 Cloudflare Pages 等静态托管服务。

## 项目结构

```
src/
├── app/                  # Next.js App Router 页面
├── components/
│   ├── layout/           # Header, Sidebar, Footer
│   ├── shared/           # FileDropzone, DownloadButton 等复用组件
│   ├── tool/             # 工具页面外壳 (ToolPageShell, ToolFAQ)
│   └── ui/               # 基础 UI 原子 (Button, Card, Badge)
├── tools/                # 工具模块
│   ├── image/            # 图片工具
│   ├── video/            # 视频工具
│   ├── audio/            # 音频工具
│   ├── pdf/              # PDF 工具
│   └── developer/        # 开发者工具
├── lib/
│   ├── registry/         # 工具注册表
│   ├── seo/              # SEO 元数据生成
│   ├── i18n/             # 国际化工具函数
│   ├── ffmpeg.ts         # FFmpeg.wasm 单例加载
│   └── analytics.ts      # GA4 事件追踪
└── messages/             # 多语言翻译文件 (21 locales)
```

## 添加新工具

1. 创建 `src/tools/{分类}/{slug}/`，包含 `index.ts`（工具定义）、`{Name}.tsx`（客户端组件）、`logic.ts`（纯处理函数）
2. 在 `src/lib/registry/index.ts` 中添加导入和注册
3. 在全部 21 个 locale 的翻译文件中添加对应键值（`common.json` + `tools-{分类}.json`）

## 许可证

私有项目，保留所有权利。
