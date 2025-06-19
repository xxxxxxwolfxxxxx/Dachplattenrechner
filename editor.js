// Vereinfachter Editor.js - OHNE komplexe Rotation, MIT einfacher Orientierung

let projectData = {};
let currentShape = '';
let currentVariant = '';
let svg;
let isUpdating = false;

// Vereinfachte Orientierung
let currentOrientation = 0; // 0, 90, 180, 270 Grad

const CANVAS_CENTER_X = 300;
const CANVAS_CENTER_Y = 200;
const SCALE_FACTOR = 60;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        try {
            loadProjectData();
            initializeCanvas();
            initializeUI();
            loadAndDrawShape();
            setupEventListeners();
            console.log('Editor erfolgreich initialisiert');
        } catch (error) {
            console.error('Editor-Fehler:', error);
        }
    }, 100);
});

function loadProjectData() {
    const dataString = localStorage.getItem('dachplattenrechner_data') || 
                       sessionStorage.getItem('dachplattenrechner_data');
    
    if (!dataString) {
        projectData = {
            profile: { profilname: 'Standard Profil', deckbreite: 1000, lieferbreite: 1050, seitenueberlappung: 50 },
            roofShape: { baseShape: 'viereck', variant: 'rechteck' }
        };
        return;
    }

    try {
        projectData = JSON.parse(dataString);
        if (!projectData.profile) {
            projectData.profile = { profilname: 'Standard Profil', deckbreite: 1000, lieferbreite: 1050, seitenueberlappung: 50 };
        }
        if (!projectData.roofShape) {
            projectData.roofShape = { baseShape: 'viereck', variant: 'rechteck' };
        }
    } catch (e) {
        projectData = {
            profile: { profilname: 'Standard Profil', deckbreite: 1000, lieferbreite: 1050, seitenueberlappung: 50 },
            roofShape: { baseShape: 'viereck', variant: 'rechteck' }
        };
    }

    console.log('Geladene roofShape-Daten:', projectData.roofShape);
}

function initializeCanvas() {
    svg = document.getElementById('main-svg');
    
    if (!svg) {
        createFallbackCanvas();
    }
}

function createFallbackCanvas() {
    const container = document.querySelector('.canvas-container') || document.querySelector('main');
    if (!container) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-wrapper';
    wrapper.style.cssText = `
        border: 2px solid #e9ecef; border-radius: 8px; background: white;
        width: 600px; height: 400px; margin: 20px auto; position: relative; user-select: none;
    `;
    
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'main-svg';
    svg.setAttribute('width', '600');
    svg.setAttribute('height', '400');
    svg.setAttribute('viewBox', '0 0 600 400');
    
    svg.innerHTML = `
        <defs>
            <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#e0e0e0" stroke-width="1"/>
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <line x1="300" y1="0" x2="300" y2="400" stroke="#c0c0c0" stroke-width="2"/>
        <line x1="0" y1="200" x2="600" y2="200" stroke="#c0c0c0" stroke-width="2"/>
        <g id="roof-shape"></g>
        <g id="corner-handles"></g>
        <g id="labels"></g>
    `;
    
    wrapper.appendChild(svg);
    container.appendChild(wrapper);
}

function initializeUI() {
    displayProfileInfo();
    updateShapeTitle();
    createOrientationControls();
}

function createOrientationControls() {
    // Orientierungs-Controls zur Tools-Grid hinzufügen
    const toolsGrid = document.querySelector('.tools-grid');
    if (!toolsGrid) return;
    
    // Neue Zeile für Orientierung erstellen
    const orientationRow = document.createElement('div');
    orientationRow.className = 'tools-row';
    orientationRow.style.marginTop = '15px';
    orientationRow.style.paddingTop = '15px';
    orientationRow.style.borderTop = '1px solid #e9ecef';
    
    orientationRow.innerHTML = `
        <h4 style="grid-column: 1 / -1; margin: 0 0 10px 0; color: #495057;">Orientierung:</h4>
        <button class="btn-tool active" id="btn-orient-0" onclick="setOrientation(0)">
            ↑ Oben
        </button>
        <button class="btn-tool" id="btn-orient-90" onclick="setOrientation(90)">
            → Rechts
        </button>
        <button class="btn-tool" id="btn-orient-180" onclick="setOrientation(180)">
            ↓ Unten
        </button>
        <button class="btn-tool" id="btn-orient-270" onclick="setOrientation(270)">
            ← Links
        </button>
    `;
    
    toolsGrid.appendChild(orientationRow);
}

