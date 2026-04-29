# PDF工具

<cite>
**本文引用的文件**
- [README.md](file://README.md)
- [package.json](file://package.json)
- [src/lib/pdfjs.ts](file://src/lib/pdfjs.ts)
- [src/lib/pdf/getPdfPreview.ts](file://src/lib/pdf/getPdfPreview.ts)
- [src/components/shared/PdfFilePreview.tsx](file://src/components/shared/PdfFilePreview.tsx)
- [src/components/shared/PdfPagePreview.tsx](file://src/components/shared/PdfPagePreview.tsx)
- [src/components/tool/ToolFeatureCards.tsx](file://src/components/tool/ToolFeatureCards.tsx)
- [messages/en/tools-pdf.json](file://messages/en/tools-pdf.json)
- [src/tools/pdf/merge/logic.ts](file://src/tools/pdf/merge/logic.ts)
- [src/tools/pdf/split/logic.ts](file://src/tools/pdf/split/logic.ts)
- [src/tools/pdf/compress/logic.ts](file://src/tools/pdf/compress/logic.ts)
- [src/tools/pdf/to-image/logic.ts](file://src/tools/pdf/to-image/logic.ts)
- [src/tools/pdf/extract-text/logic.ts](file://src/tools/pdf/extract-text/logic.ts)
- [src/tools/pdf/delete-pages/logic.ts](file://src/tools/pdf/delete-pages/logic.ts)
- [src/tools/pdf/rotate/logic.ts](file://src/tools/pdf/rotate/logic.ts)
- [src/tools/pdf/add-page-numbers/logic.ts](file://src/tools/pdf/add-page-numbers/logic.ts)
- [src/tools/pdf/crop/logic.ts](file://src/tools/pdf/crop/logic.ts)
- [src/tools/pdf/add-watermark/logic.ts](file://src/tools/pdf/add-watermark/logic.ts)
- [src/tools/pdf/images-to-pdf/logic.ts](file://src/tools/pdf/images-to-pdf/logic.ts)
- [src/tools/pdf/extract-images/logic.ts](file://src/tools/pdf/extract-images/logic.ts)
- [src/tools/pdf/esign/logic.ts](file://src/tools/pdf/esign/logic.ts)
- [src/tools/pdf/rearrange/logic.ts](file://src/tools/pdf/rearrange/logic.ts)
- [src/tools/pdf/merge/MergePdf.tsx](file://src/tools/pdf/merge/MergePdf.tsx)
- [src/tools/pdf/split/SplitPdf.tsx](file://src/tools/pdf/split/SplitPdf.tsx)
- [src/tools/pdf/compress/CompressPdf.tsx](file://src/tools/pdf/compress/CompressPdf.tsx)
- [src/tools/pdf/to-image/PdfToImage.tsx](file://src/tools/pdf/to-image/PdfToImage.tsx)
- [src/tools/pdf/extract-text/ExtractText.tsx](file://src/tools/pdf/extract-text/ExtractText.tsx)
- [src/tools/pdf/delete-pages/DeletePages.tsx](file://src/tools/pdf/delete-pages/DeletePages.tsx)
- [src/tools/pdf/rotate/RotatePdf.tsx](file://src/tools/pdf/rotate/RotatePdf.tsx)
- [src/tools/pdf/add-page-numbers/AddPageNumbers.tsx](file://src/tools/pdf/add-page-numbers/AddPageNumbers.tsx)
- [src/tools/pdf/crop/CropPdf.tsx](file://src/tools/pdf/crop/CropPdf.tsx)
- [src/tools/pdf/add-watermark/AddWatermarkPdf.tsx](file://src/tools/pdf/add-watermark/AddWatermarkPdf.tsx)
</cite>

## 更新摘要
**所做更改**
- 新增PDF工具特征卡片系统，为所有14个PDF工具提供详细的特征描述
- 集成ToolFeatureCards组件到PDF工具页面，展示工具的核心优势
- 更新所有PDF工具的国际化配置，添加featureCards字段
- 增强工具页面的用户体验，通过特征卡片突出工具价值
- 完善PDF工具文档，包含特征卡片的实现细节和使用指南

## 目录
1. [简介](#简介)
2. [PDF工具特征卡片系统](#pdf工具特征卡片系统)
3. [PDF文件预览系统](#pdf文件预览系统)
4. [项目结构](#项目结构)
5. [核心组件](#核心组件)
6. [架构总览](#架构总览)
7. [详细组件分析](#详细组件分析)
8. [依赖关系分析](#依赖关系分析)
9. [性能考量](#性能考量)
10. [故障排除指南](#故障排除指南)
11. [结论](#结论)
12. [附录](#附录)

## 简介
本文件面向"PDF工具"模块，系统梳理并解释14项PDF处理能力：合并、拆分、压缩、转图片、删除页面、旋转、提取文本、添加页码、重新排列、裁剪、添加水印、图片转PDF、提取图片与电子签名。文档覆盖技术原理（PDF解析、内容提取、格式转换）、标准与兼容性、算法实现（文本识别、图像嵌入、元数据管理）、使用场景与参数配置，并说明与pdfjs-dist和pdf-lib的集成方式，最后提供质量保障与故障排除建议。

**更新** 本版本重点介绍了新的PDF工具特征卡片系统，该系统为每个PDF工具提供详细的特征描述，帮助用户快速了解工具的核心价值和优势。特征卡片系统通过ToolFeatureCards组件实现，每个工具都配有6个精心设计的特征卡片，涵盖功能亮点、使用场景和技术优势。

## PDF工具特征卡片系统

### ToolFeatureCards组件
ToolFeatureCards组件是PDF工具特征卡片系统的核心，负责渲染工具的特征描述卡片：

```mermaid
flowchart TD
A[工具页面加载] --> B[ToolFeatureCards组件]
B --> C[国际化翻译加载]
C --> D{检查featureCards.count}
D --> |存在| E[读取特征卡片配置]
D --> |不存在| F[返回null]
E --> G[遍历特征卡片]
G --> H[渲染卡片组件]
H --> I[图标映射]
I --> J[标题 + 描述]
J --> K[网格布局显示]
```

**图表来源**
- [src/components/tool/ToolFeatureCards.tsx:49-94](file://src/components/tool/ToolFeatureCards.tsx#L49-L94)

### 特征卡片配置结构
每个PDF工具的特征卡片配置包含以下字段：
- count: 特征卡片总数（必须为6）
- f1-f6: 六个特征卡片对象
- icon: 图标名称（使用Lucide React图标）
- title: 特征标题
- description: 详细描述

### 国际化配置
特征卡片系统通过国际化文件(messages/en/tools-pdf.json)加载配置：

```mermaid
graph TB
subgraph "国际化配置"
FEATURE["featureCards配置"]
COUNT["count: 6"]
F1["f1: 图标 + 标题 + 描述"]
F2["f2: 图标 + 标题 + 描述"]
F3["f3: 图标 + 标题 + 描述"]
F4["f4: 图标 + 标题 + 描述"]
F5["f5: 图标 + 标题 + 描述"]
F6["f6: 图标 + 标题 + 描述"]
end
subgraph "组件渲染"
COMPONENT["ToolFeatureCards组件"]
RENDER["渲染6个特征卡片"]
GRID["网格布局显示"]
end
FEATURE --> COMPONENT
COMPONENT --> RENDER
RENDER --> GRID
```

**章节来源**
- [src/components/tool/ToolFeatureCards.tsx:1-95](file://src/components/tool/ToolFeatureCards.tsx#L1-L95)
- [messages/en/tools-pdf.json:12-44](file://messages/en/tools-pdf.json#L12-L44)
- [messages/en/tools-pdf.json:121-153](file://messages/en/tools-pdf.json#L121-L153)
- [messages/en/tools-pdf.json:252-284](file://messages/en/tools-pdf.json#L252-L284)
- [messages/en/tools-pdf.json:324-356](file://messages/en/tools-pdf.json#L324-L356)
- [messages/en/tools-pdf.json:398-430](file://messages/en/tools-pdf.json#L398-L430)
- [messages/en/tools-pdf.json:468-500](file://messages/en/tools-pdf.json#L468-L500)
- [messages/en/tools-pdf.json:542-574](file://messages/en/tools-pdf.json#L542-L574)
- [messages/en/tools-pdf.json:625-657](file://messages/en/tools-pdf.json#L625-L657)
- [messages/en/tools-pdf.json:696-728](file://messages/en/tools-pdf.json#L696-L728)
- [messages/en/tools-pdf.json:770-802](file://messages/en/tools-pdf.json#L770-L802)
- [messages/en/tools-pdf.json:848-880](file://messages/en/tools-pdf.json#L848-L880)
- [messages/en/tools-pdf.json:921-953](file://messages/en/tools-pdf.json#L921-L953)
- [messages/en/tools-pdf.json:997-1030](file://messages/en/tools-pdf.json#L997-L1030)
- [messages/en/tools-pdf.json:1072-1104](file://messages/en/tools-pdf.json#L1072-L1104)

## PDF文件预览系统

### getPdfPreview函数
新的PDF文件预览系统通过getPdfPreview函数提供核心预览功能：

```mermaid
flowchart TD
A[用户上传PDF文件] --> B[getPdfPreview函数]
B --> C[加载pdfjs-dist]
B --> D[读取文件缓冲区]
B --> E[获取PDF文档对象]
E --> F[获取第1页]
F --> G[计算缩放比例]
G --> H[渲染到Canvas]
H --> I[生成缩略图数据URL]
I --> J[返回预览信息]
J --> K[pageCount: 总页数]
J --> L[thumbnail: 缩略图]
J --> M[pdfDoc: PDF文档对象]
```

**图表来源**
- [src/lib/pdf/getPdfPreview.ts:10-30](file://src/lib/pdf/getPdfPreview.ts#L10-L30)

### PdfFilePreview组件
PdfFilePreview组件提供PDF文件的可视化预览：

- 显示PDF缩略图或默认图标
- 展示文件名称、页数和文件大小
- 支持替换文件和删除操作
- 在禁用状态下提供适当的交互状态

### PdfPagePreview组件
PdfPagePreview组件用于渲染单个PDF页面的缩略图：

- 支持自定义宽度和选中状态
- 实现懒加载和错误处理
- 提供页面编号显示
- 支持点击事件回调

**章节来源**
- [src/lib/pdf/getPdfPreview.ts:1-30](file://src/lib/pdf/getPdfPreview.ts#L1-L30)
- [src/components/shared/PdfFilePreview.tsx:1-86](file://src/components/shared/PdfFilePreview.tsx#L1-L86)
- [src/components/shared/PdfPagePreview.tsx:1-80](file://src/components/shared/PdfPagePreview.tsx#L1-L80)

## 项目结构
- 工具分类与数量：PDF工具包含14个子功能，分布在src/tools/pdf目录下，每个工具由index.ts（工具定义）、客户端组件（例如MergePdf.tsx）与纯逻辑处理文件（logic.ts）组成。
- 技术栈：前端全栈在浏览器端执行，使用pdf-lib进行PDF编辑、pdfjs-dist进行PDF渲染与文本提取、FFmpeg.wasm用于视频/音频处理（图片转PDF时可能涉及）、tesseract.js用于OCR（开发者工具中提供）。
- **新增** 特征卡片系统：新增ToolFeatureCards组件和相应的国际化配置，为每个PDF工具提供详细的特征描述。
- **新增** 预览系统：新增getPdfPreview函数和相关预览组件，提供PDF文件信息的快速预览。

```mermaid
graph TB
subgraph "应用层"
UI["工具页面组件<br/>如 MergePdf.tsx"]
PREVIEW["预览组件<br/>PdfFilePreview.tsx / PdfPagePreview.tsx"]
FEATURE["特征卡片系统<br/>ToolFeatureCards.tsx"]
end
subgraph "业务逻辑层"
LOGIC_M["合并逻辑<br/>merge/logic.ts"]
LOGIC_S["拆分逻辑<br/>split/logic.ts"]
LOGIC_C["压缩逻辑<br/>compress/logic.ts"]
LOGIC_T2I["转图片逻辑<br/>to-image/logic.ts"]
LOGIC_ET["提取文本逻辑<br/>extract-text/logic.ts"]
LOGIC_DP["删除页面逻辑<br/>delete-pages/logic.ts"]
LOGIC_R["旋转逻辑<br/>rotate/logic.ts"]
LOGIC_PN["页码逻辑<br/>add-page-numbers/logic.ts"]
LOGIC_CR["裁剪逻辑<br/>crop/logic.ts"]
LOGIC_WM["水印逻辑<br/>add-watermark/logic.ts"]
LOGIC_I2P["图片转PDF逻辑<br/>images-to-pdf/logic.ts"]
LOGIC_EI["提取图片逻辑<br/>extract-images/logic.ts"]
LOGIC_ESIGN["电子签名逻辑<br/>esign/logic.ts"]
LOGIC_RE["重排逻辑<br/>rearrange/logic.ts"]
end
subgraph "预览系统"
PREVIEW_FN["getPdfPreview函数<br/>getPdfPreview.ts"]
PREVIEW_COMP["预览组件<br/>PdfFilePreview.tsx / PdfPagePreview.tsx"]
end
subgraph "特征卡片系统"
FEATURE_COMP["ToolFeatureCards组件<br/>ToolFeatureCards.tsx"]
FEATURE_I18N["国际化配置<br/>tools-pdf.json"]
end
subgraph "PDF运行时"
PDFJS["pdfjs-dist<br/>getPdfjs()"]
PDFLIB["pdf-lib"]
end
UI --> LOGIC_M
UI --> LOGIC_S
UI --> LOGIC_C
UI --> LOGIC_T2I
UI --> LOGIC_ET
UI --> LOGIC_DP
UI --> LOGIC_R
UI --> LOGIC_PN
UI --> LOGIC_CR
UI --> LOGIC_WM
UI --> LOGIC_I2P
UI --> LOGIC_EI
UI --> LOGIC_ESIGN
UI --> LOGIC_RE
PREVIEW --> PREVIEW_FN
PREVIEW --> PREVIEW_COMP
PREVIEW_FN --> PDFJS
PREVIEW_COMP --> PDFJS
FEATURE --> FEATURE_COMP
FEATURE --> FEATURE_I18N
FEATURE_COMP --> FEATURE_I18N
LOGIC_M --> PDFLIB
LOGIC_S --> PDFLIB
LOGIC_C --> PDFJS
LOGIC_T2I --> PDFJS
LOGIC_ET --> PDFJS
LOGIC_DP --> PDFLIB
LOGIC_R --> PDFLIB
LOGIC_PN --> PDFLIB
LOGIC_CR --> PDFLIB
LOGIC_WM --> PDFLIB
LOGIC_I2P --> PDFLIB
LOGIC_EI --> PDFLIB
LOGIC_ESIGN --> PDFLIB
LOGIC_RE --> PDFLIB
PDFJS --> PDFTXT["文本/渲染"]
PDFJS --> PDFIMG["渲染为图像"]
```

**图表来源**
- [src/lib/pdf/getPdfPreview.ts:1-30](file://src/lib/pdf/getPdfPreview.ts#L1-L30)
- [src/components/shared/PdfFilePreview.tsx:1-86](file://src/components/shared/PdfFilePreview.tsx#L1-L86)
- [src/components/shared/PdfPagePreview.tsx:1-80](file://src/components/shared/PdfPagePreview.tsx#L1-L80)
- [src/components/tool/ToolFeatureCards.tsx:1-95](file://src/components/tool/ToolFeatureCards.tsx#L1-L95)
- [messages/en/tools-pdf.json:12-44](file://messages/en/tools-pdf.json#L12-L44)
- [src/lib/pdfjs.ts:1-15](file://src/lib/pdfjs.ts#L1-L15)

**章节来源**
- [README.md: 22](file://README.md#L22)
- [README.md: 32](file://README.md#L32)
- [package.json: 25](file://package.json#L25)
- [package.json: 26](file://package.json#L26)

## 核心组件
- pdfjs-dist封装：统一初始化worker路径，按需获取PDF文档对象，支持渲染、文本提取、视口计算等。
- pdf-lib封装：统一创建、复制页面、嵌入图像/字体、设置旋转、绘制文本、保存PDF。
- **新增** 特征卡片系统：ToolFeatureCards组件提供工具特征描述，增强用户体验和工具价值传达。
- **新增** 预览系统：getPdfPreview函数提供PDF文件的快速预览，包括页数统计和缩略图生成。
- **新增** 预览组件：PdfFilePreview和PdfPagePreview提供直观的PDF文件和页面预览界面。
- 各工具逻辑：以纯函数形式封装具体算法，接收File输入、返回Blob输出；多数提供进度回调与文件大小格式化工具。

**章节来源**
- [src/lib/pdfjs.ts: 1-15:1-15](file://src/lib/pdfjs.ts#L1-L15)
- [src/components/tool/ToolFeatureCards.tsx: 1-95:1-95](file://src/components/tool/ToolFeatureCards.tsx#L1-L95)
- [src/lib/pdf/getPdfPreview.ts: 1-30:1-30](file://src/lib/pdf/getPdfPreview.ts#L1-L30)
- [src/components/shared/PdfFilePreview.tsx: 1-86:1-86](file://src/components/shared/PdfFilePreview.tsx#L1-L86)
- [src/components/shared/PdfPagePreview.tsx: 1-80:1-80](file://src/components/shared/PdfPagePreview.tsx#L1-L80)

## 架构总览
- 输入：用户上传的PDF文件（File）
- **新增** 特征卡片：通过ToolFeatureCards组件展示工具特征描述
- **新增** 预览：通过getPdfPreview函数获取PDF文档信息和缩略图
- 解析：pdfjs-dist读取PDF元信息与页面；pdf-lib加载PDF文档以进行编辑
- 处理：各工具逻辑对页面进行复制、嵌入、重排、旋转、绘制等操作
- 输出：生成新的PDF Blob，供下载或进一步处理

```mermaid
sequenceDiagram
participant U as "用户"
participant C as "工具组件"
participant F as "特征卡片系统"
participant P as "预览系统"
participant L as "逻辑函数"
participant PJ as "pdfjs-dist"
participant PL as "pdf-lib"
U->>C : 选择文件并触发处理
C->>F : 调用ToolFeatureCards()
F->>F : 加载国际化配置
F-->>C : 返回特征卡片
C->>P : 调用getPdfPreview()
P->>PJ : 获取文档(getDocument)
PJ-->>P : 文档对象
P->>P : 生成缩略图
P-->>C : 返回预览信息
C->>L : 传入File与配置参数
alt 需要渲染/文本
L->>PJ : 获取文档(getDocument)
PJ-->>L : 文档对象
else 需要编辑
L->>PL : 加载PDF(load)
PL-->>L : PDFDocument
end
L->>L : 执行算法复制/嵌入/绘制/保存
L-->>C : 返回Blob
C-->>U : 下载或预览结果
```

**图表来源**
- [src/components/tool/ToolFeatureCards.tsx:49-94](file://src/components/tool/ToolFeatureCards.tsx#L49-L94)
- [src/lib/pdf/getPdfPreview.ts:10-30](file://src/lib/pdf/getPdfPreview.ts#L10-L30)
- [src/lib/pdfjs.ts:1-15](file://src/lib/pdfjs.ts#L1-L15)

## 详细组件分析

### 合并（MergePdf）
- 功能：将多个PDF文件合并为一个PDF。
- **更新** 集成特征卡片：通过featureCards展示页面级选择、混合格式支持、智能分隔符等功能亮点。
- **更新** 集成预览：虽然合并操作不需要预览，但UI层仍可显示文件信息。
- 算法要点：
  - 使用pdf-lib创建新文档，逐个加载源PDF，复制页面索引，批量添加到新文档。
  - 保持原页面布局与资源引用。
- 性能：O(N)页面复制，内存占用与总页数成正比。
- 参数与行为：无额外参数，直接合并。

**章节来源**
- [src/tools/pdf/merge/MergePdf.tsx:1-677](file://src/tools/pdf/merge/MergePdf.tsx#L1-L677)
- [src/tools/pdf/merge/logic.ts:1-24](file://src/tools/pdf/merge/logic.ts#L1-L24)
- [messages/en/tools-pdf.json:12-44](file://messages/en/tools-pdf.json#L12-L44)

### 拆分（SplitPdf）
- 功能：按单页或页码范围拆分为多个PDF。
- **更新** 集成特征卡片：通过featureCards展示7种拆分模式、书签拆分、文件大小限制等功能。
- **更新** 集成预览：使用getPdfPreview获取PDF信息，显示缩略图和页数。
- 算法要点：
  - 单页拆分：循环每一页，创建新PDF并复制该页。
  - 范围拆分：根据起止范围构造索引数组，复制对应页集合。
- 输出：返回每个拆分结果的Blob、文件名与页数。
- 参数与行为：支持页码范围列表，文件名包含基础名与页码段标识。

**章节来源**
- [src/tools/pdf/split/SplitPdf.tsx:1-368](file://src/tools/pdf/split/SplitPdf.tsx#L1-L368)
- [src/tools/pdf/split/logic.ts:1-73](file://src/tools/pdf/split/logic.ts#L1-L73)
- [messages/en/tools-pdf.json:121-153](file://messages/en/tools-pdf.json#L121-L153)

### 压缩（CompressPdf）
- 功能：通过将每页渲染为图像再嵌入的方式降低PDF体积（适合扫描版PDF）。
- **更新** 集成特征卡片：通过featureCards展示3种质量预设、实时大小减少、可调渲染质量等功能。
- **更新** 集成预览：使用getPdfPreview显示PDF基本信息。
- 算法要点：
  - 使用pdfjs-dist按比例渲染为Canvas，转为JPEG Blob。
  - 使用pdf-lib嵌入JPEG为新PDF页面，尺寸采用原始视口。
  - 提供进度回调，逐页处理。
- 质量控制：通过scale与jpeg质量参数平衡体积与清晰度。
- 参数与行为：quality高/中/低三档，内部映射scale与jpeg质量。

**章节来源**
- [src/tools/pdf/compress/CompressPdf.tsx:1-158](file://src/tools/pdf/compress/CompressPdf.tsx#L1-L158)
- [src/tools/pdf/compress/logic.ts:1-73](file://src/tools/pdf/compress/logic.ts#L1-L73)
- [messages/en/tools-pdf.json:770-802](file://messages/en/tools-pdf.json#L770-L802)

### 转图片（PdfToImage）
- 功能：将PDF每页渲染为PNG/JPEG图像，支持打包为ZIP下载。
- **更新** 集成特征卡片：通过featureCards展示PNG/JPG输出、1×到4×分辨率缩放、逐页图像输出等功能。
- **更新** 集成预览：使用getPdfPreview获取PDF信息，提供预览功能。
- 算法要点：
  - 使用pdfjs-dist渲染每页到Canvas，按格式与质量参数导出Blob。
  - 支持逐页回调与全局进度回调。
- 输出：每页图像对象数组，可打包为ZIP。
- 参数与行为：format（png/jpg）、quality（1-100）、scale（缩放系数）。

**章节来源**
- [src/tools/pdf/to-image/PdfToImage.tsx:1-323](file://src/tools/pdf/to-image/PdfToImage.tsx#L1-L323)
- [src/tools/pdf/to-image/logic.ts:1-86](file://src/tools/pdf/to-image/logic.ts#L1-L86)
- [messages/en/tools-pdf.json:324-356](file://messages/en/tools-pdf.json#L324-L356)

### 提取文本（ExtractText）
- 功能：提取PDF每页文本内容，按页拼接。
- **更新** 集成特征卡片：通过featureCards展示全文提取、维护阅读顺序、复制或下载文本等功能。
- **更新** 集成预览：使用getPdfPreview显示PDF基本信息。
- 算法要点：
  - 使用pdfjs-dist获取每页文本内容，过滤有效字符串并拼接。
- 输出：包含页头标记的完整文本。
- 参数与行为：无额外参数。

**章节来源**
- [src/tools/pdf/extract-text/ExtractText.tsx:1-112](file://src/tools/pdf/extract-text/ExtractText.tsx#L1-L112)
- [src/tools/pdf/extract-text/logic.ts:1-25](file://src/tools/pdf/extract-text/logic.ts#L1-L25)
- [messages/en/tools-pdf.json:625-657](file://messages/en/tools-pdf.json#L625-L657)

### 删除页面（DeletePages）
- 功能：删除指定页号集合。
- **更新** 集成特征卡片：通过featureCards展示视觉缩略图选择、批量删除语法、实时结果预览等功能。
- **更新** 集成预览：使用getPdfPreview获取PDF文档对象，PdfPagePreview组件渲染页面缩略图。
- 算法要点：
  - 构造保留页索引集，复制并添加到新PDF。
- 输出：新PDF Blob。
- 参数与行为：以页号集合表示待删页。

**章节来源**
- [src/tools/pdf/delete-pages/DeletePages.tsx:1-159](file://src/tools/pdf/delete-pages/DeletePages.tsx#L1-L159)
- [src/tools/pdf/delete-pages/logic.ts:1-39](file://src/tools/pdf/delete-pages/logic.ts#L1-L39)
- [messages/en/tools-pdf.json:252-284](file://messages/en/tools-pdf.json#L252-L284)

### 旋转（RotatePdf）
- 功能：对指定页设置旋转角度（叠加当前角度，归一化到0-360）。
- **更新** 集成特征卡片：通过featureCards展示3种旋转角度、整档旋转、元数据无损旋转等功能。
- **更新** 集成预览：使用getPdfPreview显示PDF基本信息。
- 算法要点：
  - 读取每页当前旋转，累加目标角度并标准化。
- 输出：新PDF Blob。
- 参数与行为：以页索引到角度的映射描述旋转。

**章节来源**
- [src/tools/pdf/rotate/RotatePdf.tsx:1-151](file://src/tools/pdf/rotate/RotatePdf.tsx#L1-L151)
- [src/tools/pdf/rotate/logic.ts:1-30](file://src/tools/pdf/rotate/logic.ts#L1-L30)
- [messages/en/tools-pdf.json:468-500](file://messages/en/tools-pdf.json#L468-L500)

### 添加页码（AddPageNumbers）
- 功能：在指定位置绘制页码，支持多种格式与起始页。
- **更新** 集成特征卡片：通过featureCards展示6种位置选项、自定义起始数字、格式与字体大小控制等功能。
- **更新** 集成预览：使用getPdfPreview显示PDF基本信息。
- 算法要点：
  - 嵌入标准字体，计算文本宽度与视觉坐标系，考虑页面旋转进行坐标变换。
  - 支持顶部/底部、居中/左/右定位。
- 输出：新PDF Blob。
- 参数与行为：position（位置）、fontSize（字号）、format（数字/带"Page"/"n/MAX"）、startPage（起始页）。

**章节来源**
- [src/tools/pdf/add-page-numbers/AddPageNumbers.tsx:1-211](file://src/tools/pdf/add-page-numbers/AddPageNumbers.tsx#L1-L211)
- [src/tools/pdf/add-page-numbers/logic.ts:1-94](file://src/tools/pdf/add-page-numbers/logic.ts#L1-L94)
- [messages/en/tools-pdf.json:542-574](file://messages/en/tools-pdf.json#L542-L574)

### 裁剪（CropPdf）
- 功能：按矩形区域裁剪页面。
- **更新** 集成特征卡片：通过featureCards展示4边独立边距、点精确输入、相同裁剪跨所有页面等功能。
- **更新** 集成预览：使用getPdfPreview显示PDF基本信息。
- 算法要点：
  - 使用pdf-lib的裁剪盒（CropBox）或通过重绘与裁剪路径实现。
  - 保持页面内容在裁剪区域内显示。
- 输出：新PDF Blob。
- 参数与行为：矩形坐标（x0, y0, width, height）。

**章节来源**
- [src/tools/pdf/crop/CropPdf.tsx:1-149](file://src/tools/pdf/crop/CropPdf.tsx#L1-L149)
- [src/tools/pdf/crop/logic.ts](file://src/tools/pdf/crop/logic.ts)
- [messages/en/tools-pdf.json:921-953](file://messages/en/tools-pdf.json#L921-L953)

### 添加水印（AddWatermarkPdf）
- 功能：为PDF添加文字或图片水印。
- **更新** 集成特征卡片：通过featureCards展示自定义水印文本、对角线布局、不透明度与大小控制等功能。
- **更新** 集成预览：使用getPdfPreview显示PDF基本信息。
- 算法要点：
  - 文字水印：嵌入字体，计算位置与透明度，绘制于每页。
  - 图片水印：嵌入图片，设置尺寸与位置，必要时旋转或透明化。
- 输出：新PDF Blob。
- 参数与行为：水印类型、内容、位置、透明度、尺寸、角度等。

**章节来源**
- [src/tools/pdf/add-watermark/AddWatermarkPdf.tsx:1-173](file://src/tools/pdf/add-watermark/AddWatermarkPdf.tsx#L1-L173)
- [src/tools/pdf/add-watermark/logic.ts](file://src/tools/pdf/add-watermark/logic.ts)
- [messages/en/tools-pdf.json:848-880](file://messages/en/tools-pdf.json#L848-L880)

### 图片转PDF（ImagesToPdf）
- 功能：将多张图片合并为PDF。
- **更新** 集成特征卡片：通过featureCards展示混合图像格式、自定义页面大小、拖拽排序等功能。
- 算法要点：
  - 读取图片尺寸，按页面尺寸嵌入图片，支持多页。
  - 可选缩放策略与布局。
- 输出：新PDF Blob。
- 参数与行为：图片数组、页面尺寸、对齐方式等。

**章节来源**
- [src/tools/pdf/images-to-pdf/logic.ts](file://src/tools/pdf/images-to-pdf/logic.ts)
- [messages/en/tools-pdf.json:398-430](file://messages/en/tools-pdf.json#L398-L430)

### 提取图片（ExtractImages）
- 功能：从PDF中提取嵌入的图片资源。
- **更新** 集成特征卡片：通过featureCards展示提取所有嵌入图像、原始格式与质量、ZIP一键下载等功能。
- 算法要点：
  - 遍历页面资源，提取XObject中的图片数据，导出为图像文件。
- 输出：图片文件数组（PNG/JPEG等）。
- 参数与行为：无额外参数。

**章节来源**
- [src/tools/pdf/extract-images/logic.ts](file://src/tools/pdf/extract-images/logic.ts)
- [messages/en/tools-pdf.json:1072-1104](file://messages/en/tools-pdf.json#L1072-L1104)

### 电子签名（ESign）
- 功能：为PDF添加电子签名（如图片印章或手写签名）。
- **更新** 集成特征卡片：通过featureCards展示鼠标或触摸绘制、放置在任意PDF页面、可调节签名宽度等功能。
- 算法要点：
  - 将签名图片作为水印叠加到指定页，控制位置与透明度。
  - 或嵌入手写路径形成矢量签名。
- 输出：新PDF Blob。
- 参数与行为：签名图片、页码、位置、尺寸、透明度等。

**章节来源**
- [src/tools/pdf/esign/logic.ts](file://src/tools/pdf/esign/logic.ts)
- [messages/en/tools-pdf.json:997-1030](file://messages/en/tools-pdf.json#L997-L1030)

### 重新排列（RearrangePdf）
- 功能：调整页面顺序。
- **更新** 集成特征卡片：通过featureCards展示拖拽排序、视觉缩略图网格、向上/向下移动按钮等功能。
- 算法要点：
  - 复制页面到新顺序，保持每页内容不变。
- 输出：新PDF Blob。
- 参数与行为：目标页序数组。

**章节来源**
- [src/tools/pdf/rearrange/logic.ts](file://src/tools/pdf/rearrange/logic.ts)
- [messages/en/tools-pdf.json:696-728](file://messages/en/tools-pdf.json#L696-L728)

## 依赖关系分析

```mermaid
graph LR
PREVIEW["预览系统<br/>getPdfPreview.ts"] --> FILEPREV["PdfFilePreview.tsx"]
PREVIEW --> PAGEPREV["PdfPagePreview.tsx"]
FEATURE["特征卡片系统<br/>ToolFeatureCards.tsx"] --> I18N["国际化配置<br/>tools-pdf.json"]
FEATURE --> MERGE["合并(MergePdf.tsx)"]
FEATURE --> SPLIT["拆分(SplitPdf.tsx)"]
FEATURE --> DELETE["删除(Depages.tsx)"]
FEATURE --> T2I["转图片(PdfToImage.tsx)"]
FEATURE --> ROTATE["旋转(RotatePdf.tsx)"]
FEATURE --> PAGENUM["页码(AddPageNumbers.tsx)"]
FEATURE --> EXTRACT["提取文本(ExtractText.tsx)"]
FEATURE --> COMPRESS["压缩(CompressPdf.tsx)"]
FEATURE --> WATERMARK["水印(AddWatermarkPdf.tsx)"]
FEATURE --> CROP["裁剪(CropPdf.tsx)"]
FEATURE --> IMG2PDF["图片转PDF(logic.ts)"]
FEATURE --> EXTRACTIMG["提取图片(logic.ts)"]
FEATURE --> ESIGN["电子签名(esign/logic.ts)"]
FEATURE --> REARRANGE["重排(RearrangePdf.tsx)"]
PREVIEW --> MERGE
PREVIEW --> SPLIT
PREVIEW --> DELETE
PREVIEW --> T2I
PREVIEW --> ROTATE
PREVIEW --> PAGENUM
PREVIEW --> EXTRACT
PREVIEW --> COMPRESS
PREVIEW --> WATERMARK
PREVIEW --> CROP
PREVIEW --> IMG2PDF
PREVIEW --> EXTRACTIMG
PREVIEW --> ESIGN
PREVIEW --> REARRANGE
PJ["pdfjs-dist"] --> PREVIEW
PJ --> T2I
PJ --> EXTRACT
PJ --> COMPRESS
PL["pdf-lib"] --> MERGE
PL --> SPLIT
PL --> DELETE
PL --> ROTATE
PL --> PAGENUM
PL --> CROP
PL --> WATERMARK
PL --> IMG2PDF
PL --> EXTRACTIMG
PL --> ESIGN
PL --> REARRANGE
```

**图表来源**
- [src/lib/pdf/getPdfPreview.ts:1-30](file://src/lib/pdf/getPdfPreview.ts#L1-L30)
- [src/components/shared/PdfFilePreview.tsx:1-86](file://src/components/shared/PdfFilePreview.tsx#L1-L86)
- [src/components/shared/PdfPagePreview.tsx:1-80](file://src/components/shared/PdfPagePreview.tsx#L1-L80)
- [src/components/tool/ToolFeatureCards.tsx:1-95](file://src/components/tool/ToolFeatureCards.tsx#L1-L95)
- [messages/en/tools-pdf.json:12-44](file://messages/en/tools-pdf.json#L12-L44)
- [src/lib/pdfjs.ts:1-15](file://src/lib/pdfjs.ts#L1-L15)

## 性能考量
- **新增** 特征卡片系统优化
  - 国际化配置缓存：ToolFeatureCards组件通过useTranslations缓存翻译配置，避免重复加载。
  - 条件渲染：当featureCards.count不存在或为0时，组件直接返回null，减少不必要的渲染。
  - 图标映射：ICON_MAP预定义所有可用图标，提供默认图标回退机制。
- **新增** 预览系统优化
  - 缩略图生成：getPdfPreview函数使用160像素宽度作为默认缩放，平衡了预览质量和性能。
  - Canvas复用：PdfPagePreview组件在渲染完成后会清理Canvas上下文，避免内存泄漏。
  - 懒加载：PdfPagePreview组件仅在需要时渲染页面，提高大PDF文件的响应速度。
- 渲染与压缩
  - 转图片/压缩均涉及Canvas渲染，大页或高分辨率会显著增加内存与CPU消耗。建议合理设置scale与质量参数。
  - 压缩流程中及时释放Canvas内存，避免GPU内存泄漏。
- 并行与进度
  - 对于多页处理，建议在UI层提供进度条与取消机制，避免长时间阻塞。
- 内存管理
  - 大文件合并/拆分时注意分批处理，避免一次性加载过多页面导致内存峰值过高。
  - **新增** 预览URL管理：PdfToImage组件使用URL映射表管理生成的Blob URL，及时清理不再使用的URL。
  - **新增** 特征卡片URL：ToolFeatureCards组件使用useTranslations进行国际化查询，避免重复创建DOM元素。
- 输出优化
  - 压缩后PDF仍可能包含高分辨率图像资源，可结合外部工具二次压缩（本项目为浏览器端，建议在UI提示后续步骤）。

## 故障排除指南
- **新增** 特征卡片系统问题
  - 现象：特征卡片不显示或显示为空白。
  - 排查：检查messages/en/tools-pdf.json中featureCards配置是否正确，确保count字段为6且每个f1-f6都有完整的icon、title、description字段。
  - 参考：[messages/en/tools-pdf.json:12-44](file://messages/en/tools-pdf.json#L12-L44)
- **新增** 特征卡片图标问题
  - 现象：特征卡片图标显示为默认星形图标。
  - 排查：检查icon字段是否在ICON_MAP中有对应的图标组件，确保图标名称拼写正确。
  - 参考：[src/components/tool/ToolFeatureCards.tsx:25-43](file://src/components/tool/ToolFeatureCards.tsx#L25-L43)
- **新增** 国际化配置问题
  - 现象：特征卡片显示英文或空白。
  - 排查：确认当前语言环境是否正确，检查对应语言的tools-pdf.json文件是否存在且配置完整。
  - 参考：[messages/en/tools-pdf.json:12-44](file://messages/en/tools-pdf.json#L12-L44)
- **新增** 预览系统问题
  - 现象：预览无法生成或显示空白。
  - 排查：检查getPdfPreview函数的Canvas上下文是否可用，确认PDF文件格式正确。
  - 参考：[src/lib/pdf/getPdfPreview.ts:22-28](file://src/lib/pdf/getPdfPreview.ts#L22-L28)
- pdfjs-dist worker未配置
  - 现象：渲染失败或报错。
  - 排查：确认已调用pdfjs封装函数以设置worker路径。
  - 参考：[src/lib/pdfjs.ts:1-15](file://src/lib/pdfjs.ts#L1-L15)
- Canvas上下文不可用
  - 现象：转图片或预览时报Canvas上下文错误。
  - 排查：确保在受支持的环境中运行，且页面可见。
  - 参考：[src/lib/pdf/getPdfPreview.ts:25-26](file://src/lib/pdf/getPdfPreview.ts#L25-L26)
- 图像嵌入失败
  - 现象：图片转PDF或添加水印时报错。
  - 排查：确认图片数据有效且尺寸合理；pdf-lib版本兼容性。
  - 参考：[src/tools/pdf/images-to-pdf/logic.ts](file://src/tools/pdf/images-to-pdf/logic.ts)
- 旋转后坐标异常
  - 现象：页码或水印位置不正确。
  - 排查：检查坐标变换逻辑与页面旋转角度，确保在绘制前完成坐标换算。
  - 参考：[src/tools/pdf/add-page-numbers/logic.ts:66-74](file://src/tools/pdf/add-page-numbers/logic.ts#L66-L74)
- 大文件处理卡顿
  - 现象：合并/拆分/压缩耗时过长。
  - 排查：降低scale、减少并发、分批处理；在UI层提供取消与进度反馈。
  - 参考：[src/tools/pdf/compress/logic.ts:24-61](file://src/tools/pdf/compress/logic.ts#L24-L61)

## 结论
本PDF工具模块基于pdfjs-dist与pdf-lib实现了完整的浏览器端PDF处理能力，覆盖合并、拆分、压缩、转图片、删除页面、旋转、提取文本、添加页码、重新排列、裁剪、添加水印、图片转PDF、提取图片与电子签名等场景。**更新** 新的PDF工具特征卡片系统显著增强了用户体验，通过ToolFeatureCards组件为每个工具提供详细的特征描述，帮助用户快速了解工具的核心价值和优势。**更新** 新的PDF文件预览系统通过getPdfPreview函数和预览组件提供了快速的PDF文件信息展示和页面缩略图生成功能。通过合理的参数配置与内存管理，可在浏览器端高效完成常见PDF任务。建议在生产使用中结合进度反馈与错误提示，提升用户体验与稳定性。

## 附录

### 使用场景与参数配置建议
- 合并：适用于多份文档拼接，注意页数较多时的内存占用。**更新** 特征卡片突出页面级选择、混合格式支持、智能分隔符等功能。
- 拆分：单页或范围拆分，便于分发与归档。**更新** 集成预览后可直观看到PDF信息，特征卡片展示7种拆分模式。
- 压缩：扫描版PDF降体积，建议先试用中档质量评估效果。**更新** 预览系统可快速确认压缩前后的变化，特征卡片展示3种质量预设。
- 转图片：批量导出页面为图像，支持PNG/JPEG与质量控制。**更新** 预览功能提供实时页面预览，特征卡片展示1×到4×分辨率缩放。
- 删除页面：移除不需要的空白或水印页。**更新** PdfPagePreview组件提供直观的选择界面，特征卡片展示视觉缩略图选择。
- 旋转：统一页面方向，配合页码/水印定位。特征卡片展示3种旋转角度和元数据无损旋转。
- 提取文本：用于检索与二次加工，注意非结构化文本的清洗。特征卡片展示全文提取和维护阅读顺序。
- 添加页码：多种格式与起始页，适配不同报告模板。特征卡片展示6种位置选项和自定义起始数字。
- 重新排列：调整页面顺序。特征卡片展示拖拽排序和视觉缩略图网格。
- 裁剪：聚焦页面特定区域，去除边距。特征卡片展示4边独立边距和点精确输入。
- 添加水印：文字或图片水印，控制透明度与位置。特征卡片展示自定义水印文本和对角线布局。
- 图片转PDF：批量图片生成PDF，注意图片尺寸与对齐。特征卡片展示混合图像格式和拖拽排序。
- 提取图片：导出嵌入图片，便于二次编辑。特征卡片展示提取所有嵌入图像和ZIP一键下载。
- 电子签名：图片印章或手写签名，确保位置与透明度。特征卡片展示鼠标或触摸绘制和可调节签名宽度。
- 重新排列：调整页面顺序。特征卡片展示拖拽排序和向上/向下移动按钮。

### 与pdfjs-dist和pdf-lib的集成方式
- pdfjs-dist：通过统一封装设置worker路径，按需获取文档对象，支持渲染与文本提取。
- pdf-lib：用于PDF编辑，包括复制页面、嵌入图像/字体、设置旋转、绘制文本与保存。
- **新增** 特征卡片系统：ToolFeatureCards组件通过国际化配置动态加载工具特征描述。
- **新增** 预览系统：getPdfPreview函数提供PDF文件的快速预览，包括页数统计和缩略图生成。

### 特征卡片系统集成指南
- **ToolFeatureCards组件**：自动检测工具的featureCards配置，渲染6个特征卡片，支持图标、标题和描述。
- **国际化配置**：每个PDF工具在messages/en/tools-pdf.json中配置featureCards字段，包含count和6个f1-f6对象。
- **图标系统**：支持Lucide React图标库中的所有图标，通过icon字段指定图标名称。
- **条件渲染**：当featureCards.count不存在或为0时，组件自动隐藏特征卡片区域。

### 预览系统集成指南
- **getPdfPreview函数**：提供PDF文件的基本信息和缩略图，支持自定义缩略图宽度。
- **PdfFilePreview组件**：显示PDF文件的缩略图、名称、页数和文件大小，支持文件替换和删除。
- **PdfPagePreview组件**：渲染单个PDF页面的缩略图，支持自定义宽度和选中状态。

**章节来源**
- [src/lib/pdfjs.ts: 1-15:1-15](file://src/lib/pdfjs.ts#L1-L15)
- [src/components/tool/ToolFeatureCards.tsx: 1-95:1-95](file://src/components/tool/ToolFeatureCards.tsx#L1-L95)
- [src/lib/pdf/getPdfPreview.ts: 1-30:1-30](file://src/lib/pdf/getPdfPreview.ts#L1-L30)
- [src/components/shared/PdfFilePreview.tsx: 1-86:1-86](file://src/components/shared/PdfFilePreview.tsx#L1-L86)
- [src/components/shared/PdfPagePreview.tsx: 1-80:1-80](file://src/components/shared/PdfPagePreview.tsx#L1-L80)
- [messages/en/tools-pdf.json: 12-44:12-44](file://messages/en/tools-pdf.json#L12-L44)
- [package.json: 25](file://package.json#L25)
- [package.json: 26](file://package.json#L26)