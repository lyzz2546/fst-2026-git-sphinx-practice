const routeCatalog =
  AEROSAT_DATA.routeCatalog ||
  [{ id: AEROSAT_DATA.route.id, label: AEROSAT_DATA.route.title, shortLabel: AEROSAT_DATA.route.id }];
const sources = AEROSAT_DATA.sources;
const geoSatellites = AEROSAT_DATA.geoSatellites || [];
const OPENSKY_STATES_URL =
  "https://opensky-network.org/api/states/all?lamin=10&lomin=-20&lamax=75&lomax=140";
const OPENSKY_LIVE_TIMEOUT_MS = 12000;
const OPENSKY_SNAPSHOT_URLS = [
  "./data/opensky-history-display-snapshot.json",
  "data/opensky-history-display-snapshot.json",
  "./data/opensky-display-snapshot.json",
  "data/opensky-display-snapshot.json",
  "./data/opensky-route-demo-snapshot.json",
  "data/opensky-route-demo-snapshot.json"
];
const RAW_ADSB_TRACK_URLS = {
  "PVG-CDG-MU": "./data/tracks/history-completed/pvg-cdg-mu-ces219-780f39-completed.json",
  "PVG-CDG-AF": "./data/tracks/history-completed/pvg-cdg-af-afr111-394a03-completed.json",
  "CDG-PVG-MU": "./data/tracks/history-completed/cdg-pvg-mu-ces554-780f39-completed.json",
  "CDG-PVG-AF": "./data/tracks/history-completed/cdg-pvg-af-afr116-3965a8-completed.json"
};
const ROUTE_DIRECTION_PAIRS = {
  "PVG-CDG-MU": "CDG-PVG-MU",
  "CDG-PVG-MU": "PVG-CDG-MU",
  "PVG-CDG-AF": "CDG-PVG-AF",
  "CDG-PVG-AF": "PVG-CDG-AF"
};
const AIRPORT_TRAFFIC_RADIUS_KM = 85;
const MAX_CONTEXT_AIRCRAFT = 15;
const AIRCRAFT_BANNER_AUTO_HIDE_MS = 30000;
// Embedded fallback if opensky-display-snapshot.js fails to load (file:// or cache).
const EMBEDDED_DISPLAY_STATES = [
  ["780f3d", "CES553 ", "China", 1781255071, 1781255071, 116.5341, 41.1267, 9144, false, 237, 280, 0, null, 9144, null, false, 0],
  ["3965a8", "AFR111 ", "France", 1781255071, 1781255071, 11.9787, 48.7565, 10972, false, 209, 280, 0, null, 10972, null, false, 0],
  ["06a1bc", "QTR87Q  ", "Qatar", 1781255070, 1781255070, 12.3893, 47.7211, 10058.4, false, 291, 136, 0, null, 10386, "2216", false, 0],
  ["4bb273", "THY6QL  ", "Turkey", 1781255070, 1781255070, 22.8282, 53.2691, 10058.4, false, 258, 7, 0, null, 10196, "5316", false, 0],
  ["484ee4", "KLM75C  ", "Netherlands", 1781255070, 1781255070, 17.7377, 52.4326, 10363.2, false, 239, 92, 0, null, 10432, "1000", false, 0]
];
let aircraftTrafficLoadAttempted = false;
let ranked = false;
let selectedRouteId = routeCatalog[0]?.id || AEROSAT_DATA.route.id;
let flatMapMode = "route";
let showRouteGeo = true;
let showFleetGeo = false;
let showOnCorridorAircraft = true;
let showOffCorridorAircraft = false;
let showRouteFlightsOnly = false;
let aircraftBannerAutoHideTimer = null;
let aircraftBannerDismissed = false;
let mapNoteAutoHideTimer = null;
let orbitMode = "shells";
let publicSatellites = [];
let routeMap;
let globe;
let aircraftTraffic = [];
let aircraftTrafficMeta = null;
const rawAdsbTrackCache = new Map();
const rawAdsbTrackPromises = new Map();
let profileChart;
let routeStats = null;
let profileTrackIndex = 0;

const WORLD_TOPO_URLS = [
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json",
  "https://unpkg.com/world-atlas@2/countries-50m.json"
];

const MAP_LABELS = [
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "Shanghai", lat: 31.2304, lon: 121.4737 },
  { name: "Beijing", lat: 39.9042, lon: 116.4074 },
  { name: "Ulaanbaatar", lat: 47.8864, lon: 106.9057 },
  { name: "Moscow", lat: 55.7558, lon: 37.6173 },
  { name: "Astana", lat: 51.1694, lon: 71.4491 },
  { name: "Novosibirsk", lat: 55.0084, lon: 82.9357 },
  { name: "Urumqi", lat: 43.8256, lon: 87.6168 }
];

function getSource(id) {
  return sources[id] || sources["report-limit"];
}

function getRouteCatalogEntry(routeId = selectedRouteId) {
  return routeCatalog.find((entry) => entry.id === routeId) || routeCatalog[0];
}

function getActiveRouteBundle() {
  if (AEROSAT_DATA.routes && AEROSAT_DATA.routes[selectedRouteId]) {
    return AEROSAT_DATA.routes[selectedRouteId];
  }
  return { route: AEROSAT_DATA.route, adsbTrack: AEROSAT_DATA.adsbTrack };
}

function getActiveRoute() {
  return getActiveRouteBundle().route;
}

function getActiveAdsbTrack() {
  return getActiveRouteBundle().adsbTrack;
}

/**
 * Route bundle contract — one selectedRouteId drives every view from getActiveRouteBundle():
 * View 1 map + metric cards, trajectory analysis, profile chart, elevation diagram,
 * per-satellite table, and View 2 globe. All numeric summaries MUST come from the
 * active adsbTrack points via computeRouteStatistics(); never mix in stale meta distances.
 */
function getActiveRouteStats() {
  return routeStats || computeRouteStatistics(getAdsbTrackPoints());
}

function refreshActiveRouteBundle() {
  loadRawAdsbTrackForRoute(selectedRouteId);
  refreshRouteMapGeometry();
  renderTrajectoryAnalysis();
  refreshAircraftTrafficForRoute();
  syncFlatMapLayers();
  syncGlobeRoute();
  syncGlobeLayers();
  if (routeMap?.frameRoute) routeMap.frameRoute();
}

function refreshAircraftTrafficForRoute() {
  if (!aircraftTraffic.length) return;
  aircraftTraffic = enrichAircraftTraffic(aircraftTraffic);
  if (aircraftTrafficMeta && !aircraftTrafficMeta.loading) {
    updateTrafficMetaCounts(aircraftTrafficMeta, aircraftTraffic);
  }
}

function refreshRouteMapGeometry() {
  if (!routeMap) return;
  routeMap.adsbPoints = getAdsbTrackPoints();
  const activeRoute = getActiveRoute();
  routeMap.routePoints =
    routeMap.adsbPoints.length >= 2
      ? routeMap.adsbPoints.map((point) => ({ lat: point.lat, lon: point.lon }))
      : makeGreatCircle(activeRoute.origin, activeRoute.destination, 160);
}

function getRouteGeoSatellites() {
  return geoSatellites.filter((sat) => (sat.relevanceToRoute || "primary") === "primary");
}

function getFleetGeoSatellites() {
  return geoSatellites.filter((sat) => sat.relevanceToRoute === "fleet-other");
}

function getElevationGeoSatellites() {
  return getRouteGeoSatellites();
}

function sourceLink(id) {
  const source = getSource(id);
  return `<a href="${source.url}" target="_blank" rel="noreferrer">${source.title}</a>`;
}

function makeGreatCircle(start, end, steps = 140) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const lat1 = toRad(start.lat);
  const lon1 = toRad(start.lon);
  const lat2 = toRad(end.lat);
  const lon2 = toRad(end.lon);
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
      )
    );

  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const f = i / steps;
    const a = Math.sin((1 - f) * d) / Math.sin(d);
    const b = Math.sin(f * d) / Math.sin(d);
    const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
    const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);
    points.push({
      lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
      lon: toDeg(Math.atan2(y, x))
    });
  }
  return points;
}

// ============================================================================
// ADS-B trajectory + satellite-link analysis helpers
// ============================================================================

// Return the loaded representative track as a list of {lat, lon, alt, gs, t}.
// Used as the primary route geometry instead of the synthetic great circle.
function getAdsbTrackPoints() {
  const rawTrack = getRawAdsbTrack();
  const preferredTrack =
    rawTrack && rawTrack.meta?.completedForDisplay && rawTrack.points?.length >= 2
      ? rawTrack
      : null;
  if (preferredTrack) {
    return preferredTrack.points.map((point) => ({
      t: point.t,
      lat: point.lat,
      lon: point.lon,
      alt: point.alt,
      gs: point.gs,
      source: point.source,
      connectorReason: point.connectorReason
    }));
  }
  const adsbTrack = getActiveAdsbTrack();
  if (!adsbTrack || !Array.isArray(adsbTrack.points)) return [];
  return adsbTrack.points.map((point) => ({
    t: point.t,
    lat: point.lat,
    lon: point.lon,
    alt: point.alt,
    gs: point.gs
  }));
}

function getRouteTrackPoints(routeId = selectedRouteId) {
  const rawTrack = getRawAdsbTrack(routeId);
  if (rawTrack?.meta?.completedForDisplay && rawTrack.points?.length >= 2) {
    return rawTrack.points.map((point) => ({
      t: point.t,
      lat: point.lat,
      lon: point.lon,
      alt: point.alt,
      gs: point.gs,
      source: point.source,
      connectorReason: point.connectorReason
    }));
  }
  const bundle = AEROSAT_DATA.routes?.[routeId];
  const points = bundle?.adsbTrack?.points || [];
  return points.map((point) => ({
    t: point.t,
    lat: point.lat,
    lon: point.lon,
    alt: point.alt,
    gs: point.gs
  }));
}

function getRawAdsbTrack(routeId = selectedRouteId) {
  return rawAdsbTrackCache.get(routeId) || null;
}

function getMapAdsbTrackPoints(routeId = selectedRouteId) {
  const track = getRawAdsbTrack(routeId);
  if (!track || !Array.isArray(track.points)) return [];
  return track.points.map((point) => ({
    t: point.t,
    lat: point.lat,
    lon: point.lon,
    alt: point.alt,
    gs: point.gs,
    source: point.source,
    connectorReason: point.connectorReason
  }));
}

function classifyRawAdsbTrack(track, route) {
  const points = track?.points || [];
  if (points.length < 2) {
    return {
      status: "missing",
      isComplete: false,
      startDistanceKm: null,
      endDistanceKm: null
    };
  }
  const first = points[0];
  const last = points[points.length - 1];
  const startDistanceKm = Math.round(haversineKm(first, route.origin));
  const endDistanceKm = Math.round(haversineKm(last, route.destination));
  const isComplete = startDistanceKm <= AIRPORT_TRAFFIC_RADIUS_KM && endDistanceKm <= AIRPORT_TRAFFIC_RADIUS_KM;
  return {
    status: isComplete ? "complete" : "partial",
    isComplete,
    startDistanceKm,
    endDistanceKm
  };
}

function normalizeRawAdsbTrack(payload, routeId) {
  const route = AEROSAT_DATA.routes?.[routeId]?.route || getActiveRoute();
  const points = (payload?.points || [])
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon))
    .map((point) => ({
      t: Number(point.t) || 0,
      lat: Number(point.lat),
      lon: Number(point.lon),
      alt: Number(point.alt) || 0,
      gs: Number(point.gs) || 0,
      source: point.source || "opensky",
      connectorReason: point.connectorReason || ""
    }));
  const classification = classifyRawAdsbTrack({ points }, route);
  return {
    routeId,
    meta: payload?.meta || {},
    points,
    ...classification
  };
}

function loadRawAdsbTrackForRoute(routeId = selectedRouteId) {
  if (rawAdsbTrackCache.has(routeId)) return Promise.resolve(rawAdsbTrackCache.get(routeId));
  if (rawAdsbTrackPromises.has(routeId)) return rawAdsbTrackPromises.get(routeId);

  const url = RAW_ADSB_TRACK_URLS[routeId];
  if (!url) {
    const missing = { routeId, meta: {}, points: [], status: "missing", isComplete: false };
    rawAdsbTrackCache.set(routeId, missing);
    return Promise.resolve(missing);
  }

  const promise = fetch(url, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`ADS-B track HTTP ${response.status}`);
      return response.json();
    })
    .then((payload) => normalizeRawAdsbTrack(payload, routeId))
    .catch((error) => ({
      routeId,
      meta: {},
      points: [],
      status: "missing",
      isComplete: false,
      error: String(error?.message || error)
    }))
    .then((track) => {
      rawAdsbTrackCache.set(routeId, track);
      if (routeId === selectedRouteId) {
        refreshRouteMapGeometry();
        renderTrajectoryAnalysis();
        if (routeMap?.path) {
          renderRouteMapOverlays();
          if (routeMap?.frameRoute) routeMap.frameRoute();
        }
        refreshAircraftTrafficForRoute();
        if (flatMapMode === "aircraft") {
          updateAircraftStatusBar();
          updateAircraftTrafficBanner(true);
        }
      }
      return track;
    });
  rawAdsbTrackPromises.set(routeId, promise);
  return promise;
}

// Shared {lat, lon, alt?} geometry for 2D map, 3D globe, and proximity checks.
function getRouteGeometryPoints(fallbackSteps = 160) {
  const adsbPoints = getAdsbTrackPoints();
  if (adsbPoints.length >= 2) {
    return adsbPoints.map((point) => ({ lat: point.lat, lon: point.lon, alt: point.alt }));
  }
  const activeRoute = getActiveRoute();
  return makeGreatCircle(activeRoute.origin, activeRoute.destination, fallbackSteps).map((point) => ({
    lat: point.lat,
    lon: point.lon,
    alt: 0
  }));
}

function routeAltLiftForGlobe(point, maxAlt) {
  const alt = point.alt || 0;
  if (alt <= 0) return 0.15;
  return (alt / maxAlt) * 0.55;
}

// Haversine distance in km between two lat/lon points.
function haversineKm(a, b) {
  const R = 6371.0088;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Elevation angle (in degrees) from an aircraft at (lat, lon) to a GEO satellite
// parked at longitude satLon over the equator. We assume aircraft altitude is
// negligible against the GEO range (35786 km vs 12 km cruise), so the standard
// ground-to-GEO formula applies.
//
// Reference: ITU-R S.1503 / classical link-budget textbooks.
function computeGeoElevation(lat, lon, satLon) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const Re = 6378.137;
  const Rgeo = 42164.0;
  const k = Re / Rgeo; // ~0.1513
  const cosGamma = Math.cos(toRad(lat)) * Math.cos(toRad(lon - satLon));
  // Below the horizon if the central angle exceeds the geometric limit.
  if (cosGamma < k) return -1; // visually meaningful "below horizon" sentinel
  const num = cosGamma - k;
  const den = Math.sqrt(1 - cosGamma * cosGamma);
  if (den < 1e-9) return 90;
  return toDeg(Math.atan2(num, den));
}

// Best (maximum) elevation across all known GEO assets at a given aircraft
// position. -1 if every satellite is below the horizon (geometric loss of link).
function computeBestGeoElevation(lat, lon) {
  const sats = getElevationGeoSatellites();
  if (sats.length === 0) return -1;
  let best = -90;
  for (const sat of sats) {
    const elev = computeGeoElevation(lat, lon, sat.lon);
    if (elev > best) best = elev;
  }
  return best;
}

