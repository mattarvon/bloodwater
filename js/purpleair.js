// purpleair.js — crowdsourced PM2.5 from the PurpleAir sensor network.
// Needs a free READ key (X-API-Key). Get one at develop.purpleair.com.
// The key is stored locally (localStorage), never committed.
// Globals: paKey(), setPaKey(), pmColor(), pmCategory(), loadAir()

const PA_API = "https://api.purpleair.com/v1/sensors";

function paKey() { return localStorage.getItem("pa_key") || ""; }
function setPaKey(k) { localStorage.setItem("pa_key", (k || "").trim()); }

// US-EPA PM2.5 (µg/m³) AQI bands -> colour + label
function pmCategory(pm) {
  if (pm < 12.1) return "Good";
  if (pm < 35.5) return "Moderate";
  if (pm < 55.5) return "Unhealthy (SG)";
  if (pm < 150.5) return "Unhealthy";
  if (pm < 250.5) return "Very Unhealthy";
  return "Hazardous";
}
function pmColor(pm) {
  if (pm < 12.1) return "#56e6b4";
  if (pm < 35.5) return "#e6d756";
  if (pm < 55.5) return "#e69a2f";
  if (pm < 150.5) return "#e6201c";
  if (pm < 250.5) return "#9c3bd1";
  return "#7a0b10";
}

// bbox: {nwlat,nwlng,selat,selng}. Returns null if no key set, else sensor array.
async function loadAir(bbox) {
  const key = paKey();
  if (!key) return null;
  const q = `?fields=pm2.5,latitude,longitude,name` +
    `&nwlng=${bbox.nwlng}&nwlat=${bbox.nwlat}&selng=${bbox.selng}&selat=${bbox.selat}` +
    `&max_age=3600&location_type=0`;
  const r = await fetch(PA_API + q, { headers: { "X-API-Key": key } });
  if (!r.ok) throw new Error("purpleair " + r.status);
  const j = await r.json();
  const fi = {}; (j.fields || []).forEach((f, i) => { fi[f] = i; });
  return (j.data || []).map(row => ({
    pm: +row[fi["pm2.5"]],
    lat: +row[fi["latitude"]],
    lon: +row[fi["longitude"]],
    name: row[fi["name"]],
  })).filter(s => Number.isFinite(s.lat) && Number.isFinite(s.pm));
}
