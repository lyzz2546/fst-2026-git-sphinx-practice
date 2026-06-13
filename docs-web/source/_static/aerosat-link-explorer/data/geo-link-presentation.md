# GEO 航空链路几何 — 课程展示参考

本文件与 [`geo-link-presentation.json`](./geo-link-presentation.json) 配套，供 PPT、答辩口播和实验报告插图使用。

---

## 1. 仰角是什么？

在飞机位置，**仰角 θ** = 当地水平面与「飞机 → GEO 卫星」视线之间的夹角。

```
                    GEO 卫星 (Ka 转发)
                         ○
                        /|
                       / |
                      /  |  ← 视线 (slant range)
                     /   |
                    / θ  |
         飞机 ✈ ───●─────┘
                  ═════════ 当地水平 (切线)
              ╭──────────────╮
              │    地球      │
              ╰──────────────╯
```

应用内公式（与教材一致）：

\[
\theta = \arctan\frac{\cos(\Delta\lambda)\cos(\phi) - R_e/R_{geo}}{\sqrt{1 - \cos^2(\Delta\lambda)\cos^2(\phi)}}
\]

- \(\phi\) = 飞机纬度，\(\Delta\lambda\) = 卫星经度 − 飞机经度  
- \(R_e/R_{geo} \approx 6378/42164 \approx 0.1513\)

**为何 PVG–CDG 要关心 θ？**  
长途航路纬度可达 ~62°N，经度横跨欧亚；不同 GEO 槽位（56°E、62°E、83°E…）在不同航段「看得最高」。θ 越低，Ka 链路越吃雨衰和天线扫描极限 — 工程上常用 **10°** 作为可用下限（与应用内 tier 一致）。

---

## 2. 端到端链路（GX Aviation，bent-pipe）

**乘客宽带（Ka）— 画在 PPT 主链上：**

```
[ 乘客 Wi‑Fi ] → [ 机载 Ka 终端 ] ⇄ [ GEO Inmarsat-5 ]
                                      ⇅ feeder
                              [ SAS / Teleport 地面站 ]
                                      ⇅
                              [  terrestrial IP  ]
```

- **Bent-pipe**：卫星 mainly 变频 + 放大，不在星上跑 IP 协议栈。  
- **SAS（Satellite Access Station）**：Inmarsat GX 在 Fucino、Nemea、美国、加拿大、新西兰等地建有接入站（见 JSON `gxGroundSegmentExamples`）。

**不要画进同一条链：**

| 系统 | 用途 |
|------|------|
| **ATC 塔台** | VHF 话音、监视 — 与 Ku/Ka 宽带无关 |
| **ADS-B / OpenSky** | 监视数据源 — 本项目的飞机图标来自此，不是卫星回传 |
| **L-band 安全链路** | 可与 Ka 并行，但是另一套服务 |

---

## 3. 侧视示意图（建议 PPT 第 2 页）

可在网页 **Analysis 面板** 截取，或按下列元素手绘：

```
   [ Earth station ]··············> (○) GEO  @ 62.6°E
         feeder                         |
                                        | Ka user link
   ════════════════════════════════════|═══════════  Earth surface
                         θ            /
                    ✈ Aircraft ------/
```

标注清单：

1. 地球弧（可注明 **Not to scale**）  
2. 飞机在巡航高度（~11–12 km，相对 GEO 可忽略）  
3. GEO 在赤道经度槽位正上方  
4. θ 角弧 + 数值（如 18.4°）  
5. 虚线：SAS ↔ GEO（feeder）  
6. 实线：飞机 ↔ GEO（user link）  
7. 小图标/脚注：ATC* 独立系统  

---

## 4. 与应用 View 1 的对应关系

| 界面元素 | 含义 |
|----------|------|
| 地图彩色航线 | 代表 ADS-B 轨迹上 **best GEO 仰角 tier** |
| 高度/速度剖面 | 32 个代表轨迹采样点的时间序列 |
| **新增：Elevation side-view** | 拖动滑块或点击剖面图 → 该时刻的几何示意 + θ |
| GEO 黄点 | 赤道星下点（公开槽位经度） |
| Aircraft Traffic | OpenSky 快照；绿 = 当前方向直飞航班号 |

**重要区分（答辩时建议主动说）：**

- **代表轨迹** = 一条构造/公开的 ATS 风格路径，用于 GEO 分析  
- **实时飞机** = OpenSky 某一时刻区域快照，两者不必是同一航班  

---

## 5. 建议 PPT 大纲（4 页）

1. **问题**：PVG–CDG 长途 Ka IFC，GEO 仰角沿程如何变化？  
2. **几何**：侧视图 + θ 定义 + 10° 工程下限  
3. **系统**：bent-pipe + SAS + 机载终端（ATC 单独一页或脚注）  
4. **演示**：AeroSat Link Explorer 截图（地图 tier + 剖面 + 侧视联动）

详细 bullet 见 JSON `slideDeckOutline`。

---

## 6. 参考文献（链接汇总）

| 主题 | 链接 |
|------|------|
| 仰角计算器 / 公式 | https://www.satnow.com/calculators/earth-station-elevation-angle-calculator |
| Look angle 教程 | https://rfessentials.com/rf-knowledge-base/how-do-i-calculate-the-look-angle-and-azimuth-from-a-ground-station-to-a-geostat/ |
| ITU-R S.1503 | https://www.itu.int/dms_pubrec/itu-r/rec/s/R-REC-S.1503-4-202309-I!!PDF-E.pdf |
| Inmarsat GX 概述 | https://developer.inmarsat.com/technology/gx/ |
| GX 地面站新闻 | https://avweb.com/press-releases/inmarsat-completes-construction-of-the-global-xpress-ground-network/ |
| GX Aviation 白皮书 PDF | https://www.inmarsat.com/content/dam/inmarsat/corporate/documents/aviation/insights/2017/Inmarsat%20Aviation%20-%20The%20Correctly%20Connected%20Aircraft.pdf.coredownload.pdf |
| JetWave 试验 | https://www.ukspace.org/honeywell-inmarsat/ |
| Pisa 卫星通信课件 PDF | https://docenti.ing.unipi.it/m.luise/SatCom/14%20%20-%20The%20How%20and%20Why%20-%20Services%20&%20Constellations_Mobile%20(RdG).pdf |
| Inmarsat 公开星位 | https://www.inmarsat.com/en/about/our-satellites.html |

---

## 7. 口播提示（中英各一句）

- **中文**：仰角是飞机抬头看 GEO 的角度；角度越大，穿过大气越短，Ka 越稳。  
- **English**: Elevation angle is how far above the horizon the GEO appears; higher θ means shorter atmospheric path and better Ka-band margin.

- **中文**：塔台管空管话音，不管乘客 Wi‑Fi；宽带走 Ka 卫星 + 地面站。  
- **English**: ATC uses VHF/ADS-B; passenger broadband uses Ka via GEO and ground gateways — separate systems.
