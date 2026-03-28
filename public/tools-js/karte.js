const BL = {
  'SH': 'Schleswig-Holstein', 'HH': 'Hamburg', 'NI': 'Niedersachsen', 'HB': 'Bremen',
  'HE': 'Hessen', 'RP': 'Rheinland-Pfalz', 'BW': 'Baden-Württemberg', 'BY': 'Bayern',
  'SL': 'Saarland', 'BE': 'Berlin', 'BB': 'Brandenburg', 'MV': 'Mecklenburg-Vorpommern',
  'SN': 'Sachsen', 'ST': 'Sachsen-Anhalt', 'TH': 'Thüringen', 'NW': 'Nordrhein-Westfalen'
};

const schneeWerte = {
  1: {kn: 0.65, kg: 65},
  '1a': {kn: 0.81, kg: 81},
  2: {kn: 0.85, kg: 85},
  '2a': {kn: 1.06, kg: 106},
  3: {kn: 1.10, kg: 110},
  '3a': {kn: 1.37, kg: 137}
};

const windWerte = {
  1: {ms: 22.5, kn: 0.32, kg: 32},
  2: {ms: 25.0, kn: 0.39, kg: 39},
  3: {ms: 27.5, kn: 0.47, kg: 47},
  4: {ms: 30.0, kn: 0.56, kg: 56}
};