function setOrientation(angle) {
    currentOrientation = angle;
    
    // Button-Status aktualisieren
    document.querySelectorAll('[id^="btn-orient-"]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`btn-orient-${angle}`).classList.add('active');
    
    updateShape();
    showFeedback(`Form auf ${angle}° gedreht`);
}

function displayProfileInfo() {
    const profile = projectData.profile;
    if (!profile) return;
    
    const elements = {
        'current-profile-name': profile.profilname || 'Standard',
        'current-deckbreite': (profile.deckbreite || 1000) + ' mm',
        'current-lieferbreite': (profile.lieferbreite || 1050) + ' mm',
        'current-seitenueberlappung': (profile.seitenueberlappung || 50) + ' mm'
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) { element.textContent = value; }
    });
}

function updateShapeTitle() {
    const roofShape = projectData.roofShape;
    if (!roofShape) return;
    
    const shapeNames = {
        'kreis': 'Kreis', 'oval': 'Oval', 'halbkreis': 'Halbkreis', 'viertelkreis': 'Viertelkreis', 'langloch': 'Langloch',
        'dreieck': 'Dreieck', 'gleichseitig': 'Gleichseitiges Dreieck', 'rechtwinklig': 'Rechtwinkliges Dreieck', 'ungleichschenklig': 'Ungleichschenkliges Dreieck',
        'viereck': 'Viereck', 'rechteck': 'Rechteck', 'quadrat': 'Quadrat', 'parallelogramm': 'Parallelogramm', 'trapez': 'Trapez', 'rhombus': 'Rhombus',
        'vieleck': 'Vieleck', 'fuenfeck': 'Fünfeck', 'sechseck': 'Sechseck', 'achteck': 'Achteck', 'lform': 'L-Form', 'tform': 'T-Form', 'uform': 'U-Form'
    };
    
    const shapeName = shapeNames[roofShape.variant] || shapeNames[roofShape.baseShape] || 'Unbekannt';
    const element = document.getElementById('current-shape-name');
    if (element) { element.textContent = shapeName; }
}

function loadAndDrawShape() {
    const roofShape = projectData.roofShape;
    if (!roofShape) {
        currentShape = 'viereck';
        currentVariant = 'rechteck';
    } else {
        currentShape = roofShape.baseShape || 'viereck';
        currentVariant = roofShape.variant || 'rechteck';
        if (roofShape.orientation !== undefined) currentOrientation = roofShape.orientation;
    }
    
    console.log('Lade Form:', { currentShape, currentVariant, currentOrientation });
    
    createInputFields();
    updateShape();
}

function determineActualShape() {
    if (currentVariant === 'quadrat') return 'quadrat';
    else if (currentVariant === 'trapez') return 'trapez';
    else if (currentVariant === 'parallelogramm') return 'parallelogramm';
    else if (currentVariant === 'rhombus') return 'rhombus';
    else if (currentShape === 'kreis') {
        if (['oval', 'halbkreis', 'viertelkreis', 'langloch'].includes(currentVariant)) {
            return currentVariant;
        } else {
            return 'kreis';
        }
    }
    else if (currentShape === 'dreieck') return 'dreieck';
    else if (currentShape === 'vieleck') {
        if (['fuenfeck', 'sechseck', 'achteck', 'lform', 'tform', 'uform'].includes(currentVariant)) {
            return currentVariant;
        } else {
            return 'fuenfeck';
        }
    }
    else return currentShape || 'rechteck';
}

function determineActualVariant() {
    return currentVariant || 'rechteck';
}

function createInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
    container.innerHTML = '';
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    const savedData = projectData.roofShape || {};
    
    console.log('Creating inputs for:', { finalShape, variant });
    
    // Eingabefelder basierend auf der Form erstellen
    if (finalShape === 'kreis') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '3'));
    } else if (finalShape === 'oval') {
        container.appendChild(createInput('Radius X (m)', 'radiusX', savedData.radiusX || '4'));
        container.appendChild(createInput('Radius Y (m)', 'radiusY', savedData.radiusY || '2.5'));
    } else if (finalShape === 'dreieck') {
        if (variant === 'gleichseitig') {
            container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '6'));
        } else if (variant === 'rechtwinklig') {
            container.appendChild(createInput('Kathete A (m)', 'katheteA', savedData.katheteA || '4'));
            container.appendChild(createInput('Kathete B (m)', 'katheteB', savedData.katheteB || '5'));
        } else {
            container.appendChild(createInput('Seite A (m)', 'sideA', savedData.sideA || '4'));
            container.appendChild(createInput('Seite B (m)', 'sideB', savedData.sideB || '5'));
            container.appendChild(createInput('Seite C (m)', 'sideC', savedData.sideC || '6'));
        }
    } else if (finalShape === 'quadrat') {
        container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '5'));
    } else if (finalShape === 'trapez') {
        container.appendChild(createInput('Seite A (m)', 'sideA', savedData.sideA || '8'));
        container.appendChild(createInput('Seite B (m)', 'sideB', savedData.sideB || '6'));
        container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '4'));
    } else if (finalShape === 'parallelogramm') {
        container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
        container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
        container.appendChild(createInput('Winkel (°)', 'angle', savedData.angle || '75'));
    } else if (finalShape === 'rhombus') {
        container.appendChild(createInput('Diagonale 1 (m)', 'diagonal1', savedData.diagonal1 || '6'));
        container.appendChild(createInput('Diagonale 2 (m)', 'diagonal2', savedData.diagonal2 || '4'));
    } else if (['fuenfeck', 'sechseck', 'achteck'].includes(finalShape)) {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '3'));
    } else {
        // Fallback: Rechteck
        container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
        container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
    }
}

