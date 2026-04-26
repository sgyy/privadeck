# HEIC → GIF 方向校正设计

## 背景

`src/tools/image/heic-convert/` 当前对 iPhone 连拍 HEIC 输出 GIF 时存在两个缺陷：

1. **EXIF 方向被忽略**：iPhone 传感器横向，竖拍 HEIC 的 EXIF Orientation=6。`heic2any({toType:"image/gif"})` 不应用该字段，导致输出 GIF 躺倒。
2. **用户手动旋转/翻转不生效**：UI 在 GIF 模式下 disable 了旋转/翻转按钮，与 JPG/PNG 行为不一致。

GIF 格式本身没有方向元数据字段，方向必须烘焙到像素。所以修复这个问题等价于：在 HEIC → GIF 流程中插入一个"按 EXIF + 用户 transform 重绘每一帧再编码"的中间层。

目标：GIF 输出与 JPG/PNG **完全行为一致** —— EXIF 自动校正 + 用户手动 transform 都生效。

---

## 整体架构

```
连拍 HEIC + 用户选 GIF
  ↓
heic2any({multiple:true, toType:"image/png"})    ← 解码（与现有路径共用）
  ↓
PNG 帧 Blob[]（已存在 decoded.frames，本次新增字段）
  ↓
gif-encoder Worker 启动（懒加载）
  ↓
for each frame:
  loadImage(blob) → HTMLImageElement
  → renderToCanvas(img, canvas, exifOrient, transform, MAX_DIM=1080)
      ↑ 与 JPG/PNG 共享同一个变换函数
  → ctx.getImageData → encoder.addFrame(imageData, {delay:100})
  → 释放 image
  → onProgress((i+1)/total)
  ↓
encoder.finish() → Blob
  ↓
download
```

---

## 关键决策

### 1. 仍然用 heic2any 做解码

heic2any 的 PNG 多帧输出是干净的：拿到的是已经"de-tile、de-grid、像素正确"的 PNG Blob 数组。我们只接管最后的"编码"步骤。

### 2. 共享 `renderToCanvas` 函数

`logic.ts` 当前的 `renderToCanvas` 已封装"EXIF + 用户 transform"全部逻辑。GIF 路径直接复用，确保 GIF 输出方向与预览的 JPG/PNG 输出**像素级一致**（仅分辨率不同）。

为支持 1080p 下采样，给 `renderToCanvas` 增加可选 `maxDim` 参数，默认 `Infinity`（不缩放，JPG/PNG 路径行为不变）。

### 3. 1080p 默认下采样

最长边超过 1080px 时按比例缩到 1080px。

依据：
- iPhone 12MP 单帧 4032×3024 的 30 帧动图未压缩 = 1.4GB 内存峰值
- 即便 GIF 最终压缩到 50-100MB，也超过常见聊天/社媒上传上限
- 1080p × 30 帧 GIF 通常 5-15MB，可用度最高

不开放 UI 调节 —— 减少 21 个 locale 的翻译负担，也避免让用户做技术决策。

### 4. 帧延迟 100ms（10fps）

iPhone 连拍约 10fps。heic2any 不暴露原始帧间隔，我们用业界默认 100ms。

后续若 heic2any 暴露 timing 元数据，可改为读取真实值。

### 5. 编码库：gif.js（pluggable）

API 稳定、Web Worker 异步、有 `onProgress`、社区成熟。

实现细节（package 选型、Turbopack worker 兼容性）放到实现计划阶段决定。候选：
- `gif.js`：原版，需要单独提供 worker 脚本 URL
- `gif.js.optimized`：fork，bundling 更友好
- `modern-gif`：完全 ESM、Worker 内联，对 Next.js + Turbopack 最丝滑

懒加载（仅在用户点 GIF 下载时 `await import`），对非 GIF 用户零成本。

### 6. 扔掉 `gifNote` UI 提示

GIF 行为与 JPG/PNG 一致后，"GIF 输出会跳过旋转/翻转"的提示已成为虚假信息，必须删除（21 个 locale 的 `gifNote` 键删除）。

---

## 数据结构变更

### `DecodedImage` 新增 `frames` 字段

```ts
export interface DecodedImage {
  blob: Blob;          // 第一帧（预览用）
  url: string;
  img: HTMLImageElement;
  width: number;
  height: number;
  frameCount: number;
  frames: Blob[];      // 新增：所有 PNG 帧 Blob
}
```

`frameCount === frames.length` 始终成立，单帧 HEIC 时 `frames.length === 1`。

