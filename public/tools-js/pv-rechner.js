// ============================================================
// PV-Rechner – Solarmodule aufs Dach planen
// ============================================================

// ---- Zustand ----
let selModBreite = 1038;
let selModHoehe  = 2094;
let selModWatt   = 550;
let selAzimuth   = 180;
let selOrient    = 'auto';
let hindernisse  = [];
let currentHindernisTyp = 'schornstein';

// Dachform
let dachTyp        = 'rechteck';
let dachBreiteOben = null; // Trapez: obere Breite in Metern

// Sensor
let sensorActive = false;
let sensorAlpha  = null;
let sensorBeta   = null;

// Hindernis-Canvas
let hCanvas  = null;
let hMouseXm = -1;
let hMouseYm = -1;

// ---- Kontinuierlicher Ertragsfaktor ----
function orientFactor(azimuthDeg) {
  const rad = (azimuthDeg - 180) * Math.PI / 180;
  return 0.52 + 0.48 * Math.cos(rad);
}

// ---- Basisertrag Süd nach Neigung ----
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
  initHindernisCanvas();
  document.getElementById('dach-breite').addEventListener('input', updateHindernisCanvas);
  document.getElementById('dach-laenge').addEventListener('input', updateHindernisCanvas);
});

function ladeDachParameter() {
  const p = new URLSearchParams(window.location.search);
  if (p.has('breite'))      document.getElementById('dach-breite').value = parseFloat(p.get('breite'));
  if (p.has('hoehe'))       document.getElementById('dach-laenge').value = parseFloat(p.get('hoehe'));
  if (p.has('typ'))         dachTyp = p.get('typ');
  if (p.has('breite-oben')) dachBreiteOben = parseFloat(p.get('breite-oben'));
  if (p.has('neigung')) {
    const n = parseInt(p.get('neigung'));
    document.getElementById('neigung').value = n;
    document.getElementById('neigung-wert').textContent = n;
  }
  if (p.has('azimuth')) setAzimuth(parseInt(p.get('azimuth')));
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
    btn.addEventListener('click', () => setAzimuth(parseInt(btn.dataset.az)));
  });
}