function createInput(labelText, id, defaultValue) {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-group';
    
    const label = document.createElement('label');
    label.textContent = labelText;
    
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-group-wrapper';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.id = id;
    input.value = defaultValue || '';
    input.step = '0.1';
    input.min = '0.1';
    
    input.addEventListener('input', handleInputChange);
    input.addEventListener('change', handleInputChange);
    
    const unit = document.createElement('span');
    unit.className = 'input-unit';
    unit.textContent = id.includes('angle') ? '°' : 'm';
    
    inputWrapper.appendChild(input);
    inputWrapper.appendChild(unit);
    wrapper.appendChild(label);
    wrapper.appendChild(inputWrapper);
    
    return wrapper;
}

function handleInputChange() {
    if (isUpdating) return;
    
    clearTimeout(window.inputTimeout);
    window.inputTimeout = setTimeout(() => {
        if (isUpdating) return;
        isUpdating = true;
        
        try {
            const data = getCurrentFormData();
            const newScale = calculateDynamicScale(data);
            updateShapeWithScale(newScale);
        } catch (error) {
            console.error('Input-Change Fehler:', error);
        } finally {
            setTimeout(() => { isUpdating = false; }, 50);
        }
    }, 100);
}

function calculateDynamicScale(data) {
    const finalShape = determineActualShape();
    let maxDimension = 0;
    
    if (['kreis', 'fuenfeck', 'sechseck', 'achteck'].includes(finalShape)) {
        maxDimension = (data.radius || 3) * 2;
    } else if (finalShape === 'oval') {
        maxDimension = Math.max((data.radiusX || 4) * 2, (data.radiusY || 2.5) * 2);
    } else if (finalShape === 'dreieck') {
        if (determineActualVariant() === 'gleichseitig') {
            maxDimension = data.side || 6;
        } else if (determineActualVariant() === 'rechtwinklig') {
            maxDimension = Math.max(data.katheteA || 4, data.katheteB || 5);
        } else {
            maxDimension = Math.max(data.sideA || 4, data.sideB || 5, data.sideC || 6);
        }
    } else if (finalShape === 'quadrat') {
        maxDimension = data.side || 5;
    } else if (finalShape === 'trapez') {
        maxDimension = Math.max(data.sideA || 8, data.sideB || 6, data.height || 4);
    } else if (finalShape === 'parallelogramm') {
        maxDimension = Math.max(data.length || 8, data.width || 5);
    } else if (finalShape === 'rhombus') {
        maxDimension = Math.max(data.diagonal1 || 6, data.diagonal2 || 4);
    } else {
        maxDimension = Math.max(data.length || 8, data.width || 5);
    }
    
    const availableSpace = 250;
    let scale = (availableSpace * 0.6) / maxDimension;
    scale = Math.max(scale, 25);
    scale = Math.min(scale, 80);
    
    return scale;
}

function updateShapeWithScale(scale) {
    if (!svg) return;
    
    const data = getCurrentFormData();
    
    const shapeGroup = document.getElementById('roof-shape');
    const labelsGroup = document.getElementById('labels');
    
    if (shapeGroup) shapeGroup.innerHTML = '';
    if (labelsGroup) labelsGroup.innerHTML = '';
    
    if (shapeGroup) {
        drawCurrentShape(shapeGroup, data, scale);
    }
    
    if (labelsGroup) {
        drawLabelsOnShape(labelsGroup, data, scale);
    }
    
    updateCalculations(data);
}

function updateShape() {
    updateShapeWithScale(SCALE_FACTOR);
}

