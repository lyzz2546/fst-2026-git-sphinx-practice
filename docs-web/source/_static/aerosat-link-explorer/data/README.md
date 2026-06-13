# 卫星数据目录（`data/`）

本目录存放**可机器读取**的公开卫星清单，供 `src/data.js` 维护与后续脚本导入。

## 文件

| 文件 | 用途 |
|------|------|
| `satellite-catalog.json` | PVG–CDG 航路相关 GEO / LEO 公开信息 + 项目对接字段说明 |
| `geo-link-presentation.json` | 课程/PPT：仰角定义、GX 链路、术语表、幻灯片大纲、参考文献 |
| `geo-link-presentation.md` | 同上（人类可读：侧视 ASCII 图、口播提示、与应用界面对照） |
| `opensky-states-snapshot.json` | OpenSky 区域 ADS-B 快照（人类可读） |
| `opensky-states-snapshot.js` | 同上，打包进页面（**默认使用，非编造数据**） |
| `README.md` | 本说明 |

## OpenSky 飞机流量快照（**无需账号**）

刷新本地缓存（需网络）：

```bash
python tools/fetch_opensky_states.py
```

输出：`data/opensky-states-snapshot.json` + `data/opensky-states-snapshot.js`（页面内嵌）

应用加载顺序：**OpenSky 实时 API → 页面内嵌 `opensky-states-snapshot.js` → 无数据**

最近一次成功刷新示例：`fetchedAt` 见 JSON 内 `meta` 字段。

## OpenSky 航迹（**无需账号，但有限制**）

```bash
# 必须已知 icao24 与飞行中的 unix 时间（不能按机场搜日期）
python tools/fetch_opensky.py --icao24 780f3d --time 1781232993 --out data/tracks/mu553.json

# 或：先刷新快照再按 callsign 找 icao24
python tools/fetch_opensky_today.py --callsign CES553
```

已保存的真实 ADS-B 片段见 `data/tracks/*-opensky-live*.json`（通常只是航路一段，不是 PVG–CDG 全程）。

## OpenSky 按机场搜历史航班（**需要免费注册**）

```bash
python tools/fetch_opensky_track.py --mode departure --airport ZSPD ...
```

匿名调用会 HTTP 403。

详细说明与引用链接见 [`../docs/satellite-catalog.md`](../docs/satellite-catalog.md)。

## 航路 bundle 联动规则

**一条航路 = 一个 `routes[id]` bundle**，包含 `route`（元数据）+ `adsbTrack`（轨迹点）。

切换 Route 下拉框时，`refreshActiveRouteBundle()` 统一刷新：

- View 1 地图轨迹与 metric 卡片
- 轨迹分析面板、高度/速度图、仰角剖面、卫星覆盖表
- View 2 地球仪航线

**所有距离/时间/覆盖率数字** 必须来自 `computeRouteStatistics(adsbTrack.points)`，不得手写与轨迹不一致的公里数。

## 航路轨迹（`src/data.js`）

| 键 | 说明 |
|----|------|
| `adsbTrackNorthern` | 东航类北线（经蒙古/西伯利亚，可用俄领空） |
| `adsbTrackSouthern` | 法航类南线（绕俄，中亚—里海—土耳其） |
| `routes["PVG-CDG-MU" \| "PVG-CDG-AF" \| …]` | 四条可选航路 + 对应 ADS-B 样本 |

OpenSky 抓取示例：

```bash
python tools/fetch_opensky.py --callsign CES553 ...   # 北线
python tools/fetch_opensky.py --callsign AFR111 ...   # 南线
```

## 与 `data.js` 的字段对应

### GEO（仰角分析）

`AEROSAT_DATA.geoSatellites` 每条记录：

```javascript
{
  id: "i5-f1",
  name: "Inmarsat-5 F1 (GX)",
  operator: "Inmarsat / Viasat",
  lon: 62.6,           // 来自 catalog.subSatelliteLongitudeDeg
  band: "Ka",
  sourceId: "inmarsat-fleet"
}
```

筛选条件：JSON 中 `recommendedForElevation: true` 且 `status: "operational"`。

### LEO（TLE 加载）

`AEROSAT_DATA.publicSatelliteFeeds` 每条记录：

```javascript
{
  id: "starlink",
  label: "Starlink",
  provider: "Starlink Aviation",
  shellId: "leo",
  color: "#12b3a8",
  url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json"
}
```

对应 JSON 的 `leoConstellations[]`，使用 `celestrakUrl` 作为 `url`。

## 建议同步步骤

1. 编辑 `satellite-catalog.json`（经度、状态、新增卫星）。
2. 将变更写入 `src/data.js` 的 `geoSatellites` / `publicSatelliteFeeds`。
3. 在 `sources` 中更新 `sourceId` 链接（若引用变更）。
4. 本地打开应用，检查 Analysis 面板与航迹 GEO 着色。

## 当前同步状态（相对 `data.js`）

见 JSON 内 `projectIntegration.knownDataJsCorrections`：

- **i5-f4**：`lon` 已同步为 **56.5**
- **i6-f1**：`lon` 已同步为 **83.8**
- 已补充：**i5-f3** (179.6°E)、**i5-f5** (11°E)
- `satellite-catalog.json` 仍保留历史修正记录，用于说明 AI 辅助开发过程中的数据核查。
