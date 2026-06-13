# 基于公开代表航迹的 PVG-CDG 国际航线机上卫星通信链路几何可视化分析

*Trajectory characterisation and satellite-communication coverage overlay for the
PVG-CDG long-haul route, based on publicly observable ADS-B routing.*

---

## 封面（Cover）

| | |
|---|---|
| 课程 | 现代空中交通管理 / Fundamentals of Software Technology (Assignment 4) |
| 题目 | 基于公开代表航迹的 PVG-CDG 国际航线机上卫星通信链路几何可视化分析 |
| 姓名 | _填写_ |
| 学号 | _填写_ |
| 专业 | _填写_ |
| 日期 | _填写_ |

---

## 摘要 (Abstract)

> 关键词：空中交通管理 / ADS-B 轨迹分析 / 卫星通信 / 机上互联网 (IFC) / 仰角 / 多轨道融合
>
> *Keywords: Air Traffic Management; ADS-B trajectory; satellite communications;
> in-flight connectivity (IFC); elevation angle; multi-orbit integration.*

针对上海浦东（PVG）至巴黎戴高乐（CDG）这条长航程跨欧亚国际航线，本项目以公开机场坐标、公开航班信息和**代表性 ADS-B-style 航迹样本**为输入，构建一个可在浏览器内运行的轨迹与卫星链路几何叠加分析系统。系统量化沿 MU 北线和 AF 南线两类代表航路的 **Inmarsat GX GEO** 卫星仰角分布、可服务比例与最佳卫星切换事件，并以 Starlink / OneWeb 公开 TLE 作为可选 LEO 可视化对比。当前结果表明：在内置 GEO 槽位与 10° 仰角门限下，两条代表航路均保持几何可见；但 MU 北线最高纬度约 62°N，最佳 GEO 最低仰角约 18.5°，明显低于 AF 南线的约 32.7°。本系统区分**公开事实 / 代表性样本 / 计算可视化 / 不可公开确认内容**四层数据边界，可作为机上卫星通信与现代航空通信网络教学展示工具。

---

## 1. 引言 (Introduction)

### 1.1 研究背景

随着智慧民航、低空经济和卫星互联网的快速发展，机上互联网（In-Flight Connectivity, IFC）已经从"附加服务"演化为长航程航司的差异化竞争点。截至 2025 年，
SpaceX Starlink Aviation、Eutelsat OneWeb、Inmarsat / Viasat GX 等多家运营商面向商用航司提供 Ka 频段宽带服务，且整体架构正向 **GEO + LEO 多轨道融合 (Multi-Orbit IFC)** 演进 [1][2]。
然而**长航程跨欧亚航线**（如 PVG-CDG）的链路可用性问题在公开文献中通常以理论覆盖图呈现，缺少**真实航迹上的可量化指标**。

### 1.2 研究问题

> **R1**：基于公开航班信息与代表性 ADS-B-style 航迹样本，PVG-CDG 不同运营人航路选择的纬度、距离和巡航剖面有什么差异？
>
> **R2**：以公开的 Inmarsat-5 / Inmarsat-6 GEO 子卫星经度为输入，沿该轨迹的最佳 GEO 仰角分布如何？哪些航段会跌入实务工程门限（10°）以下？
>
> **R3**：将候选 LEO 网络（Starlink, OneWeb）的公开 TLE 数据叠加到同一轨迹时，多轨道架构如何作为 GEO 航空宽带的补充能力进行可视化说明？

### 1.3 研究意义

1. 用**公开数据**回答一个**真实运营场景**的问题，避免对商业机密的不当推断
2. 将**ATM 学科**（航路、ADS-B、空管区域）与**通信学科**（链路预算、仰角、切换）首次在同一可视化界面叠加
3. 为后续**空天地一体化网络 SAGIN** 的学科教学提供可运行教具

---

## 2. 系统描述 (System Description)

### 2.1 系统总体架构

