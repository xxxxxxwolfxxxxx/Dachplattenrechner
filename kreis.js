// kreis.js – behandelt Kreis, Halbkreis, Viertelkreis

export function init(projectData) {
  const container = document.getElementById('geometry-inputs-grid');
  container.innerHTML = '';
  const variant = projectData.variant || 'vollkreis';

  switch (variant) {
    case 'halbkreis':
      createCircularInput(container, projectData, 'Halbkreis');
      break;
    case 'viertelkreis':
      createCircularInput(container, projectData, 'Viertelkreis');
      break;
    default:
      createCircularInput(container, projectData, 'Kreis');
  }
}

function createCircularInput(container, data, labelPrefix) {
  container.appendChild(createInput(`${labelPrefix}-Radius`, 'radius', data.radius));
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
  input.onchange = () => validateCircle();
  label.appendChild(input);
  return label;
}

function validateCircle() {
  const r = parseFloat(document.getElementById('radius')?.value);
  if (r > 0) {
    console.log('Gültiger Radius:', r);
  } else {
    console.warn('Ungültiger Radius');
  }
}

export function draw(ctx, data) {
  const r = data.radius || 50;
  const x = 150;
  const y = 150;
  const variant = data.variant || 'vollkreis';

  ctx.beginPath();
  switch (variant) {
    case 'halbkreis':
      ctx.arc(x, y, r, 0, Math.PI);
      break;
    case 'viertelkreis':
      ctx.arc(x, y, r, 0, Math.PI / 2);
      break;
    default:
      ctx.arc(x, y, r, 0, 2 * Math.PI);
  }
  ctx.stroke();
}
