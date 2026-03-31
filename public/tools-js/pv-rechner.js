// ============================================================
// PV-Rechner – Solarmodule aufs Dach planen
// ============================================================

// ---- Zustand ----
let selModBreite = 1038;  // mm
let selModHoehe  = 2094;  // mm
let selModWatt   = 550;
let selDir       = 'S';
let selOrient    = 'auto';
let hindernisse  = [];    // [{typ, breiteM, hoeheM, leftM, topM}]
let currentHindernisTyp = 'schornstein';

// ---- Spezifischer Ertrag: Richtung → Neigung → kWh/kWp/a (DE-Mittel) ----
const YIELD_TABLE = {
  S:  { 5:860, 10:910, 15:950, 20:980, 25:1000, 30:1010, 35:1010, 40:1005, 45:990, 50:970, 55:945, 60:910 },
  SE: { 5:840, 10:885, 15:920, 20:950, 25:968, 30:978, 35:978, 40:970, 45:955, 50:935, 55:908, 60:872 },
  SW: { 5:840, 10:885, 15:920, 20:950, 25:968, 30:978, 35:978, 40:970, 45:955, 50:935, 55:908, 60:872 },
  E:  { 5:800, 10:820, 15:840, 20:855, 25:865, 30:870, 35:868, 40:860, 45:845, 50:825, 55:800, 60:768 },
  W:  { 5:800, 10:820, 15:840, 20:855, 25:865, 30:870, 35:868, 40:860, 45:845, 50:825, 55:800, 60:768 },
  NE: { 5:760, 10:760, 15:755, 20:745, 25:730, 30:712, 35:690, 40:665, 45:638, 50:608, 55:576, 60:540 },
  NW: { 5:760, 10:760, 15:755, 20:745, 25:730, 30:712, 35:690, 40:665, 45:638, 50:608, 55:576, 60:540 },
  N:  { 5:750, 10:720, 15:700, 20:678, 25:652, 30:624, 35:593, 40:560, 45:526, 50:490, 55:452, 60:414 },
};

const REGION_FACTOR = {
  sued: 1.10,
  mitte: 1.00,
  ost: 0.95,
  west: 0.97,
  nord: 0.90,
};

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  ladeDachParameter();
  setupCompass();
  setupModuleButtons();
  setupOrientButtons();
  setupNeigungSlider();
  setupCustomModulInputs();
});

function ladeDachParameter() {
  const p = new URLSearchParams(window.location.search);
  if (p.has('breite')) document.getElementById('dach-breite').value = parseFloat(p.get('breite'));
  if (p.has('hoehe'))  document.getElementById('dach-laenge').value = parseFloat(p.get('hoehe'));
  if (p.has('neigung')) {
    const n = parseInt(p.get('neigung'));
    document.getElementById('neigung').value = n;
    document.getElementById('neigung-wert').textContent = n;
  }
}

function setupNeigungSlider() {
  const sl = document.getElementById('neigung');
  sl.addEventListener('input', () => {
    document.getElementById('neigung-wert').textContent = sl.value;
  });
}

function setupCompass() {
  document.querySelectorAll('.compass-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.compass-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selDir = btn.dataset.dir;
    });
  });
}

function setupModuleButtons() {
  document.querySelectorAll('.module-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.module-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selModBreite = parseInt(btn.dataset.w);
      selModHoehe  = parseInt(btn.dataset.h);
      selModWatt   = parseInt(btn.dataset.watt);
      // Preset-Werte in Custom-Feldern spiegeln
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
      if (b > 0) { selModBreite = b; document.querySelectorAll('.module-btn').forEach(x=>x.classList.remove('active')); }
      if (h > 0) { selModHoehe = h; }
      if (w > 0) { selModWatt = w; }
    });
  });
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

  if (hindernisse.length === 0) {
    liste.style.display = 'none';
    return;
  }
  liste.style.display = 'block';

  tbody.innerHTML = hindernisse.map((h, i) => `
    <tr>
      <td>${h.typ === 'schornstein' ? '🏭 Schornstein' : '🪟 Dachfenster'}</td>
      <td>${h.breiteM.toFixed(2)}</td>
      <td>${h.hoeheM.toFixed(2)}</td>
      <td>${h.leftM.toFixed(2)}</td>
      <td>${h.topM.toFixed(2)}</td>
      <td><button onclick="removeHindernis(${i})" style="background:none;border:none;cursor:pointer;color:#ef5350;font-size:16px;">✕</button></td>
    </tr>
  `).join('');
}