function computeBestGeoSatellite(lat, lon) {
  const sats = getElevationGeoSatellites();
  let bestSat = null;
  let bestElev = -90;
  for (const sat of sats) {
    const elev = computeGeoElevation(lat, lon, sat.lon);
    if (elev > bestElev) {
      bestElev = elev;
      bestSat = sat;
    }
  }
  if (!bestSat) return null;
  return { satellite: bestSat, elevation: bestElev, tier: geoElevationTier(bestElev) };
}

// Classify an elevation angle into a coverage tier. Below 10 deg is widely
// considered the practical service floor for Ka-band aviation broadband because
// of rain fade, multipath, and antenna scan limits.
function geoElevationTier(elevDeg) {
  if (elevDeg < 0) return "blocked";
  if (elevDeg < 5) return "marginal";
  if (elevDeg < 10) return "limited";
  if (elevDeg < 25) return "usable";
  return "strong";
}

// Aggregate statistics for the loaded ADS-B sample. Outputs the figures shown
// in the summary panel and embedded in the research report.
function computeRouteStatistics(points = getAdsbTrackPoints()) {
  if (points.length < 2) {
    return {
      totalDistanceKm: 0,
      durationMinutes: 0,
      maxLatitude: 0,
      maxAltitudeM: 0,
      avgGroundSpeedKmh: 0,
      geoCoveragePercent: 0,
      handoverCount: 0,
      perSatellite: []
    };
  }
  let dist = 0;
  let maxLat = -90;
  let maxAlt = 0;
  let speedAcc = 0;
  let speedCount = 0;
  let coveredPoints = 0;
  const perSatTimeAbove10 = new Map();

  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    if (i > 0) dist += haversineKm(points[i - 1], p);
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.alt > maxAlt) maxAlt = p.alt;
    if (p.gs > 0) {
      speedAcc += p.gs;
      speedCount += 1;
    }
    const bestElev = computeBestGeoElevation(p.lat, p.lon);
    if (bestElev >= 10) coveredPoints += 1;
    for (const sat of getElevationGeoSatellites()) {
      const elev = computeGeoElevation(p.lat, p.lon, sat.lon);
      if (elev >= 10) {
        perSatTimeAbove10.set(sat.id, (perSatTimeAbove10.get(sat.id) || 0) + 1);
      }
    }
    for (const sat of getFleetGeoSatellites()) {
      const elev = computeGeoElevation(p.lat, p.lon, sat.lon);
      if (elev >= 10) {
        perSatTimeAbove10.set(sat.id, (perSatTimeAbove10.get(sat.id) || 0) + 1);
      }
    }
  }

  // A handover event = best-satellite identity changes between two consecutive points.
  let handovers = 0;
  let prevBestId = null;
  for (const p of points) {
    let bestId = null;
    let bestElev = -90;
    for (const sat of getElevationGeoSatellites()) {
      const elev = computeGeoElevation(p.lat, p.lon, sat.lon);
      if (elev > bestElev) {
        bestElev = elev;
        bestId = sat.id;
      }
    }
    if (prevBestId !== null && bestId !== prevBestId) handovers += 1;
    prevBestId = bestId;
  }

  const durationMinutes = points[points.length - 1].t - points[0].t;
  return {
    totalDistanceKm: Math.round(dist),
    durationMinutes: Math.round(durationMinutes),
    maxLatitude: +maxLat.toFixed(2),
    maxAltitudeM: Math.round(maxAlt),
    avgGroundSpeedKmh: speedCount > 0 ? Math.round(speedAcc / speedCount) : 0,
    geoCoveragePercent: +((coveredPoints / points.length) * 100).toFixed(1),
    handoverCount: handovers,
    perSatellite: geoSatellites.map((sat) => ({
      id: sat.id,
      name: sat.name,
      lon: sat.lon,
      relevanceToRoute: sat.relevanceToRoute || "primary",
      slotLabel: sat.slotLabel || "",
      coveragePercent:
        +(((perSatTimeAbove10.get(sat.id) || 0) / points.length) * 100).toFixed(1)
    }))
  };
}

// ============================================================================
// View 1 - Tile-free vector route map
// ============================================================================

function initRouteMap() {
  const container = document.getElementById("routeMap");
  if (!window.d3 || !window.topojson) {
    container.innerHTML =
      '<div class="map-error">D3 / TopoJSON failed to load. Please run with network access enabled.</div>';
    return;
  }

  container.innerHTML = "";
  aircraftTraffic = [];
  if (!aircraftTrafficMeta || aircraftTrafficMeta.source === "none") {
    aircraftTrafficMeta = null;
  }

  const svg = d3.select(container).append("svg").attr("class", "vector-map-svg");
  const defs = svg.append("defs");
  const oceanGradient = defs
    .append("radialGradient")
    .attr("id", "route-map-ocean")
    .attr("cx", "50%")
    .attr("cy", "32%")
    .attr("r", "74%");
  oceanGradient.append("stop").attr("offset", "0%").attr("stop-color", "#174e6d");
  oceanGradient.append("stop").attr("offset", "58%").attr("stop-color", "#0b4564");
  oceanGradient.append("stop").attr("offset", "100%").attr("stop-color", "#062d4f");
  defs
    .append("filter")
    .attr("id", "route-glow")
    .append("feDropShadow")
    .attr("dx", 0)
    .attr("dy", 2)
    .attr("stdDeviation", 3)
    .attr("flood-color", "#000")
    .attr("flood-opacity", 0.45);

  const zoomRoot = svg.append("g").attr("class", "zoom-root");
  const baseLayer = zoomRoot.append("g").attr("class", "basemap-layer");
  const labelLayer = zoomRoot.append("g").attr("class", "label-layer");
  const overlayLayer = zoomRoot.append("g").attr("class", "route-overlay-layer");

  const adsbPoints = getAdsbTrackPoints();
  const routePoints = adsbPoints.length >= 2
    ? adsbPoints.map((point) => ({ lat: point.lat, lon: point.lon }))
    : makeGreatCircle(getActiveRoute().origin, getActiveRoute().destination, 160);

  routeMap = {
    container,
    svg,
    zoomRoot,
    baseLayer,
    labelLayer,
    overlayLayer,
    routePoints,
    adsbPoints,
    countries: null,
    projection: null,
    path: null,
    width: 0,
    height: 0,
    worldWidth: 0,
    hasLoadedLiveTraffic: false
  };

  routeMap.zoom = d3
    .zoom()
    .scaleExtent([1, 8])
    .filter((event) => {
      if (event.type === "wheel") return true;
      const target = event.target;
      if (target?.classList?.contains("aircraft-hit")) return false;
      return (!event.ctrlKey && !event.button) || event.button === 0;
    })
    .on("zoom", (event) => {
      const wrapped = wrapMapTransform(event.transform);
      zoomRoot.attr("transform", wrapped);
    });
  svg.call(routeMap.zoom);

  routeMap.frameRoute = () => frameRouteMapToRoute(false);
  routeMap.resize = () => {
    drawRouteMap();
    frameRouteMapToRoute(false);
  };

  loadRawAdsbTrackForRoute(selectedRouteId);

  loadWorldVectorMap().then((countries) => {
    routeMap.countries = countries;
    drawRouteMap();
    requestAnimationFrame(() => frameRouteMapToRoute(false));
  });

  const resize = () => routeMap.resize();
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(resize);
    ro.observe(container);
  }
  window.addEventListener("resize", resize);
}

async function loadWorldVectorMap() {
  for (const url of WORLD_TOPO_URLS) {
    try {
      const response = await fetch(url, { cache: "force-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const topo = await response.json();
      const objectKey = topo.objects.countries || topo.objects.land;
      return topojson.feature(topo, objectKey);
    } catch (error) {
      console.warn("[AeroSat] world vector map load failed:", url, error);
    }
  }
  return {
    type: "FeatureCollection",
    features: (AEROSAT_DATA.basemap || []).map((shape) => ({
      type: "Feature",
      properties: { name: shape.name },
      geometry: {
        type: "Polygon",
        coordinates: [shape.points]
      }
    }))
  };
}

function drawRouteMap() {
  if (!routeMap) return;
  const { container, svg, baseLayer, labelLayer } = routeMap;
  const rect = container.getBoundingClientRect();
  const width = Math.max(360, rect.width || container.clientWidth || 900);
  const height = Math.round(width / 2);
  // Equirectangular needs 2:1 width:height — CSS max-height can squash the box otherwise.
  routeMap.width = width;
  routeMap.height = height;

  svg
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("preserveAspectRatio", "xMidYMid meet");
  const scale = width / (2 * Math.PI);
  routeMap.projection = d3
    .geoEquirectangular()
    .translate([width / 2, height / 2])
    .scale(scale);
  routeMap.path = d3.geoPath(routeMap.projection);
  const left = routeMap.projection([-180, 0])?.[0] || 0;
  const right = routeMap.projection([180, 0])?.[0] || width;
  routeMap.worldWidth = right - left;

  baseLayer.selectAll("*").remove();
  labelLayer.selectAll("*").remove();

  renderMapCopies(baseLayer, (strip, copyIndex) => {
    strip
      .append("rect")
      .attr("class", "ocean-strip")
      .attr("x", left)
      .attr("y", 0)
      .attr("width", routeMap.worldWidth)
      .attr("height", height);

    strip
      .append("path")
      .datum(d3.geoGraticule10())
      .attr("class", "graticule-line")
      .attr("d", routeMap.path);

    if (routeMap.countries) {
      strip
        .selectAll(`path.country-shape-${copyIndex}`)
        .data(routeMap.countries.features)
        .join("path")
        .attr("class", "country-shape")
        .attr("d", routeMap.path);
    }
  });

  renderMapCopies(labelLayer, (strip) => {
    strip
      .selectAll("text.map-city-label")
      .data(MAP_LABELS)
      .join("text")
      .attr("class", "map-city-label")
      .attr("x", (d) => routeMap.projection([d.lon, d.lat])?.[0] || 0)
      .attr("y", (d) => routeMap.projection([d.lon, d.lat])?.[1] || 0)
      .text((d) => d.name);
  });

  renderRouteMapOverlays();
}

function renderMapCopies(parent, renderCopy) {
  [-1, 0, 1].forEach((copyIndex) => {
    const strip = parent
      .append("g")
      .attr("class", "world-copy")
      .attr("data-copy", copyIndex)
      .attr("transform", `translate(${copyIndex * routeMap.worldWidth},0)`);
    renderCopy(strip, copyIndex);
  });
}

function wrapMapTransform(transform) {
  if (!routeMap || !routeMap.worldWidth) return transform;
  const period = routeMap.worldWidth * transform.k;
  let x = transform.x;
  if (Number.isFinite(period) && period > 0) {
    x = ((x + period / 2) % period + period) % period - period / 2;
  }
  const minY = routeMap.height * (1 - transform.k) - routeMap.height * 0.28;
  const maxY = routeMap.height * 0.28;
  const y = Math.max(minY, Math.min(maxY, transform.y));
  return d3.zoomIdentity.translate(x, y).scale(transform.k);
}

function routeLineGeo(points = routeMap.routePoints) {
  return {
    type: "LineString",
    coordinates: points.map((point) => [point.lon, point.lat])
  };
}

// Build a list of small line-string segments, each tagged with a GEO coverage
// tier ("strong" | "usable" | "limited" | "marginal" | "blocked"). The overlay
// renderer uses these tags to colour the route by best-satellite elevation, so
// the user can see at a glance where Ka-band GEO links degrade along the path.
function buildAdsbSegments(points) {
  if (!Array.isArray(points) || points.length < 2) return [];
  const segments = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (isLargeAdsbGap(a, b) && !isInferredConnectorSegment(a, b)) continue;
    const midLat = (a.lat + b.lat) / 2;
    const midLon = (a.lon + b.lon) / 2;
    const elev = computeBestGeoElevation(midLat, midLon);
    segments.push({
      from: a,
      to: b,
      elevation: +elev.toFixed(1),
      tier: geoElevationTier(elev)
    });
  }
  return segments;
}

function isLargeAdsbGap(a, b) {
  const timeGapMin =
    Number.isFinite(a.t) && Number.isFinite(b.t) ? Math.abs(b.t - a.t) : 0;
  const distanceGapKm = haversineKm(a, b);
  return timeGapMin > 45 || distanceGapKm > 900;
}

function isInferredConnectorSegment(a, b) {
  return a?.source === "inferred-connector" || b?.source === "inferred-connector";
}

function buildAdsbChunks(points) {
  if (!Array.isArray(points) || points.length < 2) return [];
  const chunks = [];
  let current = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const point = points[i];
    if (isLargeAdsbGap(prev, point)) {
      if (current.length >= 2) chunks.push(current);
      current = [point];
    } else {
      current.push(point);
    }
  }
  if (current.length >= 2) chunks.push(current);
  return chunks;
}

// Stable colour mapping for the coverage tiers used both on the map and in
// the legend / report charts.
function tierColour(tier) {
  switch (tier) {
    case "strong":
      return "#22c55e"; // green
    case "usable":
      return "#84cc16"; // lime
    case "limited":
      return "#facc15"; // yellow
    case "marginal":
      return "#f97316"; // orange
    case "blocked":
      return "#ef4444"; // red
    default:
      return "#cbd5e1";
  }
}

const GEO_TIER_LEGEND = [
  { tier: "strong", label: "Strong \u2265 25\u00B0" },
  { tier: "usable", label: "Usable 10\u201325\u00B0" },
  { tier: "limited", label: "Limited 5\u201310\u00B0" },
  { tier: "marginal", label: "Marginal 0\u20135\u00B0" },
  { tier: "blocked", label: "Blocked < 0\u00B0" }
];

function renderGeoTierLegendHtml() {
  return GEO_TIER_LEGEND.map(
    (item) =>
      `<li><i style="background:${tierColour(item.tier)}"></i>${item.label}</li>`
  ).join("");
}

function ensureAircraftTrafficData() {
  if (aircraftTraffic.length > 0 && aircraftTrafficMeta && !aircraftTrafficMeta.loading) {
    return true;
  }
  if (aircraftTrafficMeta?.loading || flatMapMode !== "aircraft") {
    return false;
  }
  try {
    loadBundledOpenSkySnapshot({
      liveApiFailed: window.location.protocol === "file:",
      fallbackReason: "Live API not available in this page context"
    });
  } catch (error) {
    console.error("[AeroSat] bundled ADS-B snapshot failed:", error);
    aircraftTrafficMeta = {
      source: "none",
      loading: false,
      cacheSource: "error",
      apiErrorMessage: String(error?.message || error),
      visibleCount: 0,
      routePairCount: 0
    };
  }
  aircraftTrafficLoadAttempted = true;
  return aircraftTraffic.length > 0;
}

function getAircraftTrafficSourceLabel(meta = aircraftTrafficMeta) {
  if (!meta || meta.source === "none") return "No aircraft data";
  if (meta.source === "live") return "Live OpenSky sync";
  if (meta.liveApiNoRoute) return "Historical route capture (latest API had no selected-route aircraft)";
  if (meta.liveApiFailed) return "Historical route capture (live API unavailable)";
  if (meta.cacheSource === "embedded") return "Bundled historical route capture";
  if (meta.cacheSource === "display") return "Historical OpenSky route capture";
  return "OpenSky ADS-B snapshot";
}