function setAzimuth(deg) {
  deg = ((deg % 360) + 360) % 360;
  selAzimuth = deg;
  document.getElementById('azimuth-input').value = deg;
  document.getElementById('azimuth-label').textContent = azimuthLabel(deg);
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

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#f0f4ff';
  ctx.fill();
  ctx.strokeStyle = '#1e3c72';
  ctx.lineWidth = 2;
  ctx.stroke();

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

  const rad = (azimuthDeg - 90) * Math.PI / 180;
  const px = cx + (r - 22) * Math.cos(rad);
  const py = cy + (r - 22) * Math.sin(rad);

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(px, py);
  ctx.strokeStyle = '#f7971e';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#f7971e';
  ctx.fill();

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
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(state => {
        if (state === 'granted') activateSensor();
        else alert('Sensorzugriff wurde verweigert. Bitte in den iPhone-Einstellungen erlauben.');
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
  const beta  = event.beta  !== null ? event.beta  : 0;
  const alpha = event.alpha !== null ? event.alpha : 0;
  const neigung = Math.round(Math.abs(beta));
  const azimuth = Math.round(((alpha % 360) + 360) % 360);
  sensorAlpha = azimuth;
  sensorBeta  = neigung;
  document.getElementById('sensor-neigung').textContent  = neigung + '°';
  document.getElementById('sensor-richtung').textContent = azimuth + '°';
  document.getElementById('sensor-himmels').textContent  = azimuthLabel(azimuth);
}

function sensorUebernehmen() {
  if (sensorBeta !== null) {
    document.getElementById('neigung').value = Math.min(75, Math.max(1, sensorBeta));
    document.getElementById('neigung-wert').textContent = document.getElementById('neigung').value;
  }
  if (sensorAlpha !== null) setAzimuth(sensorAlpha);
  stopSensor();
}

// ---- Dachform-Pfad (wiederverwendbar) ----
// Baut den Canvas-Pfad für die aktuelle Dachform.
// W/H = Canvas-Dimensionen; verwendet globals dachTyp, dachBreiteOben
function buildRoofPath(ctx, W, H) {
  const dachBreiteM = parseFloat(document.getElementById('dach-breite').value) || 1;
  ctx.beginPath();
  if (dachTyp === 'trapez' && dachBreiteOben !== null && dachBreiteOben < dachBreiteM && dachBreiteOben > 0) {
    // Trapez: unten breiter (Traufe), oben schmaler (First)
    const offsetPx = W * (1 - dachBreiteOben / dachBreiteM) / 2;
    ctx.moveTo(0, H);           // Traufe links
    ctx.lineTo(W, H);           // Traufe rechts
    ctx.lineTo(W - offsetPx, 0); // First rechts
    ctx.lineTo(offsetPx, 0);    // First links
    ctx.closePath();
  } else if (dachTyp === 'dreieck') {
    ctx.moveTo(0, H);
    ctx.lineTo(W, H);
    ctx.lineTo(W / 2, 0);
    ctx.closePath();
  } else {
    ctx.rect(0, 0, W, H);
  }
}

// ---- Hindernis-Canvas: interaktive Platzierung ----
function initHindernisCanvas() {
  hCanvas = document.getElementById('hindernis-canvas');
  if (!hCanvas) return;
  hCanvas.addEventListener('mousemove',    onHMouseMove);
  hCanvas.addEventListener('click',        onHClick);
  hCanvas.addEventListener('contextmenu',  onHRightClick);
  hCanvas.addEventListener('mouseleave',   () => { hMouseXm = -1; hMouseYm = -1; drawHCanvas(); });
  hCanvas.addEventListener('touchmove',    onHTouchMove, { passive: false });
  hCanvas.addEventListener('touchend',     onHTouchEnd,  { passive: false });
  updateHindernisCanvas();
}

function updateHindernisCanvas() {
  if (!hCanvas) return;
  const dachBreiteM = parseFloat(document.getElementById('dach-breite').value) || 0;
  const dachLaengeM = parseFloat(document.getElementById('dach-laenge').value) || 0;
  const infoEl = document.getElementById('hindernis-pos-info');

  if (!dachBreiteM || !dachLaengeM || dachBreiteM <= 0 || dachLaengeM <= 0) {
    hCanvas.width  = 400;
    hCanvas.height = 120;
    const ctx = hCanvas.getContext('2d');
    ctx.fillStyle = '#eef0f5';
    ctx.fillRect(0, 0, 400, 120);
    ctx.fillStyle = '#999';
    ctx.font = '13px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Bitte zuerst Dachabmessungen eingeben', 200, 60);
    if (infoEl) infoEl.textContent = '';
    return;
  }

  const MAX_W = Math.min(700, (window.innerWidth || 800) - 60);
  const scale = MAX_W / (dachBreiteM * 1000);
  hCanvas.width  = Math.round(dachBreiteM * 1000 * scale);
  hCanvas.height = Math.round(dachLaengeM * 1000 * scale);
  hCanvas._scale = scale;

  drawHCanvas();
}

function drawHCanvas() {
  if (!hCanvas || !hCanvas._scale) return;
  const ctx = hCanvas.getContext('2d');
  const W   = hCanvas.width, H = hCanvas.height;
  const sc  = hCanvas._scale;
  const dachBreiteM = parseFloat(document.getElementById('dach-breite').value) || 0;
  const dachLaengeM = parseFloat(document.getElementById('dach-laenge').value) || 0;
  if (!dachBreiteM || !dachLaengeM) return;

  ctx.clearRect(0, 0, W, H);

  // Dachfläche füllen
  buildRoofPath(ctx, W, H);
  ctx.fillStyle = '#c8a87a';
  ctx.fill();

  // Maßbeschriftungen
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`↔ ${dachBreiteM.toFixed(1)} m`, W / 2, H - 8);
  ctx.save();
  ctx.translate(10, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${dachLaengeM.toFixed(1)} m`, 0, 0);
  ctx.restore();
  if (dachTyp === 'trapez' && dachBreiteOben !== null) {
    ctx.fillText(`↔ ${dachBreiteOben.toFixed(1)} m (First)`, W / 2, 12);
  }

  // Dach-Umriss
  buildRoofPath(ctx, W, H);
  ctx.strokeStyle = '#7a5c10';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Platzierte Hindernisse
  for (let i = 0; i < hindernisse.length; i++) {
    const h   = hindernisse[i];
    const hx  = h.leftM   * 1000 * sc;
    const hy  = h.topM    * 1000 * sc;
    const hbp = h.breiteM * 1000 * sc;
    const hhp = h.hoeheM  * 1000 * sc;
    ctx.fillStyle = 'rgba(239,83,80,0.85)';
    ctx.fillRect(hx, hy, hbp, hhp);
    ctx.strokeStyle = '#b71c1c';
    ctx.lineWidth = 2;
    ctx.strokeRect(hx, hy, hbp, hhp);
    ctx.fillStyle = 'white';
    ctx.font = `${Math.max(10, Math.round(Math.min(hbp, hhp) * 0.55))}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(h.typ === 'schornstein' ? '🏭' : '🪟', hx + hbp / 2, hy + hhp / 2);
  }

  // Geist-Hindernis am Mauszeiger
  if (hMouseXm >= 0 && hMouseYm >= 0) {
    const hbM  = parseFloat(document.getElementById('h-breite').value) || 0.5;
    const hhM  = parseFloat(document.getElementById('h-hoehe').value)  || 0.5;
    const gx   = (hMouseXm - hbM / 2) * 1000 * sc;
    const gy   = (hMouseYm - hhM / 2) * 1000 * sc;
    const gw   = hbM * 1000 * sc;
    const gh   = hhM * 1000 * sc;
    ctx.fillStyle = 'rgba(239,83,80,0.30)';
    ctx.fillRect(gx, gy, gw, gh);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#e53935';
    ctx.lineWidth = 2;
    ctx.strokeRect(gx, gy, gw, gh);
    ctx.setLineDash([]);
  }
}