function removeHindernis(idx) {
  hindernisse.splice(idx, 1);
  renderHindernisListe();
}

function clearHindernisse() {
  hindernisse = [];
  renderHindernisListe();
}

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

  // Nutzbare Fläche in mm
  const nutzBreiteMM = (dachBreiteM - 2 * randM) * 1000;
  const nutzLaengeMM = (dachLaengeM - 2 * randM) * 1000;

  if (nutzBreiteMM <= 0 || nutzLaengeMM <= 0) {
    alert('Randabstand ist größer als die Dachfläche!');
    return;
  }

  // Optimales Layout ermitteln
  const layoutHoch = berechneLayout(nutzBreiteMM, nutzLaengeMM, selModBreite, selModHoehe, abstandMM);
  const layoutQuer = berechneLayout(nutzBreiteMM, nutzLaengeMM, selModHoehe, selModBreite, abstandMM);

  let layout;
  if (selOrient === 'hoch') {
    layout = layoutHoch;
    layout.orientierung = 'Hochformat';
  } else if (selOrient === 'quer') {
    layout = layoutQuer;
    layout.orientierung = 'Querformat';
  } else {
    // Auto: mehr Module gewinnt
    if (layoutHoch.anzahl >= layoutQuer.anzahl) {
      layout = layoutHoch;
      layout.orientierung = 'Hochformat (Auto)';
    } else {
      layout = layoutQuer;
      layout.orientierung = 'Querformat (Auto)';
    }
  }

  // Hindernisse abziehen
  const blockedByHindernisse = zähleBlockierteModule(
    layout, dachBreiteM, dachLaengeM, randM, abstandMM
  );
  const finalAnzahl = Math.max(0, layout.anzahl - blockedByHindernisse);

  // Leistung
  const kwp = (finalAnzahl * selModWatt) / 1000;

  // Ertrag
  const spezYield = interpolateYield(selDir, neigung);
  const regionFak = REGION_FACTOR[region] || 1.0;
  const wechselrichterFak = 0.97;
  const ertragKwh = kwp * spezYield * regionFak * wechselrichterFak;

  // Wert (Annahme: 70% Eigenverbrauch @0,32€, 30% Einspeisung @0,082€)
  const eigenverbrauch = ertragKwh * 0.70 * 0.32;
  const einspeisung    = ertragKwh * 0.30 * 0.082;
  const gesamtWert     = eigenverbrauch + einspeisung;

  // CO2 (Bundesstrommix: 434g CO2/kWh, 2023)
  const co2Kg = (ertragKwh * 434) / 1000;

  // Investitionsschätzung (grob: 1500–1800 €/kWp inkl. Montage)
  const investMin = kwp * 1500;
  const investMax = kwp * 1900;

  // Amortisation
  const amortJahre = gesamtWert > 0 ? ((investMin + investMax) / 2 / gesamtWert).toFixed(1) : '–';

  // Ausgabe
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
    ['Blockiert durch Hindernisse', `${blockedByHindernisse} Module`],
    ['Module gesamt', `${finalAnzahl} Stück`],
    ['Installierte Leistung', `${kwp.toFixed(2)} kWp`],
    ['Himmelsrichtung', dirLabel(selDir)],
    ['Dachneigung', `${neigung}°`],
    ['Spezifischer Ertrag', `${spezYield} kWh/kWp (vor Regionfaktor)`],
    ['Regionfaktor', `× ${regionFak.toFixed(2)}`],
    ['Jahresertrag', `${Math.round(ertragKwh).toLocaleString('de-DE')} kWh`],
    ['Eigenverbrauch (~70%)', `${Math.round(eigenverbrauch).toLocaleString('de-DE')} €/Jahr`],
    ['Einspeisevergütung (~30%)', `${Math.round(einspeisung).toLocaleString('de-DE')} €/Jahr`],
    ['Gesamtwert', `${Math.round(gesamtWert).toLocaleString('de-DE')} €/Jahr`],
    ['CO₂-Einsparung', `${Math.round(co2Kg).toLocaleString('de-DE')} kg/Jahr`],
    ['Investitionsschätzung', `${Math.round(investMin).toLocaleString('de-DE')} – ${Math.round(investMax).toLocaleString('de-DE')} €`],
    ['Amortisation (ca.)', `${amortJahre} Jahre`],
  ];

  document.getElementById('res-details').innerHTML = details.map(([k, v]) =>
    `<tr><td style="color:#ffd700; font-weight:600;">${k}</td><td>${v}</td></tr>`
  ).join('');

  document.getElementById('results').style.display = 'block';
  document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Canvas zeichnen
  zeichneLayout(layout, dachBreiteM, dachLaengeM, randM, abstandMM, finalAnzahl);
}

