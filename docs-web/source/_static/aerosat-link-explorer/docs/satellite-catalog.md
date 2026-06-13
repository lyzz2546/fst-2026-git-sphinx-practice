# PVG–CDG 航路公开卫星目录

> **用途**：记录上海浦东 (PVG) — 巴黎戴高乐 (CDG) 代表性长途航路上，公开资料可查证的相关 **GEO** 与 **LEO** 卫星/星座。  
> **机器可读版本**：[`../data/satellite-catalog.json`](../data/satellite-catalog.json)  
> **更新日期**：2026-06-08  
> **边界**：本目录为公开信息整理，**不代表**某次具体航班实际使用的卫星或链路。

---

## 1. 航路与分析范围

| 项目 | 说明 |
|------|------|
| 航线 | PVG (ZSPD) → CDG (LFPG) |
| 轨迹来源 | 项目内代表性 ADS-B 风格航迹（约 31°N–62°N，121°E→3°E） |
| 经度带（粗略） | 东亚离港 → 中亚/西伯利亚 → 北欧/西欧进近 |
| 项目当前仰角模型 | 仅 **Inmarsat GX GEO**（`data.js` → `geoSatellites`） |
| LEO 可视化 | CelesTrak TLE + `satellite.js` 传播（Starlink / OneWeb） |

---

## 2. GEO 卫星（按与航路相关性）

### 2.1 主分析对象 — Inmarsat Global Xpress (GX)

航空 Ka 宽带历史上以 Inmarsat GX 为主；Viasat 收购 Inmarsat 后仍常以 GX 名义出现在公开材料中。

| ID | 名称 | 星下点经度 | 状态 | 航路相关性 | 项目 `data.js` |
|----|------|-----------|------|-----------|----------------|
| i5-f1 | Inmarsat-5 F1 (GX-1) | **62.6°E** | 在轨 | **高** — 欧亚中段 | ✅ 已收录 |
| i5-f4 | Inmarsat-5 F4 (GX-4) | **56.5°E** | 在轨 | **高** — 欧亚中段 | ✅ 已收录 |
| i5-f2 | Inmarsat-5 F2 (GX-2) | **55°W** | 在轨 | 低 — 美洲轨位 | ✅ 已收录 |
| i5-f3 | Inmarsat-5 F3 (GX-3) | **179.6°E** | 在轨 | 中 — 华东离港段 | ✅ 已收录 |
| i5-f5 | Inmarsat GX5 (F5) | **11°E** | 在轨 | **高** — 西欧进近 | ✅ 已收录 |
| i6-f1 | Inmarsat-6 F1 | **83.8°E** | 在轨 | **高** — 中亚段 | ✅ 已收录 |
| i6-f2 | Inmarsat-6 F2 | — | **在轨故障** | 无 | ❌ 不纳入 |

**公开引用**

