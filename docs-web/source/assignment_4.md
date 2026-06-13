# Assignment 4: AI-Assisted Academic Application

<a href="assignment_4_zh.html">中文版本</a>

**Student Name**: Yang Zhanxiang  
**Student ID**: ZY2557211  
**Submission Date**: 2026.6.13  

## Project Overview

For Assignment 4, I selected **Option B: Academic/Research Tool** and developed an interactive web application named **AeroSat Link Explorer**.

The application studies satellite connectivity along the PVG-CDG long-haul aviation route. It combines a flat route map, aircraft traffic evidence, GEO satellite coverage, trajectory profiles, and link-geometry visualization. The goal is to turn a research question from aviation and communication systems into a runnable browser-based tool.

```{raw} html
<p><a href="_static/aerosat-link-explorer/index.html">Open AeroSat Link Explorer</a></p>
```

```{raw} html
<figure>
  <img src="_static/images/assignment4/View%201%C2%B7%20Route%20Map.png" alt="View 1 route map of the PVG-CDG route and GEO satellites" style="width: 100%;">
  <figcaption><strong>View 1 · Route Map.</strong> This section shows the modeled PVG-CDG route, major geographic reference points, airport endpoints, and GEO satellite slots. It provides the main geographic context for the satellite-link analysis.</figcaption>
</figure>
```

## Motivation and Background

Long-haul aircraft use satellite communication systems for in-flight connectivity and operational communication. A flight from Shanghai Pudong (PVG) to Paris Charles de Gaulle (CDG) crosses a large part of Eurasia, where route geometry, satellite longitude, and aircraft position all affect link quality.

This project focuses on a practical question:

**How can a user visually explore the relationship between an aircraft route, historical ADS-B evidence, and GEO satellite coverage?**

The tool is designed for learning and exploratory analysis rather than certified flight operations. During development, I also learned that historical ADS-B data may be sparse and incomplete, so the final version clearly separates **modeled complete route geometry** from **OpenSky historical evidence**.

## Main Features

- Interactive flat map for PVG-CDG and CDG-PVG routes.
- Four route options: China Eastern northern corridor and Air France southern detour, in both directions.
- GEO satellite markers placed on the equator at their sub-satellite longitudes.
- Route line color based on best GEO elevation tier.
- Trajectory and link analysis section with altitude, ground speed, distance, and coverage metrics.
- Link geometry side view showing aircraft-to-GEO geometry.
- Aircraft traffic layer using OpenSky historical evidence or fallback data.
- Clear data-source labels explaining when data is modeled, historical, or not live.

```{raw} html
<figure>
  <img src="_static/images/assignment4/Trajectory%20%26%20Link%20Analysis.png" alt="Trajectory and link analysis dashboard for ADS-B profile and satellite coverage" style="width: 100%;">
  <figcaption><strong>Trajectory &amp; Link Analysis.</strong> This view summarizes the selected route profile, including track distance, flight time, maximum latitude, cruise altitude, mean ground speed, GEO link coverage, and GEO handover count. The altitude and speed chart connects the route model with the communication-coverage metrics.</figcaption>
</figure>
```

```{raw} html
<figure>
  <img src="_static/images/assignment4/Link%20Geometry.png" alt="Link geometry side view showing aircraft to GEO satellite elevation" style="width: 100%;">
  <figcaption><strong>Link Geometry.</strong> The side-view diagram explains how the aircraft-to-GEO elevation angle is measured. It distinguishes the Ka user link, feeder link, GEO orbit, local horizon, and ATC/ADS-B/CPDLC paths, making the communication geometry easier to interpret.</figcaption>
</figure>
```

```{raw} html
<figure>
  <img src="_static/images/assignment4/View%202%20.%20Globe.png" alt="3D globe view with route and satellite orbits" style="width: 100%;">
  <figcaption><strong>View 2 · Globe.</strong> The 3D globe provides a complementary spatial view of the route and satellite environment. It helps compare the flat route map with a globe-based visualization of orbital and geographic relationships.</figcaption>
</figure>
```

## Tech Stack

| Category | Tools |
| --- | --- |
| Operating system | Windows |
| Frontend | HTML, CSS, JavaScript |
| Visualization | D3.js, TopoJSON, SVG |
| Data processing | Python scripts |
| Aviation data | OpenSky historical API evidence, representative route models |
| Deployment target | Sphinx static site and GitHub Pages |
| AI assistant | Codex coding assistant used as the primary development partner |

The application is a static web app, so it can be hosted inside the Sphinx coursework website without a backend server.

## Development Process with AI

I used an AI coding assistant throughout the project as a development partner. The interaction was not only simple code generation; it included requirement analysis, frontend design, data processing, debugging, and validation.

### Architecture Planning

At the beginning, I asked the AI assistant to help plan a browser-based research tool. The main architecture became:

- `index.html` for the application shell.
- `src/app.js` for interaction, map rendering, route logic, charts, and UI updates.
- `src/data.js` for static route, airport, and satellite data.
- `data/tracks/` for representative tracks and generated route data.
- `tools/` for Python scripts used to process historical ADS-B evidence.

This structure kept the application easy to deploy as a static website.

### Debugging and Iteration

The most important debugging process involved ADS-B data. At one stage, I tried to use sparse OpenSky historical points as if they were a complete flight trajectory. This produced unrealistic sharp route turns and steep altitude changes.

After reviewing the output, I revised the logic with AI assistance:

- OpenSky historical points are now treated as **evidence**, not a complete continuous track.
- The displayed full route is generated from a smooth, physically reasonable route model.
- The UI now labels the source as **Modeled complete route + OpenSky evidence**.
- Metadata still records the number of OpenSky evidence points and the maximum historical data gap.

This was a useful example of handling an AI-assisted development mistake: the first implementation was technically runnable, but the data meaning was wrong. The final implementation corrected the logic instead of only smoothing the visual output.


## Results

The final application runs in a browser and is integrated into this Sphinx coursework site as a static web application.

The current submission version supports:

- PVG to CDG and CDG to PVG directions.
- China Eastern and Air France route profiles.
- GEO satellite coverage analysis along the route.
- Modeled complete route display with OpenSky historical evidence.
- Interactive map layers and traffic/status panels.

The application is suitable for this course assignment because it is functional, domain-specific, and AI-assisted.

## Limitations

This tool is for educational and exploratory use. It is not a certified aviation, navigation, or satellite-link planning system.

The main data limitation is that public OpenSky historical data may contain large coverage gaps. Therefore, the tool does not claim that the full displayed route is a complete real ADS-B trajectory. Instead, it presents a modeled route and keeps OpenSky evidence separately.

## Future Work

Possible future improvements include:

- Connecting to a commercial or more complete historical ADS-B data source.
- Adding more airlines and route variants.
- Improving aircraft traffic filtering.
- Adding exportable reports for route and satellite coverage comparisons.
