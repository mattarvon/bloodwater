// noaa.js — NOAA CO-OPS tide telemetry. Public, keyless, CORS-enabled.
// Globals: TIDE_STATIONS, loadTides()
// https://api.tidesandcurrents.noaa.gov/api/prod/datagetter

const COOPS = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";

// curated coastal water-level gauges, geographic spread around US coasts
const TIDE_STATIONS = [
  { id: "8443970", name: "Boston, MA" },
  { id: "8454000", name: "Providence, RI" },
  { id: "8518750", name: "The Battery, NY" },
  { id: "8534720", name: "Atlantic City, NJ" },
  { id: "8665530", name: "Charleston, SC" },
  { id: "8724580", name: "Key West, FL" },
  { id: "8771450", name: "Galveston, TX" },
  { id: "9410170", name: "San Diego, CA" },
  { id: "9414290", name: "San Francisco, CA" },
  { id: "9447130", name: "Seattle, WA" },
  { id: "1612340", name: "Honolulu, HI" },
  { id: "9455920", name: "Anchorage, AK" },
];

// last ~1h of 6-min water level -> current value + rising/falling trend
async function fetchTide(st) {
  const url = `${COOPS}?product=water_level&range=1&datum=MLLW&time_zone=lst_ldt&units=english&format=json&station=${st.id}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("coops " + r.status);
  const j = await r.json();
  const d = j.data || [];
  if (!d.length) throw new Error("no data");
  const last = +d[d.length - 1].v;
  const first = +d[0].v;
  const m = j.metadata || {};
  return {
    id: st.id, name: st.name,
    lat: m.lat != null ? +m.lat : null,
    lon: m.lon != null ? +m.lon : null,
    value: last, trend: last - first, t: d[d.length - 1].t,
  };
}

// resolves to an array (failed stations come back as null)
function loadTides() {
  return Promise.all(TIDE_STATIONS.map(s => fetchTide(s).catch(() => null)));
}
