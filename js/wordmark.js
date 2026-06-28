// wordmark.js — builds the blood-drip BLOODWATER title into #mark.
// Runs immediately; scripts are at end of <body> so #mark exists.

(function () {
  const word = "BLOODWATER";
  // drips spread across the title width (Creepster is wide; viewBox is 1040)
  const drips = [[120,3.4,0],[300,4.8,1.1],[500,3.0,.5],[700,5.0,1.7],[900,3.6,.3]];
  let d = `<svg viewBox="0 0 1040 130" xmlns="http://www.w3.org/2000/svg" aria-label="BLOODWATER">
    <defs>
      <linearGradient id="gore" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e6201c"/><stop offset=".55" stop-color="#bd0a13"/><stop offset="1" stop-color="#6e060b"/>
      </linearGradient>
    </defs>
    <text x="8" y="88" font-family="'Creepster',Impact,sans-serif" font-size="92"
      letter-spacing="2" fill="url(#gore)" stroke="#3a0205" stroke-width="1.4"
      paint-order="stroke">${word}</text>`;
  drips.forEach(([x, w, delay]) => {
    d += `<g class="drip" style="--dx:${delay}s">
      <path d="M${x} 86 q ${-w} 11 0 28 q ${w} -17 0 -28 Z" fill="url(#gore)"/>
      <circle class="bead" cx="${x}" cy="120" r="${w*0.9}" fill="#8c060b"/>
    </g>`;
  });
  d += `</svg>`;
  document.getElementById('mark').innerHTML = d;
})();