function updateAircraftStatusBar() {
  const bar = document.getElementById("aircraftStatusBar");
  if (!bar) return;
  if (flatMapMode !== "aircraft") return;

  if (aircraftTraffic.length && aircraftTrafficMeta && !aircraftTrafficMeta.loading) {
    updateTrafficMetaCounts(aircraftTrafficMeta, aircraftTraffic);
  }

  if (!aircraftTrafficMeta || aircraftTrafficMeta.loading) {
    bar.textContent = "ADS-B: loading…";
    return;
  }

  if (aircraftTrafficMeta.source === "none") {
    bar.textContent = "ADS-B: no snapshot loaded";
    return;
  }

  const shown = aircraftTrafficMeta.visibleCount ?? aircraftTraffic.length;
  const routePair = aircraftTrafficMeta.routePairCount ?? 0;
  const routeLabel = getRouteCatalogEntry().shortLabel;
  const time = formatTrafficTimestamp(
    aircraftTrafficMeta.openskyTime ? aircraftTrafficMeta.openskyTime * 1000 : aircraftTrafficMeta.fetchedAt
  );
  const liveCheck = aircraftTrafficMeta.liveCheckedAt
    ? ` - live checked ${formatTrafficTimestamp(aircraftTrafficMeta.liveCheckedAt)}`
    : "";
  const src = `${getAircraftTrafficSourceLabel(aircraftTrafficMeta)}${liveCheck}`;

  bar.textContent = `${src} · ${time} · ${shown} on map · ${routePair} green (${routeLabel} callsign) · orange = context`;
}

function renderRouteMapOverlays() {
  if (!routeMap || !routeMap.path) return;
  const { overlayLayer, path, projection, routePoints, adsbPoints } = routeMap;
  overlayLayer.selectAll("*").remove();

  const rawTrack = getRawAdsbTrack();
  const hasTrack = routePoints.length >= 2;
  const segments = buildAdsbSegments(adsbPoints && adsbPoints.length >= 2 ? adsbPoints : routePoints);

  renderMapCopies(overlayLayer, (strip, copyIndex) => {
    const activeRoute = getActiveRoute();

    if (hasTrack && (flatMapMode === "corridor" || flatMapMode === "aircraft")) {
      strip
        .append("path")
        .datum(routeLineGeo(routePoints))
        .attr("class", "route-corridor-svg")
        .attr("d", path);
    }

    if (hasTrack) {
      strip
        .append("path")
        .datum(routeLineGeo(routePoints))
        .attr("class", "route-outline-svg")
        .attr("d", path);
    }

    segments.forEach((seg) => {
      strip
        .append("path")
        .datum({
          type: "LineString",
          coordinates: [
            [seg.from.lon, seg.from.lat],
            [seg.to.lon, seg.to.lat]
          ]
        })
        .attr("class", "route-line-svg")
        .attr("d", path)
        .attr("stroke", tierColour(seg.tier))
        .append("title")
        .text(
          `Best GEO elevation ${seg.elevation}\u00B0 (${seg.tier})\n` +
            `From (${seg.from.lat.toFixed(2)}, ${seg.from.lon.toFixed(2)}) to ` +
            `(${seg.to.lat.toFixed(2)}, ${seg.to.lon.toFixed(2)})`
        );
    });

    const geoEntries = [];
    if (showRouteGeo) {
      getRouteGeoSatellites().forEach((sat) => geoEntries.push({ sat, layerClass: "route" }));
    }
    if (showFleetGeo) {
      getFleetGeoSatellites().forEach((sat) => geoEntries.push({ sat, layerClass: "fleet" }));
    }
    if (geoEntries.length > 0) {
      renderGeoSatMarkers(strip, geoEntries);
    }

    const labelPoint = routePoints[Math.floor(routePoints.length * 0.5)];
    const mid = labelPoint ? projection([labelPoint.lon, labelPoint.lat]) : null;
    if (mid) {
      const trackLabel =
        rawTrack?.meta?.displayTrackType === "modeled-complete-with-opensky-evidence"
          ? "modeled route + OpenSky evidence"
          : rawTrack?.meta?.completedForDisplay
            ? "completed display route"
          : rawTrack?.status === "complete"
          ? "complete OpenSky ADS-B track"
          : rawTrack?.status === "partial"
            ? "representative track + partial ADS-B evidence"
            : "FlightAware-shaped sample";
      strip
        .append("text")
        .attr("class", "route-label-svg")
        .attr("x", mid[0])
        .attr("y", mid[1] - 16)
        .text(`${getRouteCatalogEntry().shortLabel} · ${trackLabel}`);
    } else {
      const center = projection([
        (activeRoute.origin.lon + activeRoute.destination.lon) / 2,
        (activeRoute.origin.lat + activeRoute.destination.lat) / 2
      ]);
      if (center) {
        strip
          .append("text")
          .attr("class", "route-label-svg")
          .attr("x", center[0])
          .attr("y", center[1])
          .text(`${getRouteCatalogEntry().shortLabel} - no complete ADS-B track available`);
      }
    }

    renderAirportMarker(strip, activeRoute.origin, "#14b8a6", 14, -12);
    renderAirportMarker(strip, activeRoute.destination, "#60a5fa", 14, -12);

    if (flatMapMode === "aircraft") renderAircraftTraffic(strip, copyIndex);
  });

  if (flatMapMode !== "aircraft") {
    hideAircraftTooltip();
  } else {
    ensureAircraftTrafficData();
    updateAircraftStatusBar();
    updateAircraftTrafficBanner();
  }
  hideGeoSatTooltip();
}

function geoSatShortLabel(sat) {
  return sat.name.replace("Inmarsat-", "I-").replace(" (GX)", "");
}

function estimateGeoSatLabelWidth(text) {
  return Math.max(34, text.length * 6.4);
}

function geoSatLabelBox(xy, pattern, width, height) {
  const x = xy[0] + pattern.dx + (pattern.anchor === "end" ? -width : 0);
  const y = xy[1] + pattern.dy - height + 4;
  return { x, y, w: width, h: height };
}

function geoSatLabelBoxesOverlap(a, b) {
  const pad = 4;
  return !(
    a.x + a.w + pad < b.x ||
    b.x + b.w + pad < a.x ||
    a.y + a.h + pad < b.y ||
    b.y + b.h + pad < a.y
  );
}