function getCanvasPos(canvas, clientEvt) {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientEvt.clientX - rect.left) * scaleX,
    y: (clientEvt.clientY - rect.top)  * scaleY
  };
}

function onHMouseMove(evt) {
  if (!hCanvas || !hCanvas._scale) return;
  const pos  = getCanvasPos(hCanvas, evt);
  hMouseXm   = pos.x / (hCanvas._scale * 1000);
  hMouseYm   = pos.y / (hCanvas._scale * 1000);
  updateHPosInfo();
  drawHCanvas();
}

function updateHPosInfo() {
  const infoEl = document.getElementById('hindernis-pos-info');
  if (!infoEl) return;
  const dachBreiteM = parseFloat(document.getElementById('dach-breite').value) || 0;
  const dachLaengeM = parseFloat(document.getElementById('dach-laenge').value) || 0;
  if (!dachBreiteM || !dachLaengeM || hMouseXm < 0) { infoEl.textContent = ''; return; }
  const vL = Math.max(0, hMouseXm).toFixed(2);
  const vR = Math.max(0, dachBreiteM - hMouseXm).toFixed(2);
  const vF = Math.max(0, hMouseYm).toFixed(2);
  const vT = Math.max(0, dachLaengeM - hMouseYm).toFixed(2);
  infoEl.textContent = `${vL} m von links  ·  ${vR} m von rechts  ·  ${vF} m vom First  ·  ${vT} m von der Traufe`;
}

function platzierHindernis(clickXm, clickYm) {
  const dachBreiteM = parseFloat(document.getElementById('dach-breite').value) || 0;
  const dachLaengeM = parseFloat(document.getElementById('dach-laenge').value) || 0;
  if (!dachBreiteM || !dachLaengeM) return;
  const hbM  = parseFloat(document.getElementById('h-breite').value) || 0.5;
  const hhM  = parseFloat(document.getElementById('h-hoehe').value)  || 0.5;
  const leftM = Math.max(0, Math.min(clickXm - hbM / 2, dachBreiteM - hbM));
  const topM  = Math.max(0, Math.min(clickYm - hhM / 2, dachLaengeM - hhM));
  hindernisse.push({ typ: currentHindernisTyp, breiteM: hbM, hoeheM: hhM, leftM, topM });
  renderHindernisListe();
  drawHCanvas();
}

function onHClick(evt) {
  evt.preventDefault();
  if (!hCanvas || !hCanvas._scale) return;
  const pos  = getCanvasPos(hCanvas, evt);
  platzierHindernis(pos.x / (hCanvas._scale * 1000), pos.y / (hCanvas._scale * 1000));
}

function onHRightClick(evt) {
  evt.preventDefault();
  if (!hCanvas || !hCanvas._scale) return;
  const pos    = getCanvasPos(hCanvas, evt);
  const clickX = pos.x / (hCanvas._scale * 1000);
  const clickY = pos.y / (hCanvas._scale * 1000);
  for (let i = hindernisse.length - 1; i >= 0; i--) {
    const h = hindernisse[i];
    if (clickX >= h.leftM && clickX <= h.leftM + h.breiteM &&
        clickY >= h.topM  && clickY <= h.topM  + h.hoeheM) {
      hindernisse.splice(i, 1);
      renderHindernisListe();
      drawHCanvas();
      break;
    }
  }
}

function onHTouchMove(evt) {
  evt.preventDefault();
  if (!hCanvas || !hCanvas._scale || !evt.touches[0]) return;
  const pos = getCanvasPos(hCanvas, evt.touches[0]);
  hMouseXm  = pos.x / (hCanvas._scale * 1000);
  hMouseYm  = pos.y / (hCanvas._scale * 1000);
  updateHPosInfo();
  drawHCanvas();
}

function onHTouchEnd(evt) {
  evt.preventDefault();
  if (!hCanvas || !hCanvas._scale) return;
  if (evt.changedTouches && evt.changedTouches[0]) {
    const pos = getCanvasPos(hCanvas, evt.changedTouches[0]);
    platzierHindernis(pos.x / (hCanvas._scale * 1000), pos.y / (hCanvas._scale * 1000));
  }
  hMouseXm = -1; hMouseYm = -1;
}