const rawSchnee = [{"l":"SH","k":"Dithmarschen","g":"alle","z":2},{"l":"SH","k":"Herzogtum Lauenburg","g":"alle","z":2},{"l":"SH","k":"Nordfriesland","g":"alle","z":2},{"l":"SH","k":"Ostholstein","g":"alle","z":2},{"l":"SH","k":"Pinneberg","g":"alle","z":2},{"l":"SH","k":"Plön","g":"alle","z":2},{"l":"SH","k":"Rendsburg-Eckernförde","g":"alle","z":2},{"l":"SH","k":"Schleswig-Flensburg","g":"alle","z":2},{"l":"SH","k":"Segeberg","g":"alle","z":2},{"l":"SH","k":"Steinburg","g":"alle","z":2},{"l":"SH","k":"Stormarn","g":"alle","z":2},{"l":"SH","k":"Flensburg","g":"Flensburg","z":2},{"l":"SH","k":"Kiel","g":"Kiel","z":2},{"l":"SH","k":"Lübeck","g":"Lübeck","z":2},{"l":"SH","k":"Neumünster","g":"Neumünster","z":2},{"l":"HH","k":"Hamburg","g":"Hamburg","z":2},{"l":"BE","k":"Berlin","g":"Berlin","z":2},{"l":"BB","k":"Brandenburg","g":"alle","z":2},{"l":"MV","k":"Ludwigslust-Parchim","g":"alle","z":2},{"l":"MV","k":"Mecklenburgische Seenplatte","g":"alle","z":2},{"l":"MV","k":"Vorpommern-Greifswald","g":"alle","z":2},{"l":"MV","k":"Nordwestmecklenburg","g":"alle","z":3},{"l":"MV","k":"Rostock","g":"alle","z":3},{"l":"MV","k":"Vorpommern-Rügen","g":"alle","z":3},{"l":"SN","k":"Dresden","g":"alle","z":2},{"l":"SN","k":"Leipzig","g":"alle","z":2},{"l":"SN","k":"Chemnitz","g":"alle","z":2},{"l":"ST","k":"Magdeburg","g":"alle","z":2},{"l":"ST","k":"Halle","g":"alle","z":2},{"l":"BY","k":"München","g":"München","z":2},{"l":"BY","k":"Nürnberg","g":"Nürnberg","z":1},{"l":"BY","k":"Augsburg","g":"Augsburg","z":1},{"l":"BY","k":"Regensburg","g":"Regensburg","z":1},{"l":"BY","k":"Ingolstadt","g":"Ingolstadt","z":1},{"l":"BY","k":"Würzburg","g":"Würzburg","z":1},{"l":"BY","k":"Erlangen","g":"Erlangen","z":1},{"l":"BY","k":"Fürth","g":"Fürth","z":1},{"l":"BY","k":"Landshut","g":"Landshut","z":1},{"l":"BY","k":"Passau","g":"alle","z":2},{"l":"BY","k":"Berchtesgadener Land","g":"alle","z":3},{"l":"BY","k":"Bad Tölz-Wolfratshausen","g":"alle","z":2},{"l":"BY","k":"Garmisch-Partenkirchen","g":"alle","z":3},{"l":"BY","k":"Miesbach","g":"alle","z":2},{"l":"BY","k":"Rosenheim","g":"alle","z":2},{"l":"BY","k":"Traunstein","g":"alle","z":2},{"l":"BY","k":"Altötting","g":"alle","z":1},{"l":"BY","k":"Mühldorf","g":"alle","z":1},{"l":"BW","k":"Stuttgart","g":"Stuttgart","z":1},{"l":"BW","k":"Karlsruhe","g":"Karlsruhe","z":1},{"l":"BW","k":"Mannheim","g":"Mannheim","z":1},{"l":"BW","k":"Freiburg","g":"Freiburg","z":1},{"l":"BW","k":"Heidelberg","g":"Heidelberg","z":1},{"l":"BW","k":"Ulm","g":"Ulm","z":1},{"l":"BW","k":"Bodenseekreis","g":"alle","z":2},{"l":"BW","k":"Ravensburg","g":"alle","z":2},{"l":"BW","k":"Schwarzwald-Baar-Kreis","g":"alle","z":2},{"l":"HE","k":"Frankfurt am Main","g":"Frankfurt","z":1},{"l":"HE","k":"Wiesbaden","g":"Wiesbaden","z":1},{"l":"HE","k":"Kassel","g":"Kassel","z":2},{"l":"HE","k":"Darmstadt","g":"Darmstadt","z":1},{"l":"HE","k":"Offenbach","g":"Offenbach","z":1},{"l":"NI","k":"Hannover","g":"Hannover","z":2},{"l":"NI","k":"Braunschweig","g":"Braunschweig","z":2},{"l":"NI","k":"Oldenburg","g":"Oldenburg","z":3},{"l":"NI","k":"Osnabrück","g":"Osnabrück","z":1},{"l":"NI","k":"Göttingen","g":"Göttingen","z":1},{"l":"NI","k":"Wolfsburg","g":"Wolfsburg","z":2},{"l":"NI","k":"Salzgitter","g":"Salzgitter","z":2},{"l":"NI","k":"Aurich","g":"alle","z":4},{"l":"NI","k":"Cuxhaven","g":"alle","z":4},{"l":"NI","k":"Emden","g":"Emden","z":4},{"l":"NI","k":"Wilhelmshaven","g":"Wilhelmshaven","z":4},{"l":"NI","k":"Leer","g":"alle","z":3},{"l":"NI","k":"Friesland","g":"alle","z":4},{"l":"NI","k":"Wittmund","g":"alle","z":4},{"l":"NI","k":"Ammerland","g":"alle","z":3},{"l":"NI","k":"Wesermarsch","g":"alle","z":3},{"l":"NI","k":"Stade","g":"alle","z":3},{"l":"HB","k":"Bremen","g":"Bremen","z":2},{"l":"HB","k":"Bremerhaven","g":"Bremerhaven","z":2},{"l":"RP","k":"Mainz","g":"Mainz","z":1},{"l":"RP","k":"Koblenz","g":"Koblenz","z":1},{"l":"RP","k":"Trier","g":"Trier","z":2},{"l":"RP","k":"Ludwigshafen","g":"Ludwigshafen","z":1},{"l":"RP","k":"Ahrweiler","g":"alle","z":2},{"l":"RP","k":"Cochem-Zell","g":"alle","z":2},{"l":"RP","k":"Mayen-Koblenz","g":"alle","z":2},{"l":"RP","k":"Neuwied","g":"alle","z":1},{"l":"RP","k":"Rhein-Lahn-Kreis","g":"alle","z":1},{"l":"RP","k":"Westerwaldkreis","g":"alle","z":2},{"l":"SL","k":"Saarbrücken","g":"alle","z":2},{"l":"SL","k":"Neunkirchen","g":"alle","z":2},{"l":"SL","k":"Saarlouis","g":"alle","z":2},{"l":"TH","k":"Erfurt","g":"Erfurt","z":2},{"l":"TH","k":"Jena","g":"Jena","z":2},{"l":"TH","k":"Gera","g":"Gera","z":2},{"l":"TH","k":"Weimar","g":"Weimar","z":2},{"l":"TH","k":"Suhl","g":"Suhl","z":2},{"l":"TH","k":"Eisenach","g":"Eisenach","z":3},{"l":"TH","k":"Eichsfeld","g":"alle","z":2},{"l":"TH","k":"Nordhausen","g":"alle","z":2},{"l":"TH","k":"Wartburgkreis","g":"alle","z":2},{"l":"TH","k":"Schmalkalden-Meiningen","g":"alle","z":2},{"l":"TH","k":"Gotha","g":"alle","z":2},{"l":"TH","k":"Ilm-Kreis","g":"alle","z":2},{"l":"TH","k":"Sonneberg","g":"alle","z":2},{"l":"TH","k":"Saalfeld-Rudolstadt","g":"alle","z":3},{"l":"TH","k":"Saale-Orla-Kreis","g":"alle","z":2}];