function getCurrentFormData() {
    const data = { shape: currentShape, variant: currentVariant, orientation: currentOrientation };
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    
    inputs.forEach(input => {
        if (input.value && input.value.trim() !== '') {
            const numValue = parseFloat(input.value);
            if (!isNaN(numValue) && numValue > 0) {
                data[input.id] = numValue;
            }
        }
    });
    
    return data;
}

function drawCurrentShape(group, data, scale = SCALE_FACTOR) {
    const finalShape = determineActualShape();
    
    // Form ohne Rotation zeichnen
    if (finalShape === 'kreis') {
        drawCircleShape(group, data, scale);
    } else if (finalShape === 'oval') {
        drawOvalShape(group, data, scale);
    } else if (finalShape === 'dreieck') {
        drawTriangleShape(group, data, scale);
    } else if (finalShape === 'quadrat') {
        drawSquareShape(group, data, scale);
    } else if (finalShape === 'trapez') {
        drawTrapezShape(group, data, scale);
    } else if (finalShape === 'parallelogramm') {
        drawParallelogrammShape(group, data, scale);
    } else if (finalShape === 'rhombus') {
        drawRhombusShape(group, data, scale);
    } else if (['fuenfeck', 'sechseck', 'achteck'].includes(finalShape)) {
        const sides = finalShape === 'fuenfeck' ? 5 : finalShape === 'sechseck' ? 6 : 8;
        drawPolygonShape(group, data, scale, sides);
    } else {
        drawRectangleShape(group, data, scale);
    }
    
    // Einfache Rotation auf die gesamte Gruppe anwenden
    if (currentOrientation !== 0) {
        group.setAttribute('transform', `rotate(${currentOrientation} ${CANVAS_CENTER_X} ${CANVAS_CENTER_Y})`);
    }
}

// Vereinfachte Zeichenfunktionen
function drawCircleShape(group, data, scale) {
    const radius = (data.radius || 3) * scale;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', CANVAS_CENTER_X);
    circle.setAttribute('cy', CANVAS_CENTER_Y);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    circle.setAttribute('stroke', '#007bff');
    circle.setAttribute('stroke-width', '3');
    group.appendChild(circle);
}

function drawOvalShape(group, data, scale) {
    const radiusX = (data.radiusX || 4) * scale;
    const radiusY = (data.radiusY || 2.5) * scale;
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', CANVAS_CENTER_X);
    ellipse.setAttribute('cy', CANVAS_CENTER_Y);
    ellipse.setAttribute('rx', radiusX);
    ellipse.setAttribute('ry', radiusY);
    ellipse.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    ellipse.setAttribute('stroke', '#007bff');
    ellipse.setAttribute('stroke-width', '3');
    group.appendChild(ellipse);
}

function drawRectangleShape(group, data, scale) {
    const length = (data.length || 8) * scale;
    const width = (data.width || 5) * scale;
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', CANVAS_CENTER_X - length/2);
    rect.setAttribute('y', CANVAS_CENTER_Y - width/2);
    rect.setAttribute('width', length);
    rect.setAttribute('height', width);
    rect.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    rect.setAttribute('stroke', '#007bff');
    rect.setAttribute('stroke-width', '3');
    group.appendChild(rect);
}

function drawSquareShape(group, data, scale) {
    const side = (data.side || 5) * scale;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', CANVAS_CENTER_X - side/2);
    rect.setAttribute('y', CANVAS_CENTER_Y - side/2);
    rect.setAttribute('width', side);
    rect.setAttribute('height', side);
    rect.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    rect.setAttribute('stroke', '#007bff');
    rect.setAttribute('stroke-width', '3');
    group.appendChild(rect);
}

