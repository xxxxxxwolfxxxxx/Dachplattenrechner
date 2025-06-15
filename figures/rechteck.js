// rechteck.js

export function init(projectData) {
  const container = document.getElementById('geometry-inputs-grid');
  container.innerHTML = '';
  createRectangleInputs(container, projectData);
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
  input.onchange = () => validateRectangle();
  label.appendChild(input);
  return label;
}

function createRectangleInputs(container, data) {
  container.appendChild(createInput('Länge', 'length', data.length));
  container.appendChild(createInput('Breite', 'width', data.width));
}

function validateRectangle() {
  const l = parseFloat(document.getElementById('length')?.value);
  const w = parseFloat(document.getElementById('width')?.value);
  if (l > 0 && w > 0) {
    console.log('Gültiges Rechteck:', l, 'x', w);
  } else {
    console.warn('Ungültiges Rechteck');
  }
}

export function draw(ctx, data) {
  const l = data.length || 100;
  const w = data.width || 50;
  ctx.beginPath();
  ctx.rect(100, 100, l, w);
  ctx.stroke();
}
