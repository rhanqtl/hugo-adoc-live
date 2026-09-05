# AsciiDoc Live

AsciiDoc Live 是一个面向长篇技术文章的极简 Hugo 主题。视觉取向接近 PaperMod 的克制感，阅读布局由顶栏导航、正文栏与页内目录组成；Asciidoctor HTML5 元素的覆盖范围以[官方默认样式说明](https://docs.asciidoctor.org/asciidoctor/latest/html-backend/default-stylesheet/)和[默认样式源码](https://github.com/asciidoctor/asciidoctor/blob/v2.0.x/src/stylesheets/asciidoctor.css)为基准。

它不依赖前端框架。即使 JavaScript 被禁用，正文、站点导航、脚注前向跳转和 Asciidoctor 原生的脚注返回仍然可用；JavaScript 只增强阅读设置、代码复制、目录高亮、多引用返回链接与超宽屏边注。

## 功能

- 顶栏主导航、约 47rem 的正文栏、超宽屏左侧页内目录；平板和手机使用正文前的折叠目录。
- Inter + Noto Sans SC 正文字体栈，示例使用 Google Fonts；代码块保留 Maple Mono。
- 流式字号、读者手动缩放、跟随系统的明暗模式、阅读进度、打印样式与 reduced-motion 支持。
- Asciidoctor HTML5 内置结构：section anchor、admonition、sidebar/example/open block、source/literal/callout、quote/verse、image/audio/video、stem、所有列表与 marker、definition/horizontal list、checklist、UI macro、内置 role、表格 frame/grid/stripes/halign/valign、脚注和 bibliography。
- LaTeX 行内/块级公式：使用 Asciidoctor 原生 `latexmath` / `stem` 语法，主题按页面自动加载 MathJax，并处理长公式的横向滚动。
- 脚注跳转/跳回；同一具名脚注被多次引用时，为每处引用补充返回链接。
- 文献引用跳转；同一条文献被多次引用时，在文献条目后生成 `↩1`、`↩2` 返回链接。
- 文内交叉引用沿用 AsciiDoc 原生语法，跨 Hugo 页面使用 permalink 感知的 `xref` shortcode。
- 普通 sidebar 和 `sidenote` 边注；边注只在有足够空间时进入右栏，否则保持正文流。
- Compiler Explorer、C++ Insights 响应式 iframe shortcode，带懒加载、sandbox 和新窗口回退。

## 环境要求

- Hugo 0.146 或更新版本；标准版与 Extended 均可。
- Ruby 与 Asciidoctor 2.0。Hugo 使用外部 `asciidoctor` 可执行文件渲染 `.adoc`，它必须在 `PATH` 中。

确认环境：

```sh
hugo version
asciidoctor --version
```

## 主题目录结构

主题采用 Hugo 0.146 引入的新模板目录约定：页面模板直接位于 `layouts` 根目录，partial 与 shortcode 分别放在 `_partials` 和 `_shortcodes`。`exampleSite` 只保存演示站的配置、内容和静态文件，不混入主题运行资源。

```text
adoc-live/
├── archetypes/
│   └── default.adoc
├── assets/
│   ├── css/main.css
│   └── js/main.js
├── layouts/
│   ├── _partials/
│   ├── _shortcodes/
│   ├── baseof.html
│   ├── home.html
│   ├── page.html
│   ├── section.html
│   ├── taxonomy.html
│   ├── term.html
│   └── 404.html
├── exampleSite/
│   ├── content/
│   ├── static/
│   └── hugo.toml
├── hugo.toml
└── theme.toml
```

根目录 `hugo.toml` 声明兼容的 Hugo 版本，`theme.toml` 保存主题展示元数据；构建结果不会提交到主题目录。

## 安装

把主题放在站点的 `themes/adoc-live`：

```sh
git submodule add YOUR_THEME_REPOSITORY themes/adoc-live
```

在 `hugo.toml` 中启用主题和 Asciidoctor。`toc = "auto"` 很重要：Hugo 默认会从 Asciidoctor 输出中提取 TOC，再通过 `.TableOfContents` 交给主题；没有这个属性，宽屏右侧目录和窄屏折叠目录都将为空。

```toml
theme = "adoc-live"
locale = "zh-CN"
hasCJKLanguage = true

[params]
description = "站点简介"
dateFormat = "2006-01-02"
repositoryURL = "https://github.com/you/repo" # 可删除
fontCSS = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;500;600;700;800&display=swap"
mapleFontCSS = "https://fontsapi.zeoseven.com/442/main/result.css"

[markup.asciidocExt]
backend = "html5"
failureLevel = "warn"
noHeaderOrFooter = true
safeMode = "safe"
workingFolderCurrent = true

[markup.asciidocExt.attributes]
icons = "font"
sectanchors = ""
experimental = ""
stem = "latexmath"
toc = "auto"
idprefix = ""
idseparator = "-"
imagesdir = "/images"

[markup.tableOfContents]
startLevel = 2
endLevel = 4

[markup.highlight]
noClasses = false
style = "onedark"

[security.exec]
allow = ["^asciidoctor$"]
```

`failureLevel = "warn"` 会让损坏的引用、弃用语法等 warning 直接使构建失败，适合文档站 CI。如果已有站点需要渐进迁移，可以先使用 Asciidoctor 默认的 `fatal`。

正文使用 Inter + Noto Sans SC，示例通过 Google Fonts 加载；代码块使用 Maple Mono，示例通过 ZeoSeven Fonts 加载。生产环境也可以自托管字体：删除 `fontCSS` / `mapleFontCSS`，把字体文件与 `@font-face` CSS 放进站点 `static/fonts` / `static/css`，再将对应参数指向自托管 CSS。主题不会把体积很大的完整字体文件提交到仓库中。

## 写一篇文章

Hugo front matter 后保留 AsciiDoc 文档标题。嵌入式 Asciidoctor 不会重复渲染这个文档标题，页面上的 `h1` 由 Hugo 模板生成。

```asciidoc
+++
title = "一次 lowering 的生命周期"
date = 2026-09-05
description = "从语义绑定到 IR 生成。"
showReadingTime = true
tags = ["compiler", "IR"]
+++

= 一次 lowering 的生命周期

[.lead]
这是导语。

[#binding]
== 语义绑定

正文 footnote:scope[脚注会自动出现在文章末尾。]
```

也可以用主题的 archetype：

```sh
hugo new content guide/my-pass.adoc
```

## 跳转与返回

### 页内章节

显式 ID 最稳定，尤其适合中文标题：

```asciidoc
参见 <<lowering-contract,lowering 契约>>。

[#lowering-contract]
== Lowering 契约
```

### 跨 Hugo 页面

直接写 `xref:other.adoc[]` 时，Asciidoctor 生成的 `.html` 路径可能与 Hugo pretty URL 不一致。主题 shortcode 在构建时解析目标 Page：

```go-html-template
{{< xref page="/guide/asciidoctor-tour.adoc" id="pipeline" text="编译流水线" >}}
```

目标不存在时构建会失败，而不是留下一个静默的坏链接。

### 脚注

```asciidoc
第一次出现 footnote:latency[端到端响应时间。]，稍后再次引用 footnote:latency[]。
```

Asciidoctor 自带第一次引用的来回链接；主题脚本检测重复具名脚注，并在定义末尾补上每一处引用的返回链接。

### 参考文献

```asciidoc
经典教材给出了定量方法 <<hennessy2019>>，后文再次引用 <<hennessy2019>>。

== 参考文献

[bibliography]
* [[[hennessy2019,Hennessy & Patterson 2019]]] John L. Hennessy and David A. Patterson. _Computer Architecture: A Quantitative Approach_. 2019.
```

浏览器端会在对应文献后补充所有引用位置的返回链接。

## LaTeX 数学公式

主题直接支持 Asciidoctor 原生 STEM 语法，不需要 Markdown 风格的 `$` 或 `$$`。行内公式写成：

```asciidoc
圆的面积是 latexmath:[A = \pi r^2]，欧拉恒等式也可以写成 stem:[e^{i\pi}+1=0]。
```

块级公式使用 passthrough 块，以免 AsciiDoc 解释 LaTeX 中的字符：

```asciidoc
[latexmath]
++++
\begin{aligned}
T_p &= T_s + \frac{T_\parallel}{p} \\
S_p &= \frac{T_1}{T_p}
\end{aligned}
++++
```

需要编号和公式引用时，在文档头启用 AMS 编号，并使用 LaTeX 的 `\label` / `\eqref`：

```asciidoc
:eqnums: AMS

[latexmath]
++++
\begin{equation}
S(N) = \frac{1}{(1-P) + \frac{P}{N}}
\label{amdahl-speedup}
\end{equation}
++++

由 latexmath:[\eqref{amdahl-speedup}] 可知并行部分存在收益上限。
```

只要源文件出现 `latexmath:`、`[latexmath]`、`stem:` 或 `[stem]`，主题就会为该页自动加载 MathJax；普通页面不加载数学脚本。也可以设置站点级 `params.math = true` 强制全站加载，或在某一页设置 `math = false` 显式禁用。默认使用 MathJax 4 的官方 jsDelivr 地址；离线部署时，将 `params.mathJaxURL` 指向自托管的 `tex-chtml.js`。

完整示例见 [`exampleSite/content/guide/latex.adoc`](exampleSite/content/guide/latex.adoc)。

## Sidebar 与边注

标准 sidebar 保持正文宽度：

```asciidoc
.背景
****
这是不会打断主线的背景信息。
****
```

增加 `sidenote` role 后，在至少 1400px 宽的视口进入右侧页边；较窄视口自动恢复为正文块：

```asciidoc
.实现细节
[.sidenote]
****
这条信息在手机上仍按正常阅读顺序出现。
****
```

超宽屏页内目录会放在左侧并跟随滚动；sidenote 保持在正文右侧，贴近关联内容，避免目录和边注在同一侧互相抢空间。

## 嵌入交互式工具

Compiler Explorer 的 `/e` 页面是嵌入界面。也可以传入保存后的链接或自建实例地址：

```go-html-template
{{< compiler-explorer
  src="https://godbolt.org/e"
  title="比较 Clang 与 GCC"
  height="640"
>}}
```

C++ Insights 使用相同接口：

```go-html-template
{{< cppinsights
  src="https://cppinsights.io/"
  title="观察 range-for 展开"
  height="620"
>}}
```

浏览器是否允许显示第三方页面由对方的 CSP / `X-Frame-Options` 决定，所以 shortcode 始终显示“新窗口打开”。iframe 默认允许脚本、同源状态、表单、弹窗、下载与剪贴板；如果内容不可信，请复制 shortcode 到站点 `layouts/_shortcodes` 并进一步收紧 `sandbox`。

## 语法高亮和 Asciidoctor 扩展

主题使用 Hugo 内置的 Chroma 语法高亮。普通 Markdown code fence 和 Hugo `highlight` shortcode 按 `[markup.highlight]` 配置输出；AsciiDoc 的 `[source,lang]` 块会在模板里后处理为 Hugo Chroma HTML，因此不需要额外安装 Rouge。

```toml
[markup.highlight]
noClasses = false
style = "onedark"
```

主题 CSS 默认提供接近 VS Code One Dark+ 的暗色代码块；Chroma 支持的语言会显示 token 色彩，不支持的语言会回退为普通文本，但仍保留语言标签和 Asciidoctor callout。需要 `asciidoctor-diagram`、`asciidoctor-bibtex` 等 Ruby 扩展时，将 gem 安装到 Asciidoctor 所在环境，再配置：

```toml
[markup.asciidocExt]
extensions = ["asciidoctor-diagram"]
workingFolderCurrent = true
```

扩展的可执行权限和文件访问范围仍由 Hugo `[security]` 与 Asciidoctor `safeMode` 控制。

## 运行完整示例

仓库内的 `exampleSite` 覆盖脚注、重复引用、bibliography、章节跳转、边注、admonition、表格、列表、callout、LaTeX 行内/块级/编号公式和两个 iframe：

```sh
hugo server --source exampleSite
```

做一次严格的静态构建：

```sh
hugo --source exampleSite \
  --destination /tmp/adoc-live-public \
  --cleanDestinationDir \
  --logLevel info
```

本次实现用 Hugo `v0.164.0+extended` 与 Asciidoctor `2.0.26` 验证。

## 可定制项

- `params.description`：站点说明与 meta description。
- `params.eyebrow`：首页标题上方的小字。
- `params.dateFormat`：日期格式，默认 `2006-01-02`。
- `params.repositoryURL`：页脚源码链接；省略即隐藏。
- `params.fontCSS`：正文字体 CSS URL；省略时只使用本机 Inter / Noto Sans SC 与系统 sans-serif 回退。
- `params.mapleFontCSS`：代码字体 CSS URL；省略时只使用本机 Maple Mono 与系统 monospace 回退。
- `params.math`：强制全站加载 MathJax；未设置时按页面中的 AsciiDoc 数学语法自动判断。
- 页面 `math = true` / `math = false`：强制启用或禁用当前页面的 MathJax。
- `params.mathJaxURL`：MathJax `tex-chtml.js` 地址，默认使用 jsDelivr 上的 MathJax 4 主版本，也可改为自托管文件。
- `params.customCSS`：站点 `static` 下额外 CSS 路径数组。
- 页面 `navHidden = true`：从首页列表隐藏。
- 页面 `showReadingTime = true`：显示 Hugo 计算的阅读时间；默认不显示。
- 页面 `source`：在正文末尾显示“编辑本页”。

Hugo 的查找顺序允许站点用同路径文件覆盖主题模板、partial、shortcode 和 asset，因此不需要直接修改主题即可做品牌化。

## 许可证

主题代码使用 MIT License。Inter、Noto Sans SC 与 Maple Mono 使用 SIL Open Font License 1.1；字体由配置的 CDN 或你的自托管位置单独提供。