function drawTriangleShape(group, data, scale = SCALE_FACTOR) {
    const variant = determineActualVariant();
    let points = '';
    
    if (variant === 'gleichseitig') {
        const side = (data.side || 6) * scale;
        const height = side * Math.sqrt(3) / 2;
        const topX = CANVAS_CENTER_X;
        const topY = CANVAS_CENTER_Y - height/3;
        const leftX = CANVAS_CENTER_X - side/2;
        const leftY = CANVAS_CENTER_Y + height*2/3;
        const rightX = CANVAS_CENTER_X + side/2;
        const rightY = CANVAS_CENTER_Y + height*2/3;
        points = `${topX},${topY} ${leftX},${leftY} ${rightX},${rightY}`;
    } else if (variant === 'rechtwinklig') {
        const katheteA = (data.katheteA || 4) * scale;
        const katheteB = (data.katheteB || 5) * scale;
        
        const leftX = CANVAS_CENTER_X - katheteA/2;
        const rightX = CANVAS_CENTER_X + katheteA/2;
        const bottomY = CANVAS_CENTER_Y + katheteB/3;
        const topY = CANVAS_CENTER_Y - katheteB*2/3;
        
        points = `${leftX},${bottomY} ${rightX},${bottomY} ${leftX},${topY}`;
    } else {
        const sideA = (data.sideA || 4) * scale;
        const avgSide = ((data.sideB || 5) + (data.sideC || 6)) / 2;
        const height = avgSide * scale * 0.8;
        
        const topX = CANVAS_CENTER_X;
        const topY = CANVAS_CENTER_Y - height/2;
        const leftX = CANVAS_CENTER_X - sideA/2;
        const leftY = CANVAS_CENTER_Y + height/2;
        const rightX = CANVAS_CENTER_X + sideA/2;
        const rightY = CANVAS_CENTER_Y + height/2;
        
        points = `${topX},${topY} ${leftX},${leftY} ${rightX},${rightY}`;
    }
    
    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    triangle.setAttribute('points', points);
    triangle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    triangle.setAttribute('stroke', '#007bff');
    triangle.setAttribute('stroke-width', '3');
    group.appendChild(triangle);
}

function drawTrapezShape(group, data, scale) {
    const sideA = (data.sideA || 8) * scale;
    const sideB = (data.sideB || 6) * scale;
    const height = (data.height || 4) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    const points = `
        ${centerX - sideA/2},${centerY + height/2}
        ${centerX + sideA/2},${centerY + height/2}
        ${centerX + sideB/2},${centerY - height/2}
        ${centerX - sideB/2},${centerY - height/2}
    `;
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawLabelsOnShape(group, data, scale) {
    const finalShape = determineActualShape();
    
    // Einfache Labels ohne komplexe Rotation
    if (finalShape === 'dreieck') {
        const labels = ['A', 'B', 'C'];
        const colors = ['#007bff', '#28a745', '#dc3545'];
        const positions = [
            { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - 60 },     // Oben
            { x: CANVAS_CENTER_X - 50, y: CANVAS_CENTER_Y + 40 }, // Links unten
            { x: CANVAS_CENTER_X + 50, y: CANVAS_CENTER_Y + 40 }  // Rechts unten
        ];
        
        labels.forEach((label, i) => {
            const labelElement = createLabel(positions[i].x, positions[i].y, label, colors[i]);
            group.appendChild(labelElement);
        });
    } else if (['quadrat', 'rechteck', 'trapez', 'parallelogramm', 'rhombus'].includes(finalShape)) {
        const labels = ['A', 'B', 'C', 'D'];
        const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107'];
        const positions = [
            { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - 70 },     // A oben
            { x: CANVAS_CENTER_X + 70, y: CANVAS_CENTER_Y },     // B rechts
            { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y + 70 },     // C unten
            { x: CANVAS_CENTER_X - 70, y: CANVAS_CENTER_Y }      // D links
        ];
        
        labels.forEach((label, i) => {
            const labelElement = createLabel(positions[i].x, positions[i].y, label, colors[i]);
            group.appendChild(labelElement);
        });
    } else if (['kreis', 'oval'].includes(finalShape)) {
        const labelElement = createLabel(CANVAS_CENTER_X + 40, CANVAS_CENTER_Y - 40, 'R', '#007bff');
        group.appendChild(labelElement);
    }
}

function createLabel(x, y, text, color) {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', y);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', color);
    label.setAttribute('font-size', '14');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('stroke', 'white');
    label.setAttribute('stroke-width', '2');
    label.setAttribute('paint-order', 'stroke');
    label.textContent = text;
    return label;
}

