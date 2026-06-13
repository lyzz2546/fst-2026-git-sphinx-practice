# AeroSat Link Explorer

A course project for Assignment 4: an aircraft satellite connectivity visualization tool focused on the Shanghai Pudong (PVG) to Paris Charles de Gaulle (CDG) route.

## Run

```powershell
cd "E:\Projects\Python\Fundamentals of Software Technology\aerosat-link-explorer"
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

## What the App Shows

- A dark aviation-style continuous vector world map using Natural Earth / world-atlas data with the PVG-CDG great-circle route and an approximate connectivity analysis corridor.
- A live/demo aircraft layer: OpenSky Network states API when available, otherwise a local demo traffic cache.
- A textured 3D Earth globe with aircraft cruise altitude, LEO, MEO, and GEO shells.
- Candidate aviation satellite communication networks mapped to orbit layers.
- Optional live loading of public Starlink and OneWeb TLE records from CelesTrak, propagated in-browser with satellite.js.
- Evidence links and data-boundary notes for the course report.

## Data Boundary

The route map is a geodesic visualization based on public airport coordinates. It is not a real historical ADS-B track and does not identify the exact satellite used by a specific flight.
