# 作业 4：AI 辅助学术应用

<a href="assignment_4.html">English Version</a>

**姓名**：Yang Zhanxiang  
**学号**：ZY2557211  
**提交日期**：2026.6.13  

## 项目概述

在第 4 次作业中，我选择了 **Option B: Academic/Research Tool**，并开发了一个交互式网页应用 **AeroSat Link Explorer**。

该应用围绕上海浦东机场（PVG）至巴黎戴高乐机场（CDG）的长航程航线，研究航线上的卫星通信连通性问题。它结合了平面航线地图、航空器交通证据、GEO 卫星覆盖、轨迹剖面以及链路几何可视化。项目目标是把航空与通信系统中的一个研究问题转化为可以在浏览器中运行和交互探索的软件工具。

```{raw} html
<p><a href="_static/aerosat-link-explorer/index.html">打开 AeroSat Link Explorer</a></p>
```

```{raw} html
<figure>
  <img src="_static/images/assignment4/View%201%C2%B7%20Route%20Map.png" alt="PVG-CDG 航线与 GEO 卫星位置的 View 1 航线地图" style="width: 100%;">
  <figcaption><strong>View 1 · Route Map。</strong> 该部分展示建模得到的 PVG-CDG 航线、主要地理参考点、起降机场端点以及 GEO 卫星星位，为后续卫星链路分析提供主要地理背景。</figcaption>
</figure>
```

## 动机与背景

长航程飞机通常会使用卫星通信系统支持机上互联网和运行通信。上海浦东（PVG）到巴黎戴高乐（CDG）的航线横跨欧亚大陆大范围区域，航线几何形状、卫星经度以及飞机位置都会影响通信链路质量。

本项目关注的实际问题是：

**用户如何以可视化方式探索航空器航线、历史 ADS-B 证据和 GEO 卫星覆盖之间的关系？**

这个工具面向学习和探索性分析，而不是认证级飞行运行。在开发过程中，我也认识到历史 ADS-B 数据可能稀疏且不完整，因此最终版本明确区分了 **建模得到的完整航线几何** 与 **OpenSky 历史证据点**。

## 主要功能

- 面向 PVG-CDG 和 CDG-PVG 航线的交互式平面地图。
- 四种航线选项：东方航空北线走廊和法航南线绕飞路线，并支持两个方向。
- 在赤道上按照星下点经度标出 GEO 卫星位置。
- 根据最佳 GEO 仰角等级为航线着色。
- 轨迹与链路分析区域，展示高度、地速、距离和覆盖指标。
- 链路几何侧视图，展示飞机到 GEO 卫星之间的几何关系。
- 使用 OpenSky 历史证据或备用数据展示航空器交通层。
- 明确的数据源标签，用于说明数据是建模数据、历史数据还是非实时数据。

```{raw} html
<figure>
  <img src="_static/images/assignment4/Trajectory%20%26%20Link%20Analysis.png" alt="ADS-B 轨迹剖面与卫星覆盖的 Trajectory and Link Analysis 仪表板" style="width: 100%;">
  <figcaption><strong>Trajectory &amp; Link Analysis。</strong> 该视图汇总所选航线的轨迹距离、飞行时间、最大纬度、巡航高度、平均地速、GEO 链路覆盖率以及 GEO 切换次数。高度和速度曲线把航线模型与通信覆盖指标连接起来。</figcaption>
</figure>
```

```{raw} html
<figure>
  <img src="_static/images/assignment4/Link%20Geometry.png" alt="展示飞机到 GEO 卫星仰角的 Link Geometry 侧视图" style="width: 100%;">
  <figcaption><strong>Link Geometry。</strong> 该侧视图说明飞机到 GEO 卫星的仰角如何测量，并区分 Ka 用户链路、馈电链路、GEO 轨道、本地地平线以及 ATC/ADS-B/CPDLC 路径，使通信几何关系更容易理解。</figcaption>
</figure>
```

```{raw} html
<figure>
  <img src="_static/images/assignment4/View%202%20.%20Globe.png" alt="展示航线与卫星轨道关系的 3D Globe 视图" style="width: 100%;">
  <figcaption><strong>View 2 · Globe。</strong> 3D 地球视图从空间角度补充展示航线和卫星环境，帮助把平面航线地图与球面可视化中的轨道和地理关系进行对照。</figcaption>
</figure>
```

## 技术栈

| 类别 | 工具 |
| --- | --- |
| 操作系统 | Windows |
| 前端 | HTML, CSS, JavaScript |
| 可视化 | D3.js, TopoJSON, SVG |
| 数据处理 | Python 脚本 |
| 航空数据 | OpenSky 历史 API 证据、代表性航线模型 |
| 部署目标 | Sphinx 静态网站与 GitHub Pages |
| AI 助手 | Codex coding assistant，作为主要开发协作伙伴 |

该应用是一个静态网页应用，因此可以不依赖后端服务器，直接托管在 Sphinx 课程网站中。

## 使用 AI 的开发过程

在整个项目中，我使用 AI 编程助手作为开发伙伴。这个过程不仅是简单的代码生成，还包括需求分析、前端设计、数据处理、调试和验证。

### 架构规划

项目初期，我让 AI 助手帮助规划一个基于浏览器运行的研究工具。最终形成的主要结构如下：

- `index.html`：应用页面外壳。
- `src/app.js`：交互逻辑、地图渲染、航线逻辑、图表和界面更新。
- `src/data.js`：静态航线、机场和卫星数据。
- `data/tracks/`：代表性轨迹和生成的航线数据。
- `tools/`：用于处理历史 ADS-B 证据的 Python 脚本。

这种结构使应用可以方便地部署为静态网站。

### 调试与迭代

最重要的调试过程与 ADS-B 数据有关。在一个阶段，我曾经把稀疏的 OpenSky 历史点当作完整飞行轨迹使用。这导致了不合理的急转弯和过陡的高度变化。

在检查输出结果后，我借助 AI 重新调整了逻辑：

- OpenSky 历史点现在被视为 **证据**，而不是完整连续轨迹。
- 页面展示的完整航线由平滑且物理上更合理的航线模型生成。
- UI 现在将数据来源标注为 **Modeled complete route + OpenSky evidence**。
- 元数据仍然记录 OpenSky 证据点数量和最大历史数据间隔。

这是一次有价值的 AI 辅助开发纠错过程：最初版本虽然可以运行，但数据含义是错误的。最终实现没有只是平滑视觉效果，而是修正了数据逻辑。


## 结果

当前提交版本支持：

- PVG 到 CDG 和 CDG 到 PVG 两个方向。
- 东方航空和法航的航线剖面。
- 沿航线的 GEO 卫星覆盖分析。
- 建模完整航线与 OpenSky 历史证据的联合展示。
- 交互式地图图层和交通/状态面板。


## 局限性

本工具仅用于教学和探索性分析，不是经过认证的航空、导航或卫星链路规划系统。

主要的数据限制在于，公开的 OpenSky 历史数据可能存在较大的覆盖缺口。因此，本工具并不声称页面中展示的完整航线是真实完整 ADS-B 轨迹，而是展示建模航线，并单独保留 OpenSky 数据。

## 未来工作

后续可以改进的方向包括：

- 接入商业或更完整的历史 ADS-B 数据源。
- 增加更多航空公司和航线变体。
- 改进航空器交通筛选功能。
- 增加可导出的航线与卫星覆盖对比报告。