```
+--------------------------------------------------------------+
|                    AeroSat Link Explorer                     |
|                                                              |
|  +-------------------+    +-----------------------------+    |
|  |  Public Data Tier |--->|  Browser-side Analytics    |    |
|  |                   |    |  Tier (vanilla JS + D3 +   |    |
|  | OpenSky ADS-B     |    |  Chart.js + Three.js +     |    |
|  | OurAirports       |    |  satellite.js)             |    |
|  | CelesTrak TLE     |    +-----------------------------+    |
|  | Inmarsat fleet    |          |             |              |
|  +-------------------+          v             v              |
|                       View 1 (2D)        View 2 (3D)        |
|                       D3 Equirectangular Three.js Globe     |
|                       + Coverage tier   + Orbital shells    |
|                       overlay           + Candidate sats    |
|                                                              |
|                       Analysis Panel: stats / chart /        |
|                       per-satellite coverage table           |
+--------------------------------------------------------------+
```

> **图 2-1**：AeroSat Link Explorer 系统框图。数据层为公开数据源，分析层为浏览器端可视化与统计。

### 2.2 软件栈

| 模块 | 选型 | 用途 |
|---|---|---|
| 2D 矢量地图 | D3.js + TopoJSON | Natural Earth 国界 + 等积投影 + 世界平铺 |
| 2D 图表 | Chart.js | 高度 / 速度剖面图 |
| 3D 球体 | Three.js + OrbitControls | 真实地球纹理 + LEO/MEO/GEO 轨道层 |
| 轨道传播 | satellite.js (SGP4) | CelesTrak TLE 浏览器端传播 |
| 静态宿主 | Python `http.server` | 课堂演示无依赖部署 |

### 2.3 输入数据

1. **ADS-B-style track**：`src/data.js#adsbTrackNorthern` 与 `src/data.js#adsbTrackSouthern`。北线包含 34 条样本，南线包含 32 条样本。
   - **真实来源验证路径**：使用 `tools/fetch_opensky.py --icao24 <MU219 注册码> --time <unix>` 从 OpenSky Network `/api/tracks/all` 拉取真实历史航迹后替换。
2. **GEO 子卫星经度**：`src/data.js#geoSatellites`。主分析对象为 Inmarsat GX 公开 GEO 槽位：I-5 F1 @ 62.6°E、I-5 F4 @ 56.5°E、I-5 F3 @ 179.6°E、GX5/F5 @ 11.0°E、I-6 F1 @ 83.8°E；I-5 F2 @ 55°W 作为其他舰队槽位参考。
3. **LEO TLE**：CelesTrak GP feed (`gp.php?GROUP=starlink&FORMAT=json`)，运行时按需加载。

### 2.4 数据边界

| 项 | 是否可证 | 证据 / 限制 |
|---|---|---|
| 航线存在 | 是 | Directflights / FlightsFrom 公开排班 |
| 机场坐标 | 是 | OurAirports CC-BY |
| 轨迹真实性 | 部分 | 当前样本为代表性 ADS-B-style 轨迹，可用 OpenSky 历史数据替换 |
| 卫星几何 | 是 | CelesTrak TLE / Inmarsat 公开船位 |
| 单次航班实际接入卫星 | **否** | 需航司 / 终端 / 网络运营方数据 |

---

## 3. 方法设计 (Method)

### 3.1 GEO 卫星仰角计算

设飞机位于 $(\phi, \lambda)$，GEO 卫星子星点经度 $\lambda_s$，地球半径 $R_e=6378\,\mathrm{km}$，地球同步轨道半径 $R_{geo}=42164\,\mathrm{km}$。中央角 $\gamma$ 满足

$$
\cos \gamma = \cos \phi \cdot \cos(\lambda - \lambda_s)
$$

仰角 $\epsilon$（弧度）为

$$
\epsilon = \arctan\left( \frac{\cos\gamma - R_e/R_{geo}}{\sqrt{1 - \cos^2\gamma}} \right)
$$

当 $\cos\gamma < R_e/R_{geo} \approx 0.1513$ 时，卫星几何上低于地平线，定义为不可见。

### 3.2 链路服务分级

参考 ITU-R S.1503 和 Ka 频段机载终端通行实践，按最佳 GEO 仰角划分 5 级覆盖：

| 等级 | 仰角范围 | 含义 |
|---|---|---|
| Strong | ≥ 25° | 高余量，全频段可用 |
| Usable | 10–25° | 工程可用范围 |
| Limited | 5–10° | 雨衰风险加大 |
| Marginal | 0–5° | 接近地平线，多径严重 |
| Blocked | < 0° | 几何不可见 |

### 3.3 沿轨迹的指标聚合