function layoutGeoSatLabels(entries) {
  if (!routeMap?.projection) return [];
  const labelHeight = 13;
  const patterns = [
    { dx: 11, dy: -16, anchor: "start" },
    { dx: 11, dy: 20, anchor: "start" },
    { dx: -11, dy: -16, anchor: "end" },
    { dx: -11, dy: 20, anchor: "end" },
    { dx: 16, dy: 4, anchor: "start" },
    { dx: -16, dy: 4, anchor: "end" },
    { dx: 11, dy: -28, anchor: "start" },
    { dx: 11, dy: 32, anchor: "start" }
  ];
  const placedBoxes = [];

  return entries
    .map((entry) => {
      const xy = routeMap.projection([entry.sat.lon, 0]);
      if (!xy) return null;
      return {
        ...entry,
        xy,
        label: geoSatShortLabel(entry.sat)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.xy[0] - b.xy[0])
    .map((item) => {
      const width = estimateGeoSatLabelWidth(item.label);
      let chosen = patterns[0];
      for (const pattern of patterns) {
        const box = geoSatLabelBox(item.xy, pattern, width, labelHeight);
        if (!placedBoxes.some((existing) => geoSatLabelBoxesOverlap(box, existing))) {
          chosen = pattern;
          placedBoxes.push(box);
          break;
        }
      }
      return { ...item, labelPattern: chosen };
    });
}

function getGeoSatCoveragePercent(satId) {
  if (!routeStats?.perSatellite) return null;
  const entry = routeStats.perSatellite.find((sat) => sat.id === satId);
  return entry?.coveragePercent ?? null;
}

function formatGeoLongitude(lon) {
  const abs = Math.abs(lon);
  return lon < 0 ? `${abs.toFixed(1)}°W` : `${abs.toFixed(1)}°E`;
}

function buildGeoSatTooltipHtml(sat) {
  const coverage = getGeoSatCoveragePercent(sat.id);
  const relevance =
    sat.relevanceToRoute === "fleet-other" ? "Other fleet slot" : "Route-serving GX";
  const rows = [
    ["Operator", sat.operator || "—"],
    ["Sub-satellite point", `${formatGeoLongitude(sat.lon)}, 0.0°N`],
    ["Orbital slot", sat.slotLabel || "—"],
    ["Band", sat.band || "—"],
    ["Route role", relevance],
    [
      "Track coverage",
      coverage != null ? `${coverage}% of samples ≥ 10° elev.` : "— (open Track layer first)"
    ]
  ];
  const tagClass = sat.relevanceToRoute === "fleet-other" ? "off-route" : "on-route";
  return `
    <strong>${sat.name}</strong>
    <span class="aircraft-tooltip-tag ${tagClass}">${relevance}</span>
    <dl>${rows
      .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
      .join("")}</dl>
  `;
}

function hideGeoSatTooltip() {
  const tooltip = document.getElementById("geoSatTooltip");
  if (!tooltip) return;
  tooltip.classList.add("hidden");
  if (routeMap?.overlayLayer) {
    routeMap.overlayLayer.selectAll(".geo-sat-marker").classed("geo-sat-marker--active", false);
  }
}

function showGeoSatTooltip(sat, event) {
  const tooltip = document.getElementById("geoSatTooltip");
  const wrap = document.querySelector(".flat-map-wrap");
  if (!tooltip || !wrap) return;

  hideAircraftTooltip();
  tooltip.innerHTML = buildGeoSatTooltipHtml(sat);
  tooltip.classList.remove("hidden");

  const bounds = wrap.getBoundingClientRect();
  const offsetX = event.clientX - bounds.left + 14;
  const offsetY = event.clientY - bounds.top + 14;
  const maxX = bounds.width - tooltip.offsetWidth - 12;
  const maxY = bounds.height - tooltip.offsetHeight - 12;
  tooltip.style.left = `${Math.max(8, Math.min(maxX, offsetX))}px`;
  tooltip.style.top = `${Math.max(8, Math.min(maxY, offsetY))}px`;
}

function renderGeoSatMarkers(parent, entries) {
  if (!routeMap?.projection || !parent) return;
  const laidOut = layoutGeoSatLabels(entries);

  const groups = parent
    .selectAll("g.geo-sat-marker")
    .data(laidOut, (entry) => entry.sat.id)
    .join(
      (enter) => enter.append("g").attr("class", "geo-sat-marker"),
      (update) => update,
      (exit) => exit.remove()
    )
    .attr("class", (entry) =>
      `geo-sat-marker geo-sat-marker--${entry.layerClass}${entry.sat.relevanceToRoute === "fleet-other" ? " geo-sat-marker--fleet-other" : ""}`
    )
    .attr("transform", (entry) => `translate(${entry.xy[0]},${entry.xy[1]})`)
    .style("cursor", "pointer")
    .on("mouseenter", function onEnter(event, entry) {
      d3.select(this).classed("geo-sat-marker--active", true);
      showGeoSatTooltip(entry.sat, event);
    })
    .on("mousemove", (event, entry) => {
      showGeoSatTooltip(entry.sat, event);
    })
    .on("mouseleave", function onLeave() {
      d3.select(this).classed("geo-sat-marker--active", false);
      hideGeoSatTooltip();
    });

  groups.selectAll("*").remove();

  groups
    .append("circle")
    .attr("class", "geo-sat-hit")
    .attr("r", 14)
    .attr("fill", "transparent");

  groups
    .append("circle")
    .attr("class", "geo-sat-dot")
    .attr("r", (entry) => (entry.layerClass === "fleet" ? 4.5 : 5))
    .attr("fill", (entry) => (entry.layerClass === "fleet" ? "#cbd5e1" : "#fef3c7"))
    .attr("stroke", (entry) => (entry.layerClass === "fleet" ? "#64748b" : "#92400e"))
    .attr("stroke-width", 1.5);

  groups.each(function renderLabel(entry) {
    const group = d3.select(this);
    const pattern = entry.labelPattern;
    const labelX = pattern.dx;
    const labelY = pattern.dy;
    if (Math.hypot(labelX, labelY) > 10) {
      group
        .append("line")
        .attr("class", "geo-sat-leader")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", labelX * 0.55)
        .attr("y2", labelY * 0.55);
    }
    group
      .append("text")
      .attr("class", "geo-sat-label")
      .attr("x", labelX)
      .attr("y", labelY)
      .attr("text-anchor", pattern.anchor)
      .text(entry.label);
  });
}

function renderAirportMarker(parent, point, color, dx, dy) {
  const projected = routeMap.projection([point.lon, point.lat]);
  if (!projected) return;
  const group = parent
    .append("g")
    .attr("class", "airport-marker-svg")
    .attr("transform", `translate(${projected[0]},${projected[1]})`);

  group.append("circle").attr("r", 8).attr("fill", color);
  group.append("circle").attr("r", 12).attr("fill", "none").attr("stroke", "#ffffff").attr("stroke-width", 3);
  group
    .append("text")
    .attr("x", dx)
    .attr("y", dy)
    .attr("text-anchor", point.code === "PVG" ? "start" : "end")
    .text(`${point.code} ${point.city}`);
}

function resetRouteMapView(animate = true) {
  if (!routeMap || !routeMap.zoom || !routeMap.svg) return;
  const target = animate ? routeMap.svg.transition().duration(250) : routeMap.svg;
  target.call(routeMap.zoom.transform, d3.zoomIdentity);
}

function frameRouteMapToRoute(animate = true) {
  if (!routeMap || !routeMap.projection || !routeMap.zoom) return;
  const projected = routeMap.routePoints
    .map((point) => routeMap.projection([point.lon, point.lat]))
    .filter(Boolean);
  if (projected.length === 0) {
    resetRouteMapView(animate);
    return;
  }

  const xs = projected.map((point) => point[0]);
  const ys = projected.map((point) => point[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const dx = Math.max(1, maxX - minX);
  const dy = Math.max(1, maxY - minY);
  const pad = 1.4;
  const scale = Math.min(4.2, Math.max(1, Math.min(routeMap.width / (dx * pad), routeMap.height / (dy * pad))));
  const centerX = minX + dx / 2;
  const centerY = minY + dy / 2;
  const transform = d3.zoomIdentity
    .translate(routeMap.width / 2 - centerX * scale, routeMap.height / 2 - centerY * scale)
    .scale(scale);

  const target = animate ? routeMap.svg.transition().duration(350) : routeMap.svg;
  target.call(routeMap.zoom.transform, transform);
}

function syncFlatMapLayers() {
  if (!routeMap) return;
  renderRouteMapOverlays();
  updateAircraftTrafficBanner();
}

function isAircraftOnRoute(point, thresholdKm = 120) {
  const routePoints = getRouteGeometryPoints(80);
  let minDist = Infinity;
  for (const candidate of routePoints) {
    const dist = haversineKm(point, candidate);
    if (dist < minDist) minDist = dist;
  }
  return minDist < thresholdKm;
}

function isAircraftNearEndpointAirports(point, thresholdKm = AIRPORT_TRAFFIC_RADIUS_KM) {
  const activeRoute = getActiveRoute();
  let nearestCode = null;
  let minDist = Infinity;
  for (const airport of [activeRoute.origin, activeRoute.destination]) {
    const dist = haversineKm(point, airport);
    if (dist < minDist) {
      minDist = dist;
      nearestCode = airport.code;
    }
  }
  return minDist < thresholdKm ? nearestCode : null;
}

function normalizeCallsign(callsign) {
  return String(callsign || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function getRouteFlightNumbersForSelection(routeId = selectedRouteId) {
  const catalog = AEROSAT_DATA.routeFlightNumbers || {};
  return catalog[routeId] || catalog["PVG-CDG-MU"] || [];
}

function getInferredOdForRouteId(routeId) {
  const bundle = AEROSAT_DATA.routes?.[routeId];
  if (!bundle) return null;
  const route = bundle.route || bundle;
  if (!route?.origin?.code || !route?.destination?.code) return null;
  return `${route.origin.code} → ${route.destination.code}`;
}

function getInferredOdForAircraft(aircraft, routeId = selectedRouteId) {
  if (!isSelectedRouteFlight(aircraft, routeId)) return null;
  return getInferredOdForRouteId(routeId);
}

function getRouteCallsignPrefixes(routeId = selectedRouteId) {
  const map = AEROSAT_DATA.routeFlightCallsignPrefixes;
  if (map && Array.isArray(map[routeId])) return map[routeId];
  if (Array.isArray(map)) return map;
  return ["CES", "MU", "AFR", "AF"];
}

function getPairedRouteIds(routeId = selectedRouteId) {
  const paired = ROUTE_DIRECTION_PAIRS[routeId];
  return paired ? [routeId, paired] : [routeId];
}

function matchesRouteCallsign(aircraft, routeId) {
  const callsign = normalizeCallsign(aircraft.callsign);
  if (!callsign) return false;
  const prefixes = getRouteCallsignPrefixes(routeId);
  const numbers = getRouteFlightNumbersForSelection(routeId);
  const prefix = prefixes.find((item) => callsign.startsWith(item));
  if (!prefix) return false;
  const suffix = callsign.slice(prefix.length);
  return numbers.includes(suffix);
}

function getSnapshotRouteIdsForAircraft(aircraft) {
  const found = aircraftTrafficMeta?.routeFlightsFound;
  if (!Array.isArray(found)) return [];
  const id = String(aircraft.icao24 || aircraft.id || "").toLowerCase();
  const callsign = normalizeCallsign(aircraft.callsign);
  return found
    .filter(
      (entry) =>
        String(entry.icao24 || "").toLowerCase() === id ||
        normalizeCallsign(entry.callsign) === callsign
    )
    .map((entry) => entry.routeId)
    .filter(Boolean);
}

function isSelectedRouteFlight(aircraft, routeId = selectedRouteId) {
  if (getPairedRouteIds(routeId).some((candidate) => matchesRouteCallsign(aircraft, candidate))) {
    return true;
  }
  if (isDisplaySnapshotMode()) {
    const snapshotRoutes = getSnapshotRouteIdsForAircraft(aircraft);
    return getPairedRouteIds(routeId).some((candidate) => snapshotRoutes.includes(candidate));
  }
  return false;
}

function renderMapContextRows(stats = routeStats) {
  const route = getActiveRoute();
  const track = getActiveAdsbTrack();
  const rawTrack = getRawAdsbTrack();
  const hasRawTrack = rawTrack && rawTrack.points && rawTrack.points.length >= 2;
  const computed = hasRawTrack ? computeRouteStatistics(rawTrack.points) : stats || getActiveRouteStats();
  const pointCount = hasRawTrack ? rawTrack.points.length : 0;
  const directKm = route.publishedDirectKm || 9315;

  const trajHost = document.getElementById("trajectorySourceProof");
  if (trajHost) {
    var profile = route.avoidsRussia ? "AF southern detour" : "MU northern corridor";
    var isCompletedHistory = hasRawTrack && rawTrack.meta?.completedForDisplay;
    var isModeledWithEvidence = rawTrack?.meta?.displayTrackType === "modeled-complete-with-opensky-evidence";
    var openSkyCount = Number(rawTrack?.meta?.openSkyEvidencePointCount || rawTrack?.meta?.openSkyPointCount || pointCount);
    var modelPointCount = Number(rawTrack?.meta?.modelPointCount || pointCount);
    var maxGapMinutes = Number(rawTrack?.meta?.openSkyMaxGapMinutes || 0);
    var sourceTitle = hasRawTrack
      ? isModeledWithEvidence
        ? "Modeled complete route + OpenSky evidence"
        : isCompletedHistory
          ? "Completed display route"
        : rawTrack.isComplete
          ? "Complete OpenSky ADS-B"
          : "Representative track + partial ADS-B evidence"
      : "FlightAware-shaped representative track";
    var sourceNote = hasRawTrack
      ? isModeledWithEvidence
        ? `${modelPointCount} modeled display samples - OpenSky evidence: ${openSkyCount} historical waypoints, max gap ${Math.round(maxGapMinutes)} min - not a live flight dump`
        : isCompletedHistory
          ? `${pointCount} display samples - display distance ${computed.totalDistanceKm.toLocaleString()} km - not a live flight dump`
        : `${pointCount} ADS-B waypoints - captured ${computed.totalDistanceKm.toLocaleString()} km - start ${rawTrack.startDistanceKm} km from ${route.origin.code}, end ${rawTrack.endDistanceKm} km from ${route.destination.code}`
      : "No raw ADS-B file is available locally for this selected direction; map uses the representative track";
    const isOpenSky = hasRawTrack;
    const maxLat = computed.maxLatitude ?? "—";
    trajHost.innerHTML = `
      <span>Trajectory source</span>
      <strong>${isOpenSky ? "OpenSky ADS-B" : "FlightAware-shaped sample"} · ${profile}</strong>
      <small>${pointCount} waypoints · ${computed.totalDistanceKm.toLocaleString()} km · max ${maxLat}\u00B0N · not a live flight dump</small>
    `;
  }

  if (trajHost) {
    trajHost.innerHTML = `
      <span>Trajectory source</span>
      <strong>${sourceTitle} - ${profile}</strong>
      <small>${sourceNote}</small>
    `;
  }

  const metricHost = document.getElementById("routeMetricRow");
  if (metricHost) {
    const flightExamples = (route.flightExamples || [track.meta?.flightExample]).filter(Boolean).join(" · ");
    metricHost.innerHTML = `
      <article>
        <span>Track distance (this sample)</span>
        <strong>${computed.totalDistanceKm.toLocaleString()} km</strong>
        <small>Published direct ~${directKm.toLocaleString()} km · ${route.carrier || "—"}</small>
      </article>
      <article>
        <span>Carrier / examples</span>
        <strong>${route.carrier || "Representative"}</strong>
        <small>${flightExamples || "—"}</small>
      </article>
      <article>
        <span>Sample flight time</span>
        <strong>${(computed.durationMinutes / 60).toFixed(2)} h</strong>
        <small>${computed.durationMinutes} min · synced with chart below</small>
      </article>
      <article>
        <span>GEO link coverage</span>
        <strong>${computed.geoCoveragePercent}%</strong>
        <small>Best serving GX \u2265 10\u00B0 along this track</small>
      </article>
    `;
  }
}

function getSiblingRouteId(routeId = selectedRouteId) {
  const pairs = {
    "PVG-CDG-MU": "PVG-CDG-AF",
    "PVG-CDG-AF": "PVG-CDG-MU",
    "CDG-PVG-MU": "CDG-PVG-AF",
    "CDG-PVG-AF": "CDG-PVG-MU"
  };
  return pairs[routeId] || null;
}

function renderAirspaceContextPanel() {
  const host = document.getElementById("airspaceContextPanel");
  if (!host) return;
  const route = getActiveRoute();
  const track = getActiveAdsbTrack();
  const zone = AEROSAT_DATA.restrictedAirspace;
  const computed = getActiveRouteStats();
  const directKm = route.publishedDirectKm || 9315;
  const trackKm = computed.totalDistanceKm;
  const detourKm = Math.max(0, trackKm - directKm);
  const siblingId = getSiblingRouteId();
  let compareHtml = "";
  if (siblingId && AEROSAT_DATA.routes?.[siblingId]) {
    const siblingRoute = AEROSAT_DATA.routes[siblingId].route;
    const siblingPoints = getRouteTrackPoints(siblingId);
    const siblingStats = computeRouteStatistics(siblingPoints);
    const currentStats = computed;
    const covDelta = (currentStats.geoCoveragePercent - siblingStats.geoCoveragePercent).toFixed(1);
    const latDelta = (currentStats.maxLatitude - siblingStats.maxLatitude).toFixed(1);
    const distDelta = currentStats.totalDistanceKm - siblingStats.totalDistanceKm;
    compareHtml = `
      <p class="airspace-compare-note">
        vs ${siblingRoute.carrier} alternate (${getRouteCatalogEntry(siblingId).shortLabel}):
        track ${distDelta >= 0 ? "+" : ""}${distDelta.toLocaleString()} km ·
        max lat ${latDelta >= 0 ? "+" : ""}${latDelta}° ·
        GEO coverage (≥10°) ${covDelta >= 0 ? "+" : ""}${covDelta} pp
      </p>`;
  }
  host.innerHTML = `
    <div class="airspace-context-grid">
      <article>
        <span>Carrier profile</span>
        <strong>${route.carrier || "Representative"}</strong>
        <small>${(route.flightExamples || []).join(" · ") || track.meta?.flightExample || "—"}</small>
      </article>
      <article>
        <span>Airspace routing</span>
        <strong>${route.avoidsRussia ? "Southern detour · Russia avoided" : "Northern ATS · Russia usable"}</strong>
        <small>${route.airspaceProfile === "southern-detour" ? zone?.reason || "EU-carrier policy" : "Typical Chinese-carrier corridor over Siberia"}</small>
      </article>
      <article>
        <span>Track vs direct</span>
        <strong>${trackKm.toLocaleString()} km track</strong>
        <small>Published direct ~${directKm.toLocaleString()} km${detourKm > 0 ? ` · ~+${detourKm.toLocaleString()} km detour` : ""}</small>
      </article>
    </div>
    <p class="airspace-context-note">${route.note || ""}</p>
    ${compareHtml}
  `;
}

function isDisplaySnapshotMode() {
  const src = aircraftTrafficMeta?.cacheSource;
  return aircraftTrafficMeta?.displayMode === true || src === "display" || src === "embedded";
}

function pickAircraftForMapDisplay(records, enriched = null) {
  const items = enriched || enrichAircraftTraffic(records);
  if (!isDisplaySnapshotMode()) {
    const routeFlights = items.filter((a) => a.isRoutePairFlight);
    const others = items.filter(
      (a) => a.showOnMap && !a.isRoutePairFlight && isAircraftVisibleWithLayerToggles(a)
    );
    const sampled = others
      .sort((a, b) => String(a.icao24).localeCompare(String(b.icao24)))
      .slice(0, MAX_CONTEXT_AIRCRAFT);
    const keep = new Set([...routeFlights, ...sampled].map((a) => a.id));
    return items.filter((a) => keep.has(a.id));
  }
  return items.filter((a) => a.showOnMap && isAircraftVisibleWithLayerToggles(a));
}

function isAircraftVisibleWithLayerToggles(aircraft) {
  if (!aircraft.showOnMap) return false;
  if (showRouteFlightsOnly) {
    return aircraft.isRoutePairFlight || Boolean(aircraft.nearAirport);
  }
  if (aircraft.isRoutePairFlight) return true;
  if (aircraft._bundleDisplay) return showOnCorridorAircraft;
  if (aircraft.nearRoute) return showOnCorridorAircraft;
  return showOffCorridorAircraft;
}

function enrichAircraftTraffic(records) {
  return records.map((record) => {
    const nearRoute = isAircraftOnRoute(record);
    const airportCode = isAircraftNearEndpointAirports(record);
    const nearAirport = Boolean(airportCode);
    const isRoutePairFlight = isSelectedRouteFlight(record);
    const inferredOd = isRoutePairFlight ? getInferredOdForRouteId(selectedRouteId) : null;
    const bundleDisplay = Boolean(record._bundleDisplay);
    return {
      ...record,
      nearRoute,
      nearAirport,
      airportCode,
      isRoutePairFlight,
      inferredOd,
      _bundleDisplay: bundleDisplay,
      showOnMap: bundleDisplay || nearRoute || nearAirport || isRoutePairFlight
    };
  });
}

function updateTrafficMetaCounts(meta, records) {
  const enriched = enrichAircraftTraffic(records);
  const forMap = pickAircraftForMapDisplay(records, enriched);
  meta.totalCount = enriched.length;
  meta.displayedCount = enriched.filter((item) => item.showOnMap).length;
  meta.visibleCount = forMap.filter((item) => isAircraftVisibleWithLayerToggles(item)).length;
  meta.onRouteCount = enriched.filter((item) => item.nearRoute).length;
  meta.offCorridorCount = enriched.filter((item) => item.showOnMap && !item.nearRoute).length;
  meta.routePairCount = forMap.filter(
    (item) => item.isRoutePairFlight && isAircraftVisibleWithLayerToggles(item)
  ).length;
  meta.routeFilterLabel = getRouteCatalogEntry().shortLabel;
  meta.airportCount = enriched.filter((item) => item.nearAirport && !item.nearRoute && !item.isRoutePairFlight).length;
  meta.hiddenCount = meta.totalCount - meta.displayedCount;
  meta.count = meta.visibleCount;
}

function formatTrafficTimestamp(ms) {
  if (!ms) return "Unknown";
  return new Date(ms).toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
}

// Map geographic heading to SVG rotation (icon nose points up at 0° screen rotation).
function aircraftScreenHeading(lat, lon, geoHeadingDeg, projection) {
  const p = projection([lon, lat]);
  if (!p) return geoHeadingDeg || 0;
  const pNorth = projection([lon, lat + 0.35]);
  if (!pNorth) return geoHeadingDeg || 0;
  const northDeg = (Math.atan2(pNorth[0] - p[0], p[1] - pNorth[1]) * 180) / Math.PI;
  return northDeg + (geoHeadingDeg || 0);
}

function parseOpenSkyState(state, source = "live") {
  const baroAltitudeM = Number.isFinite(state[7]) ? state[7] : null;
  const geoAltitudeM = Number.isFinite(state[13]) ? state[13] : null;
  const altitudeM = geoAltitudeM ?? baroAltitudeM ?? 0;
  const aircraft = {
    id: state[0],
    icao24: state[0],
    callsign: String(state[1] || "").trim() || null,
    originCountry: state[2] || null,
    timePosition: Number.isFinite(state[3]) ? state[3] * 1000 : null,
    lastContact: Number.isFinite(state[4]) ? state[4] * 1000 : null,
    lon: state[5],
    lat: state[6],
    baroAltitudeM,
    geoAltitudeM,
    altitude: altitudeM * 3.28084,
    onGround: Boolean(state[8]),
    velocityMs: Number.isFinite(state[9]) ? state[9] : null,
    heading: state[10] || 0,
    verticalRate: Number.isFinite(state[11]) ? state[11] : null,
    squawk: state[14] != null ? String(state[14]).padStart(4, "0") : null,
    source
  };
  return aircraft;
}

function buildAircraftTooltipHtml(aircraft) {
  const callsign = aircraft.callsign || "(no callsign)";
  const speedKmh =
    aircraft.velocityMs != null ? Math.round(aircraft.velocityMs * 3.6) : null;
  const positionTime = aircraft.timePosition || aircraft.lastContact;
  const snapshotMs = aircraftTrafficMeta?.openskyTime
    ? aircraftTrafficMeta.openskyTime * 1000
    : aircraftTrafficMeta?.fetchedAt;
  const positionAgeSec =
    positionTime && snapshotMs ? Math.round((snapshotMs - positionTime) / 1000) : null;
  const inferredOd = aircraft.inferredOd || getInferredOdForAircraft(aircraft);
  const rows = [
    ["Callsign (航班号)", callsign],
    [
      "Route (inferred)",
      inferredOd
        ? `${inferredOd} (from flight number + selected route — not from ADS-B O/D fields)`
        : "Not available (OpenSky state vector has no departure/arrival airports)"
    ],
    ["ICAO24 (飞机地址)", aircraft.icao24 || aircraft.id],
    ["Registration country", aircraft.originCountry || "—"],
    ["Altitude", `${Math.round(aircraft.altitude || 0).toLocaleString()} ft`],
    [
      "Baro / Geo",
      `${aircraft.baroAltitudeM != null ? Math.round(aircraft.baroAltitudeM) + " m" : "—"} / ${
        aircraft.geoAltitudeM != null ? Math.round(aircraft.geoAltitudeM) + " m" : "—"
      }`
    ],
    ["Ground speed", speedKmh != null ? `${speedKmh} km/h` : "—"],
    ["Heading", `${Math.round(aircraft.heading || 0)}°`],
    ["Squawk", aircraft.squawk || "—"],
    ["On ground", aircraft.onGround ? "Yes" : "No"],
    ["Position time", formatTrafficTimestamp(positionTime)],
    [
      "Position age",
      positionAgeSec != null
        ? positionAgeSec === 0
          ? "Same as snapshot instant"
          : `${positionAgeSec}s before snapshot (normal when ADS-B updates are sparse)`
        : "—"
    ],
    [
      "Track proximity",
      aircraft.nearRoute
        ? "Within ~120 km of representative ADS-B track"
        : aircraft.isRoutePairFlight
          ? "Callsign matched; position is outside the representative track corridor"
          : "Off representative track"
    ],
    [
      "Endpoint airport",
      aircraft.nearAirport ? `Within ~${AIRPORT_TRAFFIC_RADIUS_KM} km of ${aircraft.airportCode}` : "—"
    ],
    ["PVG↔CDG flight", aircraft.isRoutePairFlight ? `Yes (${getRouteCatalogEntry().shortLabel} direct flight number)` : "No"]
  ];
  const tagClass = aircraft.isRoutePairFlight
    ? "on-route"
    : aircraft.nearAirport
      ? "airport"
      : "off-route";
  const tagLabel = aircraft.isRoutePairFlight
    ? `${getRouteCatalogEntry().shortLabel} route flight`
    : aircraft.nearAirport
      ? `Near ${aircraft.airportCode}`
      : "Other traffic";
  return `
    <strong>${callsign}</strong>
    <span class="aircraft-tooltip-tag ${tagClass}">${tagLabel}</span>
    <dl>${rows
      .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
      .join("")}</dl>
  `;
}

function hideAircraftTooltip() {
  const tooltip = document.getElementById("aircraftTooltip");
  if (!tooltip) return;
  tooltip.classList.add("hidden");
  tooltip.innerHTML = "";
  if (routeMap && routeMap.overlayLayer) {
    routeMap.overlayLayer.selectAll(".aircraft-marker-svg").classed("aircraft-marker-svg--active", false);
  }
}

function showAircraftTooltip(aircraft, event) {
  const wrap = document.querySelector(".flat-map-wrap");
  const tooltip = document.getElementById("aircraftTooltip");
  if (!wrap || !tooltip) return;

  tooltip.innerHTML = buildAircraftTooltipHtml(aircraft);
  tooltip.classList.remove("hidden");

  const bounds = wrap.getBoundingClientRect();
  const offsetX = event.clientX - bounds.left + 14;
  const offsetY = event.clientY - bounds.top + 14;
  const maxX = bounds.width - tooltip.offsetWidth - 12;
  const maxY = bounds.height - tooltip.offsetHeight - 12;
  tooltip.style.left = `${Math.max(8, Math.min(maxX, offsetX))}px`;
  tooltip.style.top = `${Math.max(8, Math.min(maxY, offsetY))}px`;
}

function clearAircraftBannerAutoHideTimer() {
  if (aircraftBannerAutoHideTimer) {
    clearTimeout(aircraftBannerAutoHideTimer);
    aircraftBannerAutoHideTimer = null;
  }
}

function setAircraftBannerRecallVisible(visible) {
  const recall = document.getElementById("aircraftBannerRecall");
  if (recall) recall.classList.toggle("hidden", !visible);
}

function dismissAircraftTrafficBanner() {
  const banner = document.getElementById("aircraftTrafficBanner");
  if (!banner) return;
  aircraftBannerDismissed = true;
  banner.classList.add("aircraft-traffic-banner--dismissed");
  setAircraftBannerRecallVisible(flatMapMode === "aircraft");
}

function scheduleAircraftBannerAutoHide() {
  clearAircraftBannerAutoHideTimer();
  aircraftBannerAutoHideTimer = setTimeout(() => {
    dismissAircraftTrafficBanner();
  }, AIRCRAFT_BANNER_AUTO_HIDE_MS);
}

function setMapNoteRecallVisible(visible) {
  const recall = document.getElementById("mapNoteRecall");
  if (recall) recall.classList.toggle("hidden", !visible);
}

function dismissMapNote() {
  const note = document.getElementById("mapNote");
  if (!note) return;
  note.classList.add("map-note--dismissed");
  setMapNoteRecallVisible(true);
}

function showMapNote() {
  const note = document.getElementById("mapNote");
  if (!note) return;
  note.classList.remove("map-note--dismissed");
  setMapNoteRecallVisible(false);
  scheduleMapNoteAutoHide();
}

function scheduleMapNoteAutoHide() {
  if (mapNoteAutoHideTimer) clearTimeout(mapNoteAutoHideTimer);
  mapNoteAutoHideTimer = setTimeout(() => {
    dismissMapNote();
  }, AIRCRAFT_BANNER_AUTO_HIDE_MS);
}

function updateAircraftTrafficBanner(forceShow = false) {
  const banner = document.getElementById("aircraftTrafficBanner");
  if (!banner) return;
  if (flatMapMode !== "aircraft" || !aircraftTrafficMeta) {
    banner.classList.add("hidden");
    banner.classList.remove("aircraft-traffic-banner--cache-warning", "aircraft-traffic-banner--dismissed");
    setAircraftBannerRecallVisible(false);
    clearAircraftBannerAutoHideTimer();
    return;
  }

  const meta = aircraftTrafficMeta;
  if (meta.loading) {
    clearAircraftBannerAutoHideTimer();
    aircraftBannerDismissed = false;
    banner.innerHTML = `<span class="aircraft-banner-source">Loading ADS-B…</span>`;
    banner.classList.remove("aircraft-traffic-banner--cache-warning", "aircraft-traffic-banner--dismissed", "hidden");
    setAircraftBannerRecallVisible(false);
    return;
  }

  if (forceShow) {
    aircraftBannerDismissed = false;
    banner.classList.remove("aircraft-traffic-banner--dismissed");
    setAircraftBannerRecallVisible(false);
  }

  const isEmpty = meta.source === "none" || (meta.visibleCount ?? meta.count) === 0;
  const dataTimeMs =
    meta.openskyTime ? meta.openskyTime * 1000 : meta.fetchedAt;
  const dataTime = formatTrafficTimestamp(dataTimeMs);
  const routeLabel = getRouteCatalogEntry().shortLabel;
  const routePair = meta.routePairCount ?? 0;
  const shown = meta.visibleCount ?? 0;
  const fullTotal = meta.fullSnapshotAircraft ?? meta.totalCount ?? shown;
  const displayBundle = isDisplaySnapshotMode();

  const liveCheck = meta.liveCheckedAt
    ? ` - live checked ${formatTrafficTimestamp(meta.liveCheckedAt)}`
    : "";
  const statusLine = `${getAircraftTrafficSourceLabel(meta)}${liveCheck}`;

  const routeLine =
    routePair > 0
      ? `${routePair} green = ${routeLabel} callsign match`
      : `No ${routeLabel} flight in view — green uses flight-number match`;

  banner.innerHTML = isEmpty
    ? `<span class="aircraft-banner-source">No aircraft data</span>`
    : `
    <strong>${statusLine} · ${dataTime}</strong>
    <span>Map: ${shown} aircraft (${routeLine} · orange = corridor context)</span>
    ${
      displayBundle
        ? `<span class="aircraft-banner-hint">Display bundle: ${shown} aircraft (2 route captures + up to ${MAX_CONTEXT_AIRCRAFT} corridor context)${
            fullTotal > shown ? ` · regional download had ${fullTotal.toLocaleString()} total` : ""
          }</span>`
        : fullTotal > shown
          ? `<span class="aircraft-banner-hint">${fullTotal.toLocaleString()} in regional download — map shows route flight(s) + up to ${MAX_CONTEXT_AIRCRAFT} others</span>`
          : ""
    }
  `;
  banner.classList.toggle(
    "aircraft-traffic-banner--cache-warning",
    Boolean(meta.liveApiFailed || meta.liveApiNoRoute)
  );
  banner.classList.remove("hidden");

  if (aircraftBannerDismissed && !forceShow) {
    banner.classList.add("aircraft-traffic-banner--dismissed");
    setAircraftBannerRecallVisible(true);
    clearAircraftBannerAutoHideTimer();
    return;
  }

  aircraftBannerDismissed = false;
  banner.classList.remove("aircraft-traffic-banner--dismissed");
  setAircraftBannerRecallVisible(false);
  scheduleAircraftBannerAutoHide();
}

function renderAircraftTraffic(parent, copyIndex = 0) {
  if (!routeMap || !routeMap.projection || !parent || copyIndex !== 0) return;

  const aircraftLayer = parent.append("g").attr("class", "aircraft-marker-layer");
  const visibleAircraft = pickAircraftForMapDisplay(aircraftTraffic)
    .filter((aircraft) => isAircraftVisibleWithLayerToggles(aircraft))
    .map((aircraft) => {
      const xy = routeMap.projection([aircraft.lon, aircraft.lat]);
      return xy ? { ...aircraft, xy } : null;
    })
    .filter(Boolean);

  visibleAircraft.forEach((aircraft) => {
    const rot = aircraftScreenHeading(
      aircraft.lat,
      aircraft.lon,
      aircraft.heading,
      routeMap.projection
    );
    let cls = "aircraft-marker-svg";
    if (aircraft.isRoutePairFlight) cls += " aircraft-marker-svg--on-route";

    const group = aircraftLayer
      .append("g")
      .attr("class", cls)
      .attr("transform", `translate(${aircraft.xy[0]},${aircraft.xy[1]}) rotate(${rot})`)
      .style("cursor", "pointer")
      .on("mouseenter", function onEnter(event) {
        d3.select(this).classed("aircraft-marker-svg--active", true);
        hideGeoSatTooltip();
        showAircraftTooltip(aircraft, event);
      })
      .on("mousemove", (event) => {
        showAircraftTooltip(aircraft, event);
      })
      .on("mouseleave", function onLeave() {
        d3.select(this).classed("aircraft-marker-svg--active", false);
        hideAircraftTooltip();
      });

    group
      .append("circle")
      .attr("class", "aircraft-hit")
      .attr("r", 14)
      .attr("fill", "transparent")
      .on("mousedown", (event) => {
        event.stopPropagation();
      });
    group
      .append("path")
      .attr("class", "aircraft-shape")
      .attr("d", "M0,-12 L4,-1 L12,4 L10,7 L3,5 L2,12 L-2,12 L-3,5 L-10,7 L-12,4 L-4,-1 Z");
  });
}

function loadBundledOpenSkySnapshot(extraMeta = {}) {
  const display = window.OPENSKY_HISTORY_DISPLAY_SNAPSHOT || window.OPENSKY_DISPLAY_SNAPSHOT;
  if (display && Array.isArray(display.states) && display.states.length > 0) {
    const snapTime = display.meta?.openskyTime ?? display.time;
    const savedAt = display.meta?.fetchedAt ? Date.parse(display.meta.fetchedAt) : null;
    if (
      applyAircraftTrafficFromStates(display.states, "snapshot", snapTime, savedAt, {
        cacheSource: "display",
        displayMode: true,
        routeFlightCount: display.meta?.routeFlightCount ?? 2,
        routeFlightsFound: display.meta?.routeFlightsFound,
        fullSnapshotAircraft: display.meta?.fullSnapshotAircraft,
        ...extraMeta
      })
    ) {
      return true;
    }
  }
  return applyAircraftTrafficFromStates(EMBEDDED_DISPLAY_STATES, "snapshot", 1781255071, Date.now(), {
    cacheSource: "embedded",
    displayMode: true,
    routeFlightCount: 2,
    routeFlightsFound: [
      { routeId: "PVG-CDG-MU", callsign: "CES553", icao24: "780f3d" },
      { routeId: "PVG-CDG-AF", callsign: "AFR111", icao24: "3965a8" }
    ],
    fullSnapshotAircraft: null,
    ...extraMeta
  });
}

function applyAircraftTrafficFromStates(states, metaSource, openskyTime, fetchedAtMs, extraMeta = {}) {
  const parsed = enrichAircraftTraffic(
    (states || [])
      .filter((state) => Number.isFinite(state[5]) && Number.isFinite(state[6]))
      .map((state) => parseOpenSkyState(state, metaSource))
  );
  if (parsed.length === 0) return false;
  if (extraMeta.displayMode) {
    parsed.forEach((ac) => {
      ac._bundleDisplay = true;
      ac.showOnMap = true;
    });
  }
  aircraftTraffic = parsed;
  const openskyMs = Number.isFinite(openskyTime) ? openskyTime * 1000 : null;
  aircraftTrafficMeta = {
    source: metaSource,
    fetchedAt: fetchedAtMs ?? openskyMs ?? Date.now(),
    openskyTime: Number.isFinite(openskyTime) ? openskyTime : null,
    routeFlightCount: extraMeta.routeFlightCount ?? extraMeta.routeFlightsFound?.length ?? null,
    routeFlightsFound: extraMeta.routeFlightsFound ?? null,
    liveApiFailed: false,
    apiErrorMessage: null,
    cacheSource: null,
    loading: false,
    ...extraMeta
  };
  updateTrafficMetaCounts(aircraftTrafficMeta, parsed);
  return true;
}

async function fetchOpenSkySnapshotFile() {
  let lastError = null;
  for (const url of OPENSKY_SNAPSHOT_URLS) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`Snapshot HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("No snapshot URL succeeded");
}

async function fetchOpenSkyLiveStates() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENSKY_LIVE_TIMEOUT_MS);
  try {
    const response = await fetch(OPENSKY_STATES_URL, {
      cache: "no-store",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`OpenSky HTTP ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload.states)) {
      throw new Error("OpenSky response did not include states");
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

async function loadOpenSkyAircraftTraffic() {
  if (aircraftTrafficMeta?.loading) return;

  const liveCheckedAt = Date.now();
  aircraftTrafficLoadAttempted = true;
  aircraftTrafficMeta = {
    source: "live",
    loading: true,
    fetchedAt: liveCheckedAt,
    visibleCount: 0,
    routePairCount: 0
  };
  updateAircraftStatusBar();
  updateAircraftTrafficBanner(true);

  try {
    const payload = await fetchOpenSkyLiveStates();
    const states = payload.states || [];
    const applied = applyAircraftTrafficFromStates(states, "live", payload.time, liveCheckedAt, {
      fullSnapshotAircraft: states.length,
      liveCheckedAt
    });
    const liveRoutePair = aircraftTrafficMeta?.routePairCount ?? 0;
    if (!applied || liveRoutePair === 0) {
      loadBundledOpenSkySnapshot({
        liveApiNoRoute: true,
        liveCheckedAt,
        liveOpenSkyTime: Number.isFinite(payload.time) ? payload.time : null,
        fallbackReason: "Latest OpenSky sync had no selected-route aircraft"
      });
    }
  } catch (error) {
    console.warn("[AeroSat] live OpenSky traffic failed; using bundled snapshot:", error);
    loadBundledOpenSkySnapshot({
      liveApiFailed: true,
      liveCheckedAt,
      apiErrorMessage: String(error?.message || error),
      fallbackReason: "Live OpenSky API unavailable"
    });
  }

  refreshAircraftTrafficForRoute();
  updateAircraftStatusBar();
  updateAircraftTrafficBanner(true);
  if (flatMapMode === "aircraft") syncFlatMapLayers();
}

// ============================================================================
// View 2 - Three.js globe with OrbitControls
// ============================================================================

function latLonToVector3(lat, lon, radius) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Procedural Earth texture: equirectangular canvas painted with the rough basemap polygons
// from data.js. Guarantees the globe has continents even when every CDN texture is blocked.
function buildProceduralEarthTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  const oceanGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGradient.addColorStop(0, "#0d3a5c");
  oceanGradient.addColorStop(0.5, "#114b6f");
  oceanGradient.addColorStop(1, "#0a2c47");
  ctx.fillStyle = oceanGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const project = (lon, lat) => [
    ((lon + 180) / 360) * canvas.width,
    ((90 - lat) / 180) * canvas.height
  ];

  ctx.fillStyle = "#1f6b4d";
  ctx.strokeStyle = "#1a8a64";
  ctx.lineWidth = 2;
  (AEROSAT_DATA.basemap || []).forEach((shape) => {
    ctx.beginPath();
    shape.points.forEach(([lon, lat], i) => {
      const [x, y] = project(lon, lat);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // Subtle longitude/latitude grid for orientation.
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 30) {
    const [x] = project(lon, 0);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = project(0, lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const EARTH_TEXTURE_URLS = [
  "https://cdn.jsdelivr.net/npm/three-globe@2.27.2/example/img/earth-blue-marble.jpg",
  "https://unpkg.com/three-globe@2.27.2/example/img/earth-blue-marble.jpg",
  "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/textures/planets/earth_atmos_2048.jpg"
];

function tryLoadRemoteEarthTexture(material) {
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  const tryNext = (i) => {
    if (i >= EARTH_TEXTURE_URLS.length) return;
    loader.load(
      EARTH_TEXTURE_URLS[i],
      (texture) => {
        material.map = texture;
        material.color.set(0xffffff);
        material.needsUpdate = true;
      },
      undefined,
      () => tryNext(i + 1)
    );
  };
  tryNext(0);
}

function buildStarfield(scene) {
  const geometry = new THREE.BufferGeometry();
  const count = 1200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const r = 60 + Math.random() * 20;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.18,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.75
  });
  scene.add(new THREE.Points(geometry, material));
}

function initGlobe() {
  const container = document.getElementById("globeMap");
  if (!window.THREE) {
    container.innerHTML =
      '<div class="map-error">Three.js failed to load. Please run with network access enabled.</div>';
    return;
  }

  const width = container.clientWidth || 600;
  const height = container.clientHeight || 600;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 1.6, 8.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  // Third arg false = don't write width/height onto canvas.style, let CSS do the layout.
  renderer.setSize(width, height, false);
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  buildStarfield(scene);

  const earthGroup = new THREE.Group();
  scene.add(earthGroup);

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(5, 3, 5);
  scene.add(sun);

  const earthRadius = 2;
  const proceduralTexture = buildProceduralEarthTexture();
  const earthMaterial = new THREE.MeshPhongMaterial({
    map: proceduralTexture,
    shininess: 18,
    specular: 0x1a3a55
  });
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius, 96, 96),
    earthMaterial
  );
  earthGroup.add(earth);

  // Atmosphere halo.
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(earthRadius * 1.025, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0x4ab8d8,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide
    })
  );
  earthGroup.add(atmosphere);

  // Then asynchronously try to upgrade to a real Earth texture if the network allows.
  tryLoadRemoteEarthTexture(earthMaterial);

  const layers = new THREE.Group();
  const sats = new THREE.Group();
  const routeLayer = new THREE.Group();
  const providerLayer = new THREE.Group();
  earthGroup.add(layers, sats, routeLayer, providerLayer);

  const safeGlobeLayer = (label, draw) => {
    try {
      draw();
    } catch (err) {
      console.error(`[AeroSat] ${label} failed:`, err);
    }
  };

  safeGlobeLayer("drawGlobeRoute", () => drawGlobeRoute(routeLayer, earthRadius));
  safeGlobeLayer("drawOrbitShells", () => drawOrbitShells(layers, earthRadius));

  // OrbitControls: drag = rotate, scroll = zoom, right-drag = pan.
  let controls = null;
  if (THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.8;
    controls.panSpeed = 0.5;
    controls.minDistance = 3.2;
    controls.maxDistance = 22;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
  } else {
    console.warn("[AeroSat] THREE.OrbitControls not available. Globe interaction disabled.");
  }

  globe = {
    scene,
    camera,
    renderer,
    controls,
    earthGroup,
    layers,
    sats,
    routeLayer,
    providerLayer,
    earthRadius,
    container
  };

  safeGlobeLayer("drawProviderNodes", drawProviderNodes);
  safeGlobeLayer("drawGeoSatelliteNodes", drawGeoSatelliteNodes);
  safeGlobeLayer("attachGlobePicker", attachGlobePicker);

  const animate = () => {
    if (controls) controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  animate();

  window.addEventListener("resize", resizeGlobe);
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(resizeGlobe);
    ro.observe(container);
  }
}

function resizeGlobe() {
  if (!globe) return;
  const container = globe.container;
  const width = container.clientWidth || 600;
  const height = container.clientHeight || 600;
  globe.camera.aspect = width / height;
  globe.camera.updateProjectionMatrix();
  globe.renderer.setSize(width, height, false);
}

function drawGlobeRoute(group, earthRadius) {
  group.clear();
  const trackPoints = getAdsbTrackPoints();
  const baseRadius = earthRadius + 0.08;

  if (trackPoints.length >= 2) {
    const maxAlt = Math.max(...trackPoints.map((p) => p.alt || 0), 11800);
    const segments = buildAdsbSegments(trackPoints);
    segments.forEach((seg) => {
      const midAlt = ((seg.from.alt || 0) + (seg.to.alt || 0)) / 2;
      const pts = [
        latLonToVector3(
          seg.from.lat,
          seg.from.lon,
          baseRadius + routeAltLiftForGlobe(seg.from, maxAlt)
        ),
        latLonToVector3(
          (seg.from.lat + seg.to.lat) / 2,
          (seg.from.lon + seg.to.lon) / 2,
          baseRadius + routeAltLiftForGlobe({ alt: midAlt }, maxAlt)
        ),
        latLonToVector3(
          seg.to.lat,
          seg.to.lon,
          baseRadius + routeAltLiftForGlobe(seg.to, maxAlt)
        )
      ];
      const curve = new THREE.CatmullRomCurve3(pts);
      const geometry = new THREE.TubeGeometry(curve, 8, 0.016, 6, false);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(tierColour(seg.tier))
      });
  group.add(new THREE.Mesh(geometry, material));
    });
  } else {
    const fallback = getRouteGeometryPoints(100);
    const points = fallback.map((point, index, arr) => {
      const lift =
        arr.length > 1
          ? Math.sin((index / (arr.length - 1)) * Math.PI) * 0.55
          : 0.15;
      return latLonToVector3(point.lat, point.lon, baseRadius + lift);
    });
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 100, 0.02, 8, false);
    group.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xf59e0b })));
  }

  const activeRoute = getActiveRoute();
  addGlobePoint(group, activeRoute.origin.lat, activeRoute.origin.lon, earthRadius + 0.12, 0x0f766e);
  addGlobePoint(group, activeRoute.destination.lat, activeRoute.destination.lon, earthRadius + 0.12, 0x1d4ed8);
}

