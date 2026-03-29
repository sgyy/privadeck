# PDF高级工具

<cite>
**本文档引用的文件**
- [logic.ts](file://src/tools/pdf/add-page-numbers/logic.ts)
- [AddPageNumbers.tsx](file://src/tools/pdf/add-page-numbers/AddPageNumbers.tsx)
- [logic.ts](file://src/tools/pdf/esign/logic.ts)
- [ESign.tsx](file://src/tools/pdf/esign/ESign.tsx)
- [logic.ts](file://src/tools/pdf/add-watermark/logic.ts)
- [logic.ts](file://src/tools/pdf/compress/logic.ts)
- [pdfjs.ts](file://src/lib/pdfjs.ts)
- [tools-pdf.json](file://messages/zh-Hans/tools-pdf.json)
- [package.json](file://package.json)
- [README.md](file://README.md)
</cite>

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构概览](#架构概览)
5. [详细组件分析](#详细组件分析)
6. [依赖关系分析](#依赖关系分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)
10. [附录](#附录)

## 简介

PDF高级工具是一个基于浏览器的PDF处理工具集，专注于提供强大的PDF编辑功能。该项目采用纯前端技术栈，所有处理都在浏览器本地完成，确保用户隐私和数据安全。项目包含14个PDF工具，涵盖合并、拆分、压缩、转图片、提取文本、电子签名等核心功能。

该项目的核心优势在于：
- **隐私保护**：所有文件处理都在浏览器本地完成，文件永不离开用户设备
- **离线可用**：页面加载后可完全离线使用，支持PWA安装
- **多语言支持**：支持21种语言，包括简体中文、繁体中文、英语等
- **高性能**：使用pdf-lib和pdfjs-dist等专业库，确保处理效率

## 项目结构

项目采用模块化的组织方式，按照功能分类管理不同类型的工具：

```mermaid
graph TB
subgraph "应用层"
App[Next.js App Router]
Layout[布局组件]
Tools[工具页面]
end
subgraph "工具层"
subgraph "PDF工具"
AddPageNumbers[添加页码]
ESign[电子签名]
Watermark[水印]
Compress[压缩]
ExtractText[提取文本]
Merge[合并]
Split[拆分]
end
subgraph "其他工具"
Image[图片工具]
Video[视频工具]
Audio[音频工具]
Developer[开发者工具]
end
end
subgraph "基础设施"
Lib[工具库]
Messages[国际化]
Components[共享组件]
end
App --> Tools
Tools --> AddPageNumbers
Tools --> ESign
Tools --> Watermark
Tools --> Compress
Tools --> Lib
Tools --> Messages
Tools --> Components
```

**图表来源**
- [README.md:55-78](file://README.md#L55-L78)

**章节来源**
- [README.md:16-25](file://README.md#L16-L25)
- [README.md:55-78](file://README.md#L55-L78)

## 核心组件

### PDF处理库架构

项目使用两个核心PDF处理库来实现不同的功能：

```mermaid
graph LR
subgraph "PDF处理库"
PDFlib[pdf-lib<br/>文本操作、页面编辑]
PDFJS[pdfjs-dist<br/>PDF渲染、页面计数]
end
subgraph "功能模块"
AddPageNumbers[添加页码]
ESign[电子签名]
Watermark[水印]
Compress[压缩]
ExtractText[提取文本]
end
PDFlib --> AddPageNumbers
PDFlib --> ESign
PDFlib --> Watermark
PDFlib --> Compress
PDFJS --> ExtractText
PDFJS --> ESign
```

**图表来源**
- [package.json:25-26](file://package.json#L25-L26)

### 数据流架构

```mermaid
sequenceDiagram
participant User as 用户
participant UI as 界面组件
participant Logic as 业务逻辑
participant PDFLib as pdf-lib
participant PDFJS as pdfjs-dist
User->>UI : 上传PDF文件
UI->>Logic : 处理请求
Logic->>PDFLib : 加载PDF文档
PDFLib-->>Logic : 返回PDF对象
Logic->>PDFLib : 执行PDF操作
PDFLib-->>Logic : 返回处理结果
Logic-->>UI : 返回Blob数据
UI-->>User : 下载处理后的PDF
```

**图表来源**
- [logic.ts:13-87](file://src/tools/pdf/add-page-numbers/logic.ts#L13-L87)
- [logic.ts:4-49](file://src/tools/pdf/esign/logic.ts#L4-L49)

**章节来源**
- [package.json:32](file://package.json#L32)

## 架构概览

### 技术栈架构

```mermaid
graph TB
subgraph "前端框架"
NextJS[Next.js 16<br/>App Router]
React[React 19<br/>客户端组件]
TypeScript[TypeScript]
end
subgraph "PDF处理层"
PDFlib[pdf-lib<br/>1.17.1]
PDFJS[pdfjs-dist<br/>5.5.207]
end
subgraph "工具层"
AddPageNumbers[添加页码]
ESign[电子签名]
Watermark[水印]
Compress[压缩]
ExtractText[提取文本]
end
subgraph "基础设施"
I18N[next-intl<br/>21种语言]
PWA[PWA支持]
Analytics[分析追踪]
end
NextJS --> React
React --> PDFlib
React --> PDFJS
PDFlib --> AddPageNumbers
PDFlib --> ESign
PDFlib --> Watermark
PDFlib --> Compress
PDFJS --> ExtractText
NextJS --> I18N
NextJS --> PWA
NextJS --> Analytics
```

**图表来源**
- [package.json:22-31](file://package.json#L22-L31)
- [README.md:26-33](file://README.md#L26-L33)

### 组件交互流程

```mermaid
flowchart TD
Start([用户上传PDF]) --> Validate[验证文件格式]
Validate --> LoadPDF[加载PDF文档]
LoadPDF --> ChooseTool[选择处理工具]
ChooseTool --> AddPageNumbers[添加页码]
ChooseTool --> ESign[电子签名]
ChooseTool --> Watermark[添加水印]
ChooseTool --> Compress[压缩PDF]
ChooseTool --> ExtractText[提取文本]
AddPageNumbers --> ProcessPageNumbers[处理页码]
ESign --> ProcessSignature[处理签名]
Watermark --> ProcessWatermark[处理水印]
Compress --> ProcessCompression[处理压缩]
ExtractText --> ProcessExtraction[处理提取]
ProcessPageNumbers --> SavePDF[保存PDF]
ProcessSignature --> SavePDF
ProcessWatermark --> SavePDF
ProcessCompression --> SavePDF
ProcessExtraction --> SavePDF
SavePDF --> Download[下载处理结果]
Download --> End([完成])
```

**图表来源**
- [AddPageNumbers.tsx:54-73](file://src/tools/pdf/add-page-numbers/AddPageNumbers.tsx#L54-L73)
- [ESign.tsx:120-146](file://src/tools/pdf/esign/ESign.tsx#L120-L146)

**章节来源**
- [README.md:26-33](file://README.md#L26-L33)

## 详细组件分析

### 添加页码功能

#### 实现原理

添加页码功能通过pdf-lib库实现，支持多种位置和格式的页码标注：

```mermaid
classDiagram
class NumberPosition {
<<enumeration>>
"bottom-center"
"bottom-left"
"bottom-right"
"top-center"
"top-left"
"top-right"
}
class NumberFormat {
<<enumeration>>
"number"
"pageN"
"nOfTotal"
}
class AddPageNumbersLogic {
+addPageNumbers(file, options) Blob
+formatFileSize(bytes) string
-calculateTextPosition() void
-handleRotation() void
}
class PageNumberOptions {
+position : NumberPosition
+fontSize : number
+format : NumberFormat
+startPage : number
}
AddPageNumbersLogic --> NumberPosition
AddPageNumbersLogic --> NumberFormat
AddPageNumbersLogic --> PageNumberOptions
```

**图表来源**
- [logic.ts:3-11](file://src/tools/pdf/add-page-numbers/logic.ts#L3-L11)
- [logic.ts:13-21](file://src/tools/pdf/add-page-numbers/logic.ts#L13-L21)

#### 算法机制

页码添加算法包含以下关键步骤：

1. **页面遍历**：遍历PDF中的所有页面
2. **条件判断**：根据起始页参数跳过前面的页面
3. **格式化**：根据选择的格式生成页码文本
4. **坐标计算**：处理页面旋转和坐标变换
5. **文本绘制**：使用pdf-lib绘制页码

```mermaid
flowchart TD
Start([开始处理]) --> LoadPDF[加载PDF文档]
LoadPDF --> GetPages[获取页面列表]
GetPages --> LoopPages{遍历页面}
LoopPages --> CheckStart{检查起始页}
CheckStart --> |跳过| NextPage[下一个页面]
CheckStart --> |处理| CalcFormat[计算页码格式]
CalcFormat --> CalcCoords[计算坐标位置]
CalcCoords --> HandleRotation{处理页面旋转}
HandleRotation --> |90°| Rotate90[转换坐标]
HandleRotation --> |180°| Rotate180[转换坐标]
HandleRotation --> |270°| Rotate270[转换坐标]
HandleRotation --> |0°| NoRotate[保持坐标]
Rotate90 --> DrawText[绘制页码]
Rotate180 --> DrawText
Rotate270 --> DrawText
NoRotate --> DrawText
DrawText --> NextPage
NextPage --> LoopPages
LoopPages --> |完成| SavePDF[保存PDF]
SavePDF --> End([结束])
```

**图表来源**
- [logic.ts:28-83](file://src/tools/pdf/add-page-numbers/logic.ts#L28-L83)

#### 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| position | NumberPosition | "bottom-center" | 页码位置 |
| fontSize | number | 12 | 字体大小（像素） |
| format | NumberFormat | "number" | 页码格式 |
| startPage | number | 1 | 起始页码 |

**章节来源**
- [logic.ts:13-21](file://src/tools/pdf/add-page-numbers/logic.ts#L13-L21)
- [AddPageNumbers.tsx:26-32](file://src/tools/pdf/add-page-numbers/AddPageNumbers.tsx#L26-L32)

### 电子签名功能

#### 实现原理

电子签名功能结合了Canvas绘图和pdf-lib嵌入技术：

```mermaid
sequenceDiagram
participant User as 用户
participant Canvas as Canvas画布
participant ESignLogic as 电子签名逻辑
participant PDFLib as pdf-lib
participant PDFJS as pdfjs-dist
User->>Canvas : 绘制签名
Canvas->>ESignLogic : 获取签名数据URL
ESignLogic->>PDFJS : 获取页面总数
PDFJS-->>ESignLogic : 返回页面数量
ESignLogic->>PDFLib : 加载PDF文档
ESignLogic->>PDFLib : 嵌入PNG签名
ESignLogic->>PDFLib : 设置签名位置
PDFLib-->>ESignLogic : 返回处理结果
ESignLogic-->>User : 下载签名PDF
```

**图表来源**
- [ESign.tsx:120-146](file://src/tools/pdf/esign/ESign.tsx#L120-L146)
- [logic.ts:4-49](file://src/tools/pdf/esign/logic.ts#L4-L49)

#### 技术实现

电子签名功能包含以下关键技术点：

1. **Canvas签名绘制**：使用HTML5 Canvas API绘制用户手写签名
2. **数据URL转换**：将Canvas内容转换为PNG数据URL
3. **PDF嵌入**：使用pdf-lib将PNG图像嵌入到PDF中
4. **坐标系统**：处理PDF坐标系统与Canvas坐标系统的差异

```mermaid
classDiagram
class ESignLogic {
+addSignature(file, signatureDataUrl, pageIndex, position) Blob
+getPageCount(file) number
+formatFileSize(bytes) string
}
class SignaturePosition {
+x : number
+y : number
+width : number
+height : number
}
class CanvasSignature {
+drawSignature() void
+getDataURL() string
+clearSignature() void
}
ESignLogic --> SignaturePosition
ESignLogic --> CanvasSignature
```

**图表来源**
- [logic.ts:4-9](file://src/tools/pdf/esign/logic.ts#L4-L9)
- [ESign.tsx:105-146](file://src/tools/pdf/esign/ESign.tsx#L105-L146)

#### 用户界面设计

电子签名界面提供了直观的操作体验：

```mermaid
graph TB
subgraph "签名界面"
FileUpload[文件上传]
SignaturePad[签名画布]
Settings[位置设置]
Controls[操作按钮]
end
subgraph "配置选项"
PageSelect[页面选择]
PositionXY[X/Y坐标]
WidthHeight[宽高设置]
end
FileUpload --> SignaturePad
SignaturePad --> Settings
Settings --> PageSelect
Settings --> PositionXY
Settings --> WidthHeight
Controls --> Apply[应用签名]
Apply --> Download[下载结果]
```

**图表来源**
- [ESign.tsx:148-275](file://src/tools/pdf/esign/ESign.tsx#L148-L275)

**章节来源**
- [ESign.tsx:105-146](file://src/tools/pdf/esign/ESign.tsx#L105-L146)
- [logic.ts:4-49](file://src/tools/pdf/esign/logic.ts#L4-L49)

### 水印功能

#### 实现原理

水印功能通过pdf-lib的文本绘制功能实现对角线水印效果：

```mermaid
flowchart TD
Start([开始添加水印]) --> LoadPDF[加载PDF文档]
LoadPDF --> GetPages[获取页面列表]
GetPages --> LoopPages{遍历页面}
LoopPages --> CalcCenter[计算页面中心]
CalcCenter --> CalcTextSize[计算文本尺寸]
CalcTextSize --> CalcOffset[计算偏移量]
CalcOffset --> SetRotation[设置45度旋转]
SetRotation --> DrawText[绘制水印文本]
DrawText --> LoopPages
LoopPages --> |完成| SavePDF[保存PDF]
SavePDF --> End([结束])
```

**图表来源**
- [logic.ts:3-34](file://src/tools/pdf/add-watermark/logic.ts#L3-L34)

#### 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| text | string | "机密" | 水印文本内容 |
| opacity | number | 0.5 | 水印透明度（0-1） |
| fontSize | number | 12 | 字体大小（像素） |

**章节来源**
- [logic.ts:3-6](file://src/tools/pdf/add-watermark/logic.ts#L3-L6)

### PDF压缩功能

#### 实现原理

PDF压缩功能通过pdfjs-dist渲染和pdf-lib重建实现：

```mermaid
sequenceDiagram
participant User as 用户
participant CompressLogic as 压缩逻辑
participant PDFJS as pdfjs-dist
participant PDFlib as pdf-lib
User->>CompressLogic : 选择压缩质量
CompressLogic->>PDFJS : 加载PDF文档
PDFJS-->>CompressLogic : 返回PDF对象
CompressLogic->>PDFJS : 渲染页面到Canvas
PDFJS-->>CompressLogic : 返回Canvas内容
CompressLogic->>PDFlib : 创建新PDF文档
CompressLogic->>PDFlib : 嵌入JPEG图像
PDFlib-->>CompressLogic : 返回新PDF
CompressLogic-->>User : 下载压缩后的PDF
```

**图表来源**
- [logic.ts:12-66](file://src/tools/pdf/compress/logic.ts#L12-L66)

#### 压缩质量配置

| 质量等级 | 缩放比例 | JPEG质量 | 文件大小影响 |
|----------|----------|----------|--------------|
| high | 1.5 | 0.8 | 较小，质量高 |
| medium | 1.0 | 0.6 | 中等，平衡 |
| low | 0.75 | 0.4 | 最小，质量较低 |

**章节来源**
- [logic.ts:6-10](file://src/tools/pdf/compress/logic.ts#L6-L10)

## 依赖关系分析

### 核心依赖关系

```mermaid
graph TB
subgraph "应用依赖"
NextJS[Next.js 16]
React[React 19]
TypeScript[TypeScript]
TailwindCSS[Tailwind CSS]
end
subgraph "PDF处理依赖"
PDFlib[pdf-lib 1.17.1]
PDFJS[pdfjs-dist 5.5.207]
FFmpeg[FFmpeg.wasm]
end
subgraph "工具依赖"
I18N[next-intl 4.8.3]
Fflate[fflate 0.8.2]
BrowserCompression[browser-image-compression 2.0.2]
end
subgraph "开发依赖"
ESLint[ESLint]
TailwindPostCSS[Tailwind PostCSS]
TypeScriptTS[TypeScript]
end
NextJS --> PDFlib
NextJS --> PDFJS
NextJS --> I18N
PDFlib --> Fflate
PDFJS --> FFmpeg
React --> BrowserCompression
```

**图表来源**
- [package.json:11-32](file://package.json#L11-L32)

### 工具间依赖关系

```mermaid
graph LR
subgraph "PDF工具"
AddPageNumbers[添加页码]
ESign[电子签名]
Watermark[水印]
Compress[压缩]
ExtractText[提取文本]
Merge[合并]
Split[拆分]
end
subgraph "共享依赖"
PDFlib[pdf-lib]
PDFJS[pdfjs-dist]
Utils[通用工具]
end
AddPageNumbers --> PDFlib
ESign --> PDFlib
ESign --> PDFJS
Watermark --> PDFlib
Compress --> PDFlib
Compress --> PDFJS
ExtractText --> PDFJS
Merge --> PDFlib
Split --> PDFlib
Utils --> PDFlib
Utils --> PDFJS
```

**图表来源**
- [package.json:25-26](file://package.json#L25-L26)

**章节来源**
- [package.json:11-44](file://package.json#L11-L44)

## 性能考虑

### 浏览器性能优化

项目在设计时充分考虑了浏览器性能限制：

1. **内存管理**：及时释放Canvas和PDF对象
2. **异步处理**：使用Promise和async/await避免阻塞UI
3. **进度反馈**：提供处理进度指示器
4. **文件大小限制**：根据设备内存动态调整处理策略

### 处理速度优化

```mermaid
flowchart TD
Start([开始处理]) --> CheckMemory[检查可用内存]
CheckMemory --> HasMemory{内存充足?}
HasMemory --> |是| FullProcess[完整处理]
HasMemory --> |否| OptimizedProcess[优化处理]
FullProcess --> RenderHigh[高质量渲染]
OptimizedProcess --> RenderLow[低质量渲染]
RenderHigh --> EmbedHigh[高质量嵌入]
RenderLow --> EmbedLow[低质量嵌入]
EmbedHigh --> SavePDF[保存PDF]
EmbedLow --> SavePDF
SavePDF --> End([完成])
```

### 存储优化

- **临时文件**：处理过程中的中间文件及时清理
- **缓存策略**：合理使用浏览器缓存机制
- **增量处理**：支持大文件的分块处理

## 故障排除指南

### 常见问题及解决方案

#### 页码添加问题

**问题**：页码位置不正确
- **原因**：页面旋转导致坐标计算错误
- **解决方案**：使用坐标变换函数处理不同旋转角度

**问题**：页码格式不符合预期
- **原因**：格式字符串配置错误
- **解决方案**：检查NumberFormat枚举值

#### 电子签名问题

**问题**：签名无法绘制
- **原因**：Canvas API不支持或权限问题
- **解决方案**：检查浏览器兼容性和用户手势

**问题**：签名位置不准确
- **原因**：坐标系统转换错误
- **解决方案**：验证PDF坐标系与Canvas坐标系的转换

#### 性能问题

**问题**：处理大文件时内存不足
- **原因**：PDF文件过大超出浏览器内存限制
- **解决方案**：提供文件大小警告和分块处理选项

**章节来源**
- [logic.ts:56-74](file://src/tools/pdf/add-page-numbers/logic.ts#L56-L74)
- [logic.ts:23-36](file://src/tools/pdf/esign/logic.ts#L23-L36)

### 错误处理机制

```mermaid
flowchart TD
Start([开始处理]) --> TryProcess{尝试处理}
TryProcess --> |成功| Success[返回结果]
TryProcess --> |失败| CatchError[捕获错误]
CatchError --> CheckErrorType{检查错误类型}
CheckErrorType --> |文件格式错误| FormatError[格式错误提示]
CheckErrorType --> |内存不足| MemoryError[内存不足提示]
CheckErrorType --> |其他错误| OtherError[其他错误提示]
FormatError --> ShowMessage[显示错误信息]
MemoryError --> ShowMessage
OtherError --> ShowMessage
ShowMessage --> End([结束])
Success --> End
```

**图表来源**
- [AddPageNumbers.tsx:67-72](file://src/tools/pdf/add-page-numbers/AddPageNumbers.tsx#L67-L72)
- [ESign.tsx:140-145](file://src/tools/pdf/esign/ESign.tsx#L140-L145)

## 结论

PDF高级工具项目展现了现代浏览器端PDF处理的最佳实践。通过精心设计的架构和专业的技术选型，项目实现了：

1. **隐私保护**：所有处理都在浏览器本地完成，确保用户数据安全
2. **高性能**：使用专业PDF处理库，提供流畅的用户体验
3. **易用性**：直观的界面设计和丰富的配置选项
4. **可扩展性**：模块化的架构便于添加新的PDF功能

该项目为浏览器端PDF处理提供了一个完整的解决方案，既满足了专业用户的需求，又保持了良好的用户体验。通过持续的优化和功能扩展，该项目有望成为浏览器端PDF处理领域的标杆产品。

## 附录

### 国际化支持

项目支持21种语言，包括：
- 中文（简体、繁体）
- 英语
- 日语、韩语
- 法语、德语、西班牙语
- 俄语、阿拉伯语等

### 安全特性

- **零上传**：所有文件处理都在浏览器本地完成
- **离线可用**：支持PWA安装，完全离线使用
- **数据加密**：文件在传输过程中保持加密状态
- **隐私保护**：不收集用户个人信息

### 部署指南

项目支持静态部署到Cloudflare Pages等平台，构建后可直接部署。