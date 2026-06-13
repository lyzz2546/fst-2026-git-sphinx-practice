# Real ADS-B data workflow

This project needs two different ADS-B artifacts:

1. **Whole-route track**: a line made from many positions from the same aircraft.
2. **Aircraft moment**: one selected position from that same capture, used to place the airplane marker.

Do not mix these with a separate representative route unless the UI labels it as representative.

## What the user needs to do

For **live/current OpenSky state sampling**, no account is strictly required. Anonymous access is rate limited, but it can poll the current `/states/all` endpoint.

For more reliable sampling or historical OpenSky lookup:

1. Register or log in at OpenSky Network.
2. Create an API client.
3. Set these environment variables before running the capture script:

```powershell
$env:OPENSKY_CLIENT_ID="your_client_id"
$env:OPENSKY_CLIENT_SECRET="your_client_secret"
```

OpenSky's current API uses OAuth2 client credentials. Old username/password Basic Auth should not be used for new tooling.

## Continuous sampling

Run one scan to see whether a target flight is currently visible:

```powershell
python tools/capture_adsb_route.py --once
```

Run a full capture window:

```powershell
python tools/capture_adsb_route.py --duration-min 720 --interval-sec 30
```

The script watches route callsigns such as `CES553`, `CES569`, `AFR111`, `CES554`, `CES570`, and `AFR116`.

## Outputs

Raw append-only samples:

```text
data/captures/adsb-route-samples.jsonl
```

Normalized whole-route track exports:

```text
data/tracks/captured/*.json
```

Selected aircraft moment from the same capture:

```text
data/captures/aircraft-moment-snapshot.json
data/captures/aircraft-moment-snapshot.js
```

Summary:

```text
data/captures/adsb-route-capture-summary.json
```

## Important limitation

OpenSky receiver coverage can have gaps across Siberia and remote regions. A capture is only complete if the aircraft is visible to OpenSky for the whole flight and the sampler runs for the whole flight. If the exported track is partial, keep the UI label honest: "partial OpenSky ADS-B capture" rather than "complete live ADS-B route".