function drawOrbitShells(group, earthRadius) {
  group.clear();
  const shellScale = { aircraft: 2.05, leo: 2.35, meo: 3.15, geo: 4.15 };
  AEROSAT_DATA.orbitShells.forEach((shell) => {
    const radius = shellScale[shell.id] || earthRadius + 0.5;
    const geometry = new THREE.TorusGeometry(
      radius,
      shell.id === "aircraft" ? 0.006 : 0.012,
      8,
      192
    );
    const material = new THREE.MeshBasicMaterial({
      color: shell.color,
      transparent: true,
      opacity: shell.id === "geo" ? 0.34 : 0.55
    });
    const torus = new THREE.Mesh(geometry, material);
    torus.rotation.x = shell.id === "geo" ? Math.PI / 2 : Math.PI / 2.35;
    torus.rotation.z = shell.id === "leo" ? 0.38 : shell.id === "meo" ? -0.28 : 0;
    group.add(torus);
  });
}

function addGlobePoint(group, lat, lon, radius, color, size = 0.045) {
  const geometry = new THREE.SphereGeometry(size, 14, 14);
  const material = new THREE.MeshBasicMaterial({ color });
  const point = new THREE.Mesh(geometry, material);
  point.position.copy(latLonToVector3(lat, lon, radius));
  group.add(point);
}

