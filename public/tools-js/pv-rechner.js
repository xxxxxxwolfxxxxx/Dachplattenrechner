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
let dachTyp         = 'rechteck';
let dachBreiteOben  = null;      // Trapez: obere Breite in Metern
let dachDreieckTyp  = null;      // Dreieck: 'gleichschenkliges' oder 'ungleichschenkliges'
let spitzePosX      = null;      // Ungleichschenkliges Dreieck: Spitzenposition von links (m)
let rechteckHoehe   = null;      // Dreieck auf Rechteck: Rechteck-Teil Höhe (m)
let dreieckHoehe    = null;      // Dreieck auf Rechteck: Dreieck-Teil Höhe (m)

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

// ---- Effektive Dachfläche berechnen (form-specific) ----
function berechneEffektiveFläche(dachTyp, breiteM, hoeheM) {
  switch(dachTyp) {
    case 'rechteck':
      // Rechteck: volle Fläche
      return breiteM * hoeheM;

    case 'gleichschenkliges-dreieck':
    case 'ungleichschenkliges-dreieck':
      // Dreieck: Hälfte der Rechteck-Fläche (Breite × Höhe / 2)
      return (breiteM * hoeheM) / 2;

    case 'trapez':
      // Trapez: ((obere Breite + untere Breite) × Höhe) / 2
      if (dachBreiteOben === null) return breiteM * hoeheM; // Fallback
      return ((dachBreiteOben + breiteM) * hoeheM) / 2;

    case 'dreieck-auf-rechteck':
      // Dreieck auf Rechteck: (Breite × Rechteck-Höhe) + (Breite × Dreieck-Höhe / 2)
      // Hier: rechteckHoehe und dreieckHoehe sind separate Parameter (nicht in hoeheM enthalten)
      if (rechteckHoehe === null || dreieckHoehe === null) {
        // Fallback: wenn Parameter nicht gesetzt, nimm an dass hoeheM = gesamtHöhe
        // und schätze die Anteile (Annahme: 50/50)
        return (breiteM * hoeheM * 0.75); // Reduktion für Dreieck-Form
      }
      const rectArea = breiteM * rechteckHoehe;
      const triArea = (breiteM * dreieckHoehe) / 2;
      return rectArea + triArea;

    case 'trapez-auf-rechteck':
      // Trapez auf Rechteck: Kombination aus Rechteck-Trapez und Dreieck
      if (dachBreiteOben === null || rechteckHoehe === null || dreieckHoehe === null) return breiteM * hoeheM;
      // Rechteck-Teil als Trapez
      const rectAreaTR = ((dachBreiteOben + breiteM) * rechteckHoehe) / 2;
      // Dreieck-Teil
      const triAreaTR = (breiteM * dreieckHoehe) / 2;
      return rectAreaTR + triAreaTR;

    default:
      return breiteM * hoeheM;
  }
}

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
  const hasURLParams = window.location.search.length > 0;
  ladeDachParameter();
  setupAzimuthInput();
  setupShortcutButtons();
  setupModuleButtons();
  setupOrientButtons();
  setupNeigungSlider();
  setupCustomModulInputs();
  setupDreieckTyp();
  drawCompassDial(selAzimuth);
  initHindernisCanvas();
  const dachBreiteInput = document.getElementById('dach-breite');
  const dachHoeheInput = document.getElementById('dach-hoehe');
  if (dachBreiteInput) dachBreiteInput.addEventListener('input', updateHindernisCanvas);
  if (dachHoeheInput) dachHoeheInput.addEventListener('input', updateHindernisCanvas);
  document.getElementById('berechne-btn').addEventListener('click', berechne);

  // Batterie-Checkbox
  const batterieCheckbox = document.getElementById('batterie-aktiv');
  if (batterieCheckbox) {
    batterieCheckbox.addEventListener('change', toggleBatterie);
  }

  // Batterie-Preis-Mode Radio Buttons
  const updateBatteriePriceMode = () => {
    const mode = document.querySelector('input[name="batterie-price-mode"]:checked').value;
    document.getElementById('batterie-preis-kwh-group').style.display = mode === 'kwh' ? 'block' : 'none';
    document.getElementById('batterie-preis-gesamt-group').style.display = mode === 'gesamt' ? 'block' : 'none';
    updateBatterieInfo();
  };

  document.querySelectorAll('input[name="batterie-price-mode"]').forEach(radio => {
    radio.addEventListener('change', updateBatteriePriceMode);
  });

  // Initialisierung beim Load
  updateBatteriePriceMode();

  // PV-Kosten-Mode Radio Buttons
  const updatePVCostsMode = () => {
    const mode = document.querySelector('input[name="pv-kosten-mode"]:checked').value;
    document.getElementById('pv-kosten-gesamt-group').style.display = mode === 'gesamt' ? 'block' : 'none';
    document.getElementById('pv-kosten-pro-kwp-group').style.display = mode === 'pro-kwp' ? 'block' : 'none';
    updatePVCostsInfo();
  };

  document.querySelectorAll('input[name="pv-kosten-mode"]').forEach(radio => {
    radio.addEventListener('change', updatePVCostsMode);
  });

  // Initialisierung beim Load
  updatePVCostsMode();

  // Auto-calculate if URL parameters were passed
  if (hasURLParams) {
    setTimeout(() => berechne(), 100);
  }
});

