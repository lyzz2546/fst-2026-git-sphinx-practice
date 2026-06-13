const AEROSAT_DATA = {
  // Selectable routes for the map UI. Additional city pairs can be appended here.
  routeCatalog: [
    {
      id: "PVG-CDG-MU",
      label: "PVG \u2192 CDG \u00b7 China Eastern (MU) \u00b7 northern ATS via Russia",
      shortLabel: "PVG-CDG MU",
      description:
        "Representative ADS-B-style track for Chinese-carrier routing over Mongolia / Siberia (Russian airspace usable)"
    },
    {
      id: "PVG-CDG-AF",
      label: "PVG \u2192 CDG \u00b7 Air France (AF) \u00b7 southern detour (Russia avoided)",
      shortLabel: "PVG-CDG AF",
      description:
        "Representative ADS-B-style track for EU-carrier routing via Central Asia / Turkey (post-2022 airspace sanctions)"
    },
    {
      id: "CDG-PVG-MU",
      label: "CDG \u2192 PVG \u00b7 China Eastern (MU) \u00b7 northern ATS via Russia",
      shortLabel: "CDG-PVG MU",
      description: "Return leg: northern corridor representative track"
    },
    {
      id: "CDG-PVG-AF",
      label: "CDG \u2192 PVG \u00b7 Air France (AF) \u00b7 southern detour (Russia avoided)",
      shortLabel: "CDG-PVG AF",
      description: "Return leg: southern detour representative track"
    }
  ],

  route: {
    id: "PVG-CDG",
    title: "Shanghai Pudong (PVG) to Paris Charles de Gaulle (CDG)",
    origin: {
      code: "PVG",
      icao: "ZSPD",
      name: "Shanghai Pudong International Airport",
      city: "Shanghai",
      country: "China",
      lat: 31.143378,
      lon: 121.805214,
      source: "OurAirports airports.csv / ZSPD"
    },
    destination: {
      code: "CDG",
      icao: "LFPG",
      name: "Paris Charles de Gaulle Airport",
      city: "Paris",
      country: "France",
      lat: 49.00896,
      lon: 2.554117,
      source: "OurAirports airports.csv / LFPG"
    },
    distanceKm: 9315,
    distanceMiles: 5789,
    directOperators: ["Air France", "China Eastern Airlines"],
    note:
      "PVG\u2013CDG is served by China Eastern and Air France. Since 2022, EU carriers generally avoid Russian FIR; Chinese carriers may still use northern ATS routes. Tracks here are representative ADS-B-style samples, not live flights."
  },

  // Simplified Russia FIR / airspace polygon for map shading (teaching overlay only).
  restrictedAirspace: {
    id: "russia-fir-exclusion",
    label: "Russia FIR (avoided by EU carriers, illustrative)",
    since: "2022",
    reason: "EU sanctions / operator routing policy after Russia\u2013Ukraine conflict",
    appliesToRouteIds: ["PVG-CDG-AF", "CDG-PVG-AF"],
    polygon: [
      [19, 41],
      [30, 45],
      [40, 50],
      [55, 55],
      [70, 58],
      [90, 55],
      [110, 52],
      [130, 50],
      [150, 52],
      [170, 58],
      [180, 65],
      [170, 72],
      [140, 75],
      [100, 73],
      [60, 70],
      [30, 65],
      [10, 58],
      [0, 50],
      [10, 43]
    ]
  },

  routeFlightNumbers: {
    "PVG-CDG-MU": ["569", "553", "219"],
    "PVG-CDG-AF": ["111", "116"],
    "CDG-PVG-MU": ["570", "554", "220"],
    "CDG-PVG-AF": ["116", "111"]
  },
  routeFlightCallsignPrefixes: {
    "PVG-CDG-MU": ["CES", "MU"],
    "PVG-CDG-AF": ["AFR", "AF"],
    "CDG-PVG-MU": ["CES", "MU"],
    "CDG-PVG-AF": ["AFR", "AF"]
  },

  // Very coarse local basemap polygons. The app does not depend on map tiles, so the route
  // remains visible in classrooms with unreliable tile loading.
  basemap: [
    {
      name: "Europe",
      points: [
        [-10, 36],
        [0, 45],
        [8, 58],
        [22, 61],
        [33, 54],
        [40, 46],
        [31, 37],
        [15, 35],
        [4, 40]
      ]
    },
    {
      name: "Asia",
      points: [
        [35, 31],
        [48, 44],
        [70, 55],
        [102, 58],
        [130, 50],
        [146, 38],
        [132, 24],
        [112, 19],
        [95, 8],
        [76, 19],
        [58, 23]
      ]
    },
    {
      name: "China / East Asia",
      points: [
        [92, 20],
        [105, 36],
        [120, 45],
        [134, 40],
        [130, 27],
        [122, 21],
        [110, 18]
      ]
    },
    {
      name: "North Africa",
      points: [
        [-17, 14],
        [6, 33],
        [32, 31],
        [41, 16],
        [20, 5],
        [-6, 6]
      ]
    },
    {
      name: "Arctic Reference",
      points: [
        [-20, 67],
        [20, 72],
        [70, 74],
        [120, 70],
        [160, 63],
        [120, 58],
        [60, 60],
        [10, 62]
      ]
    }
  ],

  orbitShells: [
    {
      id: "aircraft",
      label: "Aircraft cruise",
      altitudeKm: 11,
      color: "#f59e0b",
      description: "A long-haul aircraft typically cruises near 10-12 km altitude."
    },
    {
      id: "leo",
      label: "LEO broadband",
      altitudeKm: 550,
      color: "#12b3a8",
      description: "Starlink and OneWeb are represented as low Earth orbit broadband constellations."
    },
    {
      id: "meo",
      label: "MEO layer",
      altitudeKm: 8060,
      color: "#6d5dfc",
      description: "SES O3b / O3b mPOWER is represented as a medium Earth orbit capacity layer."
    },
    {
      id: "geo",
      label: "GEO broadband",
      altitudeKm: 35786,
      color: "#1d4ed8",
      description: "Viasat, Intelsat, Panasonic partner capacity, and other legacy broadband services often use GEO capacity."
    }
  ],

  providers: [
    {
      name: "Eutelsat OneWeb",
      orbit: "LEO + GEO ecosystem",
      shellId: "leo",
      fitScore: 92,
      fitLabel: "Very strong candidate",
      regionFit: "Global / mobility-focused",
      why:
        "Eutelsat states that its aviation offer uses the OneWeb LEO network with multi-orbit GEO capabilities. This makes it a plausible candidate for a long Eurasian route, especially through integrator partners.",
      caveat:
        "Actual service depends on airline contract, aircraft terminal, route approvals, and operational rollout.",
      sourceId: "eutelsat-aviation"
    },
    {
      name: "Intelsat Aviation",
      orbit: "GEO + LEO multi-orbit",
      shellId: "geo",
      fitScore: 88,
      fitLabel: "Strong candidate",
      regionFit: "Dense long-haul routes",
      why:
        "Intelsat describes aviation connectivity using global network coverage and multi-layered capacity, with public materials describing multi-orbit IFC using LEO and GEO assets.",
      caveat:
        "Public materials show capability, not that a specific PVG-CDG aircraft is equipped with it.",
      sourceId: "intelsat-aviation"
    },
    {
      name: "Viasat / Inmarsat GX",
      orbit: "GEO Ka-band + L-band safety services",
      shellId: "geo",
      fitScore: 82,
      fitLabel: "Strong legacy broadband candidate",
      regionFit: "Long-haul aviation",
      why:
        "Viasat positions its aviation services around high-capacity satellite connectivity and global reach. Inmarsat GX is a major aviation broadband lineage after the Viasat acquisition.",
      caveat:
        "GEO service quality varies with beam footprint, terminal, congestion, and regulatory permissions.",
      sourceId: "viasat-aviation"
    },
    {
      name: "Starlink Aviation",
      orbit: "LEO",
      shellId: "leo",
      fitScore: 78,
      fitLabel: "Technically plausible, fleet-dependent",
      regionFit: "Low-latency broadband",
      why:
        "Starlink markets a dedicated aviation product and its LEO architecture is attractive for passenger broadband on long flights.",
      caveat:
        "Do not infer PVG-CDG service unless the operating aircraft is known to carry Starlink.",
      sourceId: "starlink-aviation"
    },
    {
      name: "Panasonic Avionics",
      orbit: "GEO + LEO partner capacity",
      shellId: "geo",
      fitScore: 74,
      fitLabel: "Integrator/service-provider candidate",
      regionFit: "Airline IFEC ecosystem",
      why:
        "Panasonic Avionics describes its inflight connectivity network as combining GEO and LEO capacity.",
      caveat:
        "It is an IFEC provider and integrator; satellite ownership and capacity partners may vary.",
      sourceId: "panasonic-network"
    },
    {
      name: "SES / O3b mPOWER",
      orbit: "MEO + GEO",
      shellId: "meo",
      fitScore: 68,
      fitLabel: "Possible multi-orbit capacity layer",
      regionFit: "High-throughput mobility",
      why:
        "SES describes O3b mPOWER as a MEO system and offers mobility connectivity. It is relevant as a non-GEO middle-orbit architecture comparison.",
      caveat:
        "Commercial aviation availability for a specific airline must be verified via contracts and installations.",
      sourceId: "ses-o3b"
    },
    {
      name: "Iridium Certus",
      orbit: "LEO L-band",
      shellId: "leo",
      fitScore: 54,
      fitLabel: "More relevant to safety/operational links",
      regionFit: "Reliable low-data-rate global service",
      why:
        "Iridium Certus supports aviation satellite communications and can be important for safety, cockpit, or operational connectivity.",
      caveat:
        "It is not the main candidate for passenger high-speed Wi-Fi comparable with Ka/Ku broadband.",
      sourceId: "iridium-certus"
    }
  ],

  publicSatelliteFeeds: [
    {
      id: "starlink",
      label: "Starlink",
      provider: "Starlink Aviation",
      shellId: "leo",
      color: "#12b3a8",
      url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json"
    },
    {
      id: "oneweb",
      label: "OneWeb",
      provider: "Eutelsat OneWeb",
      shellId: "leo",
      color: "#0f766e",
      url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=oneweb&FORMAT=json"
    }
  ],

  evidence: [
    {
      type: "Route",
      claim: "PVG-CDG is a real scheduled non-stop city pair served by Air France and China Eastern.",
      status: "Supported",
      sourceId: "flightsfrom-cdg-pvg"
    },
    {
      type: "Airspace",
      claim: "Since 2022, EU carriers (e.g. Air France AF111) commonly route PVG\u2013CDG south of Russia; Chinese carriers may still use northern ATS corridors.",
      status: "Supported",
      sourceId: "flightaware-af111-airspace"
    },
    {
      type: "Airport",
      claim: "PVG and CDG coordinates are taken from open airport data rather than manually invented.",
      status: "Supported",
      sourceId: "ourairports-data"
    },
    {
      type: "Satellite Data",
      claim: "CelesTrak provides public GP element data in JSON/CSV formats for satellite groups such as Starlink and OneWeb.",
      status: "Supported",
      sourceId: "celestrak-gp"
    },
    {
      type: "IFC Network",
      claim: "Multiple public aviation connectivity providers advertise LEO, GEO, MEO, or multi-orbit IFC capabilities.",
      status: "Supported",
      sourceId: "eutelsat-aviation"
    },
    {
      type: "Limitation",
      claim: "The public web does not reliably disclose the exact satellite used by a specific scheduled passenger flight.",
      status: "Needs private/operator data",
      sourceId: "report-limit"
    }
  ],

  sources: {
    "directflights-pvg-cdg": {
      title: "Directflights: Direct flights from Shanghai to Paris (PVG-CDG)",
      url: "https://www.directflights.com/PVG-CDG",
      note:
        "Used for public route facts: direct operators, published distance 5,789 miles / 9,315 km, and scheduled direct departures."
    },
    "flightsfrom-cdg-pvg": {
      title: "FlightsFrom: Direct non-stop flights CDG-PVG",
      url: "https://www.flightsfrom.com/CDG-PVG",
      note:
        "Used to cross-check the non-stop route, direct airlines, distance, and aircraft examples for the reverse city pair."
    },
    "flightroutes-pvg-cdg": {
      title: "FlightRoutes: Shanghai to Paris routes",
      url: "https://www.flightroutes.com/PVG-CDG",
      note:
        "Used as a public route-map reference showing non-stop and connecting route options."
    },
    "ourairports-data": {
      title: "OurAirports open data downloads",
      url: "https://ourairports.com/data/",
      note:
        "Used for open airport coordinate data; the site states the dataset is public domain and downloadable as CSV."
    },
    "celestrak-gp": {
      title: "CelesTrak GP data formats",
      url: "https://www.celestrak.org/NORAD/documentation/gp-data-formats.php",
      note:
        "Used as the public source for satellite element-set data formats and current satellite group feeds."
    },
    "starlink-aviation": {
      title: "Starlink Aviation",
      url: "https://www.starlink.com/aviation",
      note: "Used for Starlink's public aviation connectivity product description."
    },
    "eutelsat-aviation": {
      title: "Eutelsat Aviation",
      url: "https://www.eutelsat.com/satellite-services/aviation",
      note:
        "Used for public statements about OneWeb LEO aviation services and multi-orbit capability."
    },
    "intelsat-aviation": {
      title: "Intelsat Aviation",
      url: "https://www.intelsat.com/aviation/",
      note:
        "Used for public statements about aviation connectivity, global coverage, and multi-layered capacity."
    },
    "viasat-aviation": {
      title: "Viasat Aviation",
      url: "https://www.viasat.com/aviation/",
      note:
        "Used for public statements about Viasat aviation connectivity, satellite-based services, and global reach."
    },
    "panasonic-network": {
      title: "Panasonic Avionics network",
      url: "https://www.panasonic.aero/our-offerings/in-flight-connectivity/network",
      note:
        "Used for public statements about Panasonic's inflight connectivity network and multi-orbit capacity."
    },
    "ses-o3b": {
      title: "SES O3b mPOWER",
      url: "https://www.ses.com/v2/network-and-technology/meo/o3b-mpower",
      note:
        "Used as a public reference for MEO high-throughput satellite architecture relevant to mobility."
    },
    "iridium-certus": {
      title: "Iridium Certus Aviation",
      url: "https://ifp.iridium.com/iridium-certus-aviation/",
      note:
        "Used as a public reference for L-band aviation satellite communication services."
    },
    "report-limit": {
      title: "Research limitation documented in this project",
      url: "./docs/report.md#data-boundary",
      note:
        "A project-level limitation: exact flight-to-satellite association normally requires airline/operator/private telemetry."
    },
    "opensky-network": {
      title: "OpenSky Network — Live ADS-B / Mode-S data",
      url: "https://opensky-network.org/",
      note:
        "Free academic API providing aircraft state vectors and historical track data derived from a global volunteer ADS-B receiver network."
    },
    "inmarsat-fleet": {
      title: "Inmarsat Global Xpress (GX) fleet positions",
      url: "https://www.inmarsat.com/en/about/our-satellites.html",
      note:
        "Publicly disclosed sub-satellite longitudes for the Inmarsat-5 / Inmarsat-6 Ka-band aviation broadband fleet."
    },
    "adsb-track-sample": {
      title: "PVG-CDG representative track samples (MU northern / AF southern)",
      url: "./src/data.js#adsbTrackNorthern",
      note:
        "Two representative trajectories: northern ATS (MU) and southern detour (AF). Replace with OpenSky-fetched JSON via tools/fetch_opensky.py."
    },
    "flightaware-af111-airspace": {
      title: "FlightAware — AF111 PVG-CDG track (southern detour reference)",
      url: "https://www.flightaware.com/",
      note:
        "Public flight-track snapshots show EU-carrier PVG\u2013CDG routings avoiding Russian FIR with longer flown distance (~10 779 km vs ~9 277 km direct)."
    }
  },

  // Northern ATS — China Eastern MU553 class.
  // Shape from public FlightAware MU552/MU553: Mongolia + Siberia (N of Kazakhstan),
  // then Baltic/Scandinavia sector into CDG (~9 600 km flown class on FA snapshots).
  adsbTrackNorthern: {
    meta: {
      flightId: "PVG-CDG MU553-class northern track",
      operator: "China Eastern Airlines (MU / CES)",
      flightExample: "MU553 / MU569",
      aircraftType: "Boeing 777-300ER",
      departureUtc: "2025-01-15T16:33:00Z",
      arrivalUtc: "2025-01-16T04:10:00Z",
      airspaceProfile: "northern-russia-ats",
      avoidsRussia: false,
      crossesKazakhstan: false,
      publishedDirectKm: 9277,
      flightAwareFlownKm: 9606,
      source:
        "Representative sample with OpenSky-captured China climb segment from CES553, then FlightAware-shaped Mongolia/Siberia continuation; not a full raw OpenSky dump."
    },
    points: [
      { t: 0, lat: 31.143, lon: 121.805, alt: 50, gs: 0 },
      { t: 8, lat: 31.7, lon: 121.35, alt: 1500, gs: 400 },
      { t: 18, lat: 32.8, lon: 120.4, alt: 5000, gs: 620 },
      { t: 30, lat: 34.8, lon: 118.7, alt: 8500, gs: 760 },
      { t: 42, lat: 37.2, lon: 117.3, alt: 9144, gs: 830 },
      { t: 54, lat: 39.2411, lon: 116.5931, alt: 9144, gs: 850 },
      { t: 58, lat: 39.7506, lon: 116.8313, alt: 9144, gs: 892 },
      { t: 63, lat: 40.3977, lon: 116.721, alt: 9144, gs: 831 },
      { t: 67, lat: 40.8309, lon: 116.5618, alt: 9144, gs: 865 },
      { t: 70, lat: 41.1267, lon: 116.5341, alt: 9144, gs: 854 },
      { t: 74, lat: 41.4761, lon: 116.3383, alt: 9144, gs: 831 },
      { t: 96, lat: 45.2, lon: 108.8, alt: 11200, gs: 875 },
      { t: 124, lat: 48.2, lon: 101.0, alt: 11500, gs: 884 },
      { t: 156, lat: 51.0, lon: 95.0, alt: 11800, gs: 882 },
      { t: 183, lat: 53.5, lon: 91.2, alt: 11800, gs: 880 },
      { t: 210, lat: 55.8, lon: 87.0, alt: 11800, gs: 878 },
      { t: 238, lat: 57.8, lon: 82.5, alt: 11800, gs: 876 },
      { t: 266, lat: 59.5, lon: 77.5, alt: 11800, gs: 874 },
      { t: 294, lat: 60.8, lon: 72.0, alt: 11800, gs: 872 },
      { t: 322, lat: 61.8, lon: 66.0, alt: 11800, gs: 870 },
      { t: 348, lat: 62.0, lon: 60.0, alt: 11800, gs: 868 },
      { t: 374, lat: 62.0, lon: 54.0, alt: 11800, gs: 866 },
      { t: 398, lat: 61.6, lon: 48.0, alt: 11800, gs: 862 },
      { t: 422, lat: 60.8, lon: 42.0, alt: 11800, gs: 858 },
      { t: 446, lat: 60.0, lon: 36.0, alt: 11800, gs: 854 },
      { t: 470, lat: 59.2, lon: 30.0, alt: 11800, gs: 848 },
      { t: 494, lat: 58.5, lon: 24.0, alt: 11750, gs: 842 },
      { t: 518, lat: 57.8, lon: 18.5, alt: 11600, gs: 825 },
      { t: 542, lat: 56.5, lon: 14.0, alt: 11200, gs: 790 },
      { t: 564, lat: 54.8, lon: 10.5, alt: 10200, gs: 710 },
      { t: 584, lat: 52.8, lon: 7.8, alt: 8800, gs: 620 },
      { t: 602, lat: 51.2, lon: 5.5, alt: 6800, gs: 520 },
      { t: 620, lat: 50.0, lon: 3.8, alt: 4500, gs: 400 },
      { t: 640, lat: 49.4, lon: 2.85, alt: 2200, gs: 280 },
      { t: 660, lat: 49.12, lon: 2.62, alt: 700, gs: 160 },
      { t: 696, lat: 49.009, lon: 2.554, alt: 50, gs: 0 }
    ]
  },

  // Southern detour — Air France AF111 class (Russia avoided).
  // Central Asia → Caspian → Turkey → Balkans → central Europe. Max latitude ~48°N.
  adsbTrackSouthern: {
    meta: {
      flightId: "PVG-CDG AF111-class southern detour",
      operator: "Air France (AF / AFR)",
      flightExample: "AF111",
      aircraftType: "Boeing 777-300ER",
      departureUtc: "2025-03-12T13:52:00Z",
      arrivalUtc: "2025-03-13T03:12:00Z",
      airspaceProfile: "southern-detour",
      avoidsRussia: true,
      crossesKazakhstan: true,
      publishedDirectKm: 9277,
      flightAwareFlownKm: 10779,
      source:
        "FlightAware-shaped representative sample (not raw OpenSky ADS-B). Central Asia ~41°N, avoids Russia."
    },
    points: [
      { t: 0, lat: 31.143, lon: 121.805, alt: 50, gs: 0 },
      { t: 5, lat: 31.42, lon: 121.48, alt: 1100, gs: 370 },
      { t: 12, lat: 32.0, lon: 120.55, alt: 4200, gs: 560 },
      { t: 20, lat: 33.0, lon: 118.9, alt: 7800, gs: 730 },
      { t: 30, lat: 34.5, lon: 116.0, alt: 10500, gs: 840 },
      { t: 42, lat: 36.2, lon: 111.5, alt: 11000, gs: 870 },
      { t: 58, lat: 37.8, lon: 106.0, alt: 11200, gs: 878 },
      { t: 78, lat: 39.0, lon: 99.5, alt: 11300, gs: 880 },
      { t: 102, lat: 40.2, lon: 92.0, alt: 11500, gs: 880 },
      { t: 128, lat: 41.0, lon: 84.5, alt: 11500, gs: 878 },
      { t: 155, lat: 41.5, lon: 77.0, alt: 11800, gs: 876 },
      { t: 183, lat: 41.8, lon: 69.5, alt: 11800, gs: 874 },
      { t: 212, lat: 41.5, lon: 62.0, alt: 11800, gs: 872 },
      { t: 242, lat: 41.0, lon: 54.5, alt: 11800, gs: 870 },
      { t: 272, lat: 40.8, lon: 47.0, alt: 11800, gs: 868 },
      { t: 302, lat: 40.5, lon: 40.0, alt: 11800, gs: 865 },
      { t: 332, lat: 40.8, lon: 33.5, alt: 11800, gs: 862 },
      { t: 362, lat: 41.5, lon: 28.0, alt: 11800, gs: 858 },
      { t: 392, lat: 42.5, lon: 23.0, alt: 11800, gs: 855 },
      { t: 422, lat: 43.8, lon: 18.5, alt: 11800, gs: 850 },
      { t: 452, lat: 45.2, lon: 14.5, alt: 11800, gs: 845 },
      { t: 482, lat: 46.5, lon: 11.0, alt: 11700, gs: 835 },
      { t: 512, lat: 47.5, lon: 8.0, alt: 11200, gs: 780 },
      { t: 542, lat: 48.2, lon: 5.5, alt: 9800, gs: 680 },
      { t: 572, lat: 48.8, lon: 4.0, alt: 7500, gs: 560 },
      { t: 598, lat: 49.2, lon: 3.2, alt: 5200, gs: 440 },
      { t: 622, lat: 49.4, lon: 2.85, alt: 2800, gs: 320 },
      { t: 648, lat: 49.25, lon: 2.68, alt: 1200, gs: 200 },
      { t: 665, lat: 49.08, lon: 2.58, alt: 400, gs: 120 },
      { t: 675, lat: 49.009, lon: 2.554, alt: 50, gs: 0 }
    ]
  },

  // Legacy alias — northern MU track (was the single combined representative sample).
  adsbTrack: null,

  // GEO aviation broadband satellites along this corridor (sub-satellite longitudes are
  // public). For each point on the track we compute the elevation angle to each satellite;
  // if it falls below ~10 degrees the link is considered unreliable.
  geoSatellites: [
    {
      id: "i5-f1",
      name: "Inmarsat-5 F1 (GX)",
      operator: "Inmarsat / Viasat",
      lon: 62.6,
      band: "Ka",
      relevanceToRoute: "primary",
      slotLabel: "EMEA (62.6\u00B0E)",
      sourceId: "inmarsat-fleet"
    },
    {
      id: "i5-f4",
      name: "Inmarsat-5 F4 (GX)",
      operator: "Inmarsat / Viasat",
      lon: 56.5,
      band: "Ka",
      relevanceToRoute: "primary",
      slotLabel: "Europe (56.5\u00B0E)",
      sourceId: "inmarsat-fleet"
    },
    {
      id: "i5-f3",
      name: "Inmarsat-5 F3 (GX)",
      operator: "Inmarsat / Viasat",
      lon: 179.6,
      band: "Ka",
      relevanceToRoute: "primary",
      slotLabel: "Pacific / Asia (179.6\u00B0E)",
      sourceId: "inmarsat-fleet"
    },
    {
      id: "i5-f5",
      name: "Inmarsat GX5 (F5)",
      operator: "Inmarsat / Viasat",
      lon: 11.0,
      band: "Ka",
      relevanceToRoute: "primary",
      slotLabel: "Europe / ME (11\u00B0E)",
      sourceId: "inmarsat-fleet"
    },
    {
      id: "i6-f1",
      name: "Inmarsat-6 F1 (GX)",
      operator: "Inmarsat / Viasat",
      lon: 83.8,
      band: "Ka / L",
      relevanceToRoute: "primary",
      slotLabel: "Asia (83.8\u00B0E)",
      sourceId: "inmarsat-fleet"
    },
    {
      id: "i5-f2",
      name: "Inmarsat-5 F2 (GX)",
      operator: "Inmarsat / Viasat",
      lon: -55.0,
      band: "Ka",
      relevanceToRoute: "fleet-other",
      slotLabel: "Americas (55\u00B0W)",
      sourceId: "inmarsat-fleet"
    }
  ]
};

