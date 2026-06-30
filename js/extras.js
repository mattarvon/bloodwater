// extras.js — three more layers for The Clot:
//   • NASA EONET   — open natural events (wildfires, storms, volcanoes, ice…)
//   • disease.sh   — global contagion ledger (cumulative; COVID reporting wound down)
//   • USGS HANS    — elevated US volcano alert levels (coords baked in; list lacks them)
// Self-contained. Uses globals map, L, inspect, and gid() from blocks.js.

let eonetLayer, contagionLayer, volcanoLayer;

// ===================== NASA EONET =====================
const EONET_CAT = {
  "Wildfires": { ic: "🔥", c: "#e6201c" }, "Severe Storms": { ic: "🌀", c: "#2fb6b6" },
  "Volcanoes": { ic: "🌋", c: "#e69a2f" }, "Sea and Lake Ice": { ic: "🧊", c: "#9ad8e6" },
  "Dust and Haze": { ic: "🌫", c: "#caa46a" }, "Floods": { ic: "🌊", c: "#3b6fd1" },
  "Earthquakes": { ic: "⊙", c: "#e6201c" }, "Landslides": { ic: "⛰", c: "#a06a3a" },
  "Drought": { ic: "☀", c: "#caa46a" }, "Temperature Extremes": { ic: "🌡", c: "#e6201c" },
  "Manmade": { ic: "☣", c: "#9c3bd1" }, "Snow": { ic: "❄", c: "#cfe6ee" }, "Water Color": { ic: "≈", c: "#3b6fd1" },
};
async function loadEonet() {
  const j = await (await fetch("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=120")).json();
  return (j.events || []).map(e => {
    const g = e.geometry || [], last = g[g.length - 1];
    if (!last) return null;
    let co = last.coordinates;
    if (last.type === "Polygon") co = co[0][0];
    const cat = e.categories && e.categories[0] && e.categories[0].title;
    return { title: e.title, cat, lon: co[0], lat: co[1], date: (last.date || "").slice(0, 10),
      link: (e.sources && e.sources[0] && e.sources[0].url) || e.link };
  }).filter(x => x && Number.isFinite(x.lat));
}
function renderEonet(events) {
  const el = gid("eonet-rows"); if (!el) return;
  el.innerHTML = events.length ? events.slice(0, 6).map(e => {
    const m = EONET_CAT[e.cat] || { ic: "•", c: "#8a9298" };
    return `<div class="trow"><span class="tn">${m.ic} ${(e.title || "").slice(0, 20)}</span><span class="tv" style="color:${m.c}">${(e.cat || "").slice(0, 5)}</span></div>`;
  }).join("") : `<div class="tmuted">no open events</div>`;
}
function plotEonet(events) {
  if (!eonetLayer) return;
  eonetLayer.clearLayers();
  events.forEach(e => {
    const m = EONET_CAT[e.cat] || { ic: "•", c: "#8a9298" };
    L.circleMarker([e.lat, e.lon], { radius: 4, color: m.c, weight: 1.4, fillColor: m.c, fillOpacity: .3 })
      .bindTooltip(`${m.ic} ${e.title}`, { className: "telem-tip", direction: "top" })
      .on("click", () => inspect({
        kind: (e.cat || "Event") + " · NASA EONET", title: e.title,
        rows: [{ k: "Category", v: e.cat }, { k: "Last observed", v: e.date }],
        lat: e.lat, lon: e.lon, link: e.link, linkLabel: "EONET source ↗",
      })).addTo(eonetLayer);
  });
}

// ===================== disease.sh contagion =====================
function fmtN(n) { n = +n || 0; return n >= 1e9 ? (n / 1e9).toFixed(1) + "B" : n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(n); }
async function loadContagion() {
  const [all, countries] = await Promise.all([
    (await fetch("https://disease.sh/v3/covid-19/all")).json(),
    (await fetch("https://disease.sh/v3/covid-19/countries")).json(),
  ]);
  return { all, countries: (countries || []).filter(c => c.countryInfo && Number.isFinite(c.countryInfo.lat)) };
}
function renderContagion(d) {
  const el = gid("dz-rows"); if (!el) return;
  const a = d.all, top = d.countries.slice().sort((x, y) => y.cases - x.cases).slice(0, 5);
  el.innerHTML =
    `<div class="airagg" style="color:#e6201c">${fmtN(a.deaths)}<small>cumulative deaths · ${fmtN(a.cases)} cases · ${a.affectedCountries} countries</small></div>` +
    top.map(c => `<div class="trow"><span class="tn">${c.country}</span><span class="tv" style="color:#e69a2f">${fmtN(c.cases)}<small> cases</small></span></div>`).join("");
}
function plotContagion(d) {
  if (!contagionLayer) return;
  contagionLayer.clearLayers();
  d.countries.forEach(c => {
    const r = Math.min(2 + Math.sqrt(c.cases || 0) / 700, 18);
    if (r < 2.4) return;
    L.circleMarker([c.countryInfo.lat, c.countryInfo.long], { radius: r, stroke: false, fillColor: "#7a0b10", fillOpacity: .26 })
      .bindTooltip(`${c.country}: ${fmtN(c.cases)} cases`, { className: "telem-tip", direction: "top" })
      .on("click", () => inspect({
        kind: "Contagion · disease.sh", title: c.country,
        rows: [
          { k: "Total cases", v: fmtN(c.cases), color: "#e69a2f" },
          { k: "Total deaths", v: fmtN(c.deaths), color: "#e6201c" },
          { k: "Recovered", v: fmtN(c.recovered) },
          { k: "Active", v: fmtN(c.active) },
          { k: "Deaths / million", v: c.deathsPerOneMillion },
        ], lat: c.countryInfo.lat, lon: c.countryInfo.long,
      })).addTo(contagionLayer);
  });
}