function updateCalculations(data) {
    let area = 0;
    let perimeter = 0;
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    switch (finalShape) {
        case 'kreis':
            const radius = data.radius || 3;
            area = Math.PI * radius * radius;
            perimeter = 2 * Math.PI * radius;
            break;
        case 'oval':
            const radiusX = data.radiusX || 4;
            const radiusY = data.radiusY || 2.5;
            area = Math.PI * radiusX * radiusY;
            perimeter = Math.PI * (3 * (radiusX + radiusY) - Math.sqrt((3 * radiusX + radiusY) * (radiusX + 3 * radiusY)));
            break;
        case 'rechteck':
            const rectLength = data.length || 8;
            const rectWidth = data.width || 5;
            area = rectLength * rectWidth;
            perimeter = 2 * (rectLength + rectWidth);
            break;
        case 'quadrat':
            const side = data.side || 5;
            area = side * side;
            perimeter = 4 * side;
            break;
        case 'dreieck':
            if (variant === 'rechtwinklig') {
                const a = data.katheteA || 4;
                const b = data.katheteB || 5;
                area = 0.5 * a * b;
                const c = Math.sqrt(a*a + b*b);
                perimeter = a + b + c;
            } else if (variant === 'gleichseitig') {
                const s = data.side || 6;
                area = (Math.sqrt(3) / 4) * s * s;
                perimeter = 3 * s;
            } else {
                const a = data.sideA || 4;
                const b = data.sideB || 5;
                const c = data.sideC || 6;
                const s = (a + b + c) / 2;
                area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
                perimeter = a + b + c;
            }
            break;
        case 'trapez':
            const sideA = data.sideA || 8;
            const sideB = data.sideB || 6;
            const height = data.height || 4;
            area = ((sideA + sideB) / 2) * height;
            const sideLength = Math.sqrt(height * height + ((sideA - sideB) / 2) * ((sideA - sideB) / 2));
            perimeter = sideA + sideB + 2 * sideLength;
            break;
        case 'parallelogramm':
            const pLength = data.length || 8;
            const pWidth = data.width || 5;
            const angle = (data.angle || 75) * Math.PI / 180;
            area = pLength * pWidth * Math.sin(angle);
            perimeter = 2 * (pLength + pWidth);
            break;
        case 'rhombus':
            const d1 = data.diagonal1 || 6;
            const d2 = data.diagonal2 || 4;
            area = (d1 * d2) / 2;
            const rhombusSide = Math.sqrt((d1/2) * (d1/2) + (d2/2) * (d2/2));
            perimeter = 4 * rhombusSide;
            break;
        case 'fuenfeck':
        case 'sechseck':
        case 'achteck':
            const polyRadius = data.radius || 3;
            const n = finalShape === 'fuenfeck' ? 5 : finalShape === 'sechseck' ? 6 : 8;
            area = (n * polyRadius * polyRadius * Math.sin(2 * Math.PI / n)) / 2;
            perimeter = n * 2 * polyRadius * Math.sin(Math.PI / n);
            break;
        default:
            area = 40;
            perimeter = 26;
    }
    
    const areaElement = document.getElementById('calc-area');
    const perimeterElement = document.getElementById('calc-perimeter');
    
    if (areaElement) areaElement.textContent = area.toFixed(2) + ' m²';
    if (perimeterElement) perimeterElement.textContent = perimeter.toFixed(2) + ' m';
}

function setupEventListeners() {
    const backBtn = document.getElementById('btn-back');
    const continueBtn = document.getElementById('btn-continue');
    
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            saveCurrentData();
            window.location.href = 'dachform.html';
        });
    }
    
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            saveCurrentData();
            window.location.href = 'berechnung.html';
        });
    }
    
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            resetToDefaults();
        });
    }
}

function resetToDefaults() {
    currentOrientation = 0;
    
    // Orientierungs-Buttons zurücksetzen
    document.querySelectorAll('[id^="btn-orient-"]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById('btn-orient-0').classList.add('active');
    
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    inputs.forEach(input => {
        const finalShape = determineActualShape();
        switch(input.id) {
            case 'radius': input.value = '3'; break;
            case 'radiusX': input.value = '4'; break;
            case 'radiusY': input.value = '2.5'; break;
            case 'side': 
                input.value = finalShape === 'quadrat' ? '5' : '6'; 
                break;
            case 'katheteA': input.value = '4'; break;
            case 'katheteB': input.value = '5'; break;
            case 'sideA': input.value = '4'; break;
            case 'sideB': input.value = '5'; break;
            case 'sideC': input.value = '6'; break;
            case 'length': input.value = '8'; break;
            case 'width': input.value = '5'; break;
            case 'height': input.value = '4'; break;
            case 'angle': input.value = '75'; break;
            case 'diagonal1': input.value = '6'; break;
            case 'diagonal2': input.value = '4'; break;
        }
    });
    
    updateShape();
    showFeedback('Zurückgesetzt: Form und alle Parameter');
}

function showFeedback(message) {
    const existingFeedback = document.querySelectorAll('.feedback-message');
    existingFeedback.forEach(fb => fb.remove());
    
    const feedback = document.createElement('div');
    feedback.className = 'feedback-message';
    feedback.style.cssText = `
        position: fixed; top: 100px; right: 20px; background: #28a745; color: white;
        padding: 12px 20px; border-radius: 6px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        max-width: 300px; font-size: 14px; font-weight: 500; animation: slideIn 0.3s ease-out;
    `;
    
    if (!document.getElementById('feedback-styles')) {
        const style = document.createElement('style');
        style.id = 'feedback-styles';
        style.textContent = `
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
        `;
        document.head.appendChild(style);
    }
    
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => { if (feedback.parentNode) { feedback.remove(); } }, 300);
    }, 3000);
}

