// ============================================================
// PV-Rechner – Solarmodule aufs Dach planen
// ============================================================

// ---- Zustand ----
let selModBreite = 1038;
let selModHoehe  = 2094;
let selModWatt   = 550;
let selAzimuth   = 180;   // Grad (0=N, 90=O, 180=S, 270=W)
let selOrient    = 'auto';
let hindernisse  = [];
let currentHindernisTyp = 'schornstein';

// Sensor
let sensorActive   = false;
let sensorAlpha    = null;
let sensorBeta     = null;

// ---- Kontinuierlicher Ertragsfaktor nach Azimut ----
// Basiert auf PVGis-Daten: Süd (180°) = optimal
// Annäherungsformel: factor = 0.52 + 0.48 * cos(azimuth - 180°)
function orientFactor(azimuthDeg) {
  const rad = (azimuthDeg - 180) * Math.PI / 180;
  return 0.52 + 0.48 * Math.cos(rad);
}

// ---- Spezifischer Basisertrag Süd (kWh/kWp/a) nach Neigung ----
// Gilt für Süd (180°); andere Richtungen werden mit orientFactor() skaliert
const YIELD_SOUTH = {
  1:780, 5:860, 10:920, 15:960, 20:990, 25:1010, 30:1020,
  35:1025, 40:1020, 45:1010, 50:990, 55:965, 60:930, 70:850, 75:800
};

const REGION_FACTOR = {
  sued: 1.10, mitte: 1.00, ost: 0.95, west: 0.97, nord: 0.90
};

// ---- Azimut → Himmelsrichtungsname ----
function azimuthLabel(deg) {
  const d = ((deg % 360) + 360) % 360;
  if (d < 11)  return 'Nord';
  if (d < 34)  return 'NNO';
  if (d < 56)  return 'Nordost';
  if (d < 79)  return 'ONO';
  if (d < 101) return 'Ost';
  if (d < 124) return 'OSO';
  if (d < 146) return 'Südost';
  if (d < 169) return 'SSO';
  if (d < 191) return 'Süd';
  if (d < 214) return 'SSW';
  if (d < 236) return 'Südwest';
  if (d < 259) return 'WSW';
  if (d < 281) return 'West';
  if (d < 304) return 'WNW';
  if (d < 326) return 'Nordwest';
  if (d < 349) return 'NNW';
  return 'Nord';
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  ladeDachParameter();
  setupAzimuthInput();
  setupShortcutButtons();
  setupModuleButtons();
  setupOrientButtons();
  setupNeigungSlider();
  setupCustomModulInputs();
  drawCompassDial(selAzimuth);
});

function ladeDachParameter() {
  const p = new URLSearchParams(window.location.search);
  if (p.has('breite'))  document.getElementById('dach-breite').value = parseFloat(p.get('breite'));
  if (p.has('hoehe'))   document.getElementById('dach-laenge').value = parseFloat(p.get('hoehe'));
  if (p.has('neigung')) {
    const n = parseInt(p.get('neigung'));
    document.getElementById('neigung').value = n;
    document.getElementById('neigung-wert').textContent = n;
  }
  if (p.has('azimuth')) {
    setAzimuth(parseInt(p.get('azimuth')));
  }
}

// ---- Azimut-Eingabe ----
function setupAzimuthInput() {
  const inp = document.getElementById('azimuth-input');
  inp.addEventListener('input', () => {
    let v = parseInt(inp.value);
    if (isNaN(v)) return;
    v = ((v % 360) + 360) % 360;
    setAzimuth(v);
  });
  inp.addEventListener('change', () => {
    let v = parseInt(inp.value);
    if (isNaN(v)) v = 180;
    v = ((v % 360) + 360) % 360;
    inp.value = v;
    setAzimuth(v);
  });
}

function setupShortcutButtons() {
  document.querySelectorAll('.cs-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setAzimuth(parseInt(btn.dataset.az));
    });
  });
}