const rawWind = [{"l":"SH","k":"Schleswig-Flensburg","z":3},{"l":"SH","k":"Nordfriesland","z":4},{"l":"SH","k":"Dithmarschen","z":4},{"l":"SH","k":"Rendsburg-Eckernförde","z":3},{"l":"SH","k":"Ostholstein","z":2},{"l":"SH","k":"Plön","z":2},{"l":"SH","k":"Segeberg","z":2},{"l":"SH","k":"Steinburg","z":3},{"l":"SH","k":"Pinneberg","z":3},{"l":"SH","k":"Stormarn","z":2},{"l":"SH","k":"Herzogtum Lauenburg","z":2},{"l":"HH","k":"Hamburg","z":3},{"l":"NI","k":"Aurich","z":4},{"l":"NI","k":"Wittmund","z":4},{"l":"NI","k":"Friesland","z":4},{"l":"NI","k":"Cuxhaven","z":4},{"l":"NI","k":"Emden","z":4},{"l":"NI","k":"Wilhelmshaven","z":4},{"l":"NI","k":"Wesermarsch","z":3},{"l":"NI","k":"Stade","z":3},{"l":"NI","k":"Leer","z":3},{"l":"NI","k":"Ammerland","z":3},{"l":"NI","k":"Oldenburg","z":3},{"l":"NI","k":"Osterholz","z":3},{"l":"NI","k":"Rotenburg (Wümme)","z":2},{"l":"NI","k":"Hannover","z":2},{"l":"NI","k":"Braunschweig","z":2},{"l":"NI","k":"Wolfsburg","z":2},{"l":"HB","k":"Bremen","z":3},{"l":"HB","k":"Bremerhaven","z":4},{"l":"BE","k":"Berlin","z":2},{"l":"BB","k":"Brandenburg","z":2},{"l":"MV","k":"Ludwigslust-Parchim","z":2},{"l":"MV","k":"Mecklenburgische Seenplatte","z":2},{"l":"MV","k":"Vorpommern-Greifswald","z":2},{"l":"MV","k":"Nordwestmecklenburg","z":3},{"l":"MV","k":"Rostock","z":3},{"l":"MV","k":"Vorpommern-Rügen","z":4},{"l":"SN","k":"Dresden","z":2},{"l":"SN","k":"Leipzig","z":2},{"l":"SN","k":"Chemnitz","z":2},{"l":"ST","k":"Magdeburg","z":2},{"l":"ST","k":"Halle","z":2},{"l":"BY","k":"München","z":2},{"l":"BY","k":"Nürnberg","z":1},{"l":"BY","k":"Augsburg","z":2},{"l":"BY","k":"Berchtesgadener Land","z":1},{"l":"BY","k":"Garmisch-Partenkirchen","z":1},{"l":"BY","k":"Rosenheim","z":2},{"l":"BY","k":"Traunstein","z":1},{"l":"BW","k":"Stuttgart","z":1},{"l":"BW","k":"Karlsruhe","z":1},{"l":"BW","k":"Mannheim","z":1},{"l":"BW","k":"Freiburg","z":1},{"l":"BW","k":"Bodenseekreis","z":2},{"l":"BW","k":"Ravensburg","z":2},{"l":"HE","k":"Frankfurt am Main","z":1},{"l":"HE","k":"Kassel","z":1},{"l":"HE","k":"Wiesbaden","z":1},{"l":"RP","k":"Mainz","z":1},{"l":"RP","k":"Koblenz","z":1},{"l":"RP","k":"Trier","z":1},{"l":"RP","k":"Ahrweiler","z":2},{"l":"SL","k":"Saarbrücken","z":1},{"l":"TH","k":"Erfurt","z":2},{"l":"TH","k":"Jena","z":2},{"l":"TH","k":"Gera","z":2}];

const daten = {};
rawSchnee.forEach(item => {
  if (!daten[item.l]) daten[item.l] = {};
  if (!daten[item.l][item.k]) daten[item.l][item.k] = {sz: item.z, wz: null};
  else daten[item.l][item.k].sz = item.z;
});
rawWind.forEach(item => {
  if (!daten[item.l]) daten[item.l] = {};
  if (!daten[item.l][item.k]) daten[item.l][item.k] = {sz: null, wz: item.z};
  else daten[item.l][item.k].wz = item.z;
});