function saveCurrentData() {
    const currentData = getCurrentFormData();
    currentData.orientation = currentOrientation;
    
    if (!projectData.roofShape) { projectData.roofShape = {}; }
    Object.assign(projectData.roofShape, currentData);
    
    projectData.roofShape.points = generateRoofPoints(currentData);
    
    projectData.geometry = {
        shapeType: determineActualShape(),
        variant: determineActualVariant(),
        points: projectData.roofShape.points,
        orientation: currentOrientation,
        area: calculateArea(currentData),
        dimensions: calculateDimensions(currentData)
    };
    
    console.log('Speichere Daten:', projectData);
    
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
    } catch (e) {
        sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
    }
}

function generateRoofPoints(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    let points = [];
    
    console.log('Generiere Punkte für:', finalShape, variant);
    
    switch (finalShape) {
        case 'kreis':
            const radius = data.radius || 3;
            for (let i = 0; i < 16; i++) {
                const angle = (i * 2 * Math.PI) / 16;
                points.push({
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle)
                });
            }
            break;
        case 'oval':
            const radiusX = data.radiusX || 4;
            const radiusY = data.radiusY || 2.5;
            for (let i = 0; i < 16; i++) {
                const angle = (i * 2 * Math.PI) / 16;
                points.push({
                    x: radiusX * Math.cos(angle),
                    y: radiusY * Math.sin(angle)
                });
            }
            break;
        case 'dreieck':
            if (variant === 'gleichseitig') {
                const side = data.side || 6;
                const height = side * Math.sqrt(3) / 2;
                points = [
                    { x: 0, y: height * 2/3 },
                    { x: -side/2, y: -height/3 },
                    { x: side/2, y: -height/3 }
                ];
            } else if (variant === 'rechtwinklig') {
                const a = data.katheteA || 4;
                const b = data.katheteB || 5;
                points = [
                    { x: -a/2, y: -b/3 },
                    { x: a/2, y: -b/3 },
                    { x: -a/2, y: b*2/3 }
                ];
            } else {
                const sideA = data.sideA || 4;
                points = [
                    { x: 0, y: 3 },
                    { x: -sideA/2, y: -2 },
                    { x: sideA/2, y: -2 }
                ];
            }
            break;
        case 'quadrat':
            const side = data.side || 5;
            points = [
                { x: -side/2, y: -side/2 }, { x: side/2, y: -side/2 },
                { x: side/2, y: side/2 }, { x: -side/2, y: side/2 }
            ];
            break;
        case 'trapez':
            const sideA = data.sideA || 8;
            const sideB = data.sideB || 6;
            const height = data.height || 4;
            points = [
                { x: -sideA/2, y: -height/2 },
                { x: sideA/2, y: -height/2 },
                { x: sideB/2, y: height/2 },
                { x: -sideB/2, y: height/2 }
            ];
            break;
        case 'parallelogramm':
            const length = data.length || 8;
            const width = data.width || 5;
            const angle = (data.angle || 75) * Math.PI / 180;
            const offset = width * Math.cos(angle);
            points = [
                { x: -length/2, y: -width/2 },
                { x: length/2, y: -width/2 },
                { x: length/2 + offset, y: width/2 },
                { x: -length/2 + offset, y: width/2 }
            ];
            break;
        case 'rhombus':
            const diagonal1 = data.diagonal1 || 6;
            const diagonal2 = data.diagonal2 || 4;
            points = [
                { x: 0, y: -diagonal2/2 },
                { x: diagonal1/2, y: 0 },
                { x: 0, y: diagonal2/2 },
                { x: -diagonal1/2, y: 0 }
            ];
            break;
        case 'fuenfeck':
        case 'sechseck':
        case 'achteck':
            const polyRadius = data.radius || 3;
            const n = finalShape === 'fuenfeck' ? 5 : finalShape === 'sechseck' ? 6 : 8;
            for (let i = 0; i < n; i++) {
                const angle = (i * 2 * Math.PI / n) - Math.PI / 2;
                points.push({
                    x: polyRadius * Math.cos(angle),
                    y: polyRadius * Math.sin(angle)
                });
            }
            break;
        default:
            // Fallback: Rechteck
            const rectLength = data.length || 8;
            const rectWidth = data.width || 5;
            points = [
                { x: -rectLength/2, y: -rectWidth/2 }, { x: rectLength/2, y: -rectWidth/2 },
                { x: rectLength/2, y: rectWidth/2 }, { x: -rectLength/2, y: rectWidth/2 }
            ];
    }
    
    // Einfache Orientierung anwenden
    if (currentOrientation !== 0) {
        const angle = (currentOrientation * Math.PI) / 180;
        points = points.map(point => ({
            x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
            y: point.x * Math.sin(angle) + point.y * Math.cos(angle)
        }));
    }
    
    console.log('Generierte Punkte:', points);
    return points;
}