function setAzimuth(deg) {
  deg = ((deg % 360) + 360) % 360;
  selAzimuth = deg;
  document.getElementById('azimuth-input').value = deg;
  document.getElementById('azimuth-label').textContent = azimuthLabel(deg);

  // Shortcut-Buttons: aktiv wenn exakt auf einer Hauptrichtung
  document.querySelectorAll('.cs-btn').forEach(btn => {
    btn.classList.toggle('cs-active', parseInt(btn.dataset.az) === deg);
  });

  drawCompassDial(deg);
}

// ---- Kompass-Canvas ----
function drawCompassDial(azimuthDeg) {
  const canvas = document.getElementById('compass-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 80, cy = 80, r = 72;

  ctx.clearRect(0, 0, 160, 160);

  // Kreis
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#f0f4ff';
  ctx.fill();
  ctx.strokeStyle = '#1e3c72';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Himmelsrichtungsbeschriftung
  const dirs = [['N',0],['O',90],['S',180],['W',270]];
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  dirs.forEach(([label, deg]) => {
    const rad = (deg - 90) * Math.PI / 180;
    const lx = cx + (r - 14) * Math.cos(rad);
    const ly = cy + (r - 14) * Math.sin(rad);
    ctx.fillStyle = deg === 180 ? '#f7971e' : '#1e3c72';
    ctx.fillText(label, lx, ly);
  });

  // Zeiger (Azimut-Richtung)
  const rad = (azimuthDeg - 90) * Math.PI / 180;
  const px = cx + (r - 22) * Math.cos(rad);
  const py = cy + (r - 22) * Math.sin(rad);

  // Zeiger-Linie
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(px, py);
  ctx.strokeStyle = '#f7971e';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Zeiger-Spitze
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#f7971e';
  ctx.fill();

  // Mittelpunkt
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#1e3c72';
  ctx.fill();
}

// ---- Neigung-Slider ----
function setupNeigungSlider() {
  const sl = document.getElementById('neigung');
  sl.addEventListener('input', () => {
    document.getElementById('neigung-wert').textContent = sl.value;
  });
}

// ---- Modul-Buttons ----
function setupModuleButtons() {
  document.querySelectorAll('.module-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.module-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selModBreite = parseInt(btn.dataset.w);
      selModHoehe  = parseInt(btn.dataset.h);
      selModWatt   = parseInt(btn.dataset.watt);
      document.getElementById('mod-breite').value = '';
      document.getElementById('mod-hoehe').value  = '';
      document.getElementById('mod-watt').value   = '';
    });
  });
}

function setupOrientButtons() {
  document.querySelectorAll('.orient-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.orient-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selOrient = btn.dataset.orient;
    });
  });
}

function setupCustomModulInputs() {
  ['mod-breite', 'mod-hoehe', 'mod-watt'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      const b = parseFloat(document.getElementById('mod-breite').value);
      const h = parseFloat(document.getElementById('mod-hoehe').value);
      const w = parseFloat(document.getElementById('mod-watt').value);
      if (b > 0) { selModBreite = b; document.querySelectorAll('.module-btn').forEach(x => x.classList.remove('active')); }
      if (h > 0) { selModHoehe = h; }
      if (w > 0) { selModWatt = w; }
    });
  });
}

// ---- Handy-Sensor ----
function startSensor() {
  if (typeof DeviceOrientationEvent === 'undefined') {
    alert('Dein Browser unterstützt keine Sensor-Daten.');
    return;
  }
  // iOS 13+ braucht Erlaubnis
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(state => {
        if (state === 'granted') {
          activateSensor();
        } else {
          alert('Sensorzugriff wurde verweigert. Bitte in den iPhone-Einstellungen erlauben.');
        }
      })
      .catch(() => alert('Sensorzugriff konnte nicht angefordert werden.'));
  } else {
    activateSensor();
  }
}

function activateSensor() {
  sensorActive = true;
  document.getElementById('sensor-btn').style.display = 'none';
  document.getElementById('sensor-live').style.display = 'block';
  window.addEventListener('deviceorientation', handleOrientation, true);
}