// Place each candidate provider as a glowing node on its orbital shell so the 3D globe
// directly visualises "which networks could plausibly serve this route".
function drawProviderNodes() {
  if (!globe) return;
  globe.providerLayer.clear();
  const shellRadius = { leo: 2.35, meo: 3.15, geo: 4.15 };
  const corridor = getRouteGeometryPoints(32);
  if (corridor.length === 0) return;

  AEROSAT_DATA.providers.forEach((provider, index) => {
    const radius = shellRadius[provider.shellId] || 2.6;
    const anchor = corridor[(index + 2) % corridor.length];
    const latOffset = (index - AEROSAT_DATA.providers.length / 2) * 6;
    const lonOffset = (index % 2 === 0 ? 1 : -1) * (8 + index * 4);
    const shell = AEROSAT_DATA.orbitShells.find((s) => s.id === provider.shellId);
    const colorHex = shell ? new THREE.Color(shell.color).getHex() : 0x12b3a8;

    const lat = Math.max(-80, Math.min(80, anchor.lat + latOffset));
    const lon = anchor.lon + lonOffset;

    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 16, 16),
      new THREE.MeshBasicMaterial({ color: colorHex })
    );
    node.position.copy(latLonToVector3(lat, lon, radius));
    node.userData = { provider };

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 16),
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.25 })
    );
    halo.position.copy(node.position);
    globe.providerLayer.add(node, halo);
  });
}

function drawGeoSatelliteNodes() {
  if (!globe) return;
  const geoRadius = 4.15;
  geoSatellites.forEach((sat) => {
    const isRouteServing = (sat.relevanceToRoute || "primary") !== "fleet-other";
    const color = isRouteServing ? 0xfef3c7 : 0xcbd5e1;
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(isRouteServing ? 0.07 : 0.055, 18, 18),
      new THREE.MeshBasicMaterial({ color })
    );
    node.position.copy(latLonToVector3(0, sat.lon, geoRadius));
    node.userData = { geoSatellite: sat };

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(isRouteServing ? 0.115 : 0.09, 18, 18),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: isRouteServing ? 0.28 : 0.18
      })
    );
    halo.position.copy(node.position);
    globe.sats.add(node, halo);
  });
}

function syncGlobeLayers() {
  if (!globe) return;
  globe.sats.clear();
  drawOrbitShells(globe.layers, globe.earthRadius);
  drawProviderNodes();
  drawGeoSatelliteNodes();

  if ((orbitMode === "leo" || orbitMode === "service") && publicSatellites.length > 0) {
    publicSatellites.slice(0, 520).forEach((sat) => {
      addGlobePoint(
        globe.sats,
        sat.lat,
        sat.lon,
        sat.feedId === "starlink" || sat.feedId === "oneweb" ? 2.35 : 2.45,
        sat.feedId === "starlink" ? 0x12b3a8 : 0x0f766e,
        sat.nearRoute ? 0.035 : 0.022
      );
    });
  }

  globe.providerLayer.visible = orbitMode !== "leo";
}

function attachGlobePicker() {
  if (!globe) return;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const tooltip = document.createElement("div");
  tooltip.className = "globe-tooltip";
  tooltip.style.display = "none";
  globe.container.appendChild(tooltip);

  globe.renderer.domElement.addEventListener("mousemove", (event) => {
    const rect = globe.renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, globe.camera);
    const hits = raycaster.intersectObjects(
      [...globe.providerLayer.children, ...globe.sats.children],
      false
    );
    const hit = hits.find((h) => h.object.userData && (h.object.userData.provider || h.object.userData.geoSatellite));
    if (hit?.object.userData.provider) {
      const provider = hit.object.userData.provider;
      tooltip.innerHTML = `<strong>${provider.name}</strong><br><span>${provider.orbit}</span>`;
      tooltip.style.display = "block";
      tooltip.style.left = `${event.clientX - rect.left + 12}px`;
      tooltip.style.top = `${event.clientY - rect.top + 12}px`;
    } else if (hit?.object.userData.geoSatellite) {
      const sat = hit.object.userData.geoSatellite;
      tooltip.innerHTML = `<strong>${sat.name}</strong><br><span>GEO @ ${formatGeoLongitudeLabel(sat.lon)}, 0.0°N</span>`;
      tooltip.style.display = "block";
      tooltip.style.left = `${event.clientX - rect.left + 12}px`;
      tooltip.style.top = `${event.clientY - rect.top + 12}px`;
    } else {
      tooltip.style.display = "none";
    }
  });

  globe.renderer.domElement.addEventListener("mouseleave", () => {
    tooltip.style.display = "none";
  });
}

function renderOrbitLegend() {
  const container = document.getElementById("orbitLegend");
  if (!container) return;

  const shellCards = AEROSAT_DATA.orbitShells
    .map(
      (shell) => `
        <article>
          <span style="--legend:${shell.color}"></span>
          <div>
            <strong>${shell.label}</strong>
            <small>${shell.description}</small>
          </div>
        </article>
      `
    )
    .join("");

  container.innerHTML = `
    <section class="orbit-legend-block route-tier-block">
      <p class="eyebrow">Route line colour = best Inmarsat GEO elevation</p>
      <ul class="coverage-legend">${renderGeoTierLegendHtml()}</ul>
      <p class="legend-note">
        Along this PVG\u2192CDG track the weakest segment is the Baltic / western-Europe
        approach (limited, ~8\u201310\u00B0). China departure and CDG final are usable or
        strong. <strong>Route height above the globe shows aircraft altitude and does not
        affect link colour.</strong>
      </p>
    </section>
    <section class="orbit-legend-block shell-block">
      <p class="eyebrow">Orbit shell rings (reference layers)</p>
      <div class="orbit-shell-grid">${shellCards}</div>
    </section>
  `;
}

function parseTleText(text, feed) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const records = [];
  for (let i = 0; i < lines.length - 2; i += 3) {
    const name = lines[i];
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];
    if (!line1.startsWith("1 ") || !line2.startsWith("2 ")) continue;
    records.push(propagateTle(name, line1, line2, feed));
  }
  return records.filter(Boolean);
}

function propagateTle(name, line1, line2, feed) {
  if (!window.satellite) return null;
  try {
    const satrec = satellite.twoline2satrec(line1, line2);
    const now = new Date();
    const positionAndVelocity = satellite.propagate(satrec, now);
    if (!positionAndVelocity.position) return null;
    const gmst = satellite.gstime(now);
    const geodetic = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
    const lat = satellite.degreesLat(geodetic.latitude);
    const lon = satellite.degreesLong(geodetic.longitude);
    const nearRoute = isNearRoute({ lat, lon });
    return {
      name,
      line1,
      line2,
      epoch: line1.slice(18, 32).trim(),
      feedId: feed.id,
      feedLabel: feed.label,
      provider: feed.provider,
      lat,
      lon,
      altitudeKm: geodetic.height,
      nearRoute
    };
  } catch {
    return null;
  }
}

