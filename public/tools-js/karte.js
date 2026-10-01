const BL = {
  'SH': 'Schleswig-Holstein', 'HH': 'Hamburg', 'NI': 'Niedersachsen', 'HB': 'Bremen',
  'HE': 'Hessen', 'RP': 'Rheinland-Pfalz', 'BW': 'Baden-Württemberg', 'BY': 'Bayern',
  'SL': 'Saarland', 'BE': 'Berlin', 'BB': 'Brandenburg', 'MV': 'Mecklenburg-Vorpommern',
  'SN': 'Sachsen', 'ST': 'Sachsen-Anhalt', 'TH': 'Thüringen', 'NW': 'Nordrhein-Westfalen'
};

const windWerte = {
  1: {ms: 22.5, kn: 0.32, kg: 32},
  2: {ms: 25.0, kn: 0.39, kg: 39},
  3: {ms: 27.5, kn: 0.47, kg: 47},
  4: {ms: 30.0, kn: 0.56, kg: 56}
};

const rawWind = [{"l":"SH","k":"Schleswig-Flensburg","z":3},{"l":"SH","k":"Nordfriesland","z":4},{"l":"SH","k":"Dithmarschen","z":4},{"l":"SH","k":"Rendsburg-Eckernförde","z":3},{"l":"SH","k":"Ostholstein","z":2},{"l":"SH","k":"Plön","z":2},{"l":"SH","k":"Segeberg","z":2},{"l":"SH","k":"Steinburg","z":3},{"l":"SH","k":"Pinneberg","z":3},{"l":"SH","k":"Stormarn","z":2},{"l":"SH","k":"Herzogtum Lauenburg","z":2},{"l":"HH","k":"Hamburg","z":3},{"l":"NI","k":"Aurich","z":4},{"l":"NI","k":"Wittmund","z":4},{"l":"NI","k":"Friesland","z":4},{"l":"NI","k":"Cuxhaven","z":4},{"l":"NI","k":"Emden","z":4},{"l":"NI","k":"Wilhelmshaven","z":4},{"l":"NI","k":"Wesermarsch","z":3},{"l":"NI","k":"Stade","z":3},{"l":"NI","k":"Leer","z":3},{"l":"NI","k":"Ammerland","z":3},{"l":"NI","k":"Oldenburg","z":3},{"l":"NI","k":"Osterholz","z":3},{"l":"NI","k":"Rotenburg (Wümme)","z":2},{"l":"NI","k":"Hannover","z":2},{"l":"NI","k":"Braunschweig","z":2},{"l":"NI","k":"Wolfsburg","z":2},{"l":"HB","k":"Bremen","z":3},{"l":"HB","k":"Bremerhaven","z":4},{"l":"BE","k":"Berlin","z":2},{"l":"BB","k":"Brandenburg","z":2},{"l":"MV","k":"Ludwigslust-Parchim","z":2},{"l":"MV","k":"Mecklenburgische Seenplatte","z":2},{"l":"MV","k":"Vorpommern-Greifswald","z":2},{"l":"MV","k":"Nordwestmecklenburg","z":3},{"l":"MV","k":"Rostock","z":3},{"l":"MV","k":"Vorpommern-Rügen","z":4},{"l":"SN","k":"Dresden","z":2},{"l":"SN","k":"Leipzig","z":2},{"l":"SN","k":"Chemnitz","z":2},{"l":"ST","k":"Magdeburg","z":2},{"l":"ST","k":"Halle","z":2},{"l":"BY","k":"München","z":2},{"l":"BY","k":"Nürnberg","z":1},{"l":"BY","k":"Augsburg","z":2},{"l":"BY","k":"Berchtesgadener Land","z":1},{"l":"BY","k":"Garmisch-Partenkirchen","z":1},{"l":"BY","k":"Rosenheim","z":2},{"l":"BY","k":"Traunstein","z":1},{"l":"BW","k":"Stuttgart","z":1},{"l":"BW","k":"Karlsruhe","z":1},{"l":"BW","k":"Mannheim","z":1},{"l":"BW","k":"Freiburg","z":1},{"l":"BW","k":"Bodenseekreis","z":2},{"l":"BW","k":"Ravensburg","z":2},{"l":"HE","k":"Frankfurt am Main","z":1},{"l":"HE","k":"Kassel","z":1},{"l":"HE","k":"Wiesbaden","z":1},{"l":"RP","k":"Mainz","z":1},{"l":"RP","k":"Koblenz","z":1},{"l":"RP","k":"Trier","z":1},{"l":"RP","k":"Ahrweiler","z":2},{"l":"SL","k":"Saarbrücken","z":1},{"l":"TH","k":"Erfurt","z":2},{"l":"TH","k":"Jena","z":2},{"l":"TH","k":"Gera","z":2}];

const daten = {};
rawWind.forEach(item => {
  if (!daten[item.l]) daten[item.l] = {};
  daten[item.l][item.k] = {wz: item.z};
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
  const wz = info.wz;
  let html = '<div class="karte-grid">';
  if (wz) {
    const d = windWerte[wz];
    html += `<div class="karte-card"><div class="karte-card-header karte-orange"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg><h3>Windzone</h3></div><div class="karte-zone-num">${wz}</div><p><strong>Windgeschwindigkeit:</strong> ${d.ms} m/s</p><p><strong>Staudruck:</strong> ${d.kg} kg/m² (${d.kn} kN/m²)</p><p><strong>Bundesland:</strong> ${BL[bl]}</p><p><strong>Landkreis:</strong> ${kreis}</p></div>`;
  }
  if (!wz) {
    html += '<div class="karte-card"><p>Für diesen Landkreis liegen keine Windzonendaten vor. Bitte wenden Sie sich an Ihr zuständiges Bauamt.</p></div>';
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
    html = '<h4>Schneelastzonen – Mindestwerte der Schneelast am Boden</h4><div class="legend-grid">';
    html += '<div class="legend-item"><div class="legend-color" style="background:#e6f2ff"></div><span>Zone 1: 65 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#b3d9ff"></div><span>Zone 1a: 81 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#80bfff"></div><span>Zone 2: 85 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#4da6ff"></div><span>Zone 2a: 106 kg/m²</span></div>';
    html += '<div class="legend-item"><div class="legend-color" style="background:#1a8cff"></div><span>Zone 3: 110 kg/m²</span></div>';
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
