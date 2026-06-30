// layers.js — overlay toggle control so the dense map stays clickable.
// Loads last, after every module has created its layer group.

function initLayers() {
  if (typeof map === "undefined" || !map) return;
  const ov = {};
  const add = (name, layer) => { if (layer) ov[name] = layer; };
  add("Sharks", typeof markersLayer !== "undefined" ? markersLayer : null);
  add("Blood trails", typeof trailsLayer !== "undefined" ? trailsLayer : null);
  add("Tide gauges", typeof tideLayer !== "undefined" ? tideLayer : null);
  add("Earthquakes", typeof quakeLayer !== "undefined" ? quakeLayer : null);
  add("Hazards", typeof hazLayer !== "undefined" ? hazLayer : null);
  add("Tornadoes", typeof tornadoLayer !== "undefined" ? tornadoLayer : null);
  add("Air sensors", typeof airLayer !== "undefined" ? airLayer : null);
  add("Sightings", typeof sightLayer !== "undefined" ? sightLayer : null);
  add("Natural events", typeof eonetLayer !== "undefined" ? eonetLayer : null);
  add("Volcanoes", typeof volcanoLayer !== "undefined" ? volcanoLayer : null);
  add("Contagion", typeof contagionLayer !== "undefined" ? contagionLayer : null);
  add("Jason", typeof jasonLayer !== "undefined" ? jasonLayer : null);
  L.control.layers(null, ov, { collapsed: true, position: "topright" }).addTo(map);
}
initLayers();