对 ADS-B 样本点 $p_i, i=1..N$，定义：

- **航迹长度** $D = \sum_{i=1}^{N-1} \text{Haversine}(p_i, p_{i+1})$
- **最大纬度** $\phi_\text{max} = \max \phi_i$
- **GEO 覆盖比例** $C = \frac{1}{N}\sum_{i=1}^{N} \mathbf{1}[\epsilon^\star(p_i) \ge 10°]$，其中 $\epsilon^\star$ 是 4 颗 GEO 中的最大仰角
- **切换次数** $H = \sum_{i=2}^{N} \mathbf{1}[\arg\max_{sat}\epsilon(p_i, sat) \neq \arg\max_{sat}\epsilon(p_{i-1}, sat)]$

### 3.4 LEO 候选网络可见数（扩展指标）

读取 CelesTrak Starlink / OneWeb TLE，用 satellite.js 在浏览器端进行 SGP4 传播，对每个 $p_i$ 统计仰角 ≥ 10° 的卫星数 $L_i$。本指标在课程展示中作为对比项使用。

---

## 4. 实验分析 (Experiments and Results)

### 4.1 实验设置

- **航班样本**：2 条 PVG-CDG 代表性轨迹（MU 北线 34 个采样点 / 645 分钟；AF 南线 32 个采样点 / 675 分钟）
- **运行环境**：本地 Python `http.server` + Chrome 124+
- **可重复性**：直接打开 `http://localhost:8000`，截图记录数值

### 4.2 实验结果

#### 4.2.1 轨迹特征

> _在此处插入软件展示的 4 张主截图：(a) 2D 地图含轨迹与覆盖分级；(b) 高度速度剖面图；
> (c) GEO 覆盖统计面板；(d) 3D 球体含轨道层。_

应用界面 `Route Stat Grid` 给出的关键指标：

| 指标 | 数值 | 备注 |
|---|---|---|
| 轨迹长度 | MU 北线约 10,815 km；AF 南线约 10,537 km | 基于内置样本点 Haversine 聚合 |
| 飞行时长 | MU 10.75 h；AF 11.25 h | 代表性数据 |
| 最高纬度 | MU 62.0°N；AF 49.5°N | 北线高纬度特征更明显 |
| 巡航高度 | 11.8 km | 样本最大高度 |
| 平均地速 | MU 762 km/h；AF 743 km/h | 排除地面/低速段 |
| GEO 覆盖比例 | 100% | 任一路由服务 GX 仰角 ≥ 10° |
| GEO 切换次数 | 3 次 | 最佳 GEO 槽位沿航迹变化 |

#### 4.2.2 沿轨迹覆盖分级

> _插入 "Best-GEO elevation tier" 图例 + 地图截图_

地图将每个 ADS-B 段按最佳 GEO 仰角着色，可观察到：

- 出发段（PVG 起飞至中亚上空）：长时间处于 **Strong** / **Usable** 区
- 中段（西伯利亚北部 60–62°N）：进入 **Limited** / **Marginal** 区
- 北欧 / 波罗的海段：随经度西移，I-5 F2（-55°W）开始可见，重新回到 Usable
- 进近段（CDG 进场）：高仰角 GEO 与 LEO 共同可用

#### 4.2.3 卫星级别贡献

`per-satellite-table` 给出每颗 GEO 在轨迹上 ≥ 10° 仰角的覆盖比例：

| 卫星 | 子星点 | 覆盖比例 |
|---|---|---|
| Inmarsat-5 F1 | 62.6 °E | MU 100.0%；AF 100.0% |
| Inmarsat-5 F4 | 56.5 °E | MU 100.0%；AF 100.0% |
| Inmarsat-5 F3 | 179.6 °E | MU 20.6%；AF 21.9% |
| Inmarsat GX5/F5 | 11.0 °E | MU 58.8%；AF 62.5% |
| Inmarsat-6 F1 | 83.8 °E | MU 58.8%；AF 65.6% |

#### 4.2.4 LEO 补充（可选实验）

加载 Starlink / OneWeb TLE 后，系统可在 3D 视图中显示候选 LEO 星座位置。该部分用于说明多轨道候选网络，不作为本报告的主定量结论；主结论仍以 GEO 仰角几何为准。

### 4.3 讨论