function ladeDachParameter() {
  const p = new URLSearchParams(window.location.search);
  const dachBreiteInput = document.getElementById('dach-breite');
  const dachHoeheInput = document.getElementById('dach-hoehe');
  const dachFormSelect = document.getElementById('dach-form');
  const dachBreiteObenInput = document.getElementById('dach-breite-oben');

  if (dachBreiteInput && p.has('breite')) dachBreiteInput.value = parseFloat(p.get('breite')).toFixed(2);
  if (dachHoeheInput && p.has('hoehe')) dachHoeheInput.value = parseFloat(p.get('hoehe')).toFixed(2);
  if (p.has('typ')) {
    dachTyp = p.get('typ');
    if (dachFormSelect) dachFormSelect.value = dachTyp;
  }
  // Support both 'breite-oben' and 'breiteOben' for backward compatibility
  if (p.has('breiteOben'))  dachBreiteOben = parseFloat(p.get('breiteOben'));
  else if (p.has('breite-oben')) dachBreiteOben = parseFloat(p.get('breite-oben'));
  if (dachBreiteObenInput && dachBreiteOben) dachBreiteObenInput.value = dachBreiteOben.toFixed(2);
  if (p.has('dreieckTyp'))  {
    dachDreieckTyp = p.get('dreieckTyp');
    const radio = document.querySelector(`input[name="dreieck-typ"][value="${dachDreieckTyp}"]`);
    if (radio) radio.checked = true;
  }
  if (p.has('spitzenPosition')) {
    spitzePosX = parseFloat(p.get('spitzenPosition'));
    const input = document.getElementById('spitze-pos');
    if (input) input.value = spitzePosX;
  }
  if (p.has('rechteckHoehe')) rechteckHoehe = parseFloat(p.get('rechteckHoehe'));
  else if (p.has('rechteck-hoehe')) rechteckHoehe = parseFloat(p.get('rechteck-hoehe'));
  if (p.has('dreieckHoehe'))  dreieckHoehe = parseFloat(p.get('dreieckHoehe'));
  else if (p.has('trapez-hoehe')) dreieckHoehe = parseFloat(p.get('trapez-hoehe'));
  if (p.has('neigung')) {
    const n = parseInt(p.get('neigung'));
    document.getElementById('neigung').value = n;
    document.getElementById('neigung-wert').textContent = n;
  }
  if (p.has('azimuth')) setAzimuth(parseInt(p.get('azimuth')));
}

// ---- Azimut-Eingabe ----
function setupAzimuthInput() {
  const inp = document.getElementById('azimuth');
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
      document.getElementById('mod-breite').value = btn.dataset.w;
      document.getElementById('mod-hoehe').value  = btn.dataset.h;
      document.getElementById('mod-watt').value   = btn.dataset.watt;
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
    const el = document.getElementById(id);
    if (!el) return;  // Element doesn't exist, skip
    el.addEventListener('input', () => {
      const b = parseFloat(document.getElementById('mod-breite').value);
      const h = parseFloat(document.getElementById('mod-hoehe').value);
      const w = parseFloat(document.getElementById('mod-watt').value);
      if (b > 0) { selModBreite = b; document.querySelectorAll('.module-btn').forEach(x => x.classList.remove('active')); }
      if (h > 0) { selModHoehe = h; }
      if (w > 0) { selModWatt = w; }
    });
  });
}