function calculateArea(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    switch (finalShape) {
        case 'kreis':
            const radius = data.radius || 3;
            return Math.PI * radius * radius;
        case 'oval':
            const radiusX = data.radiusX || 4;
            const radiusY = data.radiusY || 2.5;
            return Math.PI * radiusX * radiusY;
        case 'rechteck':
            return (data.length || 8) * (data.width || 5);
        case 'quadrat':
            const side = data.side || 5;
            return side * side;
        case 'dreieck':
            if (variant === 'rechtwinklig') {
                return 0.5 * (data.katheteA || 4) * (data.katheteB || 5);
            } else if (variant === 'gleichseitig') {
                const s = data.side || 6;
                return (Math.sqrt(3) / 4) * s * s;
            } else {
                const a = data.sideA || 4;
                const b = data.sideB || 5;
                const c = data.sideC || 6;
                const s = (a + b + c) / 2;
                return Math.sqrt(s * (s - a) * (s - b) * (s - c));
            }
        case 'trapez':
            const sideA = data.sideA || 8;
            const sideB = data.sideB || 6;
            const height = data.height || 4;
            return ((sideA + sideB) / 2) * height;
        case 'parallelogramm':
            const pLength = data.length || 8;
            const pWidth = data.width || 5;
            const angle = (data.angle || 75) * Math.PI / 180;
            return pLength * pWidth * Math.sin(angle);
        case 'rhombus':
            const d1 = data.diagonal1 || 6;
            const d2 = data.diagonal2 || 4;
            return (d1 * d2) / 2;
        case 'fuenfeck':
        case 'sechseck':
        case 'achteck':
            const polyRadius = data.radius || 3;
            const n = finalShape === 'fuenfeck' ? 5 : finalShape === 'sechseck' ? 6 : 8;
            return (n * polyRadius * polyRadius * Math.sin(2 * Math.PI / n)) / 2;
        default:
            return 40;
    }
}

function calculateDimensions(data) {
    const finalShape = determineActualShape();
    
    switch (finalShape) {
        case 'kreis':
            const circleRadius = data.radius || 3;
            return { length: circleRadius * 2, width: circleRadius * 2 };
        case 'oval':
            const radiusX = data.radiusX || 4;
            const radiusY = data.radiusY || 2.5;
            return { length: radiusX * 2, width: radiusY * 2 };
        case 'rechteck':
            return { length: data.length || 8, width: data.width || 5 };
        case 'quadrat':
            const side = data.side || 5;
            return { length: side, width: side };
        case 'trapez':
            const sideA = data.sideA || 8;
            const height = data.height || 4;
            return { length: sideA, width: height };
        case 'parallelogramm':
            return { length: data.length || 8, width: data.width || 5 };
        case 'rhombus':
            const d1 = data.diagonal1 || 6;
            const d2 = data.diagonal2 || 4;
            return { length: d1, width: d2 };
        default:
            return { length: 8, width: 5 };
    }
}

console.log('Vereinfachter Editor.js geladen - ohne komplexe Maus-Rotation');bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawParallelogrammShape(group, data, scale) {
    const length = (data.length || 8) * scale;
    const width = (data.width || 5) * scale;
    const angle = (data.angle || 75) * Math.PI / 180;
    const offset = width * Math.cos(angle);
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    const points = `
        ${centerX - length/2},${centerY + width/2}
        ${centerX + length/2},${centerY + width/2}
        ${centerX + length/2 + offset},${centerY - width/2}
        ${centerX - length/2 + offset},${centerY - width/2}
    `;
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawRhombusShape(group, data, scale) {
    const diagonal1 = (data.diagonal1 || 6) * scale;
    const diagonal2 = (data.diagonal2 || 4) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    const points = `
        ${centerX},${centerY - diagonal2/2}
        ${centerX + diagonal1/2},${centerY}
        ${centerX},${centerY + diagonal2/2}
        ${centerX - diagonal1/2},${centerY}
    `;
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawPolygonShape(group, data, scale, sides) {
    const radius = (data.radius || 3) * scale;
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    let points = [];
    for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points.join(' '));
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007
