# AI-Assisted Development Log

## Project

**AeroSat Link Explorer** is an Assignment 4 research-tool prototype. The goal is to combine a PVG-CDG representative long-haul flight track with public GEO satellite positions and visualize how route geometry changes candidate aviation satellite broadband link quality.

## AI Role

The project was developed with Cursor / LLM assistance. AI was used as a coding partner, not as an unchecked source of truth.

## Development Timeline

### 1. Topic Definition

Initial idea: identify which satellites provide connectivity to a specific passenger flight.

AI-assisted refinement: this claim was too strong because airline contracts, terminal installation, beam assignment, and real handover logs are normally not public. The project was narrowed to a defensible question:

> Given a representative PVG-CDG route and public GEO satellite orbital slots, what is the best-candidate GEO elevation angle along the route?

Result: the tool now claims **link-geometry analysis**, not actual operational satellite usage.

### 2. Architecture Planning

AI helped separate the app into:

- Data layer: route samples, airport coordinates, satellite catalog, public sources.
- Geometry layer: haversine route distance and GEO elevation calculation.
- Visualization layer: 2D route map, profile chart, side-view elevation diagram, and 3D globe.
- Evidence layer: public source dialog and data-boundary notes.

Result: the project fits Assignment 4 Option B as an academic/research tool.

### 3. Map and Route Iteration

Early attempts used tile maps and schematic maps. They caused broken tiles, wrong wrapping, and misleading airport placement in some browsers.

AI-assisted debugging led to a tile-free D3/vector approach for classroom reliability. The map is now used as a teaching visualization rather than a certified navigation display.

Result: the route remains visible offline or with unstable network access.

### 4. Satellite Data Correction

AI initially mixed some GEO orbital slots. The satellite catalog was added to record public checks and corrections.

Important correction examples:

- Inmarsat-5 F4: 56.5°E
- Inmarsat-6 F1: 83.8°E
- Inmarsat GX5 / F5: 11.0°E
- Inmarsat-5 F3: 179.6°E

Result: `src/data.js` now uses corrected Inmarsat GX positions for the route-serving GEO elevation analysis.

### 5. Data Boundary Handling

AI output sometimes used wording such as "real ADS-B track" too confidently. The final project language was tightened:

- The route samples are **representative ADS-B-style tracks**, shaped from public route information.
- The OpenSky snapshot is a separate public aircraft-traffic layer.
- The project does **not** prove that a specific aircraft used a specific satellite.

Result: the app separates public facts, computed analysis, and unavailable private operator data.

### 6. Final Verification

Pre-presentation checks:

- `node --check src/app.js`: passed.
- `node --check src/data.js`: passed.
- Computed statistics are available for MU northern and AF southern representative routes.
- Missing `docs/development-log.md` was added so the Assignment 4 AI-process requirement is covered.

## Known Limitations

- The representative route is not a certified historical ADS-B record.
- GEO elevation is a geometry proxy, not a full link budget.
- Beam footprint, terminal type, aircraft installation, weather attenuation, gateway routing, and airline contracts are outside public verification.
- LEO TLE loading is optional and depends on network access during demo.

## How Hallucinations Were Handled

The most important hallucination risk was overclaiming data availability. The project now avoids claiming actual flight-to-satellite usage and instead presents a reproducible geometry analysis based on public or explicitly representative inputs.