function setHindernisTyp(btn) {
  document.querySelectorAll('.htyp-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentHindernisTyp = btn.dataset.typ;
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

function removeHindernis(idx) { hindernisse.splice(idx, 1); renderHindernisListe(); drawHCanvas(); }
function clearHindernisse()   { hindernisse = [];            renderHindernisListe(); drawHCanvas(); }

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

// ---- Layout-Berechnung (mit Zentrierung) ----
function berechneLayout(nutzBreiteMM, nutzLaengeMM, modB, modH, abstandMM) {
  const spalten = Math.max(0, Math.floor((nutzBreiteMM + abstandMM) / (modB + abstandMM)));
  const reihen  = Math.max(0, Math.floor((nutzLaengeMM + abstandMM) / (modH + abstandMM)));
  const totalW  = spalten > 0 ? spalten * (modB + abstandMM) - abstandMM : 0;
  const totalH  = reihen  > 0 ? reihen  * (modH + abstandMM) - abstandMM : 0;
  const offsetX = Math.max(0, (nutzBreiteMM - totalW) / 2);
  const offsetY = Math.max(0, (nutzLaengeMM - totalH) / 2);
  return { spalten, reihen, anzahl: spalten * reihen, modB, modH, offsetX, offsetY };
}

// ---- Blockierte Module (mit Zentrierung) ----
function zähleBlockierteModule(layout, randM, abstandMM) {
  if (hindernisse.length === 0 || layout.anzahl === 0) return 0;
  const nutzStartX = randM * 1000 + layout.offsetX;
  const nutzStartY = randM * 1000 + layout.offsetY;
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

// ---- Neigungsinterpolation ----
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

// ---- Ergebnis-Canvas: korrekte Dachform + zentrierte Module ----
function zeichneLayout(layout, dachBreiteM, dachLaengeM, randM, abstandMM, finalAnzahl) {
  const canvas = document.getElementById('pv-canvas');
  const ctx    = canvas.getContext('2d');
  const MAX_W  = Math.min(600, (window.innerWidth || 800) - 60);
  const scale  = MAX_W / (dachBreiteM * 1000);
  canvas.width  = Math.round(dachBreiteM * 1000 * scale);
  canvas.height = Math.round(dachLaengeM * 1000 * scale);
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // 1. Dachfläche füllen
  buildRoofPath(ctx, W, H);
  ctx.fillStyle = '#c8a87a';
  ctx.fill();

  // 2. Randabstand-Markierung
  const rx = randM * 1000 * scale;
  const ry = randM * 1000 * scale;
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(0, 0, W, ry);
  ctx.fillRect(0, H - ry, W, ry);
  ctx.fillRect(0, ry, rx, H - 2*ry);
  ctx.fillRect(W - rx, ry, rx, H - 2*ry);

  // 3. Auf Dachform clippen
  ctx.save();
  buildRoofPath(ctx, W, H);
  ctx.clip();

  // 4. Module zeichnen (zentriert)
  const { modB, modH, offsetX, offsetY } = layout;
  for (let r = 0; r < layout.reihen; r++) {
    for (let s = 0; s < layout.spalten; s++) {
      const worldX = randM * 1000 + offsetX + s * (modB + abstandMM);
      const worldY = randM * 1000 + offsetY + r * (modH + abstandMM);
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

  // 5. Hindernisse zeichnen
  for (const h of hindernisse) {
    const hx  = h.leftM   * 1000 * scale;
    const hy  = h.topM    * 1000 * scale;
    const hbp = h.breiteM * 1000 * scale;
    const hhp = h.hoeheM  * 1000 * scale;
    ctx.fillStyle = 'rgba(239,83,80,0.85)';
    ctx.fillRect(hx, hy, hbp, hhp);
    ctx.strokeStyle = '#b71c1c'; ctx.lineWidth = 2;
    ctx.strokeRect(hx, hy, hbp, hhp);
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.max(10, Math.round(Math.min(hbp, hhp) * 0.35))}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(h.typ === 'schornstein' ? '🏭' : '🪟', hx + hbp/2, hy + hhp/2);
  }

  ctx.restore();

  // 6. Dach-Umriss oben drüber
  buildRoofPath(ctx, W, H);
  ctx.strokeStyle = '#7a5c10';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 7. Info-Bar
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, H - 28, W, 28);
  ctx.fillStyle = 'white'; ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(
    `${finalAnzahl} Module · ${((finalAnzahl*selModWatt)/1000).toFixed(2)} kWp · ${selAzimuth}° ${azimuthLabel(selAzimuth)}`,
    W/2, H - 14
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