// ---- Layout-Berechnung ----
function berechneLayout(nutzBreiteMM, nutzLaengeMM, modB, modH, abstandMM) {
  const spalten = Math.floor((nutzBreiteMM + abstandMM) / (modB + abstandMM));
  const reihen  = Math.floor((nutzLaengeMM + abstandMM) / (modH + abstandMM));
  return {
    spalten: Math.max(0, spalten),
    reihen:  Math.max(0, reihen),
    anzahl:  Math.max(0, spalten * reihen),
    modB,
    modH,
  };
}

// ---- Blockierte Module durch Hindernisse ----
function zähleBlockierteModule(layout, dachBreiteM, dachLaengeM, randM, abstandMM) {
  if (hindernisse.length === 0 || layout.anzahl === 0) return 0;

  const nutzStartX = randM * 1000; // mm
  const nutzStartY = randM * 1000;
  const modB = layout.modB;
  const modH = layout.modH;
  const gap  = abstandMM;

  let blocked = 0;

  for (let r = 0; r < layout.reihen; r++) {
    for (let s = 0; s < layout.spalten; s++) {
      const mx = nutzStartX + s * (modB + gap);
      const my = nutzStartY + r * (modH + gap);

      for (const h of hindernisse) {
        const hx = h.leftM  * 1000;
        const hy = h.topM   * 1000;
        const hb = h.breiteM * 1000;
        const hh = h.hoeheM  * 1000;

        // Überschneidung prüfen (mit 100mm Sicherheitsabstand ums Hindernis)
        const sicher = 100;
        if (mx < hx + hb + sicher && mx + modB > hx - sicher &&
            my < hy + hh + sicher && my + modH > hy - sicher) {
          blocked++;
          break;
        }
      }
    }
  }

  return blocked;
}

// ---- Ertrag interpolieren ----
function interpolateYield(dir, neigung) {
  const table = YIELD_TABLE[dir] || YIELD_TABLE['S'];
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  const n = Math.max(5, Math.min(60, neigung));

  // Lineare Interpolation zwischen nächsten Stützwerten
  for (let i = 0; i < keys.length - 1; i++) {
    if (n >= keys[i] && n <= keys[i + 1]) {
      const t = (n - keys[i]) / (keys[i + 1] - keys[i]);
      return Math.round(table[keys[i]] + t * (table[keys[i + 1]] - table[keys[i]]));
    }
  }
  return table[keys[keys.length - 1]];
}

// ---- Richtungs-Label ----
function dirLabel(d) {
  const m = { S:'Süd', N:'Nord', E:'Ost', W:'West', SE:'Südost', SW:'Südwest', NE:'Nordost', NW:'Nordwest' };
  return m[d] || d;
}

