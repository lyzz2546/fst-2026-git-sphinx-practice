# ADS-B track samples (`data/tracks/`)

## 无账号能下载什么？

OpenSky 分两类 API，**不要混为一谈**：

| API | 脚本 | 需要账号？ | 用途 |
|-----|------|-----------|------|
| `GET /api/states/all` | `python tools/fetch_opensky_states.py` | **否** | 地图上实时/缓存飞机点（欧亚 bbox） |
| `GET /api/tracks/all?icao24=&time=` | `python tools/fetch_opensky.py` | **否** | 某一架飞机的航迹，**但必须已知 icao24 + 飞行中的 unix 时间** |
| `GET /api/flights/departure` | `python tools/fetch_opensky_track.py` | **是（免费注册）** | 按机场+日期搜索 MU553/AF111 是哪一架 |

一键刷新（快照 + 可选搜 callsign + 可选拉航迹）：

```powershell
cd aerosat-link-explorer
python tools/fetch_opensky_today.py
python tools/fetch_opensky_today.py --callsign CES553
python tools/fetch_opensky.py --icao24 780f3d --time 1781232993 --out data/tracks/mu553.json
```

## 本目录已有文件

| 文件 | 说明 |
|------|------|
| `pvg-cdg-mu553-representative.json` | FlightAware 对齐的代表性样本（应用默认用这个形状） |
| `pvg-cdg-af111-representative.json` | 同上，法航南线 |
| `pvg-cdg-mu553-opensky-live-partial.json` | **真实 OpenSky ADS-B**，但仅 ~19 点（北京上空一段，不是全程） |
| `pvg-cdg-af111-opensky-live.json` | 真实 OpenSky 片段（同样受 Siberia 接收盲区限制） |

上次无账号成功下载位置：

- 飞机快照 → `data/opensky-states-snapshot.json` + `.js`（页面地图上的飞机点）
- 航迹片段 → 本目录 `*-opensky-live*.json`（需当时航班在网且知道 icao24）

## MU vs AF — 是否经过哈萨克？

| Profile | Crosses Kazakhstan? |
|---------|----------------------|
| **MU northern** | **No** — Mongolia/Siberia |
| **AF southern** | **Yes ~41°N** — Central Asia detour |

## 有账号时：按机场搜历史航班

```powershell
python tools/fetch_opensky_track.py `
  --mode departure --airport ZSPD `
  --begin 1736899200 --end 1736985600 `
  --callsign-filter CES553 `
  --user YOUR_USER --password YOUR_PASS `
  --out data/tracks/pvg-cdg-mu553.json
```

## ADS-B 覆盖说明

OpenSky 在西伯利亚接收站稀疏，真实航迹常有 **大段缺口**；FlightAware 会插值补全。
课程报告里写：地图几何可用代表样本 + 注明 OpenSky 片段为真实 ADS-B 子集即可。