### `convertHeicToGif` 替换为 `convertFramesToGif`

```ts
export async function convertFramesToGif(
  frames: Blob[],
  exifOrientation: number | undefined,
  transform: UserTransform,
  options?: {
    maxDim?: number;          // 默认 1080
    frameDelayMs?: number;    // 默认 100
    onProgress?: (p: number) => void;
  },
): Promise<Blob>
```

旧的 `convertHeicToGif(file: File)` 删除。

### `renderToCanvas` 加可选 `maxDim`

```ts
export function renderToCanvas(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  exifOrientation: number | undefined,
  transform: UserTransform,
  maxDim?: number,        // 新增
): void
```

`maxDim` 缩放在所有变换之前执行，按最长边等比例缩小。预览路径不传该参数，行为完全不变。

---

## UI 变更（HeicConvert.tsx）

### 移除

- `isGif` 对 `RotateCcw / RotateCw / FlipH / FlipV` 的 `disabled`
- `isGif` 时渲染的 `<p>{t("gifNote")}</p>`

### 新增

- `gifProgress: number | null` state（0–1，null 表示未在编码）
- `handleDownload` GIF 分支：
  ```ts
  if (format === "image/gif") {
    setGifProgress(0);
    blob = await convertFramesToGif(
      decoded.frames,
      exif?.orientation,
      transform,
      { onProgress: (p) => mountedRef.current && setGifProgress(p) },
    );
  }
  ```
  finally 中 `setGifProgress(null)`
- 下载按钮在 GIF 编码中显示 `t("encodingGif", { percent: Math.round((gifProgress ?? 0) * 100) })`

### 不变

- 单帧 HEIC 仍不显示 GIF 按钮（`isBurst` 逻辑保留）
- 切换文件 / 切换格式时 race-safe 机制（requestId、mountedRef）继续生效，对 GIF 编码同样有效

---

## i18n 变更（21 locale）

### 删除

- `gifNote`

### 新增

- `encodingGif`：模板 `"Encoding GIF... {percent}%"`，各语言本地化

---

## 错误处理

- `convertFramesToGif` 抛错 → handleDownload catch → `setError(t("downloadFailed"))` + `tracker.trackProcessError`
- `loadImage(blob)` 失败（极罕见，PNG blob 是我们自己的输出）→ 整体编码失败
- 用户中途切换文件 → mountedRef.current 在 finally 前已 false，setGifProgress 跳过；编码 Worker 仍在跑直到 finish 但结果被丢弃。可接受（对 30 帧 1080p 编码 ≤ 5s）。
- 浏览器内存不足 → gif.js 抛错，被 catch 捕获

---

## 验证

### 自动化

- `pnpm lint`：HEIC 模块零错误（沿用现状）
- `pnpm build`：1518 页面正常生成
- 21 locale 校验脚本：所有语言 `encodingGif` 存在、`gifNote` 不存在

### 手工

1. **iPhone 竖拍连拍 HEIC（orient=6）**：选 GIF → 下载 → 浏览器打开 = 正方向（与 JPG 输出方向一致）
2. **手动顺时针 90° + GIF**：下载 GIF 视觉上比 JPG 多转 90°
3. **水平翻转 + GIF**：下载 GIF 镜像，与 JPG 输出像素级一致（除分辨率）
4. **单帧 HEIC**：GIF 按钮不出现（不变）
5. **进度更新**：编码过程中下载按钮文本平滑从 0% → 100%
6. **取消 race**：编码进行中切换文件 → 不崩溃、不弹错、新文件流程正常
7. **下载体积**：iPhone 15 Pro Max 30 帧连拍 GIF ≤ 20MB
8. **首次访问非 GIF 流程**：DevTools Network 中无 gif-encoder bundle（懒加载验证）

### 视觉对照

把同一张 iPhone 连拍 HEIC：
- 输出 JPG（第一帧）→ 截图
- 输出 GIF → 第一帧截图
两者像素方向应一致（仅分辨率差异，1080p 下采样导致）。

---

## 不在范围内

- **GIF 调色板优化 / 抖动算法选择**：用 gif.js 默认（Floyd-Steinberg + 256 色调色板）
- **真实帧延迟提取**：固定 100ms，等 heic2any 暴露 timing 后再做
- **分辨率/质量 UI 选项**：保持单一 1080p 默认
- **GIF 转其他动图格式（WebP / APNG）**：不在本次范围
- **非连拍单帧 HEIC 的"伪动图"**：单帧仍走 PNG/JPG，不显示 GIF 按钮
