# 工具分类

<cite>
**本文档引用的文件**
- [README.md](file://README.md)
- [src/lib/registry/index.ts](file://src/lib/registry/index.ts)
- [messages/en/tools-image.json](file://messages/en/tools-image.json)
- [messages/en/tools-video.json](file://messages/en/tools-video.json)
- [messages/en/tools-pdf.json](file://messages/en/tools-pdf.json)
- [src/tools/audio/convert/AudioConvert.tsx](file://src/tools/audio/convert/AudioConvert.tsx)
- [src/tools/image/compress/ImageCompress.tsx](file://src/tools/image/compress/ImageCompress.tsx)
- [src/tools/pdf/compress/CompressPdf.tsx](file://src/tools/pdf/compress/CompressPdf.tsx)
- [src/tools/video/compress/VideoCompress.tsx](file://src/tools/video/compress/VideoCompress.tsx)
</cite>

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构概览](#架构概览)
5. [详细组件分析](#详细组件分析)
6. [依赖分析](#依赖分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)

## 简介

PrivaDeck 是一个基于浏览器的多媒体工具箱，所有文件处理都在本地完成，实现零上传、零服务器的隐私保护设计。该项目提供了60个工具，覆盖图片、视频、音频、PDF、开发者五大分类，支持21种语言，并采用Next.js 16框架和FFmpeg.wasm技术栈。

## 项目结构

项目采用模块化的目录结构，按照功能分类组织工具代码：

```mermaid
graph TB
subgraph "应用层"
APP[Next.js 应用路由]
LAYOUT[布局组件]
COMPONENTS[共享组件]
end
subgraph "工具模块"
IMAGE[图片工具<br/>17个工具]
VIDEO[视频工具<br/>8个工具]
AUDIO[音频工具<br/>4个工具]
PDF[PDF工具<br/>14个工具]
DEVELOPER[开发者工具<br/>17个工具]
end
subgraph "核心库"
REGISTRY[工具注册表]
MEDIAPIPE[媒体管道]
ANALYTICS[分析服务]
end
subgraph "国际化"
MESSAGES[多语言消息]
I18N[国际化工具]
end
APP --> IMAGE
APP --> VIDEO
APP --> AUDIO
APP --> PDF
APP --> DEVELOPER
IMAGE --> REGISTRY
VIDEO --> REGISTRY
AUDIO --> REGISTRY
PDF --> REGISTRY
DEVELOPER --> REGISTRY
REGISTRY --> MEDIAPIPE
REGISTRY --> ANALYTICS
APP --> MESSAGES
APP --> I18N
```

**图表来源**
- [README.md:55-78](file://README.md#L55-L78)
- [src/lib/registry/index.ts:66-133](file://src/lib/registry/index.ts#L66-L133)

**章节来源**
- [README.md:55-78](file://README.md#L55-L78)
- [src/lib/registry/index.ts:1-164](file://src/lib/registry/index.ts#L1-164)

## 核心组件

### 工具注册表系统

工具注册表是整个系统的核心，负责管理所有工具的元数据和分类信息：

```mermaid
classDiagram
class ToolDefinition {
+string slug
+ToolCategory category
+boolean featured
+string name
+string description
+string metaTitle
+string metaDescription
+string[] keywords
}
class ToolRegistry {
+getAllTools() ToolDefinition[]
+getToolBySlug(slug, category?) ToolDefinition
+getToolsByCategory(category) ToolDefinition[]
+getAllSlugs() SlugDefinition[]
+getFeaturedTools(category) ToolDefinition[]
+getNonFeaturedTools(category) ToolDefinition[]
}
class ImageTools {
+imageCompress
+formatConverter
+imageResize
+imageCrop
+imageWatermark
+imageRemoveExif
+imageGrayscale
+imageFlip
+imageAddText
+imageAddBorder
+imageCircleCrop
+imagePixelate
+imageSvgToPng
+imageHeicConvert
+imageCombine
+imageSplit
+imageCollage
}
class VideoTools {
+videoTrim
+videoCompress
+videoToGif
+videoRotate
+videoFormatConvert
+videoResize
+videoToWebp
+videoMute
+videoInfo
}
class AudioTools {
+audioTrim
+audioConvert
+audioExtract
+audioVolume
}
class PDFTools {
+pdfMerge
+pdfSplit
+pdfCompress
+pdfToImage
+pdfDeletePages
+pdfRotate
+pdfExtractText
+pdfAddPageNumbers
+pdfRearrange
+pdfCrop
+pdfAddWatermark
+pdfImagesToPdf
+pdfExtractImages
+pdfEsign
}
class DeveloperTools {
+jsonFormatter
+base64
+hashGenerator
+urlEncoder
+csvJson
+timestamp
+colorConverter
+regexTester
+markdownPreview
+textDiff
+caseConverter
+yamlJson
+jsonXml
+ocr
+wordCounter
+archive
+loremIpsum
}
ToolRegistry --> ToolDefinition
ToolRegistry --> ImageTools
ToolRegistry --> VideoTools
ToolRegistry --> AudioTools
ToolRegistry --> PDFTools
ToolRegistry --> DeveloperTools
```

**图表来源**
- [src/lib/registry/index.ts:66-133](file://src/lib/registry/index.ts#L66-L133)

### 工具分类统计

根据项目文档，各分类的工具数量分布如下：

| 分类 | 工具数量 | 占比 | 示例功能 |
|------|----------|------|----------|
| 图片 | 17 | 28.3% | 格式转换、压缩、裁剪、去EXIF、拼图、加水印 |
| 开发者 | 17 | 28.3% | JSON格式化、Base64、正则测试、OCR、哈希生成 |
| PDF | 14 | 23.3% | 合并、拆分、压缩、转图片、提取文本、电子签名 |
| 视频 | 8 | 13.3% | 剪辑、压缩、转GIF、格式转换、静音 |
| 音频 | 4 | 6.7% | 剪辑、格式转换、提取音频、音量调整 |

**章节来源**
- [README.md:16-24](file://README.md#L16-L24)
- [src/lib/registry/index.ts:66-133](file://src/lib/registry/index.ts#L66-L133)

## 架构概览

系统采用分层架构设计，确保功能模块的独立性和可维护性：

```mermaid
graph TB
subgraph "前端界面层"
UI[用户界面组件]
ROUTER[Next.js路由系统]
LAYOUT[布局组件]
end
subgraph "业务逻辑层"
TOOL_LOGIC[工具业务逻辑]
VALIDATION[输入验证]
PROCESSING[数据处理]
end
subgraph "媒体处理层"
FFMEG[FFmpeg.wasm]
PDF_LIB[pdf-lib]
PDFJS[pdfjs-dist]
IMAGE_COMPRESSION[browser-image-compression]
end
subgraph "数据存储层"
LOCAL_STORAGE[浏览器本地存储]
CACHE[缓存机制]
end
subgraph "国际化层"
I18N[next-intl]
MESSAGES[多语言资源]
end
UI --> TOOL_LOGIC
ROUTER --> UI
LAYOUT --> UI
TOOL_LOGIC --> VALIDATION
TOOL_LOGIC --> PROCESSING
PROCESSING --> FFMEG
PROCESSING --> PDF_LIB
PROCESSING --> PDFJS
PROCESSING --> IMAGE_COMPRESSION
TOOL_LOGIC --> LOCAL_STORAGE
LOCAL_STORAGE --> CACHE
UI --> I18N
I18N --> MESSAGES
```

**图表来源**
- [README.md:26-33](file://README.md#L26-L33)
- [src/lib/registry/index.ts:1-164](file://src/lib/registry/index.ts#L1-L164)

## 详细组件分析

### 图片工具分类

图片工具是项目中最大的工具类别，包含17个不同的功能模块：

#### 图像压缩工具
图像压缩工具提供智能压缩算法，支持多种输出格式和质量控制：

```mermaid
sequenceDiagram
participant 用户 as 用户
participant 组件 as ImageCompress组件
participant 逻辑 as 压缩逻辑
participant 浏览器 as 浏览器API
用户->>组件 : 选择图片文件
组件->>组件 : 读取图片尺寸
组件->>用户 : 显示预览
用户->>组件 : 设置压缩参数
组件->>逻辑 : 执行压缩
逻辑->>浏览器 : 使用Canvas API处理
浏览器-->>逻辑 : 返回压缩结果
逻辑-->>组件 : 返回处理后的Blob
组件-->>用户 : 显示压缩结果
用户->>组件 : 下载压缩文件
```

**图表来源**
- [src/tools/image/compress/ImageCompress.tsx:138-178](file://src/tools/image/compress/ImageCompress.tsx#L138-L178)

#### 图像格式转换工具
格式转换工具支持WebP、PNG、JPG、AVIF、ICO等多种格式之间的转换：

```mermaid
flowchart TD
Start([开始转换]) --> ValidateInput["验证输入文件"]
ValidateInput --> CheckFormat{"检查源格式"}
CheckFormat --> |支持| GetQuality["获取质量设置"]
CheckFormat --> |不支持| ShowError["显示错误信息"]
GetQuality --> SetOutput["设置输出格式"]
SetOutput --> ProcessImage["使用Canvas API处理"]
ProcessImage --> CheckResult{"检查处理结果"}
CheckResult --> |成功| CreateBlob["创建Blob对象"]
CheckResult --> |失败| HandleError["处理错误"]
CreateBlob --> Download["下载转换文件"]
ShowError --> End([结束])
HandleError --> End
Download --> End
```

**图表来源**
- [src/tools/image/compress/ImageCompress.tsx:138-178](file://src/tools/image/compress/ImageCompress.tsx#L138-L178)

**章节来源**
- [src/tools/image/compress/ImageCompress.tsx:1-373](file://src/tools/image/compress/ImageCompress.tsx#L1-L373)

### 视频工具分类

视频工具提供完整的视频处理功能，涵盖编辑、转换、优化等多个方面：

#### 视频压缩工具
视频压缩工具支持H.264和H.265编码，提供简单和高级两种操作模式：

```mermaid
classDiagram
class VideoCompress {
+File file
+Quality quality
+string mode
+CompressOptions advancedOptions
+Blob result
+number progress
+boolean processing
+string error
+VideoMetadata sourceMetadata
+VideoMetadata outputMetadata
+handleCompress() void
+updateAdvanced(key, value) void
+detectOutputFps(video, metadata) void
}
class CompressOptions {
+VideoCodec codec
+number crf
+string preset
+string resolution
+string fps
+string audioBitrate
+string maxBitrate
}
class VideoMetadata {
+number width
+number height
+number duration
+number estimatedBitrate
+number fileSize
+string codec
+number fps
}
class FFmpegPreset {
<<enumeration>>
ultrafast
superfast
veryfast
faster
fast
medium
slow
slower
veryslow
}
VideoCompress --> CompressOptions
VideoCompress --> VideoMetadata
CompressOptions --> FFmpegPreset
```

**图表来源**
- [src/tools/video/compress/VideoCompress.tsx:45-134](file://src/tools/video/compress/VideoCompress.tsx#L45-L134)

#### 视频处理流程
视频处理采用FFmpeg.wasm进行本地编码处理：

```mermaid
sequenceDiagram
participant 用户 as 用户
participant 组件 as VideoCompress组件
participant FFmpeg as FFmpeg.wasm
participant 浏览器 as 浏览器环境
用户->>组件 : 上传视频文件
组件->>组件 : 解析视频元数据
组件->>用户 : 显示视频信息
用户->>组件 : 选择压缩参数
组件->>FFmpeg : 初始化编码器
FFmpeg->>浏览器 : 加载WebAssembly核心
FFmpeg->>FFmpeg : 执行视频编码
FFmpeg-->>组件 : 返回编码进度
FFmpeg-->>组件 : 返回压缩结果
组件-->>用户 : 显示压缩结果
用户->>组件 : 下载压缩视频
```

**图表来源**
- [src/tools/video/compress/VideoCompress.tsx:101-134](file://src/tools/video/compress/VideoCompress.tsx#L101-L134)

**章节来源**
- [src/tools/video/compress/VideoCompress.tsx:1-624](file://src/tools/video/compress/VideoCompress.tsx#L1-L624)

### PDF工具分类

PDF工具提供全面的PDF文档处理功能，支持编辑、转换、优化等操作：

#### PDF压缩工具
PDF压缩工具通过重新渲染页面来减小文件大小：

```mermaid
flowchart TD
Start([开始压缩]) --> LoadPDF["加载PDF文件"]
LoadPDF --> AnalyzePages["分析页面内容"]
AnalyzePages --> CheckContent{"检查页面类型"}
CheckContent --> |文本页面| RenderText["渲染文本内容"]
CheckContent --> |图像页面| RenderImage["渲染图像内容"]
CheckContent --> |混合页面| RenderMixed["渲染混合内容"]
RenderText --> SetQuality["设置压缩质量"]
RenderImage --> SetQuality
RenderMixed --> SetQuality
SetQuality --> ProcessPages["处理所有页面"]
ProcessPages --> CreatePDF["创建压缩PDF"]
CreatePDF --> ShowResult["显示压缩结果"]
ShowResult --> Download["下载压缩文件"]
Download --> End([结束])
```

**图表来源**
- [src/tools/pdf/compress/CompressPdf.tsx:28-45](file://src/tools/pdf/compress/CompressPdf.tsx#L28-L45)

#### PDF处理技术栈
PDF工具采用专业的JavaScript库进行处理：

| 功能 | 技术实现 | 用途 |
|------|----------|------|
| PDF解析 | pdf-lib | PDF文档操作和修改 |
| 文本提取 | pdfjs-dist | 从PDF中提取文本内容 |
| 图像提取 | pdfjs-dist | 从PDF中提取嵌入图像 |
| 文档合并 | pdf-lib | 合并多个PDF文件 |
| 页面操作 | pdf-lib | 删除、旋转、重排PDF页面 |

**章节来源**
- [src/tools/pdf/compress/CompressPdf.tsx:1-131](file://src/tools/pdf/compress/CompressPdf.tsx#L1-L131)

### 音频工具分类

音频工具提供基础的音频处理功能，目前包含4个主要工具：

#### 音频格式转换工具
音频转换工具支持MP3、WAV、OGG、AAC、FLAC等多种格式转换：

```mermaid
classDiagram
class AudioConvert {
+File file
+AudioFormat format
+Blob result
+number progress
+boolean processing
+string error
+handleConvert() void
}
class AudioFormat {
<<enumeration>>
mp3
wav
ogg
aac
flac
}
class FFmpegLogic {
+convertAudio(file, format, progressCallback) Blob
+checkBrowserSupport() boolean
}
AudioConvert --> AudioFormat
AudioConvert --> FFmpegLogic
```

**图表来源**
- [src/tools/audio/convert/AudioConvert.tsx:15-48](file://src/tools/audio/convert/AudioConvert.tsx#L15-L48)

**章节来源**
- [src/tools/audio/convert/AudioConvert.tsx:1-86](file://src/tools/audio/convert/AudioConvert.tsx#L1-L86)

### 开发者工具分类

开发者工具提供各种编程和文档处理相关的实用功能：

#### 工具分类统计
开发者工具包含17个不同类型的工具，涵盖以下功能领域：

| 功能类别 | 工具数量 | 主要工具示例 |
|----------|----------|--------------|
| 编码转换 | 4 | Base64、URL编码、十六进制、时间戳 |
| 数据格式化 | 4 | JSON格式化、CSV转JSON、YAML转JSON、XML格式化 |
| 文本处理 | 5 | 正则表达式测试、文本差异比较、单词计数、Markdown预览、Lorem Ipsum |
| 开发辅助 | 4 | OCR文字识别、颜色格式转换、哈希生成、代码高亮 |

**章节来源**
- [src/lib/registry/index.ts:115-133](file://src/lib/registry/index.ts#L115-L133)

## 依赖分析

### 核心依赖关系

```mermaid
graph TB
subgraph "运行时依赖"
NEXTJS[Next.js 16]
REACT[React 18]
TYPESCRIPT[TypeScript]
TAILWIND[Tailwind CSS v4]
end
subgraph "媒体处理依赖"
FFMEGWASM[FFmpeg.wasm]
PDFLIB[pdf-lib]
PDFJS[pdfjs-dist]
IMAGECOMP[browser-image-compression]
HEIC2ANY[heic2any]
end
subgraph "国际化依赖"
NEXTINTL[next-intl]
I18NLIB[i18n工具库]
end
subgraph "分析依赖"
GA4[GA4分析]
PWA[PWA支持]
end
NEXTJS --> REACT
NEXTJS --> NEXTINTL
NEXTJS --> TAILWIND
NEXTJS --> FFMEGWASM
NEXTJS --> PDFLIB
NEXTJS --> PDFJS
NEXTJS --> IMAGECOMP
NEXTJS --> HEIC2ANY
NEXTINTL --> I18NLIB
NEXTJS --> GA4
NEXTJS --> PWA
```

**图表来源**
- [README.md:26-33](file://README.md#L26-L33)

### 工具间依赖关系

```mermaid
graph LR
subgraph "工具注册表"
REGISTRY[工具注册表]
end
subgraph "共享组件"
FILEDROP[文件拖拽组件]
DOWNLOAD[下载按钮组件]
BUTTON[按钮组件]
SELECT[下拉选择组件]
end
subgraph "工具实现"
IMAGE_TOOLS[图片工具]
VIDEO_TOOLS[视频工具]
AUDIO_TOOLS[音频工具]
PDF_TOOLS[PDF工具]
DEV_TOOLS[开发者工具]
end
subgraph "媒体处理"
MEDIA_PIPE[媒体管道]
OBJECT_URL[对象URL钩子]
end
REGISTRY --> IMAGE_TOOLS
REGISTRY --> VIDEO_TOOLS
REGISTRY --> AUDIO_TOOLS
REGISTRY --> PDF_TOOLS
REGISTRY --> DEV_TOOLS
IMAGE_TOOLS --> FILEDROP
IMAGE_TOOLS --> DOWNLOAD
IMAGE_TOOLS --> BUTTON
IMAGE_TOOLS --> SELECT
VIDEO_TOOLS --> FILEDROP
VIDEO_TOOLS --> DOWNLOAD
VIDEO_TOOLS --> BUTTON
VIDEO_TOOLS --> SELECT
AUDIO_TOOLS --> FILEDROP
AUDIO_TOOLS --> DOWNLOAD
AUDIO_TOOLS --> BUTTON
AUDIO_TOOLS --> SELECT
PDF_TOOLS --> FILEDROP
PDF_TOOLS --> DOWNLOAD
PDF_TOOLS --> BUTTON
PDF_TOOLS --> SELECT
IMAGE_TOOLS --> MEDIA_PIPE
VIDEO_TOOLS --> MEDIA_PIPE
AUDIO_TOOLS --> MEDIA_PIPE
PDF_TOOLS --> MEDIA_PIPE
FILEDROP --> OBJECT_URL
DOWNLOAD --> OBJECT_URL
```

**图表来源**
- [src/lib/registry/index.ts:1-164](file://src/lib/registry/index.ts#L1-L164)

**章节来源**
- [src/lib/registry/index.ts:1-164](file://src/lib/registry/index.ts#L1-L164)

## 性能考虑

### 浏览器兼容性优化

系统针对不同浏览器的功能支持进行了优化：

| 功能特性 | 支持检测 | 降级方案 | 性能影响 |
|----------|----------|----------|----------|
| SharedArrayBuffer | isSharedArrayBufferSupported | 提示用户升级浏览器 | 无 |
| WebCodecs API | isWebCodecsSupported | 使用FFmpeg.wasm替代 | 中等 |
| Canvas API | 标准支持 | 无 | 无 |
| WebAssembly | 现代浏览器 | 不支持时禁用相关功能 | 无 |
| Service Worker | 支持 | PWA安装 | 无 |

### 内存管理策略

```mermaid
flowchart TD
Start([开始处理]) --> CheckMemory["检查可用内存"]
CheckMemory --> MemoryOK{"内存充足?"}
MemoryOK --> |是| ProcessFile["处理文件"]
MemoryOK --> |否| ShowError["显示内存不足提示"]
ProcessFile --> CreateObjectURL["创建对象URL"]
CreateObjectURL --> ProcessMedia["处理媒体内容"]
ProcessMedia --> Cleanup["清理临时资源"]
Cleanup --> RevokeURL["撤销对象URL"]
RevokeURL --> End([结束])
ShowError --> End
```

### 并行处理优化

系统采用异步处理和进度反馈机制：

- **批量处理**: 支持同时处理多个文件，提供实时进度显示
- **分块传输**: 大文件采用分块处理，避免内存溢出
- **进度回调**: 实时更新处理进度，提升用户体验
- **错误恢复**: 单个文件处理失败不影响其他文件

## 故障排除指南

### 常见问题诊断

#### 浏览器兼容性问题
- **症状**: 工具无法使用或功能受限
- **原因**: 浏览器不支持必要的API
- **解决方案**: 
  1. 检查浏览器版本和功能支持
  2. 更新到最新版本的现代浏览器
  3. 确保使用HTTPS协议
  4. 启用必要的浏览器功能

#### 性能问题
- **症状**: 处理速度慢或内存占用过高
- **原因**: 文件过大或设备性能不足
- **解决方案**:
  1. 减小文件尺寸或数量
  2. 关闭其他占用资源的程序
  3. 使用更高性能的设备
  4. 分批处理大文件

#### 存储空间问题
- **症状**: 无法保存或下载文件
- **原因**: 浏览器存储空间不足
- **解决方案**:
  1. 清理浏览器缓存和存储
  2. 检查设备存储空间
  3. 尝试使用其他浏览器
  4. 减小输出文件质量

**章节来源**
- [src/tools/audio/convert/AudioConvert.tsx:26-32](file://src/tools/audio/convert/AudioConvert.tsx#L26-L32)
- [src/tools/video/compress/VideoCompress.tsx:93-99](file://src/tools/video/compress/VideoCompress.tsx#L93-L99)

## 结论

PrivaDeck项目展现了现代浏览器端多媒体处理的最佳实践。通过精心设计的工具分类体系、完善的国际化支持和强大的技术架构，该项目成功实现了隐私保护与功能完整性的平衡。

### 主要优势

1. **隐私保护**: 所有处理都在本地完成，用户数据完全可控
2. **功能丰富**: 60个工具覆盖多媒体处理的各个方面
3. **性能优异**: 采用WebAssembly和Canvas API优化处理效率
4. **用户体验**: 直观的界面设计和实时进度反馈
5. **技术先进**: 使用最新的Web技术和标准

### 技术特色

- **模块化架构**: 清晰的工具分类和职责分离
- **异步处理**: 非阻塞的用户界面和后台处理
- **错误处理**: 完善的异常捕获和用户提示机制
- **国际化支持**: 21种语言的完整本地化
- **PWA支持**: 离线可用和应用安装能力

该项目为浏览器端多媒体处理提供了一个优秀的参考实现，展示了如何在保持隐私安全的同时提供丰富的功能和服务。