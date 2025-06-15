// rhombus.js

export function init(projectData) {
  const container = document.getElementById('geometry-inputs-grid');
  container.innerHTML = '';
  createRhombusInputs(container, projectData);
}

function createRhombusInputs(container, data) {
  container.appendChild(createInput('Seitenlänge', 'side', data.side));
  container.appendChild(createInput('Winkel (°)', 'angle', data.angle));
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
  input.onchange = () => validateRhombus();
  label.appendChild(input);
  return label;
}

function validateRhombus() {
  const s = parseFloat(document.getElementById('side')?.value);
  const a = parseFloat(document.getElementById('angle')?.value);
  if (s > 0 && a > 0 && a < 180) {
    console.log('Gültiger Rhombus:', { s, a });
  } else {
    console.warn('Ungültiger Rhombus');
  }
}

export function draw(ctx, data) {
  const s = data.side || 60;
  const a = (data.angle || 60) * Math.PI / 180;

  ctx.beginPath();
  ctx.moveTo(100, 100);
  ctx.lineTo(100 + s, 100);
  ctx.lineTo(100 + s - s * Math.cos(a), 100 + s * Math.sin(a));
  ctx.lineTo(100 - s * Math.cos(a), 100 + s * Math.sin(a));
  ctx.closePath();
  ctx.stroke();
}
