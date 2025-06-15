// vieleck.js – behandelt Fünfeck, Sechseck, Achteck usw.

export function init(projectData) {
  const container = document.getElementById('geometry-inputs-grid');
  container.innerHTML = '';
  createPolygonInputs(container, projectData);
}

function createPolygonInputs(container, data) {
  container.appendChild(createInput('Anzahl Seiten', 'sides', data.sides || getDefaultSides(data.variant)));
  container.appendChild(createInput('Seitenlänge', 'sideLength', data.sideLength));
}

function createInput(labelText, id, value = '') {
  const label = document.createElement('label');
  label.textContent = labelText;
  const input = document.createElement('input');
  input.type = 'number';
  input.id = id;
  input.value = value;
  input.step = '1';
  input.min = '1';
  input.onchange = () => validatePolygon();
  label.appendChild(input);
  return label;
}

function getDefaultSides(variant) {
  switch (variant) {
    case 'fuenfeck': return 5;
    case 'sechseck': return 6;
    case 'achteck': return 8;
    default: return 6;
  }
}

function validatePolygon() {
  const n = parseInt(document.getElementById('sides')?.value);
  const l = parseFloat(document.getElementById('sideLength')?.value);
  if (n >= 3 && l > 0) {
    console.log(`Gültiges Vieleck mit ${n} Seiten, Seitenlänge: ${l}`);
  } else {
    console.warn('Ungültiges Vieleck');
  }
}

export function draw(ctx, data) {
  const n = data.sides || getDefaultSides(data.variant);
  const l = data.sideLength || 40;
  const cx = 150;
  const cy = 150;
  const radius = l / (2 * Math.sin(Math.PI / n));

  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const angle = (2 * Math.PI / n) * i - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}