// ===================== USGS volcano alerts =====================
function vkey(s) { return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); }
const VOLC_COORDS = {
  "kilauea": [19.421, -155.287], "mauna loa": [19.475, -155.608], "hualalai": [19.69, -155.87],
  "great sitkin": [52.076, -176.13], "shishaldin": [54.756, -163.97], "pavlof": [55.42, -161.89],
  "cleveland": [52.825, -169.945], "semisopochnoi": [51.93, 179.58], "akutan": [54.13, -165.99],
  "veniaminof": [56.17, -159.38], "trident": [58.236, -155.1], "gareloi": [51.79, -178.79],
  "tanaga": [51.885, -178.146], "korovin": [52.38, -174.16], "redoubt": [60.49, -152.74],
  "augustine": [59.363, -153.43], "spurr": [61.299, -152.251], "iliamna": [60.032, -153.09],
  "okmok": [53.43, -168.13], "bogoslof": [53.93, -168.03], "aniakchak": [56.91, -158.15],
  "westdahl": [54.52, -164.65], "kanaga": [51.92, -177.16], "makushin": [53.89, -166.93],
  "dutton": [55.18, -162.27], "wrangell": [62.0, -144.02], "kupreanof": [56.013, -159.797],
  "atka": [52.331, -174.139], "carlisle": [52.9, -170.06], "gareloi island": [51.79, -178.79],
  "mount st. helens": [46.2, -122.18],
  "mount rainier": [46.85, -121.76], "mount hood": [45.37, -121.7], "mount shasta": [41.41, -122.19],
  "mount baker": [48.78, -121.81], "lassen volcanic center": [40.49, -121.51], "three sisters": [44.1, -121.77],
  "newberry": [43.72, -121.23], "glacier peak": [48.11, -121.11], "yellowstone": [44.43, -110.67],
  "long valley caldera": [37.7, -118.87], "pagan": [18.13, 145.8], "anatahan": [16.35, 145.67],
};
function volcColor(cc) { cc = (cc || "").toUpperCase(); return cc === "RED" ? "#e6201c" : cc === "ORANGE" ? "#e69a2f" : cc === "YELLOW" ? "#e6d756" : "#56e6b4"; }
async function loadVolcanoes() {
  const v = await (await fetch("https://volcanoes.usgs.gov/hans-public/api/volcano/getElevatedVolcanoes")).json();
  return (v || []).map(x => ({
    name: x.volcano_name, alert: x.alert_level, color: x.color_code,
    obs: x.obs_fullname, url: x.notice_url, sent: x.sent_utc, ll: VOLC_COORDS[vkey(x.volcano_name)] || null,
  }));
}
function renderVolc(rows) {
  const el = gid("volc-rows"); if (!el) return;
  el.innerHTML = rows.length ? rows.map(v =>
    `<div class="trow"><span class="tn">🌋 ${v.name}</span><span class="tv" style="color:${volcColor(v.color)}">${v.alert}</span></div>`).join("")
    : `<div class="tmuted">all monitored volcanoes normal</div>`;
}
function plotVolc(rows) {
  if (!volcanoLayer) return;
  volcanoLayer.clearLayers();
  rows.forEach(v => {
    if (!v.ll) return;
    const c = volcColor(v.color);
    L.circleMarker(v.ll, { radius: 6, color: c, weight: 1.6, fillColor: c, fillOpacity: .3 })
      .bindTooltip(`🌋 ${v.name} · ${v.alert}`, { className: "telem-tip", direction: "top" })
      .on("click", () => inspect({
        kind: "Volcano · USGS", title: v.name,
        rows: [
          { k: "Alert level", v: v.alert, color: c },
          { k: "Aviation color", v: v.color, color: c },
          { k: "Observatory", v: v.obs, full: true },
          { k: "Notice issued", v: (v.sent || "").slice(0, 16) },
        ], lat: v.ll[0], lon: v.ll[1], link: v.url, linkLabel: "USGS notice ↗",
      })).addTo(volcanoLayer);
  });
}

// ===================== boot =====================
function initExtras() {
  if (typeof map !== "undefined" && map) {
    eonetLayer = L.layerGroup().addTo(map);
    contagionLayer = L.layerGroup().addTo(map);
    volcanoLayer = L.layerGroup().addTo(map);
  }
  const rE = async () => { try { const e = await loadEonet(); renderEonet(e); plotEonet(e); } catch (x) {} };
  const rD = async () => { try { const d = await loadContagion(); renderContagion(d); plotContagion(d); } catch (x) {} };
  const rV = async () => { try { const v = await loadVolcanoes(); renderVolc(v); plotVolc(v); } catch (x) {} };
  rE(); setInterval(rE, 15 * 60 * 1000);
  rD(); setInterval(rD, 60 * 60 * 1000);
  rV(); setInterval(rV, 10 * 60 * 1000);
}
initExtras();
