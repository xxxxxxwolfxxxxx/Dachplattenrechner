// dreieck.js

export function init(projectData) {
  const container = document.getElementById('geometry-inputs-grid');
  container.innerHTML = '';

  const variant = projectData.variant || 'allgemein';
  
  switch (variant) {
    case 'gleichseitig':
      createEquilateralInputs(container, projectData);
      break;
    case 'rechtwinklig':
      createRightAngledInputs(container, projectData);
      break;
    default:
      createGeneralInputs(container, projectData);
  }
}

function createInput(labelText, id, value = '') {
  const label = document.createElement('label');
  label.textContent = labelText;
  const input = document.createElement('input');
  input.type = 'number';
  input.id = id;
  input.value = value;
  input.onchange = () => validateTriangle();
  label.appendChild(input);
  return label;
}

function createGeneralInputs(container, data) {
  container.appendChild(createInput('Seite A', 'sideA', data.sideA));
  container.appendChild(createInput('Seite B', 'sideB', data.sideB));
  container.appendChild(createInput('Seite C', 'sideC', data.sideC));
}

function createEquilateralInputs(container, data) {
  container.appendChild(createInput('Seitenlänge', 'side', data.side));
}

function createRightAngledInputs(container, data) {
  container.appendChild(createInput('Kathete A', 'katheteA', data.katheteA));
  container.appendChild(createInput('Kathete B', 'katheteB', data.katheteB));
}

function validateTriangle() {
  // Beispielhafte einfache Validierung für allgemeines Dreieck
  const a = parseFloat(document.getElementById('sideA')?.value);
  const b = parseFloat(document.getElementById('sideB')?.value);
  const c = parseFloat(document.getElementById('sideC')?.value);
  if (a && b && c && (a + b > c) && (a + c > b) && (b + c > a)) {
    console.log('Gültiges Dreieck');
  } else {
    console.warn('Ungültiges Dreieck');
  }
}

export function drawTriangle(ctx, data) {
  // Zeichnet ein Beispiel-Dreieck basierend auf festen Werten
  ctx.beginPath();
  ctx.moveTo(100, 100);
  ctx.lineTo(200, 100);
  ctx.lineTo(150, 200);
  ctx.closePath();
  ctx.stroke();
}