(function initRouteBundles() {
  function haversineTrackKm(points) {
    const R = 6371.0088;
    const toRad = (deg) => (deg * Math.PI) / 180;
    let total = 0;
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      const dLat = toRad(b.lat - a.lat);
      const dLon = toRad(b.lon - a.lon);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);
      const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
      total += 2 * R * Math.asin(Math.sqrt(h));
    }
    return Math.round(total);
  }

  function enrichTrackMeta(track) {
    const points = track.points || [];
    if (points.length === 0) return track;
    const durationMinutes = points[points.length - 1].t - points[0].t;
    track.meta.durationMinutes = durationMinutes;
    track.meta.trackDistanceKm = haversineTrackKm(points);
    track.meta.maxLatitudeDeg = +Math.max(...points.map((p) => p.lat)).toFixed(1);
    return track;
  }

  function reverseTrack(track, metaOverrides) {
    const maxT = track.points[track.points.length - 1].t;
    const reversed = {
      meta: { ...track.meta, ...metaOverrides },
      points: track.points
        .slice()
        .reverse()
        .map((point) => ({ ...point, t: maxT - point.t }))
    };
    return enrichTrackMeta(reversed);
  }

  AEROSAT_DATA.adsbTrackNorthern = enrichTrackMeta(AEROSAT_DATA.adsbTrackNorthern);
  AEROSAT_DATA.adsbTrackSouthern = enrichTrackMeta(AEROSAT_DATA.adsbTrackSouthern);
  AEROSAT_DATA.adsbTrack = AEROSAT_DATA.adsbTrackNorthern;

  const base = AEROSAT_DATA.route;
  const northern = AEROSAT_DATA.adsbTrackNorthern;
  const southern = AEROSAT_DATA.adsbTrackSouthern;

  AEROSAT_DATA.routes = {
    "PVG-CDG-MU": {
      route: {
        ...base,
        id: "PVG-CDG-MU",
        title: "Shanghai Pudong (PVG) to Paris CDG — China Eastern northern ATS",
        carrier: "China Eastern Airlines",
        carrierIcao: "CES",
        flightExamples: ["MU553", "MU569"],
        airspaceProfile: "northern-russia-ats",
        avoidsRussia: false,
        publishedDirectKm: northern.meta.publishedDirectKm,
        note:
          "Representative northern track over Mongolia / Siberia (~62\u00B0N). Chinese carriers may use Russian FIR; descent via Poland/Germany into CDG."
      },
      adsbTrack: northern
    },
    "PVG-CDG-AF": {
      route: {
        ...base,
        id: "PVG-CDG-AF",
        title: "Shanghai Pudong (PVG) to Paris CDG — Air France southern detour",
        carrier: "Air France",
        carrierIcao: "AFR",
        flightExamples: ["AF111"],
        airspaceProfile: "southern-detour",
        avoidsRussia: true,
        publishedDirectKm: southern.meta.publishedDirectKm,
        note:
          "Representative southern detour via Central Asia / Turkey (Russia avoided). Lower max latitude vs northern ATS."
      },
      adsbTrack: southern
    },
    "CDG-PVG-MU": {
      route: {
        id: "CDG-PVG-MU",
        title: "Paris CDG to Shanghai Pudong (PVG) — China Eastern northern ATS",
        origin: base.destination,
        destination: base.origin,
        carrier: "China Eastern Airlines",
        carrierIcao: "CES",
        flightExamples: ["MU554", "MU570"],
        airspaceProfile: "northern-russia-ats",
        avoidsRussia: false,
        publishedDirectKm: northern.meta.publishedDirectKm,
        directOperators: base.directOperators,
        note: "Return leg — time-reversed northern representative track."
      },
      adsbTrack: reverseTrack(northern, {
        flightId: "CDG-PVG MU554-class northern track",
        flightExample: "MU554 / MU570"
      })
    },
    "CDG-PVG-AF": {
      route: {
        id: "CDG-PVG-AF",
        title: "Paris CDG to Shanghai Pudong (PVG) — Air France southern detour",
        origin: base.destination,
        destination: base.origin,
        carrier: "Air France",
        carrierIcao: "AFR",
        flightExamples: ["AF116"],
        airspaceProfile: "southern-detour",
        avoidsRussia: true,
        publishedDirectKm: southern.meta.publishedDirectKm,
        directOperators: base.directOperators,
        note: "Return leg — time-reversed southern detour representative track."
      },
      adsbTrack: reverseTrack(southern, {
        flightId: "CDG-PVG AF116-class southern detour",
        flightExample: "AF116"
      })
    }
  };

  Object.values(AEROSAT_DATA.routes).forEach((bundle) => {
    bundle.route.distanceKm = bundle.adsbTrack.meta.trackDistanceKm;
    bundle.route.durationMinutes = bundle.adsbTrack.meta.durationMinutes;
    bundle.route.maxLatitudeDeg = bundle.adsbTrack.meta.maxLatitudeDeg;
  });
})();