// ---- Canvas-Visualisierung ----
function zeichneLayout(layout, dachBreiteM, dachLaengeM, randM, abstandMM, finalAnzahl) {
  const canvas = document.getElementById('pv-canvas');
  const ctx    = canvas.getContext('2d');

  const MAX_W = Math.min(600, window.innerWidth - 60);
  const scale  = MAX_W / (dachBreiteM * 1000); // px per mm
  canvas.width  = Math.round(dachBreiteM * 1000 * scale);
  canvas.height = Math.round(dachLaengeM * 1000 * scale);

  // Hintergrund (Dach)
  ctx.fillStyle = '#c8a87a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Rand-Schraffur
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  const rx = randM * 1000 * scale;
  const ry = randM * 1000 * scale;
  const rw = canvas.width  - 2 * rx;
  const rh = canvas.height - 2 * ry;
  // Rand (Rahmen outside nutzfläche)
  ctx.fillRect(0, 0, canvas.width, ry);
  ctx.fillRect(0, canvas.height - ry, canvas.width, ry);
  ctx.fillRect(0, ry, rx, canvas.height - 2 * ry);
  ctx.fillRect(canvas.width - rx, ry, rx, canvas.height - 2 * ry);

  const modB = layout.modB;
  const modH = layout.modH;
  const gap  = abstandMM;

  const nutzStartX = randM * 1000;
  const nutzStartY = randM * 1000;

  // Module zeichnen
  let drawn = 0;
  for (let r = 0; r < layout.reihen; r++) {
    for (let s = 0; s < layout.spalten; s++) {
      const mx = (nutzStartX + s * (modB + gap)) * scale;
      const my = (nutzStartY + r * (modH + gap)) * scale;
      const mw = modB * scale;
      const mh = modH * scale;

      // Blockiert durch Hindernis?
      const worldX = nutzStartX + s * (modB + gap);
      const worldY = nutzStartY + r * (modH + gap);
      let isBlocked = false;
      for (const h of hindernisse) {
        const hx = h.leftM * 1000, hy = h.topM * 1000;
        const hb = h.breiteM * 1000, hh = h.hoeheM * 1000;
        if (worldX < hx + hb + 100 && worldX + modB > hx - 100 &&
            worldY < hy + hh + 100 && worldY + modH > hy - 100) {
          isBlocked = true; break;
        }
      }

      if (!isBlocked) {
        // Modul-Fläche (blau)
        ctx.fillStyle = '#1565c0';
        ctx.fillRect(mx, my, mw, mh);
        // Zellen-Linien (dekorativ)
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 0.5;
        const cellCols = 6, cellRows = 10;
        for (let c = 1; c < cellCols; c++) {
          const cx = mx + c * (mw / cellCols);
          ctx.beginPath(); ctx.moveTo(cx, my); ctx.lineTo(cx, my + mh); ctx.stroke();
        }
        for (let c = 1; c < cellRows; c++) {
          const cy = my + c * (mh / cellRows);
          ctx.beginPath(); ctx.moveTo(mx, cy); ctx.lineTo(mx + mw, cy); ctx.stroke();
        }
        // Modulrahmen
        ctx.strokeStyle = '#0d47a1';
        ctx.lineWidth = 1;
        ctx.strokeRect(mx, my, mw, mh);
        drawn++;
      }
    }
  }

  // Hindernisse zeichnen
  for (const h of hindernisse) {
    const hx = h.leftM   * 1000 * scale;
    const hy = h.topM    * 1000 * scale;
    const hb = h.breiteM * 1000 * scale;
    const hh = h.hoeheM  * 1000 * scale;

    ctx.fillStyle = 'rgba(239, 83, 80, 0.85)';
    ctx.fillRect(hx, hy, hb, hh);
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 2;
    ctx.strokeRect(hx, hy, hb, hh);

    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.max(10, Math.round(hb * 0.25))}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(h.typ === 'schornstein' ? '🏭' : '🪟', hx + hb / 2, hy + hh / 2);
  }

  // Beschriftung
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, canvas.height - 28, canvas.width, 28);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${drawn} Module · ${((drawn * selModWatt)/1000).toFixed(2)} kWp · ${dachBreiteM.toFixed(1)} × ${dachLaengeM.toFixed(1)} m`, canvas.width / 2, canvas.height - 14);
}

// ---- Cross-Navigation ----
function zuLattenrechner() {
  const b = parseFloat(document.getElementById('dach-breite').value);
  const h = parseFloat(document.getElementById('dach-laenge').value);
  if (!b || !h) { alert('Bitte zuerst Dachmaße eingeben.'); return; }
  const p = new URLSearchParams({ breite: b, hoehe: h, typ: 'rechteck' });
  window.location.href = `/tools/lattenrechner/?${p.toString()}`;
}

function zuVerschnitt() {
  window.location.href = '/tools/verschnitt-optimierung/';
}