function stopSensor() {
  sensorActive = false;
  window.removeEventListener('deviceorientation', handleOrientation, true);
  document.getElementById('sensor-btn').style.display = '';
  document.getElementById('sensor-live').style.display = 'none';
}

function handleOrientation(event) {
  if (!sensorActive) return;

  // alpha: Kompassrichtung (0=Nord, 90=Ost, 180=Süd, 270=West)
  // beta:  Neigung vorne/hinten (-180..180, 0=flach, 90=aufrecht nach vorne)
  // gamma: Neigung links/rechts

  // Neigung: absoluter Wert von beta (Handy flach auf Dach)
  const beta  = event.beta  !== null ? event.beta  : 0;
  const alpha = event.alpha !== null ? event.alpha : 0;

  // Neigungswinkel: beta bei flach aufliegendem Handy
  const neigung = Math.round(Math.abs(beta));
  // Azimut: alpha gibt Kompassrichtung der Handyvorderseite
  // Wenn Handy aufs Dach gelegt wird (Oberkante zeigt zur Traufe/Richtung Dachausrichtung):
  // Azimut = alpha
  const azimuth = Math.round(((alpha % 360) + 360) % 360);

  sensorAlpha = azimuth;
  sensorBeta  = neigung;

  document.getElementById('sensor-neigung').textContent = neigung + '°';
  document.getElementById('sensor-richtung').textContent = azimuth + '°';
  document.getElementById('sensor-himmels').textContent = azimuthLabel(azimuth);
}

function sensorUebernehmen() {
  if (sensorBeta !== null) {
    document.getElementById('neigung').value = Math.min(75, Math.max(1, sensorBeta));
    document.getElementById('neigung-wert').textContent = document.getElementById('neigung').value;
  }
  if (sensorAlpha !== null) {
    setAzimuth(sensorAlpha);
  }
  stopSensor();
}

// ---- Hindernisse ----
function addHindernis(typ) {
  currentHindernisTyp = typ;
  document.getElementById('hindernis-modal-titel').textContent =
    typ === 'schornstein' ? '🏭 Schornstein hinzufügen' : '🪟 Dachfenster hinzufügen';
  document.getElementById('hindernis-modal').style.display = 'flex';
}

function closeHindernisModal() {
  document.getElementById('hindernis-modal').style.display = 'none';
}

function confirmHindernis() {
  const breiteM = parseFloat(document.getElementById('h-breite').value) || 0.5;
  const hoeheM  = parseFloat(document.getElementById('h-hoehe').value)  || 0.5;
  const leftM   = parseFloat(document.getElementById('h-left').value)   || 1.0;
  const topM    = parseFloat(document.getElementById('h-top').value)    || 1.0;
  hindernisse.push({ typ: currentHindernisTyp, breiteM, hoeheM, leftM, topM });
  closeHindernisModal();
  renderHindernisListe();
}

function renderHindernisListe() {
  const tbody = document.getElementById('hindernis-body');
  const liste = document.getElementById('hindernis-liste');
  if (hindernisse.length === 0) { liste.style.display = 'none'; return; }
  liste.style.display = 'block';
  tbody.innerHTML = hindernisse.map((h, i) => `
    <tr>
      <td>${h.typ === 'schornstein' ? '🏭 Schornstein' : '🪟 Dachfenster'}</td>
      <td>${h.breiteM.toFixed(2)}</td><td>${h.hoeheM.toFixed(2)}</td>
      <td>${h.leftM.toFixed(2)}</td><td>${h.topM.toFixed(2)}</td>
      <td><button onclick="removeHindernis(${i})" style="background:none;border:none;cursor:pointer;color:#ef5350;font-size:16px;">✕</button></td>
    </tr>`).join('');
}

function removeHindernis(idx) { hindernisse.splice(idx, 1); renderHindernisListe(); }
function clearHindernisse() { hindernisse = []; renderHindernisListe(); }