function isNearRoute(point) {
  const routePoints = getRouteGeometryPoints(60);
  return routePoints.some((candidate) => haversineKm(point, candidate) < 1300);
}

function haversineKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthKm * Math.asin(Math.sqrt(h));
}

async function loadPublicSatellites() {
  const status = document.getElementById("satelliteStatus");
  const sampleNode = document.getElementById("satelliteSample");
  const button = document.getElementById("loadSatellitesBtn");
  button.disabled = true;
  status.textContent = "Loading real public TLE records from CelesTrak...";
  sampleNode.textContent = "Fetching Starlink and OneWeb current GP/TLE feeds.";

  try {
    const feeds = await Promise.all(
      AEROSAT_DATA.publicSatelliteFeeds.map(async (feed) => {
        const tleUrl = feed.url.replace("FORMAT=json", "FORMAT=tle");
        const response = await fetch(tleUrl);
        if (!response.ok) throw new Error(`${feed.label}: HTTP ${response.status}`);
        const text = await response.text();
        return parseTleText(text, feed).slice(0, 360);
      })
    );
    publicSatellites = feeds.flat();
    const nearCount = publicSatellites.filter((sat) => sat.nearRoute).length;
    const sample = publicSatellites
      .slice(0, 6)
      .map((sat) => `${sat.name} epoch ${sat.epoch}`)
      .join("; ");
    status.textContent = `Loaded ${publicSatellites.length.toLocaleString()} real Starlink / OneWeb TLE records from CelesTrak. ${nearCount} estimate near the PVG-CDG corridor.`;
    sampleNode.textContent = `Sample records: ${sample}`;
    flatMapMode = "satellites";
    orbitMode = "leo";
    syncModeButtons();
    syncFlatMapLayers();
    syncGlobeLayers();
  } catch (error) {
    status.textContent =
      "Could not load CelesTrak from this browser session. Check network/CORS, then try again.";
    sampleNode.textContent = "The route map and provider layers remain source-backed.";
  } finally {
    button.disabled = false;
  }
}

// ============================================================================
// Side panels
// ============================================================================

function renderProviders() {
  const container = document.getElementById("providerList");
  const data = [...AEROSAT_DATA.providers];
  if (ranked) data.sort((a, b) => b.fitScore - a.fitScore);

  container.innerHTML = data
    .map((provider) => {
      const shell = AEROSAT_DATA.orbitShells.find((item) => item.id === provider.shellId);
      return `
        <article class="provider-card">
          <div class="provider-top">
            <div>
              <h4>${provider.name}</h4>
              <p>${provider.orbit}</p>
            </div>
            <div class="score" style="--score:${provider.fitScore}%; --score-color:${shell.color}">
              <strong>${provider.fitScore}</strong>
              <span>fit</span>
            </div>
          </div>
          <div class="tag-row">
            <span>${provider.fitLabel}</span>
            <span>${provider.regionFit}</span>
          </div>
          <p>${provider.why}</p>
          <p class="caveat">${provider.caveat}</p>
          <div class="source-note">Source: ${sourceLink(provider.sourceId)}</div>
        </article>
      `;
    })
    .join("");
}

