// langloch.js

export function init(projectData) {
  const container = document.getElementById('geometry-inputs-grid');
  container.innerHTML = '';
  createLanglochInputs(container, projectData);
}

function createLanglochInputs(container, data) {
  container.appendChild(createInput('Länge', 'length', data.length));
  container.appendChild(createInput('Breite', 'width', data.width));
  container.appendChild(createInput('Eckenradius', 'radius', data.radius));
}

function createInput(labelText, id, value = '') {
  const label = document.createElement('label');
  label.textContent = labelText;
  const input = document.createElement('input');
  input.type = 'number';
  input.id = id;
  input.value = value;
  input.step = '0.1';
  input.min = '0';
  input.onchange = () => validateLangloch();
  label.appendChild(input);
  return label;
}

function validateLangloch() {
  const l = parseFloat(document.getElementById('length')?.value);
  const w = parseFloat(document.getElementById('width')?.value);
  const r = parseFloat(document.getElementById('radius')?.value);
  if (l > 0 && w > 0 && r >= 0 && r <= Math.min(l, w) / 2) {
    console.log('Gültiges Langloch:', { l, w, r });
  } else {
    console.warn('Ungültiges Langloch');
  }
}

export function draw(ctx, data) {
  const l = data.length || 100;
  const w = data.width || 40;
  const r = data.radius || 10;
  const x = 100, y = 100;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + l - r, y);
  ctx.arcTo(x + l, y, x + l, y + r, r);
  ctx.lineTo(x + l, y + w - r);
  ctx.arcTo(x + l, y + w, x + l - r, y + w, r);
  ctx.lineTo(x + r, y + w);
  ctx.arcTo(x, y + w, x, y + w - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.stroke();
}