// ---- Hauptberechnung ----
function berechne() {
  const dachBreiteM = parseFloat(document.getElementById('dach-breite').value);
  const dachLaengeM = parseFloat(document.getElementById('dach-laenge').value);
  const randM       = parseFloat(document.getElementById('rand-abstand').value) || 0.2;
  const neigung     = parseInt(document.getElementById('neigung').value);
  const region      = document.getElementById('region').value;
  const abstandMM   = parseFloat(document.getElementById('mod-abstand').value) || 20;

  if (!dachBreiteM || !dachLaengeM || dachBreiteM <= 0 || dachLaengeM <= 0) {
    alert('Bitte Dachbreite und Dachlänge eingeben!');
    return;
  }

  const nutzBreiteMM = (dachBreiteM - 2 * randM) * 1000;
  const nutzLaengeMM = (dachLaengeM - 2 * randM) * 1000;

  if (nutzBreiteMM <= 0 || nutzLaengeMM <= 0) {
    alert('Randabstand ist größer als die Dachfläche!');
    return;
  }

  const layoutHoch = berechneLayout(nutzBreiteMM, nutzLaengeMM, selModBreite, selModHoehe, abstandMM);
  const layoutQuer = berechneLayout(nutzBreiteMM, nutzLaengeMM, selModHoehe, selModBreite, abstandMM);

  let layout;
  if (selOrient === 'hoch') {
    layout = { ...layoutHoch, orientierung: 'Hochformat' };
  } else if (selOrient === 'quer') {
    layout = { ...layoutQuer, orientierung: 'Querformat' };
  } else {
    layout = layoutHoch.anzahl >= layoutQuer.anzahl
      ? { ...layoutHoch, orientierung: 'Hochformat (Auto)' }
      : { ...layoutQuer, orientierung: 'Querformat (Auto)' };
  }

  const blocked     = zähleBlockierteModule(layout, randM, abstandMM);
  const finalAnzahl = Math.max(0, layout.anzahl - blocked);
  const kwp         = (finalAnzahl * selModWatt) / 1000;

  // Ertrag: Basiswert Süd × Orientierungsfaktor × Regionfaktor × Wechselrichter
  const baseSuedYield = interpolateNeigung(neigung);
  const oriF          = orientFactor(selAzimuth);
  const regionFak     = REGION_FACTOR[region] || 1.0;
  const ertragKwh     = kwp * baseSuedYield * oriF * regionFak * 0.97;

  const eigenverbrauch = ertragKwh * 0.70 * 0.32;
  const einspeisung    = ertragKwh * 0.30 * 0.082;
  const gesamtWert     = eigenverbrauch + einspeisung;
  const co2Kg          = (ertragKwh * 434) / 1000;
  const investMin      = kwp * 1500;
  const investMax      = kwp * 1900;
  const amort          = gesamtWert > 0 ? ((investMin + investMax) / 2 / gesamtWert).toFixed(1) : '–';

  document.getElementById('res-anzahl').textContent = finalAnzahl;
  document.getElementById('res-kwp').textContent    = kwp.toFixed(2);
  document.getElementById('res-ertrag').textContent = Math.round(ertragKwh).toLocaleString('de-DE');
  document.getElementById('res-wert').textContent   = Math.round(gesamtWert).toLocaleString('de-DE');

  const details = [
    ['Dachbreite', `${dachBreiteM.toFixed(2)} m`],
    ['Dachlänge', `${dachLaengeM.toFixed(2)} m`],
    ['Nutzbare Fläche', `${(nutzBreiteMM/1000 * nutzLaengeMM/1000).toFixed(1)} m²`],
    ['Modulformat', `${selModBreite} × ${selModHoehe} mm (${selModWatt} W)`],
    ['Ausrichtung', layout.orientierung],
    ['Reihen × Spalten', `${layout.reihen} × ${layout.spalten}`],
    ['Blockiert durch Hindernisse', `${blocked} Module`],
    ['Module gesamt', `${finalAnzahl} Stück`],
    ['Installierte Leistung', `${kwp.toFixed(2)} kWp`],
    ['Himmelsrichtung', `${selAzimuth}° (${azimuthLabel(selAzimuth)})`],
    ['Orientierungsfaktor', `${(oriF * 100).toFixed(0)} % von Süd-Optimal`],
    ['Dachneigung', `${neigung}°`],
    ['Basisertrag Süd', `${baseSuedYield} kWh/kWp`],
    ['Regionfaktor', `× ${regionFak.toFixed(2)}`],
    ['Jahresertrag', `${Math.round(ertragKwh).toLocaleString('de-DE')} kWh`],
    ['Eigenverbrauch (~70%)', `${Math.round(eigenverbrauch).toLocaleString('de-DE')} €/Jahr`],
    ['Einspeisevergütung (~30%)', `${Math.round(einspeisung).toLocaleString('de-DE')} €/Jahr`],
    ['Gesamtwert', `${Math.round(gesamtWert).toLocaleString('de-DE')} €/Jahr`],
    ['CO₂-Einsparung', `${Math.round(co2Kg).toLocaleString('de-DE')} kg/Jahr`],
    ['Investitionsschätzung', `${Math.round(investMin).toLocaleString('de-DE')} – ${Math.round(investMax).toLocaleString('de-DE')} €`],
    ['Amortisation (ca.)', `${amort} Jahre`],
  ];

  document.getElementById('res-details').innerHTML = details
    .map(([k,v]) => `<tr><td style="color:#ffd700;font-weight:600;">${k}</td><td>${v}</td></tr>`)
    .join('');

  document.getElementById('results').style.display = 'block';
  document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  zeichneLayout(layout, dachBreiteM, dachLaengeM, randM, abstandMM, finalAnzahl);
}