const blSelect = document.getElementById('bundesland');
Object.keys(BL).sort((a,b) => BL[a].localeCompare(BL[b])).forEach(code => {
  const option = document.createElement('option');
  option.value = code;
  option.textContent = BL[code];
  blSelect.appendChild(option);
});

function updateKreise() {
  const bl = document.getElementById('bundesland').value;
  const kreisSelect = document.getElementById('kreis');
  const btn = document.getElementById('showBtn');
  kreisSelect.innerHTML = '<option value="">-- Bitte wählen --</option>';
  document.getElementById('result').innerHTML = '';
  btn.disabled = true;
  if (!bl) { kreisSelect.disabled = true; return; }
  kreisSelect.disabled = false;
  if (daten[bl]) {
    Object.keys(daten[bl]).sort().forEach(kreis => {
      const option = document.createElement('option');
      option.value = kreis;
      option.textContent = kreis;
      kreisSelect.appendChild(option);
    });
  }
}

function checkButton() {
  const kreis = document.getElementById('kreis').value;
  document.getElementById('showBtn').disabled = !kreis;
}

function showResult() {
  const bl = document.getElementById('bundesland').value;
  const kreis = document.getElementById('kreis').value;
  if (!bl || !kreis) return;
  const info = daten[bl][kreis];
  const sz = info.sz;
  const wz = info.wz;
  let html = '<div class="karte-grid">';
  if (sz) {
    const d = schneeWerte[sz];
    html += `<div class="karte-card"><div class="karte-card-header karte-blue"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/></svg><h3>Schneelastzone</h3></div><div class="karte-zone-num">${sz}</div><p><strong>Schneelast:</strong> ${d.kg} kg/m² (${d.kn} kN/m²)</p><p><strong>Bundesland:</strong> ${BL[bl]}</p><p><strong>Landkreis:</strong> ${kreis}</p></div>`;
  }
  if (wz) {
    const d = windWerte[wz];
    html += `<div class="karte-card"><div class="karte-card-header karte-orange"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg><h3>Windzone</h3></div><div class="karte-zone-num">${wz}</div><p><strong>Windgeschwindigkeit:</strong> ${d.ms} m/s</p><p><strong>Staudruck:</strong> ${d.kg} kg/m² (${d.kn} kN/m²)</p><p><strong>Bundesland:</strong> ${BL[bl]}</p><p><strong>Landkreis:</strong> ${kreis}</p></div>`;
  }
  if (!sz && !wz) {
    html += '<div class="karte-card"><p>Für diesen Landkreis liegen keine Zonendaten vor. Bitte wenden Sie sich an Ihr zuständiges Bauamt.</p></div>';
  }
  html += '</div>';
  document.getElementById('result').innerHTML = html;
}

let currentMap = 'schnee';
function toggleMap(type) {
  currentMap = type;
  document.getElementById('btnSchnee').classList.toggle('active', type === 'schnee');
  document.getElementById('btnWind').classList.toggle('active', type === 'wind');
  document.getElementById('mapSchnee').classList.toggle('hidden', type !== 'schnee');
  document.getElementById('mapWind').classList.toggle('hidden', type !== 'wind');
  updateMapLegend();
}

function updateMapLegend() {
  const legend = document.getElementById('mapLegend');
  let html = '';
  if (currentMap === 'schnee') {
    html = '<h4>Schneelastzonen – Belastungswerte</h4><div class="legend-grid">';
    html += '<div class="legend-item"><div class="legend-color" style="background:#e6f2ff"></div><span>Zone 1: 65 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#b3d9ff"></div><span>Zone 1a: 81 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#80bfff"></div><span>Zone 2: 85 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#4da6ff"></div><span>Zone 2a: 106 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#1a8cff"></div><span>Zone 3: 110 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#0066cc"></div><span>Zone 3a: 137 kg/m²</span></div>';
    html += '</div>';
  } else {
    html = '<h4>Windzonen – Staudruckwerte</h4><div class="legend-grid">';
    html += '<div class="legend-item"><div class="legend-color" style="background:#f5e6d3"></div><span>Zone 1: 32 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#ffd966"></div><span>Zone 2: 39 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#f2a74b"></div><span>Zone 3: 47 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#d9692a"></div><span>Zone 4: 56 kg/m²</span></div>';
    html += '</div>';
  }
  legend.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
  updateMapLegend();
});
