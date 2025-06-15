// trapez.js

export function init(projectData) {
  const container = document.getElementById('geometry-inputs-grid');
  container.innerHTML = '';
  createTrapezInputs(container, projectData);
}

function createTrapezInputs(container, data) {
  container.appendChild(createInput('Basis a (unten)', 'baseA', data.baseA));
  container.appendChild(createInput('Basis b (oben)', 'baseB', data.baseB));
  container.appendChild(createInput('Höhe', 'height', data.height));
  container.appendChild(createInput('Seite links', 'sideL', data.sideL));
  container.appendChild(createInput('Seite rechts', 'sideR', data.sideR));
}

function createInput(labelText, id, value = '') {
  const label = document.createElement('label');
  label.textContent = labelText;
  const input = document.createElement('input');
  input.type = 'number';
  input.id = id;
  input.value = value;
  input.step = '0.1';
  input.min = '0.1';
  input.onchange = () => validateTrapez();
  label.appendChild(input);
  return label;
}

function validateTrapez() {
  const a = parseFloat(document.getElementById('baseA')?.value);
  const b = parseFloat(document.getElementById('baseB')?.value);
  const h = parseFloat(document.getElementById('height')?.value);
  if (a > 0 && b > 0 && h > 0) {
    console.log('Gültiges Trapez:', { a, b, h });
  } else {
    console.warn('Ungültiges Trapez');
  }
}

export function draw(ctx, data) {
  const a = data.baseA || 100;
  const b = data.baseB || 60;
  const h = data.height || 50;
  const dx = (a - b) / 2;

  ctx.beginPath();
  ctx.moveTo(100, 100);
  ctx.lineTo(100 + a, 100);
  ctx.lineTo(100 + a - dx, 100 + h);
  ctx.lineTo(100 + dx, 100 + h);
  ctx.closePath();
  ctx.stroke();
}