// ---- Layout-Berechnung ----
function berechneLayout(nutzBreiteMM, nutzLaengeMM, modB, modH, abstandMM) {
  const spalten = Math.max(0, Math.floor((nutzBreiteMM + abstandMM) / (modB + abstandMM)));
  const reihen  = Math.max(0, Math.floor((nutzLaengeMM + abstandMM) / (modH + abstandMM)));
  return { spalten, reihen, anzahl: spalten * reihen, modB, modH };
}

// ---- Blockierte Module ----
function zähleBlockierteModule(layout, randM, abstandMM) {
  if (hindernisse.length === 0 || layout.anzahl === 0) return 0;
  const nutzStartX = randM * 1000;
  const nutzStartY = randM * 1000;
  const { modB, modH } = layout;
  let blocked = 0;
  for (let r = 0; r < layout.reihen; r++) {
    for (let s = 0; s < layout.spalten; s++) {
      const mx = nutzStartX + s * (modB + abstandMM);
      const my = nutzStartY + r * (modH + abstandMM);
      for (const h of hindernisse) {
        const hx = h.leftM * 1000, hy = h.topM * 1000;
        const hb = h.breiteM * 1000, hh = h.hoeheM * 1000;
        const sicher = 100;
        if (mx < hx+hb+sicher && mx+modB > hx-sicher && my < hy+hh+sicher && my+modH > hy-sicher) {
          blocked++; break;
        }
      }
    }
  }
  return blocked;
}

// ---- Neigungsinterpolation (Basisertrag Süd) ----
function interpolateNeigung(neigung) {
  const keys = Object.keys(YIELD_SOUTH).map(Number).sort((a,b)=>a-b);
  const n = Math.max(1, Math.min(75, neigung));
  for (let i = 0; i < keys.length - 1; i++) {
    if (n >= keys[i] && n <= keys[i+1]) {
      const t = (n - keys[i]) / (keys[i+1] - keys[i]);
      return Math.round(YIELD_SOUTH[keys[i]] + t * (YIELD_SOUTH[keys[i+1]] - YIELD_SOUTH[keys[i]]));
    }
  }
  return YIELD_SOUTH[keys[keys.length - 1]];
}