- [Wikipedia — Inmarsat（舰队表含 I-5 / I-6 经度）](https://en.wikipedia.org/wiki/Inmarsat)
- [SatSig — GEO 卫星经度列表](https://www.satsig.net/sslist.htm)（2026-06-08 抓取：I-5 F1 62.6°E、F4 56.5°E、F3 179.6°E、GX5 11.0°E、I-6 F1 83.8°E）
- [SatBeams — Inmarsat-6 F1 @ 83.8°E](https://www.satbeams.com/satellites?norad=50319)
- [N2YO — INMARSAT 6-F1 (NORAD 50319)](https://www.n2yo.com/satellite/?s=50319)
- [Viasat Aviation（GX 航空产品公开页）](https://www.viasat.com/aviation/)

**说明**：原 `data.js` 中 `inmarsat-fleet` 指向的 Inmarsat 官网舰队页可能失效；经度以 Wikipedia + SatSig 交叉验证为准。

---

### 2.2 次要 GEO — 航空 IFC 公开候选（未纳入当前仰角计算）

以下卫星/系统在公开材料中与 **Intelsat Aviation、Eutelsat Aviation、Panasonic Avionics** 等航电集成商相关，对 PVG–CDG 走廊有潜在几何可见性，但**项目当前未写入 `geoSatellites`**。

| ID | 名称 | 星下点经度 | 状态 | 备注 |
|----|------|-----------|------|------|
| is-39 | Intelsat 39 | 62.0°E | 在轨 | Epic HTS，欧亚可见 |
| is-22 | Intelsat 22 | 72.1°E | 在轨 | Ku/C |
| is-15 | Intelsat 15 | 85.2°E | 在轨 | Ku |
| is-33e | Intelsat 33e | 60°E | **2024-10 解体失效** | 曾用于 Ku 航空 IFC，仅历史参考 |
| eutelsat-konnect-vhts | Eutelsat Konnect VHTS | 2.7°E | 在轨 | Ka；Eutelsat 多轨方案 GEO 层 |
| eutelsat-10b | Eutelsat 10B | 10°E | 在轨 | Ku/Ka |
| i4-f1 | Inmarsat-4 F1 | 178.1°E | 在轨 | _legacy L-band_，非 Ka 主分析 |

**公开引用**

- [SatSig — GEO 列表（Intelsat / Eutelsat 经度）](https://www.satsig.net/sslist.htm)
- [Intelsat Aviation](https://www.intelsat.com/aviation/)
- [Eutelsat Aviation](https://www.eutelsat.com/satellite-services/aviation)
- [Wikipedia — Intelsat 33e（含 2024 失效）](https://en.wikipedia.org/wiki/Intelsat_33e)
- [SpaceNews — Intelsat 33e 在轨解体](https://spacenews.com/intelsat-33e-loses-power-in-geostationary-orbit/)
- [Panasonic Avionics — IFC Network（GEO+LEO 公开描述）](https://www.panasonic.aero/our-offerings/in-flight-connectivity/network)

---

## 3. LEO 星座（公开 TLE 源）

LEO 卫星数量大、位置随时间变；公开分析通常按 **星座 + CelesTrak GP 元数据** 对接，而非逐星手工维护。

| ID | 星座 | 典型轨道 | 航空公开产品 | CelesTrak GROUP | 项目状态 |
|----|------|---------|-------------|-----------------|---------|
| starlink | Starlink | ~550 km, i≈53° | [Starlink Aviation](https://www.starlink.com/aviation) | `starlink` | ✅ `publicSatelliteFeeds` |
| oneweb | OneWeb / Eutelsat OneWeb | ~1200 km, i≈87° | [Eutelsat Aviation](https://www.eutelsat.com/satellite-services/aviation) | `oneweb` | ✅ 已接入 |
| iridium-next | Iridium NEXT | ~780 km, i≈86.4° | [Iridium Certus Aviation](https://ifp.iridium.com/iridium-certus-aviation/) | `iridium-NEXT` | ⚠️ providers 有述，TLE 未接 |

**CelesTrak JSON 端点（与项目一致）**

- Starlink: https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json
- OneWeb: https://celestrak.org/NORAD/elements/gp.php?GROUP=oneweb&FORMAT=json
- Iridium NEXT: https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium-NEXT&FORMAT=json

**格式与限制**

- [CelesTrak GP 数据格式说明](https://www.celestrak.org/NORAD/documentation/gp-data-formats.php)
- [CelesTrak 卫星组索引（含 Communications）](https://www.celestrak.org/NORAD/elements/)
- CelesTrak 对高频重复下载有速率/频次限制（2026 年起对 Active/Starlink 等组强化）；课程演示建议缓存 JSON，勿每次刷新全量拉取。

**LEO 与航路关系（公开层面）**

- **Starlink / OneWeb**：公开 marketed 航空宽带；是否服务 PVG–CDG 取决于航司终端与合同，**不能从 ADS-B 推断**。
- **Iridium NEXT**：L 波段 Certus，偏驾驶舱/运维/低速链路，非乘客 Wi‑Fi 主候选；几何上航路全程可见 LEO 星，但项目未做 LEO 逐段统计。

---

## 4. 明确未列入主表的对象

| 类别 | 示例 | 原因 |
|------|------|------|
| MEO | SES O3b mPOWER | 非 GEO/LEO；项目中仅作 `orbitShells` 对比 |
| GNSS | GPS / BeiDou 等 | 导航，非 IFC |
| 未来 LEO | Telesat Lightspeed, Kuiper | TLE 可获，航空 IFC 公开部署与 PVG–CDG 无稳定绑定 |
| 失效 GEO | Inmarsat-6 F2, Intelsat 29e/33e | 不应参与“当前可用性”仰角分析 |

---

## 5. 项目对接数据格式

### 5.1 GEO → `src/data.js`

```javascript
geoSatellites: [
  {
    id: "i5-f1",                    // 与 catalog.id 一致
    name: "Inmarsat-5 F1 (GX)",
    operator: "Inmarsat / Viasat",
    lon: 62.6,                      // catalog.subSatelliteLongitudeDeg
    band: "Ka",                     // catalog.band 取主波段字符串
    sourceId: "inmarsat-fleet"      // 指向 sources 键
  }
]
```

**筛选规则**：`recommendedForElevation === true` 且 `status === "operational"`。

### 5.2 LEO → `src/data.js`

```javascript
publicSatelliteFeeds: [
  {
    id: "starlink",
    label: "Starlink",
    provider: "Starlink Aviation",
    shellId: "leo",
    color: "#12b3a8",
    url: "<celestrakUrl from catalog>"
  }
]
```

### 5.3 完整 Schema

见 [`../data/satellite-catalog.json`](../data/satellite-catalog.json) 顶层字段：

- `schemaVersion`
- `projectIntegration` — 字段映射、同步流程、已知 `data.js` 修正项
- `geoSatellites[]` — 含 `sources[]`、`recommendedForElevation`
- `leoConstellations[]` — 含 `celestrakGroup`、`celestrakUrl`

### 5.4 已完成的数据修正

已同步 [`satellite-catalog.json`](../data/satellite-catalog.json) 到 `data.js`：

1. 修正 **i5-f4** → `lon: 56.5`
2. 修正 **i6-f1** → `lon: 83.8`
3. 新增 **i5-f3** (179.6°E)、**i5-f5** (11°E)
4. 保留 **i5-f2** (55°W) 作为其他 GX 舰队槽位参考，不纳入 route-serving 主结论。

---

## 6. 参考文献（公开 URL 汇总）

| # | 标题 | URL |
|---|------|-----|
| 1 | Wikipedia — Inmarsat | https://en.wikipedia.org/wiki/Inmarsat |
| 2 | SatSig GEO 经度表 | https://www.satsig.net/sslist.htm |
| 3 | SatBeams — Inmarsat-6 F1 | https://www.satbeams.com/satellites?norad=50319 |
| 4 | N2YO — INMARSAT 6-F1 | https://www.n2yo.com/satellite/?s=50319 |
| 5 | Viasat Aviation | https://www.viasat.com/aviation/ |
| 6 | Intelsat Aviation | https://www.intelsat.com/aviation/ |
| 7 | Eutelsat Aviation | https://www.eutelsat.com/satellite-services/aviation |
| 8 | Starlink Aviation | https://www.starlink.com/aviation |
| 9 | Iridium Certus Aviation | https://ifp.iridium.com/iridium-certus-aviation/ |
| 10 | CelesTrak GP formats | https://www.celestrak.org/NORAD/documentation/gp-data-formats.php |
| 11 | CelesTrak element sets | https://www.celestrak.org/NORAD/elements/ |
| 12 | Wikipedia — Intelsat 33e | https://en.wikipedia.org/wiki/Intelsat_33e |
| 13 | SpaceNews — IS-33e breakup | https://spacenews.com/intelsat-33e-loses-power-in-geostationary-orbit/ |
| 14 | Panasonic IFC Network | https://www.panasonic.aero/our-offerings/in-flight-connectivity/network |

---

*维护：当 SatSig / CelesTrak / 运营商公开页更新时，先改 `data/satellite-catalog.json`，再同步 `src/data.js`。*