function renderEvidence() {
  const container = document.getElementById("evidenceChain");
  container.innerHTML = AEROSAT_DATA.evidence
    .map(
      (item, index) => `
        <article class="evidence-item">
          <div class="evidence-index">${index + 1}</div>
          <div>
            <div class="evidence-meta">
              <span>${item.type}</span>
              <strong class="${item.status === "Supported" ? "supported" : "pending"}">${item.status}</strong>
            </div>
            <p>${item.claim}</p>
            <div class="source-note">Source: ${sourceLink(item.sourceId)}</div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderSources() {
  const container = document.getElementById("sourceList");
  container.innerHTML = Object.entries(sources)
    .map(
      ([, source]) => `
        <article>
          <h4>${source.title}</h4>
          <a href="${source.url}" target="_blank" rel="noreferrer">${source.url}</a>
          <p>${source.note}</p>
        </article>
      `
    )
    .join("");
}

function syncModeButtons() {
  document.querySelectorAll("[data-map-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mapMode === flatMapMode);
  });
  document.querySelectorAll("[data-orbit-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.orbitMode === orbitMode);
  });
  const aircraftToolbar = document.getElementById("aircraftLayerToolbar");
  if (aircraftToolbar) {
    aircraftToolbar.classList.toggle("hidden", flatMapMode !== "aircraft");
  }
  if (flatMapMode === "aircraft") {
    updateAircraftStatusBar();
    updateAircraftTrafficBanner(true);
  }
}

function populateRouteSelect() {
  const select = document.getElementById("routeSelect");
  if (!select) return;
  select.innerHTML = routeCatalog
    .map(
      (entry) =>
        `<option value="${entry.id}"${entry.id === selectedRouteId ? " selected" : ""}>${entry.label}</option>`
    )
    .join("");
  select.value = selectedRouteId;
}

function updateRouteChrome() {
  const entry = getRouteCatalogEntry();
  const title = document.getElementById("mapPanelTitle");
  if (title) {
    title.textContent = `Public Route Map: ${entry.label}`;
  }
  const globeTitle = document.getElementById("globePanelTitle");
  if (globeTitle) {
    globeTitle.textContent = `Orbital Shell View: ${entry.shortLabel}`;
  }
}

function syncGlobeRoute() {
  if (!globe || !globe.routeLayer) return;
  drawGlobeRoute(globe.routeLayer, globe.earthRadius);
}

function applyRouteSelection(routeId) {
  selectedRouteId = routeId;
  const routeSelect = document.getElementById("routeSelect");
  if (routeSelect && routeSelect.value !== selectedRouteId) {
    routeSelect.value = selectedRouteId;
  }
  updateRouteChrome();
  refreshActiveRouteBundle();
}

function setupInteractions() {
  document.getElementById("rankBtn").addEventListener("click", () => {
    ranked = !ranked;
    renderProviders();
  });

  document.getElementById("sourceBtn").addEventListener("click", () => {
    document.getElementById("sourceDialog").showModal();
  });

  document.querySelectorAll(".nav-list a[href^='#']").forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href")?.slice(1);
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      document.querySelectorAll(".nav-list a").forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
    });
  });

  populateRouteSelect();
  updateRouteChrome();

  const routeSelect = document.getElementById("routeSelect");
  if (routeSelect) {
    routeSelect.value = selectedRouteId;
    routeSelect.addEventListener("change", () => {
      applyRouteSelection(routeSelect.value);
    });
    window.addEventListener("pageshow", () => {
      routeSelect.value = selectedRouteId;
    });
    requestAnimationFrame(() => {
      routeSelect.value = selectedRouteId;
    });
  }

  const routeGeoToggle = document.getElementById("showRouteGeoToggle");
  if (routeGeoToggle) {
    routeGeoToggle.addEventListener("change", () => {
      showRouteGeo = routeGeoToggle.checked;
      syncFlatMapLayers();
    });
  }

  const fleetGeoToggle = document.getElementById("showFleetGeoToggle");
  if (fleetGeoToggle) {
    fleetGeoToggle.addEventListener("change", () => {
      showFleetGeo = fleetGeoToggle.checked;
      syncFlatMapLayers();
    });
  }

  const onCorridorToggle = document.getElementById("showOnCorridorAircraftToggle");
  if (onCorridorToggle) {
    onCorridorToggle.addEventListener("change", () => {
      showOnCorridorAircraft = onCorridorToggle.checked;
      syncFlatMapLayers();
    });
  }

  const offCorridorToggle = document.getElementById("showOffCorridorAircraftToggle");
  if (offCorridorToggle) {
    offCorridorToggle.checked = showOffCorridorAircraft;
    offCorridorToggle.addEventListener("change", () => {
      showOffCorridorAircraft = offCorridorToggle.checked;
      syncFlatMapLayers();
    });
  }

  const routeFlightsOnlyToggle = document.getElementById("showRouteFlightsOnlyToggle");
  if (routeFlightsOnlyToggle) {
    routeFlightsOnlyToggle.addEventListener("change", () => {
      showRouteFlightsOnly = routeFlightsOnlyToggle.checked;
      syncFlatMapLayers();
      updateAircraftTrafficBanner(true);
    });
  }

  document.querySelectorAll("[data-map-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      flatMapMode = button.dataset.mapMode;
      syncModeButtons();
      if (flatMapMode === "aircraft") loadOpenSkyAircraftTraffic();
      syncFlatMapLayers();
      if (flatMapMode === "aircraft") updateAircraftTrafficBanner(true);
    });
  });

  const aircraftBannerRecall = document.getElementById("aircraftBannerRecall");
  if (aircraftBannerRecall) {
    aircraftBannerRecall.addEventListener("click", () => {
      updateAircraftTrafficBanner(true);
    });
  }

  const mapNoteRecall = document.getElementById("mapNoteRecall");
  if (mapNoteRecall) {
    mapNoteRecall.addEventListener("click", () => {
      showMapNote();
    });
  }

  const elevationSlider = document.getElementById("elevationTrackSlider");
  if (elevationSlider) {
    elevationSlider.addEventListener("input", () => {
      setProfileTrackIndex(Number(elevationSlider.value));
      renderProfileChart(getAdsbTrackPoints());
    });
  }

  document.querySelectorAll("[data-orbit-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      orbitMode = button.dataset.orbitMode;
      syncModeButtons();
      syncGlobeLayers();
    });
  });

  document.getElementById("loadSatellitesBtn").addEventListener("click", loadPublicSatellites);
}

document.addEventListener("DOMContentLoaded", () => {
  // Each init step is isolated. A failure in View 1 must not prevent View 2
  // (Three.js globe) from initialising, and vice versa. This was the root cause of both
  // views appearing blank at once during the previous refactor.
  const safe = (label, fn) => {
    try {
      const result = fn();
      if (result && typeof result.catch === "function") {
        result.catch((err) => console.error(`[AeroSat] ${label} failed:`, err));
      }
    } catch (err) {
      console.error(`[AeroSat] ${label} failed:`, err);
    }
  };
  safe("initRouteMap", initRouteMap);
  safe("initGlobe", initGlobe);
  safe("renderOrbitLegend", renderOrbitLegend);
  safe("renderProviders", renderProviders);
  safe("renderEvidence", renderEvidence);
  safe("renderSources", renderSources);
  safe("renderTrajectoryAnalysis", renderTrajectoryAnalysis);
  safe("setupInteractions", setupInteractions);
  safe("preloadAircraftTraffic", () => {
    ensureAircraftTrafficData();
    updateAircraftStatusBar();
  });
  safe("scheduleMapNoteAutoHide", scheduleMapNoteAutoHide);
});

// ============================================================================
// Trajectory analysis panel: route stats, altitude/speed chart, per-satellite
// coverage table. Reads from per-route ADS-B tracks in AEROSAT_DATA.routes and GEO fleet list.
// ============================================================================

function renderTrajectoryAnalysis() {
  const points = getAdsbTrackPoints();
  const stats = computeRouteStatistics(points);
  routeStats = stats;

  renderRouteStatGrid(stats);
  renderPerSatelliteTable(stats);
  renderAirspaceContextPanel();
  renderMapContextRows(stats);
  initElevationDiagram(points);
  renderProfileChart(points);
  renderGeoTierLegendList();

  const status = document.getElementById("analysisStatus");
  if (status) {
    status.textContent = `Loaded ${points.length} ADS-B-style samples / ${stats.durationMinutes} min`;
  }
}

function initElevationDiagram(points) {
  const slider = document.getElementById("elevationTrackSlider");
  if (!slider || points.length === 0) return;
  slider.min = "0";
  slider.max = String(Math.max(0, points.length - 1));
  const mid = Math.floor(points.length / 2);
  setProfileTrackIndex(mid, points);
}

function setProfileTrackIndex(index, points = getAdsbTrackPoints()) {
  if (!points.length) return;
  profileTrackIndex = Math.max(0, Math.min(points.length - 1, index));
  const slider = document.getElementById("elevationTrackSlider");
  if (slider) slider.value = String(profileTrackIndex);
  renderElevationDiagram(points[profileTrackIndex], profileTrackIndex, points.length);
}

function formatGeoLongitudeLabel(lon) {
  const abs = Math.abs(lon);
  return lon < 0 ? `${abs.toFixed(1)}°W` : `${abs.toFixed(1)}°E`;
}

function renderElevationDiagram(point, index, totalPoints) {
  const svgHost = document.getElementById("elevationDiagramSvg");
  const metaHost = document.getElementById("elevationDiagramMeta");
  const label = document.getElementById("elevationTrackLabel");
  if (!svgHost || !metaHost || !point) return;

  const best = computeBestGeoSatellite(point.lat, point.lon);
  const sat = best?.satellite;
  const elev = best?.elevation ?? -1;
  const tier = best?.tier ?? "blocked";
  const tierColor = tierColour(tier);

  if (label) {
    label.textContent = `Sample ${index + 1}/${totalPoints} · t=${(point.t / 60).toFixed(2)} h`;
  }

  if (!sat || elev < 0) {
    svgHost.innerHTML = buildBlockedElevationSvg(point);
    metaHost.innerHTML = buildElevationMetaHtml(point, null, elev, tier);
    return;
  }

  svgHost.innerHTML = buildElevationGeometrySvg(point, sat, elev, tierColor);
  metaHost.innerHTML = buildElevationMetaHtml(point, sat, elev, tier);
}

function buildElevationMetaHtml(point, sat, elev, tier) {
  const tierLabel = GEO_TIER_LEGEND.find((item) => item.tier === tier)?.label || tier;
  const rows = [
    ["Track point", `${point.lat.toFixed(2)}°N, ${formatGeoLongitudeLabel(point.lon)}`],
    ["Altitude / speed", `${(point.alt / 1000).toFixed(1)} km · ${Math.round(point.gs)} km/h`],
    ["Best GEO", sat ? sat.name : "None visible"],
    ["Sub-satellite", sat ? formatGeoLongitudeLabel(sat.lon) : "—"],
    ["Elevation θ", elev >= 0 ? `${elev.toFixed(1)}° (${tierLabel})` : "Below horizon"],
    [
      "IFC path",
      "Aircraft ↔ GEO (Ka user link) ↔ SAS/teleport ↔ terrestrial IP"
    ],
    [
      "ATC (separate)",
      "VHF / ADS-B / CPDLC — not part of the Ku/Ka broadband chain"
    ]
  ];
  return `
    <dl>${rows
      .map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`)
      .join("")}</dl>
    <p class="elevation-diagram-note">Meridian slice through the serving GEO slot. Earth and GEO orbit are concentric circles (Re : R<sub>geo</sub> ≈ 1 : 6.6); the satellite stays on the GEO ring while the aircraft moves along the surface. Aircraft altitude is exaggerated (true cruise ≈12 km is invisible at this scale). θ is measured from the local horizon tangent to the line-of-sight.</p>
  `;
}

// Build meridian-slice geometry: Earth + GEO are concentric circles (true Re : Rgeo
// ratio). Satellite sits on the GEO ring at the subsatellite radial; aircraft sits
// on Earth + exaggerated altitude bump. Angles follow the same formula as
// computeGeoElevation().
function computeElevationDiagramLayout(point, sat, elevDeg) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const ReKm = 6378.137;
  const RgeoKm = 42164.0;
  const orbitRatio = RgeoKm / ReKm;
  const hKm = Math.max(0, point.alt / 1000);

  const cosSigma = Math.cos(toRad(point.lat)) * Math.cos(toRad(point.lon - sat.lon));
  const sigma = Math.acos(Math.max(-1, Math.min(1, cosSigma)));

  const RePx = 92;
  const RgeoPx = RePx * orbitRatio;
  // Link geometry uses surface radius (h ≪ Re, same as computeGeoElevation).
  const rA = RePx;
  // Visual-only radial bump so taxi vs cruise differ on the diagram.
  const hVisualPx = 3 + Math.min(hKm / 11.8, 1) * 11;

  const ox = 118;
  const oy = 248;

  const subAng = 0;
  const acAng = -sigma;

  const subX = ox + RePx * Math.cos(subAng);
  const subY = oy + RePx * Math.sin(subAng);
  const ax = ox + rA * Math.cos(acAng);
  const ay = oy + rA * Math.sin(acAng);
  const iconX = ox + (rA + hVisualPx) * Math.cos(acAng);
  const iconY = oy + (rA + hVisualPx) * Math.sin(acAng);
  const gx = ox + RgeoPx * Math.cos(subAng);
  const gy = oy + RgeoPx * Math.sin(subAng);

  const horizonAng = acAng + Math.PI / 2;
  const hx1 = ax - 56 * Math.cos(horizonAng);
  const hy1 = ay - 56 * Math.sin(horizonAng);
  const hx2 = ax + 56 * Math.cos(horizonAng);
  const hy2 = ay + 56 * Math.sin(horizonAng);

  const losAng = Math.atan2(gy - ay, gx - ax);
  let elevFromGeom = ((horizonAng - losAng) * 180) / Math.PI;
  while (elevFromGeom < 0) elevFromGeom += 360;
  if (elevFromGeom > 180) elevFromGeom = 360 - elevFromGeom;

  const arcR = 32;
  const arcStartX = ax + arcR * Math.cos(horizonAng);
  const arcStartY = ay + arcR * Math.sin(horizonAng);
  const arcEndX = ax + arcR * Math.cos(losAng);
  const arcEndY = ay + arcR * Math.sin(losAng);
  const arcLarge = Math.abs(losAng - horizonAng) > Math.PI ? 1 : 0;
  const arcSweep = losAng < horizonAng ? 1 : 0;

  const gsAng = acAng + 0.55;
  const gsx = ox + RePx * Math.cos(gsAng);
  const gsy = oy + RePx * Math.sin(gsAng);

  const pad = 8;
  const xs = [ax, gx, ox - RePx, ox + RgeoPx, gsx];
  const ys = [ay, gy, oy - RePx, oy, gsy];
  const viewMinX = Math.min(...xs) - pad - 8;
  const viewMinY = Math.min(...ys) - pad - 54;
  const viewMaxX = Math.max(...xs) + pad + 52;
  const viewMaxY = Math.max(...ys) + pad + 70;
  const vbW = Math.max(420, viewMaxX - viewMinX);
  const vbH = Math.max(240, viewMaxY - viewMinY);

  return {
    ox,
    oy,
    RePx,
    RgeoPx,
    hVisualPx,
    hKm,
    sigma,
    acAng,
    sigmaDeg: (sigma * 180) / Math.PI,
    ax,
    ay,
    iconX,
    iconY,
    gx,
    gy,
    subX,
    subY,
    hx1,
    hy1,
    hx2,
    hy2,
    arcStartX,
    arcStartY,
    arcEndX,
    arcEndY,
    arcLarge,
    arcSweep,
    gsx,
    gsy,
    elevFromGeom,
    viewMinX,
    viewMinY,
    viewW: vbW,
    viewH: vbH,
    viewBox: `${viewMinX.toFixed(1)} ${viewMinY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`
  };
}

function buildBlockedElevationSvg(point) {
  return `
    <svg viewBox="0 0 520 280" preserveAspectRatio="xMidYMid meet" class="elevation-schematic-svg" aria-hidden="true">
      <rect width="520" height="280" fill="#0b4564" rx="10"/>
      <text x="260" y="132" text-anchor="middle" fill="#fca5a5" font-size="14" font-weight="700">No route-serving GEO above the horizon</text>
      <text x="260" y="154" text-anchor="middle" fill="#cbd5e1" font-size="11">${point.lat.toFixed(1)}°N, ${formatGeoLongitudeLabel(point.lon)}</text>
    </svg>
  `;
}

function buildElevationGeometrySvg(point, sat, elevDeg, linkColor) {
  const g = computeElevationDiagramLayout(point, sat, elevDeg);
  const shortName = geoSatShortLabel(sat);
  const altNote =
    g.hKm >= 1
      ? `${g.hKm.toFixed(1)} km (exaggerated on diagram)`
      : `${(g.hKm * 1000).toFixed(0)} m (ground / taxi)`;

  const satLabelX = Math.min(g.gx + 10, g.ox + g.RgeoPx - 40);
  const satLabelY = g.gy < g.viewMinY + 40 ? g.gy + 26 : g.gy - 10;
  const planeRotDeg = (g.acAng * 180) / Math.PI + 90;

  return `
    <svg viewBox="${g.viewBox}" preserveAspectRatio="xMidYMid meet" class="elevation-schematic-svg" aria-hidden="true">
      <defs>
        <radialGradient id="elev-earth-fill" cx="50%" cy="42%" r="58%">
          <stop offset="0%" stop-color="#1e6b8a"/>
          <stop offset="100%" stop-color="#0b4564"/>
        </radialGradient>
        <marker id="arrow-signal" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="${linkColor}"/>
        </marker>
      </defs>
      <rect x="${g.viewMinX}" y="${g.viewMinY}" width="${g.viewW}" height="${g.viewH}" fill="#062d4f" rx="10"/>

      <circle cx="${g.ox}" cy="${g.oy}" r="${g.RgeoPx}" fill="none" stroke="#334155" stroke-width="0.9" stroke-dasharray="3 5" opacity="0.55"/>
      <text x="${g.ox + g.RgeoPx * 0.55}" y="${g.oy + 16}" fill="#64748b" font-size="8">GEO orbit (~35 786 km)</text>

      <circle cx="${g.ox}" cy="${g.oy}" r="${g.RePx}" fill="url(#elev-earth-fill)" stroke="#64748b" stroke-width="1.2"/>

      <line x1="${g.hx1}" y1="${g.hy1}" x2="${g.hx2}" y2="${g.hy2}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4 4" opacity="0.95"/>
      <text x="${g.hx1 + 4}" y="${g.hy1 - 6}" fill="#cbd5e1" font-size="9">Local horizon</text>

      <line x1="${g.gsx}" y1="${g.gsy}" x2="${g.gx}" y2="${g.gy}" stroke="#60a5fa" stroke-width="1.4" stroke-dasharray="5 4" opacity="0.85"/>
      <text x="${(g.gsx + g.gx) / 2 - 20}" y="${(g.gsy + g.gy) / 2 + 12}" fill="#93c5fd" font-size="9">Feeder link (SAS)</text>

      <line x1="${g.ax}" y1="${g.ay}" x2="${g.gx}" y2="${g.gy}" stroke="${linkColor}" stroke-width="2.4" marker-end="url(#arrow-signal)"/>
      <text x="${(g.ax + g.gx) / 2 - 8}" y="${(g.ay + g.gy) / 2 - 10}" fill="${linkColor}" font-size="10" font-weight="700">Ka user link</text>

      <path d="M ${g.arcStartX} ${g.arcStartY} A 32 32 0 ${g.arcLarge} ${g.arcSweep} ${g.arcEndX} ${g.arcEndY}" fill="none" stroke="#fef3c7" stroke-width="1.3"/>
      <text x="${g.ax + 8}" y="${g.ay - 12}" fill="#fef3c7" font-size="11" font-weight="700">θ=${elevDeg.toFixed(1)}°</text>

      <circle cx="${g.gx}" cy="${g.gy}" r="7" fill="#fef3c7" stroke="#92400e" stroke-width="1.4"/>
      <text x="${satLabelX}" y="${satLabelY}" fill="#fef3c7" font-size="10" font-weight="700">${shortName}</text>
      <text x="${satLabelX}" y="${satLabelY + 12}" fill="#94a3b8" font-size="9">GEO @ ${formatGeoLongitudeLabel(sat.lon)}</text>

      <g transform="translate(${g.iconX},${g.iconY}) rotate(${planeRotDeg})">
        <path d="M0,-11 L3,-2 L9,2 L8,5 L2,3 L1,9 L-1,9 L-2,3 L-8,5 L-9,2 L-3,-2 Z" fill="#ffc47d" stroke="#1e293b" stroke-width="0.8"/>
      </g>
      ${g.hVisualPx > 4 ? `<line x1="${g.ax}" y1="${g.ay}" x2="${g.iconX}" y2="${g.iconY}" stroke="#64748b" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.7"/>` : ""}
      <text x="${g.iconX - 20}" y="${g.iconY + 22}" fill="#e2e8f0" font-size="10">Aircraft</text>
      <text x="${g.iconX - 20}" y="${g.iconY + 36}" fill="#94a3b8" font-size="9">${point.lat.toFixed(1)}°N · ${altNote}</text>

      <rect x="${g.gsx - 4}" y="${g.gsy - 10}" width="8" height="10" fill="#64748b" stroke="#cbd5e1" stroke-width="0.8"/>
      <polygon points="${g.gsx - 6},${g.gsy - 10} ${g.gsx + 6},${g.gsy - 10} ${g.gsx},${g.gsy - 16}" fill="#64748b"/>
      <text x="${g.gsx - 24}" y="${g.gsy + 18}" fill="#93c5fd" font-size="9">Earth station</text>

      <text x="${g.viewMinX + 12}" y="${g.viewMinY + 18}" fill="#94a3b8" font-size="10">Meridian @ ${formatGeoLongitudeLabel(sat.lon)} · σ=${g.sigmaDeg.toFixed(1)}° from subsatellite</text>
    </svg>
  `;
}

function renderGeoTierLegendList() {
  const host = document.getElementById("geoTierLegend");
  if (!host) return;
  host.innerHTML = renderGeoTierLegendHtml();
}

function renderRouteStatGrid(stats) {
  const host = document.getElementById("routeStatGrid");
  if (!host) return;
  const route = getActiveRoute();
  const computed = stats || getActiveRouteStats();
  const directKm = route.publishedDirectKm || 9315;
  const maxLatNote = route.avoidsRussia
    ? "Southern detour — lower latitude improves GEO geometry vs northern ATS"
    : "Northern ATS — high-latitude Siberia segment (~62°N peak)";
  const items = [
    {
      label: "Track distance",
      value: `${computed.totalDistanceKm.toLocaleString()} km`,
      note: `Published direct ~${directKm.toLocaleString()} km · ${route.carrier || "representative"} profile`
    },
    {
      label: "Flight time",
      value: `${(computed.durationMinutes / 60).toFixed(2)} h`,
      note: `${computed.durationMinutes} minutes airborne`
    },
    {
      label: "Maximum latitude",
      value: `${computed.maxLatitude}\u00B0 N`,
      note: maxLatNote
    },
    {
      label: "Cruise altitude",
      value: `${(computed.maxAltitudeM / 1000).toFixed(1)} km`,
      note: "Top-of-climb peak"
    },
    {
      label: "Mean ground speed",
      value: `${computed.avgGroundSpeedKmh} km/h`,
      note: "Excluding taxi / climb"
    },
    {
      label: "GEO link coverage",
      value: `${computed.geoCoveragePercent}%`,
      note: "Route-serving GX, best elev. \u2265 10\u00B0"
    },
    {
      label: "GEO handovers",
      value: `${computed.handoverCount}`,
      note: "Best-sat switches along track"
    }
  ];
  host.innerHTML = items
    .map(
      (item) =>
        `<article><span>${item.label}</span><strong>${item.value}</strong><small>${item.note}</small></article>`
    )
    .join("");
}

function renderPerSatelliteTable(stats) {
  const tbody = document.querySelector("#perSatelliteTable tbody");
  if (!tbody) return;
  const primary = stats.perSatellite.filter((sat) => sat.relevanceToRoute !== "fleet-other");
  const fleet = stats.perSatellite.filter((sat) => sat.relevanceToRoute === "fleet-other");
  const rowHtml = (sat) => {
    const widthPct = Math.max(2, Math.min(100, sat.coveragePercent));
    const lonLabel = sat.lon >= 0 ? `${sat.lon}\u00B0E` : `${Math.abs(sat.lon)}\u00B0W`;
    return `<tr class="${sat.relevanceToRoute === "fleet-other" ? "sat-row-fleet" : "sat-row-route"}">
      <td>${sat.name}${sat.slotLabel ? `<small>${sat.slotLabel}</small>` : ""}</td>
      <td>${lonLabel}</td>
      <td><span class="bar" style="width:${widthPct}px"></span>${sat.coveragePercent}%</td>
    </tr>`;
  };
  tbody.innerHTML = [
    `<tr class="sat-group-row"><td colspan="3">Route-serving GX (used for elevation analysis)</td></tr>`,
    ...primary.map(rowHtml),
    fleet.length
      ? `<tr class="sat-group-row"><td colspan="3">Other GX fleet slots (reference only on this route)</td></tr>`
      : "",
    ...fleet.map(rowHtml)
  ].join("");
}

function renderProfileChart(points) {
  const canvas = document.getElementById("profileChart");
  if (!canvas) return;
  if (typeof Chart === "undefined") {
    canvas.replaceWith(
      Object.assign(document.createElement("p"), {
        className: "map-note",
        textContent:
          "Chart.js failed to load (offline?). Altitude/speed profile is unavailable; numeric statistics remain valid."
      })
    );
    return;
  }
  const xFor = (point) => +(point.t / 60).toFixed(3);
  const altSeries = points.map((p) => ({
    x: xFor(p),
    y: +(p.alt / 1000).toFixed(2)
  }));
  const speedSeries = points.map((p) => ({
    x: xFor(p),
    y: p.gs
  }));

  if (profileChart) {
    profileChart.destroy();
  }
  profileChart = new Chart(canvas, {
    type: "line",
    data: {
      datasets: [
        {
          label: "Altitude (km)",
          data: altSeries,
          yAxisID: "yAlt",
          borderColor: "#1d4ed8",
          backgroundColor: "rgba(29,78,216,0.15)",
          fill: true,
          tension: 0.25,
          pointRadius: points.map((_, i) => (i === profileTrackIndex ? 5 : 1.5)),
          pointBackgroundColor: points.map((_, i) =>
            i === profileTrackIndex ? "#f59e0b" : "#1d4ed8"
          ),
          borderWidth: 2
        },
        {
          label: "Ground speed (km/h)",
          data: speedSeries,
          yAxisID: "yGs",
          borderColor: "#16a34a",
          backgroundColor: "rgba(22,163,74,0.05)",
          fill: false,
          tension: 0.25,
          pointRadius: 1.5,
          borderWidth: 2,
          borderDash: [4, 4]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      onClick: (_event, elements) => {
        if (elements.length > 0) {
          setProfileTrackIndex(elements[0].index, points);
          renderProfileChart(points);
        }
      },
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            title: (items) => `t = ${items[0].parsed.x.toFixed(2)} h`
          }
        }
      },
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: "Time since pushback (h)" },
          ticks: { maxTicksLimit: 12 }
        },
        yAlt: {
          type: "linear",
          position: "left",
          title: { display: true, text: "Altitude (km)" },
          suggestedMin: 0,
          suggestedMax: 13
        },
        yGs: {
          type: "linear",
          position: "right",
          title: { display: true, text: "Ground speed (km/h)" },
          suggestedMin: 0,
          suggestedMax: 1000,
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}