// ---- Canvas-Visualisierung ----
function zeichneLayout(layout, dachBreiteM, dachLaengeM, randM, abstandMM, finalAnzahl) {
  const canvas = document.getElementById('pv-canvas');
  const ctx    = canvas.getContext('2d');
  const MAX_W  = Math.min(600, window.innerWidth - 60);
  const scale  = MAX_W / (dachBreiteM * 1000);
  canvas.width  = Math.round(dachBreiteM * 1000 * scale);
  canvas.height = Math.round(dachLaengeM * 1000 * scale);

  ctx.fillStyle = '#c8a87a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const rx = randM * 1000 * scale;
  const ry = randM * 1000 * scale;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(0, 0, canvas.width, ry);
  ctx.fillRect(0, canvas.height - ry, canvas.width, ry);
  ctx.fillRect(0, ry, rx, canvas.height - 2*ry);
  ctx.fillRect(canvas.width - rx, ry, rx, canvas.height - 2*ry);

  const { modB, modH } = layout;
  const nutzStartX = randM * 1000;
  const nutzStartY = randM * 1000;

  for (let r = 0; r < layout.reihen; r++) {
    for (let s = 0; s < layout.spalten; s++) {
      const worldX = nutzStartX + s * (modB + abstandMM);
      const worldY = nutzStartY + r * (modH + abstandMM);
      let isBlocked = false;
      for (const h of hindernisse) {
        const hx = h.leftM*1000, hy = h.topM*1000, hb = h.breiteM*1000, hh = h.hoeheM*1000;
        if (worldX < hx+hb+100 && worldX+modB > hx-100 && worldY < hy+hh+100 && worldY+modH > hy-100) {
          isBlocked = true; break;
        }
      }
      if (!isBlocked) {
        const mx = worldX * scale, my = worldY * scale;
        const mw = modB * scale,   mh = modH * scale;
        ctx.fillStyle = '#1565c0';
        ctx.fillRect(mx, my, mw, mh);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 0.5;
        for (let c = 1; c < 6; c++) { ctx.beginPath(); ctx.moveTo(mx + c*mw/6, my); ctx.lineTo(mx + c*mw/6, my+mh); ctx.stroke(); }
        for (let c = 1; c < 10; c++) { ctx.beginPath(); ctx.moveTo(mx, my + c*mh/10); ctx.lineTo(mx+mw, my + c*mh/10); ctx.stroke(); }
        ctx.strokeStyle = '#0d47a1'; ctx.lineWidth = 1;
        ctx.strokeRect(mx, my, mw, mh);
      }
    }
  }

  for (const h of hindernisse) {
    const hx = h.leftM*1000*scale, hy = h.topM*1000*scale;
    const hb = h.breiteM*1000*scale, hh = h.hoeheM*1000*scale;
    ctx.fillStyle = 'rgba(239,83,80,0.85)';
    ctx.fillRect(hx, hy, hb, hh);
    ctx.strokeStyle = '#b71c1c'; ctx.lineWidth = 2;
    ctx.strokeRect(hx, hy, hb, hh);
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.max(10, Math.round(hb * 0.3))}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(h.typ === 'schornstein' ? '🏭' : '🪟', hx + hb/2, hy + hh/2);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
  ctx.fillStyle = 'white'; ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(
    `${finalAnzahl} Module · ${((finalAnzahl*selModWatt)/1000).toFixed(2)} kWp · ${selAzimuth}° ${azimuthLabel(selAzimuth)}`,
    canvas.width/2, canvas.height - 14
  );
}

// ---- Cross-Navigation ----
function zuLattenrechner() {
  const b = parseFloat(document.getElementById('dach-breite').value);
  const h = parseFloat(document.getElementById('dach-laenge').value);
  if (!b || !h) { alert('Bitte zuerst Dachmaße eingeben.'); return; }
  window.location.href = `/tools/lattenrechner/?${new URLSearchParams({breite:b, hoehe:h, typ:'rechteck'})}`;
}

function zuVerschnitt() {
  window.location.href = '/tools/verschnitt-optimierung/';
}