1. 真实 PVG-CDG 航路**不跨北极**：理论大圆弧顶 72°N 与真实 ATS 弧顶 ~62°N 相差 10°，对 GEO 覆盖问题的严重度判断有量级影响
2. 当前公开 GX 槽位下，代表航迹没有跌破 10° 门限，但北线最低仰角明显低于南线，说明航路选择会改变 GEO 链路余量
3. 多 GEO 资产协作可降低单一槽位带来的几何风险，体现多星覆盖的重要性
4. LEO 网络（Starlink / OneWeb）的优势应作为未来扩展实验，不宜在当前版本中过度推断

---

## 5. 总结 (Conclusion)

本项目以 PVG-CDG 代表航路为例，构建了一个**基于公开资料和代表性样本的轨迹+卫星链路几何叠加分析系统**，得到沿航迹的 GEO 链路可用性量化指标。系统在浏览器端运行，数据边界明确，可直接用于课程教学与延展研究。

**主要创新点**：

- 将 ADS-B 轨迹与多 GEO 仰角计算耦合为同一交互式可视化界面
- 区分 "客观证据 / 计算可视化 / 不可证内容" 三层数据边界
- 提供可替换数据源（OpenSky）的接口，支持研究可重复性

**后续工作**：

- 用 OpenSky 或其他授权历史 ADS-B 数据替换代表性样本
- 引入 LEO 切换决策算法（最早可见时间、最大可见时长）
- 把分析模块迁移到 Three.js 3D 球体上，做空管员视角演示

---

## 参考文献 (References)

> 至少 15 篇。以下为初步列表，请根据中文 / 英文 / 期刊 / 标准混合补全。

[1] ITU-R Recommendation S.1503: Functional description to be used in developing software tools for determining conformity of non-geostationary-satellite orbit fixed-satellite system networks with limits contained in Article 22 of the Radio Regulations.

[2] J. Liu, Y. Shi, et al., "Space-Air-Ground Integrated Network: A Survey," IEEE Communications Surveys & Tutorials, 2018.

[3] Inmarsat, Global Xpress Fleet Overview, https://www.inmarsat.com/

[4] CelesTrak, NORAD GP element data formats, https://celestrak.org/NORAD/

[5] OpenSky Network, ADS-B / Mode-S Open API, https://opensky-network.org/

[6] OurAirports open data, https://ourairports.com/data/

[7] SpaceX, Starlink Aviation, https://www.starlink.com/aviation

[8] Eutelsat / OneWeb, Aviation Connectivity, https://www.eutelsat.com/

[9] 中国民航局，《中国民航高质量发展指标体系》，2024.

[10] D. Vallado, Fundamentals of Astrodynamics and Applications, 4th ed., Microcosm Press, 2013.

[11] R. Wertz, J. Everett, J. Puschell (eds.), Space Mission Engineering: The New SMAD, 2011.

[12] EUROCONTROL, Performance Review Report (PRR), https://www.eurocontrol.int/

[13] ICAO Doc 9924, Aeronautical Surveillance Manual.

[14] T. Pratt, J. Allnutt, Satellite Communications, 3rd ed., Wiley, 2019.

[15] 张三, 李四, "面向跨极航线的多轨道卫星通信链路切换决策," 航空学报, 2024 (示例占位).

---

## 附录 A：软件运行说明

```bash
cd "E:\Projects\Python\Fundamentals of Software Technology\aerosat-link-explorer"
python -m http.server 8000
# 浏览器打开 http://localhost:8000
```

## 附录 B：用真实 OpenSky 数据替换样本轨迹

```bash
cd aerosat-link-explorer/tools
python fetch_opensky.py --icao24 <ICAO24-HEX> --time <UNIX_TS> \
    --user <OPENSKY_USER> --password <OPENSKY_PASSWORD> --out new_track.json
# 然后把 new_track.json 内容粘到 src/data.js 的 AEROSAT_DATA.adsbTrack
```

## 附录 C：AI 辅助开发说明（对应 Assignment 4）

本项目使用 Cursor IDE / LLM 助手作为开发协助者。AI 协助的边界：

- **辅助**：代码框架设计、bug 定位（Leaflet vs D3 架构识别、StrReplace 调试）、报告骨架草稿
- **不替代**：实验数据生成需运行真实代码；论文实验结果与讨论需由作者完成

详细开发日志见 `docs/development-log.md`。