// ---- Dreieck-Typ Setup ----
function setupDreieckTyp() {
  const dreieckTypGroup = document.getElementById('dreieck-typ-group');
  const spitzePosGroup = document.getElementById('spitze-pos-group');

  if (!dreieckTypGroup) return; // Elements don't exist, skip

  // Show dreieck-typ-group only if dachTyp is 'dreieck'
  const shouldShow = dachTyp === 'dreieck';
  dreieckTypGroup.style.display = shouldShow ? 'block' : 'none';

  // Listen to dreieck-typ radio changes
  document.querySelectorAll('input[name="dreieck-typ"]').forEach(radio => {
    radio.addEventListener('change', () => {
      dachDreieckTyp = radio.value;
      // Show spitze-pos-group only if ungleichschenkliges is selected
      if (spitzePosGroup) {
        spitzePosGroup.style.display = dachDreieckTyp === 'ungleichschenkliges' ? 'block' : 'none';
      }
    });
  });

  // Listen to spitze-pos input changes
  const spitzePosInput = document.getElementById('spitze-pos');
  if (spitzePosInput) {
    spitzePosInput.addEventListener('input', () => {
      const val = parseFloat(spitzePosInput.value);
      spitzePosX = isNaN(val) ? null : val;
    });
  }

  // Initialize visibility based on loaded dachDreieckTyp
  if (shouldShow && dachDreieckTyp) {
    const radio = document.querySelector(`input[name="dreieck-typ"][value="${dachDreieckTyp}"]`);
    if (radio) radio.checked = true;
    if (spitzePosGroup) {
      spitzePosGroup.style.display = dachDreieckTyp === 'ungleichschenkliges' ? 'block' : 'none';
    }
  }
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
function buildRoofPath(ctx, W, H) {
  const dachBreiteM = parseFloat(document.getElementById('dach-breite').value) || 1;
  ctx.beginPath();
  if (dachTyp === 'trapez' && dachBreiteOben !== null && dachBreiteOben > 0 && dachBreiteOben < dachBreiteM) {
    const offsetPx = W * (1 - dachBreiteOben / dachBreiteM) / 2;
    ctx.moveTo(0, H);
    ctx.lineTo(W, H);
    ctx.lineTo(W - offsetPx, 0);
    ctx.lineTo(offsetPx, 0);
    ctx.closePath();
  } else if (dachTyp === 'dreieck') {
    ctx.moveTo(0, H);
    ctx.lineTo(W, H);
    ctx.lineTo(W / 2, 0);
    ctx.closePath();
  } else if (dachTyp === 'dreieck-auf-rechteck' && rechteckHoehe !== null && dreieckHoehe !== null) {
    // Rectangle (bottom) + triangle (top)
    const dachLaengeM = parseFloat(document.getElementById('dach-hoehe').value) || 1;
    const rectHeightPx = H * (rechteckHoehe / dachLaengeM);
    const triHeightPx = H - rectHeightPx;

    // Rectangle part (bottom)
    ctx.moveTo(0, H);
    ctx.lineTo(W, H);
    ctx.lineTo(W, rectHeightPx);

    // Triangle part (top) - tapering to center peak
    ctx.lineTo(W / 2, 0);
    ctx.lineTo(0, rectHeightPx);
    ctx.closePath();
  } else if (dachTyp === 'trapez-auf-rechteck' && dachBreiteOben !== null && rechteckHoehe !== null && dreieckHoehe !== null) {
    // Rectangle (bottom) + trapez (top)
    const dachLaengeM = parseFloat(document.getElementById('dach-hoehe').value) || 1;
    const rectHeightPx = H * (rechteckHoehe / dachLaengeM);

    const offsetPx = W * (1 - dachBreiteOben / dachBreiteM) / 2;

    // Rectangle part (bottom)
    ctx.moveTo(0, H);
    ctx.lineTo(W, H);
    ctx.lineTo(W, rectHeightPx);

    // Trapez part (top)
    ctx.lineTo(W - offsetPx, 0);
    ctx.lineTo(offsetPx, 0);
    ctx.lineTo(0, rectHeightPx);
    ctx.closePath();
  } else {
    ctx.rect(0, 0, W, H);
  }
}

// ---- Breite der Dachform an globaler y-Position (in mm) ----
// yGlobal = Abstand vom First (y=0 = First, y=dachHMM = Traufe)
function dachBreiteAnY(yGlobal, dachBMM, dachHMM) {
  if (dachTyp === 'trapez' && dachBreiteOben !== null && dachBreiteOben > 0) {
    const boMM = dachBreiteOben * 1000;
    return boMM + (yGlobal / dachHMM) * (dachBMM - boMM);
  } else if (dachTyp === 'dreieck') {
    return (yGlobal / dachHMM) * dachBMM;
  } else if (dachTyp === 'dreieck-auf-rechteck' && rechteckHoehe !== null && dreieckHoehe !== null) {
    // Dreieck-auf-Rechteck: Oben (Dreieck) tapert zur Spitze, Unten (Rechteck) volle Breite
    const dreieckHMM = dreieckHoehe * 1000;

    if (yGlobal >= dreieckHMM) {
      // Im Rechteck-Bereich: volle Breite
      return dachBMM;
    } else {
      // Im Dreieck-Bereich (oben)
      if (dachDreieckTyp === 'ungleichschenkliges' && spitzePosX !== null) {
        // Asymmetrisches Dreieck mit spitzePosX
        const spitzePosXMM = spitzePosX * 1000;
        const linkeBreite = spitzePosXMM;
        const rechteBreite = dachBMM - spitzePosXMM;

        // Anteil: wie weit sind wir vom Peak (0) zur Basis (dreieckHMM)?
        const prozent = yGlobal / dreieckHMM;

        // Breite wächst linear von 0 zur Basis
        const leftWidth = linkeBreite * prozent;
        const rightWidth = rechteBreite * prozent;
        return leftWidth + rightWidth;
      } else {
        // Symmetrisches (gleichschenkliges) Dreieck
        return (yGlobal / dreieckHMM) * dachBMM;
      }
    }
  } else if (dachTyp === 'trapez-auf-rechteck' && dachBreiteOben !== null && rechteckHoehe !== null && dreieckHoehe !== null) {
    const trapezHMM = dreieckHoehe * 1000;
    const boMM = dachBreiteOben * 1000;

    if (yGlobal >= trapezHMM) {
      return dachBMM;
    } else {
      return boMM + (yGlobal / trapezHMM) * (dachBMM - boMM);
    }
  } else {
    return dachBMM;
  }
}

// ---- Layout-Berechnung: formabhängig, per Reihe ----
// Gibt rows zurück: [{spalten, xStartMM, yTopGlobal}]
// Für Trapez/Dreieck: Reihen von Traufe (unten) nach First (oben) gestapelt,
//   jede Reihe so breit wie es die Dachform an ihrer Oberkante erlaubt.
// Für Rechteck: gleichmäßig zentriert.
function berechneLayoutFuerForm(dachBMM, dachHMM, randMM, modB, modH, gapMM) {
  const nutzHMM = dachHMM - 2 * randMM;
  const nutzBMM = dachBMM - 2 * randMM;
  if (nutzHMM <= 0 || nutzBMM <= 0) return { reihen: 0, anzahl: 0, rows: [], modB, modH };

  const reihen = Math.max(0, Math.floor((nutzHMM + gapMM) / (modH + gapMM)));
  if (reihen === 0) return { reihen: 0, anzahl: 0, rows: [], modB, modH };

  const isShapeAware = (dachTyp === 'trapez' && dachBreiteOben !== null && dachBreiteOben > 0 && dachBreiteOben * 1000 < dachBMM)
                     || dachTyp === 'dreieck'
                     || (dachTyp === 'dreieck-auf-rechteck' && rechteckHoehe !== null && dreieckHoehe !== null)
                     || (dachTyp === 'trapez-auf-rechteck' && dachBreiteOben !== null && rechteckHoehe !== null && dreieckHoehe !== null);

  const rows = [];
  let totalAnzahl = 0;

  if (isShapeAware) {
    // Reihen von Traufe nach First, r=0 ist die unterste (breiteste) Reihe
    for (let r = 0; r < reihen; r++) {
      // yTop dieser Reihe von oben (First) gemessen
      const yTopGlobal = dachHMM - randMM - (r + 1) * modH - r * gapMM;

      // Breite der Dachform an der Oberkante dieser Reihe (engste Stelle)
      const widthAtTop = Math.max(0, dachBreiteAnY(yTopGlobal, dachBMM, dachHMM));
      const leftEdge   = (dachBMM - widthAtTop) / 2;
      const availW     = Math.max(0, widthAtTop - 2 * randMM);

      const spalten  = Math.max(0, Math.floor((availW + gapMM) / (modB + gapMM)));
      const usedW    = spalten > 0 ? spalten * modB + (spalten - 1) * gapMM : 0;
      const centerOff = spalten > 0 ? (availW - usedW) / 2 : 0;
      const xStartMM  = leftEdge + randMM + centerOff;

      rows.push({ spalten, xStartMM, yTopGlobal });
      totalAnzahl += spalten;
    }
  } else {
    // Rechteck: zentriert horizontal + vertikal
    const spalten = Math.max(0, Math.floor((nutzBMM + gapMM) / (modB + gapMM)));
    const usedW   = spalten > 0 ? spalten * modB + (spalten - 1) * gapMM : 0;
    const usedH   = reihen  > 0 ? reihen  * modH + (reihen  - 1) * gapMM : 0;
    const offX    = Math.max(0, (nutzBMM - usedW) / 2);
    const offY    = Math.max(0, (nutzHMM - usedH) / 2);
    const xStart  = randMM + offX;

    for (let r = 0; r < reihen; r++) {
      const yTopGlobal = randMM + offY + r * (modH + gapMM);
      rows.push({ spalten, xStartMM: xStart, yTopGlobal });
      totalAnzahl += spalten;
    }
  }

  return { reihen, anzahl: totalAnzahl, modB, modH, rows, isShapeAware };
}

// ---- Blockierte Module (per-Reihe) ----
function zähleBlockierteModule(layout, gapMM) {
  if (hindernisse.length === 0 || layout.anzahl === 0) return 0;
  const { modB, modH, rows } = layout;
  let blocked = 0;
  for (const row of rows) {
    for (let s = 0; s < row.spalten; s++) {
      const mx = row.xStartMM + s * (modB + gapMM);
      const my = row.yTopGlobal;
      for (const h of hindernisse) {
        const hx = h.leftM*1000, hy = h.topM*1000;
        const hb = h.breiteM*1000, hh = h.hoeheM*1000;
        const sicher = 100;
        if (mx < hx+hb+sicher && mx+modB > hx-sicher && my < hy+hh+sicher && my+modH > hy-sicher) {
          blocked++; break;
        }
      }
    }
  }
  return blocked;
}

// ---- Hindernis-Canvas: interaktive Platzierung ----
function initHindernisCanvas() {
  hCanvas = document.getElementById('hindernis-canvas');
  if (!hCanvas) return;
  hCanvas.addEventListener('mousemove',   onHMouseMove);
  hCanvas.addEventListener('click',       onHClick);
  hCanvas.addEventListener('contextmenu', onHRightClick);
  hCanvas.addEventListener('mouseleave',  () => { hMouseXm = -1; hMouseYm = -1; drawHCanvas(); });
  hCanvas.addEventListener('touchmove',   onHTouchMove, { passive: false });
  hCanvas.addEventListener('touchend',    onHTouchEnd,  { passive: false });
  updateHindernisCanvas();
}

function updateHindernisCanvas() {
  if (!hCanvas) return;
  const dachBreiteM = parseFloat(document.getElementById('dach-breite').value) || 0;
  const dachLaengeM = parseFloat(document.getElementById('dach-hoehe').value) || 0;
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
  const dachLaengeM = parseFloat(document.getElementById('dach-hoehe').value) || 0;
  if (!dachBreiteM || !dachLaengeM) return;

  ctx.clearRect(0, 0, W, H);

  buildRoofPath(ctx, W, H);
  ctx.fillStyle = '#c8a87a';
  ctx.fill();

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

  buildRoofPath(ctx, W, H);
  ctx.strokeStyle = '#7a5c10';
  ctx.lineWidth = 2;
  ctx.stroke();

  for (const h of hindernisse) {
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
  const dachLaengeM = parseFloat(document.getElementById('dach-hoehe').value) || 0;
  if (!dachBreiteM || !dachLaengeM || hMouseXm < 0) { infoEl.textContent = ''; return; }
  const vL = Math.max(0, hMouseXm).toFixed(2);
  const vR = Math.max(0, dachBreiteM - hMouseXm).toFixed(2);
  const vF = Math.max(0, hMouseYm).toFixed(2);
  const vT = Math.max(0, dachLaengeM - hMouseYm).toFixed(2);
  infoEl.textContent = `${vL} m von links  ·  ${vR} m von rechts  ·  ${vF} m vom First  ·  ${vT} m von der Traufe`;
}

function platzierHindernis(clickXm, clickYm) {
  const dachBreiteM = parseFloat(document.getElementById('dach-breite').value) || 0;
  const dachLaengeM = parseFloat(document.getElementById('dach-hoehe').value) || 0;
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
  const pos = getCanvasPos(hCanvas, evt);
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

// ---- Batterie-Hilfsfunktionen ----
let batteriePriceMode = 'kwh'; // 'kwh' oder 'gesamt'

function toggleBatterie() {
  const aktiv = document.getElementById('batterie-aktiv').checked;
  document.getElementById('batterie-box').style.display = aktiv ? 'block' : 'none';
  updateBatterieInfo();
}

// Eigenverbrauchsrate mit Batterie berechnen
function eigenverbrauchsmitBatterie(basisRate, ertragKwh, batterieKwh) {
  if (ertragKwh <= 0) return basisRate;
  const tagErtrag = ertragKwh / 365;
  const pufferbareFraktion = Math.min(0.90, (batterieKwh * 0.85) / Math.max(1, tagErtrag));
  const verbesserung = (1 - basisRate) * pufferbareFraktion * 0.55;
  return Math.min(0.95, basisRate + verbesserung);
}

// Batteriekosten aus Eingaben ermitteln
function getBatterieKosten() {
  const batterieKwh   = parseFloat(document.getElementById('batterie-kwh').value) || 10;
  const gesamtInput   = parseFloat(document.getElementById('batterie-preis-gesamt').value);
  const preisProKwh   = parseFloat(document.getElementById('batterie-preis-kwh').value) || 650;
  if (!isNaN(gesamtInput) && gesamtInput > 0) return gesamtInput;
  return batterieKwh * preisProKwh;
}

function getPVKosten(kWp) {
  const mode = document.querySelector('input[name="pv-kosten-mode"]:checked').value;
  if (mode === 'gesamt') {
    return parseFloat(document.getElementById('pv-kosten-gesamt').value) || 0;
  } else {
    const proKwp = parseFloat(document.getElementById('pv-kosten-pro-kwp').value) || 0;
    return (kWp || 0) * proKwp;
  }
}

function updateBatterieInfo() {
  const infoEl = document.getElementById('batterie-info');
  if (!infoEl) return;
  const aktiv = document.getElementById('batterie-aktiv').checked;
  if (!aktiv) { infoEl.innerHTML = ''; return; }

  const batterieKwh = parseFloat(document.getElementById('batterie-kwh').value) || 10;
  const basisRate   = (parseFloat(document.getElementById('eigenverbrauch-rate').value) || 30) / 100;
  const evMit       = Math.round(eigenverbrauchsmitBatterie(basisRate, 4000, batterieKwh) * 100);
  const kosten      = Math.round(getBatterieKosten());
  infoEl.innerHTML =
    `⚡ Eigenverbrauchsquote steigt auf ca. <strong>${evMit} %</strong><br>` +
    `💶 Batteriekosten: <strong>${kosten.toLocaleString('de-DE')} €</strong>`;
}

function updatePVCostsInfo() {
  const infoEl = document.getElementById('pv-kosten-info');
  if (!infoEl) return;

  const mode = document.querySelector('input[name="pv-kosten-mode"]:checked').value;
  const gesamtCost = parseFloat(document.getElementById('pv-kosten-gesamt').value) || 0;
  const proKwpCost = parseFloat(document.getElementById('pv-kosten-pro-kwp').value) || 0;

  if (mode === 'gesamt') {
    infoEl.innerHTML = `💰 Gesamtkosten der PV-Anlage: <strong>${gesamtCost.toLocaleString('de-DE')} €</strong>`;
  } else {
    infoEl.innerHTML = `💰 Kosten pro kWp: <strong>${proKwpCost.toLocaleString('de-DE')} €/kWp</strong><br><span style="font-size: 12px; color: #666;">Wird mit der Anlagengröße multipliziert</span>`;
  }
}

// ---- Format-Optimierer ----
const MODULE_PRESETS = [
  { name: 'Halbzellen M10',       w: 1134, h: 1722, watt: 410 },
  { name: 'Standard XL 450W',     w: 1134, h: 1762, watt: 450 },
  { name: 'Großmodul 500W',       w: 1134, h: 2100, watt: 500 },
  { name: 'Groß-Modul 72Z',       w: 1038, h: 2094, watt: 550 },
  { name: 'TOPCon / HJT',         w: 1134, h: 2172, watt: 600 },
  { name: 'Standard 72Z',         w:  992, h: 1956, watt: 390 },
  { name: 'Standard 60Z',         w:  992, h: 1650, watt: 310 },
  { name: 'Glas-Glas / Rahmenlos',w: 1002, h: 2008, watt: 420 },
];

function findeOptimalesFormat() {
  const dachBreiteM = parseFloat(document.getElementById('dach-breite').value);
  const dachLaengeM = parseFloat(document.getElementById('dach-hoehe').value);
  const randM       = parseFloat(document.getElementById('rand-abstand').value) || 0.2;
  const abstandMM   = parseFloat(document.getElementById('mod-abstand').value) || 20;

  if (!dachBreiteM || !dachLaengeM || dachBreiteM <= 0 || dachLaengeM <= 0) {
    alert('Bitte zuerst Dachabmessungen eingeben.');
    return;
  }

  const dachBMM = dachBreiteM * 1000;
  const dachHMM = dachLaengeM * 1000;
  const randMM  = randM * 1000;

  const neigung       = parseInt(document.getElementById('neigung').value);
  const region        = document.getElementById('region').value;
  const baseSuedYield = interpolateNeigung(neigung);
  const oriF          = orientFactor(selAzimuth);
  const regionFak     = REGION_FACTOR[region] || 1.0;
  const strompreisEur = parseFloat(document.getElementById('strompreis').value) || 0.32;
  const einspeisungEur= parseFloat(document.getElementById('einspeisung-preis').value) || 0.082;
  const basisEvRate   = (parseFloat(document.getElementById('eigenverbrauch-rate').value) || 30) / 100;

  const results = [];
  for (const mod of MODULE_PRESETS) {
    for (const [orientLabel, orientKey, modB, modH] of [
      ['Hochformat', 'hoch', mod.w, mod.h],
      ['Querformat',  'quer', mod.h, mod.w],
    ]) {
      const layout = berechneLayoutFuerForm(dachBMM, dachHMM, randMM, modB, modH, abstandMM);
      if (layout.anzahl === 0) continue;
      const kwp    = (layout.anzahl * mod.watt) / 1000;
      const ertrag = kwp * baseSuedYield * oriF * regionFak * 0.97;
      const wert   = Math.round(ertrag * basisEvRate * strompreisEur + ertrag * (1 - basisEvRate) * einspeisungEur);
      results.push({ name: mod.name, orientLabel, orientKey, modBeff: modB, modHeff: modH,
                     w: mod.w, h: mod.h, watt: mod.watt, anzahl: layout.anzahl, kwp, ertrag: Math.round(ertrag), wert });
    }
  }

  // Sortierung: primär nach kWp, sekundär nach Anzahl
  results.sort((a, b) => b.kwp - a.kwp || b.anzahl - a.anzahl);

  const container = document.getElementById('format-results');
  container.style.display = 'block';
  container.innerHTML = `
    <h4 style="color:#1e3c72; margin-bottom:10px; font-size:1rem;">
      📊 Alle ${results.length} Kombinationen für dieses Dach (sortiert nach kWp)
    </h4>
    <div style="overflow-x:auto;">
      <table class="optim-table">
        <thead>
          <tr><th>#</th><th>Modulformat</th><th>Lage</th><th>Module</th><th>kWp</th><th>kWh/Jahr</th><th>€/Jahr</th><th></th></tr>
        </thead>
        <tbody>
          ${results.map((r, i) => `
            <tr class="${i === 0 ? 'optim-best' : ''}">
              <td style="text-align:center;">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
              <td>
                <strong>${r.name}</strong><br>
                <span style="font-size:11px;color:#888;">${r.w}×${r.h} mm · ${r.watt} W</span>
              </td>
              <td style="white-space:nowrap;">${r.orientLabel}</td>
              <td style="font-weight:700;">${r.anzahl}</td>
              <td style="font-weight:700;">${r.kwp.toFixed(2)}</td>
              <td>${r.ertrag.toLocaleString('de-DE')}</td>
              <td>${r.wert.toLocaleString('de-DE')}</td>
              <td><button class="optim-waehlen" onclick="waehleFormat(${r.w},${r.h},${r.watt},'${r.orientKey}',${r.modBeff},${r.modHeff})">Wählen</button></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p style="font-size:12px;color:#666;margin-top:8px;">
      💡 „Wählen" übernimmt Format + Ausrichtung für die Berechnung.
    </p>`;
}

function waehleFormat(origW, origH, watt, orientKey, modBeff, modHeff) {
  selModBreite = modBeff;
  selModHoehe  = modHeff;
  selModWatt   = watt;

  // Preset-Button aktivieren falls passend (nach Originaldimensionen)
  document.querySelectorAll('.module-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.w) === origW && parseInt(b.dataset.h) === origH);
  });
  // Eigene Felder leeren
  document.getElementById('mod-breite').value = '';
  document.getElementById('mod-hoehe').value  = '';
  document.getElementById('mod-watt').value   = '';

  // Orientierung setzen
  selOrient = orientKey;
  document.querySelectorAll('.orient-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.orient === orientKey);
  });

  document.getElementById('format-results').style.display = 'none';
  document.querySelector('.module-btn.active, #mod-breite')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ---- Hauptberechnung ----
function berechne() {
  const dachBreiteM = parseFloat(document.getElementById('dach-breite').value);
  const dachLaengeM = parseFloat(document.getElementById('dach-hoehe').value);
  const dachFormSelect = document.getElementById('dach-form');
  const dachFormVal = dachFormSelect ? dachFormSelect.value : 'rechteck';
  const randM       = parseFloat(document.getElementById('rand-abstand').value) || 0.2;
  const neigung     = parseInt(document.getElementById('neigung').value);
  const region      = document.getElementById('region').value;
  const abstandMM   = parseFloat(document.getElementById('mod-abstand').value) || 20;

  // Setze dachTyp aus dach-form
  dachTyp = dachFormVal;

  // Lese dachBreiteOben falls vorhanden
  const dachBreiteObenInput = document.getElementById('dach-breite-oben');
  if (dachBreiteObenInput && dachBreiteObenInput.value) {
    dachBreiteOben = parseFloat(dachBreiteObenInput.value);
  }

  if (!dachBreiteM || !dachLaengeM || dachBreiteM <= 0 || dachLaengeM <= 0) {
    alert('Bitte Dachbreite und Dachhöhe eingeben!');
    return;
  }

  const dachBMM = dachBreiteM * 1000;
  const dachHMM = dachLaengeM * 1000;
  const randMM  = randM * 1000;

  if (dachBMM - 2*randMM <= 0 || dachHMM - 2*randMM <= 0) {
    alert('Randabstand ist größer als die Dachfläche!');
    return;
  }

  const layoutHoch = berechneLayoutFuerForm(dachBMM, dachHMM, randMM, selModBreite, selModHoehe, abstandMM);
  const layoutQuer = berechneLayoutFuerForm(dachBMM, dachHMM, randMM, selModHoehe, selModBreite, abstandMM);

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

  const blocked     = zähleBlockierteModule(layout, abstandMM);
  const finalAnzahl = Math.max(0, layout.anzahl - blocked);
  const kwp         = (finalAnzahl * selModWatt) / 1000;

  // Berechne effektive Dachfläche basierend auf Dachform (ohne Randabzug)
  const effektiveFläche = berechneEffektiveFläche(dachTyp, dachBreiteM, dachLaengeM);

  // Randabzug: vereinfacht als prozentuale Reduktion (Rand von allen Seiten)
  const randabzugFaktor = (1 - 2 * randM / Math.max(dachBreiteM, dachLaengeM));
  const nutzbareFlächeM2 = effektiveFläche * randabzugFaktor * randabzugFaktor;

  const baseSuedYield = interpolateNeigung(neigung);
  const oriF          = orientFactor(selAzimuth);
  const regionFak     = REGION_FACTOR[region] || 1.0;
  const ertragKwh     = kwp * baseSuedYield * oriF * regionFak * 0.97;

  // Wirtschaftlichkeits-Eingaben
  const strompreisEur    = parseFloat(document.getElementById('strompreis').value)         || 0.32;
  const einspeisungEur   = parseFloat(document.getElementById('einspeisung-preis').value)  || 0.082;
  const basisEvRate      = (parseFloat(document.getElementById('eigenverbrauch-rate').value) || 30) / 100;
  const batterieAktiv    = document.getElementById('batterie-aktiv').checked;
  const batterieKwh      = parseFloat(document.getElementById('batterie-kwh').value) || 10;

  // Eigenverbrauchsrate (mit Batterie erhöht)
  const evRate = batterieAktiv
    ? eigenverbrauchsmitBatterie(basisEvRate, ertragKwh, batterieKwh)
    : basisEvRate;

  const eigenverbrauch = ertragKwh * evRate        * strompreisEur;
  const einspeisung    = ertragKwh * (1 - evRate)  * einspeisungEur;
  const gesamtWert     = eigenverbrauch + einspeisung;
  const co2Kg          = (ertragKwh * 434) / 1000;

  const pvKosten       = getPVKosten(kwp);
  const batterieKosten = batterieAktiv ? getBatterieKosten() : 0;
  const gesamtInvest   = pvKosten + batterieKosten;
  const amort          = (gesamtInvest > 0 && gesamtWert > 0) ? (gesamtInvest / gesamtWert).toFixed(1) : '–';

  document.getElementById('res-anzahl').textContent = finalAnzahl;
  document.getElementById('res-kwp').textContent    = kwp.toFixed(2);
  document.getElementById('res-ertrag').textContent = Math.round(ertragKwh).toLocaleString('de-DE');
  document.getElementById('res-wert').textContent   = Math.round(gesamtWert).toLocaleString('de-DE');

  const maxSpalten = layout.rows.length > 0 ? Math.max(...layout.rows.map(r => r.spalten)) : 0;
  const minSpalten = layout.rows.filter(r => r.spalten > 0).reduce((m, r) => Math.min(m, r.spalten), maxSpalten);
  const spaltenInfo = layout.isShapeAware && maxSpalten !== minSpalten
    ? `${minSpalten}–${maxSpalten} (je nach Reihe)`
    : `${maxSpalten}`;

  const details = [
    ['Dachform', `${dachTyp}`],
    ['Dachbreite', `${dachBreiteM.toFixed(2)} m`],
    ['Dachlänge', `${dachLaengeM.toFixed(2)} m`],
    ['Nutzbare Fläche', `${nutzbareFlächeM2.toFixed(1)} m²`],
    ['Modulformat', `${layout.modB} × ${layout.modH} mm (${selModWatt} W)`],
    ['Ausrichtung', layout.orientierung],
    ['Reihen', `${layout.reihen}`],
    ['Spalten', spaltenInfo],
    ['Blockiert durch Hindernisse', `${blocked} Module`],
    ['Module gesamt', `${finalAnzahl} Stück`],
    ['Installierte Leistung', `${kwp.toFixed(2)} kWp`],
    ['Himmelsrichtung', `${selAzimuth}° (${azimuthLabel(selAzimuth)})`],
    ['Orientierungsfaktor', `${(oriF * 100).toFixed(0)} % von Süd-Optimal`],
    ['Dachneigung', `${neigung}°`],
    ['Basisertrag Süd', `${baseSuedYield} kWh/kWp`],
    ['Regionfaktor', `× ${regionFak.toFixed(2)}`],
    ['Jahresertrag', `${Math.round(ertragKwh).toLocaleString('de-DE')} kWh`],
    ['Eigenverbrauchsquote', `${Math.round(evRate * 100)} %${batterieAktiv ? ` (mit ${batterieKwh} kWh Batterie)` : ''}`],
    ['Strompreis', `${strompreisEur.toFixed(3)} €/kWh`],
    ['Einspeisevergütung', `${einspeisungEur.toFixed(3)} €/kWh`],
    ['Eigenverbrauchswert', `${Math.round(eigenverbrauch).toLocaleString('de-DE')} €/Jahr`],
    ['Einspeisung', `${Math.round(einspeisung).toLocaleString('de-DE')} €/Jahr`],
    ['Gesamtwert', `${Math.round(gesamtWert).toLocaleString('de-DE')} €/Jahr`],
    ['CO₂-Einsparung', `${Math.round(co2Kg).toLocaleString('de-DE')} kg/Jahr`],
    ...(pvKosten > 0 ? [['PV-Systemkosten', `${Math.round(pvKosten).toLocaleString('de-DE')} €`]] : []),
    ...(batterieAktiv ? [['Batteriekosten', `${Math.round(batterieKosten).toLocaleString('de-DE')} €`]] : []),
    ...(gesamtInvest > 0 ? [['Gesamtinvestition', `${Math.round(gesamtInvest).toLocaleString('de-DE')} €`]] : []),
    ['Amortisationszeit', `${amort} Jahre`],
  ];

  document.getElementById('res-details').innerHTML = details
    .map(([k,v]) => `<tr><td style="color:#1e3c72;font-weight:600;">${k}</td><td style="color:#1e3c72;">${v}</td></tr>`)
    .join('');

  document.getElementById('results').style.display = 'block';
  document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  zeichneLayout(layout, dachBreiteM, dachLaengeM, abstandMM, finalAnzahl);
  updateNavigationLinksPVRechner();
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

// ---- Ergebnis-Canvas ----
function zeichneLayout(layout, dachBreiteM, dachLaengeM, gapMM, finalAnzahl) {
  const canvas = document.getElementById('pv-canvas');
  const ctx    = canvas.getContext('2d');
  const MAX_W  = Math.min(600, (window.innerWidth || 800) - 60);
  const scale  = MAX_W / (dachBreiteM * 1000);
  canvas.width  = Math.round(dachBreiteM * 1000 * scale);
  canvas.height = Math.round(dachLaengeM * 1000 * scale);
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Dachfläche
  buildRoofPath(ctx, W, H);
  ctx.fillStyle = '#c8a87a';
  ctx.fill();

  // Randabstand
  const randM  = parseFloat(document.getElementById('rand-abstand').value) || 0.2;
  const rx = randM * 1000 * scale;
  const ry = randM * 1000 * scale;
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(0, 0, W, ry);
  ctx.fillRect(0, H - ry, W, ry);
  ctx.fillRect(0, ry, rx, H - 2*ry);
  ctx.fillRect(W - rx, ry, rx, H - 2*ry);

  // Module pro Reihe zeichnen (keine Clip-Magie nötig: alle Panels liegen bereits vollständig innerhalb)
  const { modB, modH, rows } = layout;
  for (const row of rows) {
    for (let s = 0; s < row.spalten; s++) {
      const worldX = row.xStartMM + s * (modB + gapMM);
      const worldY = row.yTopGlobal;

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

  // Hindernisse
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

  // Dach-Umriss oben drüber
  buildRoofPath(ctx, W, H);
  ctx.strokeStyle = '#7a5c10';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Info-Bar
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, H - 28, W, 28);
  ctx.fillStyle = 'white'; ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(
    `${finalAnzahl} Module · ${((finalAnzahl*selModWatt)/1000).toFixed(2)} kWp · ${selAzimuth}° ${azimuthLabel(selAzimuth)}`,
    W/2, H - 14
  );
}

// ---- Navigation zu anderen Rechnern ----
function updateNavigationLinksPVRechner() {
  const dachBreiteM = parseFloat(document.getElementById('dach-breite').value);
  const dachLaengeM = parseFloat(document.getElementById('dach-hoehe').value);

  if (!dachBreiteM || !dachLaengeM) return;

  // Lese Dachform-Parameter aus URL oder globalen Variablen
  const params = new URLSearchParams({
    breite: dachBreiteM,
    hoehe: dachLaengeM,
    typ: dachTyp
  });

  // Alle Dachform-spezifischen Parameter mitschicken
  if (dachBreiteOben && dachBreiteOben > 0) params.append('breiteOben', dachBreiteOben);
  if (rechteckHoehe && rechteckHoehe > 0) params.append('rechteckHoehe', rechteckHoehe);
  if (dreieckHoehe && dreieckHoehe > 0) params.append('dreieckHoehe', dreieckHoehe);
  if (spitzePosX !== null && !isNaN(spitzePosX)) params.append('spitzenPosition', spitzePosX);

  // Lese aktuelle Dreieck-Typ aus UI falls vorhanden
  const dreieckTypInput = document.querySelector('input[name="dreieck-typ"]:checked');
  if (dreieckTypInput) {
    params.append('dreieckTyp', dreieckTypInput.value);
  }

  // Konstruiere URLs
  // Anrissplan: Neue einfache Parameter-Format
  const anrissplanUrl = `/tools/anrissplan.html?${params.toString()}`;
  const lattenrechnerUrl = `/tools/lattenrechner/?${params.toString()}`;

  // Zeige und setze Links
  const anrissLink = document.getElementById('to-anrissplan');
  const lattenLink = document.getElementById('to-lattenrechner');

  if (anrissLink) {
    anrissLink.href = anrissplanUrl;
    anrissLink.style.display = 'inline-flex';
    anrissLink.style.alignItems = 'center';
    anrissLink.style.gap = '8px';
  }

  if (lattenLink) {
    lattenLink.href = lattenrechnerUrl;
    lattenLink.style.display = 'inline-flex';
    lattenLink.style.alignItems = 'center';
    lattenLink.style.gap = '8px';
  }
}

// ---- Cross-Navigation ----
function zuLattenrechner() {
  const b = parseFloat(document.getElementById('dach-breite').value);
  const h = parseFloat(document.getElementById('dach-hoehe').value);
  if (!b || !h) { alert('Bitte zuerst Dachmaße eingeben.'); return; }

  // Read current values from UI
  const currentDreieckTyp = document.querySelector('input[name="dreieck-typ"]:checked')?.value || dachDreieckTyp;
  const spitzePosInput = document.getElementById('spitze-pos');
  const currentSpitzePosX = spitzePosInput && spitzePosInput.value ? parseFloat(spitzePosInput.value) : spitzePosX;

  const params = new URLSearchParams({
    breite: b,
    hoehe: h,
    typ: dachTyp
  });

  // Alle Dachform-spezifischen Parameter mitschicken
  if (dachBreiteOben > 0) params.append('breiteOben', dachBreiteOben);
  if (trapezHoehe > 0) params.append('trapezHoehe', trapezHoehe);
  if (rechteckHoehe > 0) params.append('rechteckHoehe', rechteckHoehe);
  if (dreieckHoehe > 0) params.append('dreieckHoehe', dreieckHoehe);
  if (currentDreieckTyp) params.append('dreieckTyp', currentDreieckTyp);
  if (currentSpitzePosX !== null && !isNaN(currentSpitzePosX)) params.append('spitzenPosition', currentSpitzePosX);

  window.location.href = `/tools/lattenrechner/?${params.toString()}`;
}

function zuVerschnitt() {
  window.location.href = '/tools/verschnitt-optimierung/';
}

// ---- PDF-Export ----
async function exportPDF() {
  const { jsPDF } = window.jspdf;
  const html2canvas = window.html2canvas;

  if (!jsPDF || !html2canvas) {
    alert('PDF-Bibliotheken nicht verfügbar. Bitte laden Sie die Seite neu.');
    return;
  }

  try {
    // 1. Hole alle Daten
    const canvas = document.getElementById('pv-canvas');
    const detailsTable = document.getElementById('res-details');
    const modulCount = document.getElementById('res-anzahl').textContent;
    const kwp = document.getElementById('res-kwp').textContent;
    const ertrag = document.getElementById('res-ertrag').textContent;
    const wert = document.getElementById('res-wert').textContent;

    // 2. Erstelle PDF (A4, Hochformat)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 8;

    // 3. Header mit Branding
    pdf.setFontSize(16);
    pdf.setTextColor(30, 60, 114);
    pdf.text('PV-Anlagen Berechnung', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;

    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    const today = new Date().toLocaleDateString('de-DE');
    pdf.text(`www.dachplattenrechner.de | ${today}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;

    // 4. Dünne Trennlinie
    pdf.setDrawColor(180, 180, 180);
    pdf.line(10, yPos, pageWidth - 10, yPos);
    yPos += 3;

    // 5. Obere Hälfte: Zwei-spaltige Tabelle mit wichtigen Daten
    pdf.setFontSize(7.5);
    pdf.setTextColor(50, 50, 50);

    // Sammle wichtige Daten
    const tableData = [];
    if (detailsTable) {
      const rows = detailsTable.querySelectorAll('tr');
      // Nur erste 12 Zeilen für PDF (wichtigste Infos)
      for (let i = 0; i < Math.min(12, rows.length); i++) {
        const cells = rows[i].querySelectorAll('td');
        if (cells.length >= 2) {
          const label = cells[0].textContent.trim();
          const value = cells[1].textContent.trim();
          tableData.push([label, value]);
        }
      }
    }

    // Zwei-spaltige Tabelle
    const colWidth = (pageWidth - 20) / 2 - 2;
    const lineHeight = 3.2;
    const col1X = 10;
    const col2X = pageWidth / 2 + 1;
    const maxRows = Math.ceil(tableData.length / 2);
    const tableStartY = yPos;

    for (let i = 0; i < maxRows; i++) {
      if (yPos > pageHeight - 75) break; // Platz für Canvas

      // Linke Spalte
      if (i < tableData.length) {
        const [label, value] = tableData[i];
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(30, 60, 114);
        pdf.text(label + ':', col1X, yPos, { maxWidth: colWidth });

        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(50, 50, 50);
        pdf.text(value, col1X + 3, yPos + 2.2, { maxWidth: colWidth - 3 });
      }

      // Rechte Spalte
      if (i + maxRows < tableData.length) {
        const [label, value] = tableData[i + maxRows];
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(30, 60, 114);
        pdf.text(label + ':', col2X, yPos, { maxWidth: colWidth });

        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(50, 50, 50);
        pdf.text(value, col2X + 3, yPos + 2.2, { maxWidth: colWidth - 3 });
      }

      yPos += lineHeight;
    }

    yPos += 2;

    // 6. Modulskizze (Canvas als Bild)
    if (canvas && yPos < pageHeight - 40) {
      try {
        const canvasImage = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height / canvas.width) * imgWidth * 0.5; // Hälfte der Größe

        // Höhe limitieren
        const maxImgHeight = pageHeight - yPos - 15;
        const finalHeight = Math.min(imgHeight, maxImgHeight);
        const finalWidth = imgWidth;

        if (finalHeight > 10) {
          pdf.addImage(canvasImage, 'PNG', 10, yPos, finalWidth, finalHeight);
          yPos += finalHeight + 2;
        }
      } catch (e) {
        console.error('Canvas-Fehler:', e);
      }
    }

    // 7. Footer mit Branding
    pdf.setFontSize(7);
    pdf.setTextColor(150, 150, 150);
    pdf.line(10, pageHeight - 8, pageWidth - 10, pageHeight - 8);
    pdf.text('Erstellt mit dachplattenrechner.de - Kostenlose PV-Anlagen Planung', pageWidth / 2, pageHeight - 4, { align: 'center' });

    // 8. Download
    pdf.save('PV-Berechnung.pdf');
  } catch (error) {
    console.error('PDF-Export-Fehler:', error);
    alert('Fehler beim PDF-Export: ' + error.message);
  }
}
