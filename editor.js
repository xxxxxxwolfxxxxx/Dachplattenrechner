// KORRIGIERTE editor.js - Ohne Syntaxfehler

let projectData = {};
let currentShape = '';
let currentVariant = '';
let svg;
let isUpdating = false;

// Transformation state
let currentRotation = 0;
let isMirroredH = false;
let isMirroredV = false;

// Interaktion state
let isDragging = false;
let dragStartAngle = 0;
let dragStartRotation = 0;
let rotationCenter = { x: 0, y: 0 };

const CANVAS_CENTER_X = 300;
const CANVAS_CENTER_Y = 200;
const SCALE_FACTOR = 60;
const CORNER_RADIUS = 8;

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
}

function initializeCanvas() {
    svg = document.getElementById('main-svg');
    
    if (!svg) {
        createFallbackCanvas();
    }
    
    // Event Listeners für Rotation (falls gewünscht)
    svg.addEventListener('mousedown', handleMouseDown, { passive: false });
    svg.addEventListener('mousemove', handleMouseMove, { passive: false });
    svg.addEventListener('mouseup', handleMouseUp, { passive: false });
    svg.addEventListener('mouseleave', handleMouseUp, { passive: false });
    
    rotationCenter = { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y };
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
    svg.style.cursor = 'default';
    
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
    createRotationDisplay();
}

function createRotationDisplay() {
    const existing = document.getElementById('rotation-display');
    if (existing) existing.remove();
    
    const display = document.createElement('div');
    display.id = 'rotation-display';
    display.style.cssText = `
        position: absolute; top: 10px; right: 10px; background: rgba(0, 0, 0, 0.8); color: white;
        padding: 8px 12px; border-radius: 6px; font-family: 'Courier New', monospace;
        font-size: 14px; font-weight: bold; z-index: 1000; pointer-events: none;
    `;
    display.textContent = '0°';
    
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (canvasWrapper) { canvasWrapper.appendChild(display); }
}

function updateRotationDisplay() {
    const display = document.getElementById('rotation-display');
    if (display) {
        const roundedRotation = Math.round(currentRotation * 10) / 10;
        display.textContent = roundedRotation + '°';
        display.style.background = Math.abs(roundedRotation % 90) < 1 ? '#28a745' : 'rgba(0, 0, 0, 0.8)';
    }
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
        'rechteck': 'Rechteck',
        'quadrat': 'Quadrat', 
        'parallelogramm': 'Parallelogramm',
        'trapez': 'Trapez',
        'rhombus': 'Rhombus',
        'gleichseitig': 'Gleichseitiges Dreieck', 
        'rechtwinklig': 'Rechtwinkliges Dreieck',
        'ungleichschenklig': 'Ungleichschenkliges Dreieck',
        'kreis': 'Kreis',
        'oval': 'Oval',
        'halbkreis': 'Halbkreis',
        'viertelkreis': 'Viertelkreis',
        'langloch': 'Langloch',
        'fuenfeck': 'Fünfeck',
        'sechseck': 'Sechseck',
        'achteck': 'Achteck',
        'lform': 'L-Form',
        'tform': 'T-Form',
        'uform': 'U-Form'
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
        if (roofShape.rotation !== undefined) currentRotation = roofShape.rotation;
    }
    
    setTimeout(() => {
        createInputFields();
        updateShape();
    }, 100);
}

function determineActualShape() {
    if (!currentVariant || !currentShape) {
        return 'rechteck';
    }
    
    if (currentVariant === 'quadrat') return 'quadrat';
    if (currentVariant === 'rechteck') return 'rechteck';
    if (currentVariant === 'parallelogramm') return 'parallelogramm';
    if (currentVariant === 'trapez') return 'trapez';
    if (currentVariant === 'rhombus') return 'rhombus';
    
    if (currentVariant === 'gleichseitig' || currentVariant === 'rechtwinklig' || currentVariant === 'ungleichschenklig') {
        return 'dreieck';
    }
    
    if (currentVariant === 'kreis' || currentVariant === 'oval' || currentVariant === 'halbkreis' || 
        currentVariant === 'viertelkreis' || currentVariant === 'langloch') {
        return 'kreis';
    }
    
    if (currentVariant === 'fuenfeck' || currentVariant === 'sechseck' || currentVariant === 'achteck' ||
        currentVariant === 'lform' || currentVariant === 'tform' || currentVariant === 'uform') {
        return 'vieleck';
    }
    
    return currentShape || 'rechteck';
}

function determineActualVariant() {
    return currentVariant || 'rechteck';
}

function createInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
    container.innerHTML = '';
    const finalShape = determineActualShape();
    const savedData = projectData.roofShape || {};
    
    // IMMER einen Rotations-Slider hinzufügen
    const rotationInput = createRotationInput('Rotation (°)', 'rotation', currentRotation || 0);
    container.appendChild(rotationInput);
    
    if (finalShape === 'dreieck') {
        if (currentVariant === 'gleichseitig') {
            container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '6'));
        } else if (currentVariant === 'rechtwinklig') {
            container.appendChild(createInput('Kathete A (m)', 'katheteA', savedData.katheteA || '4'));
            container.appendChild(createInput('Kathete B (m)', 'katheteB', savedData.katheteB || '5'));
        } else {
            container.appendChild(createInput('Seite A (m)', 'sideA', savedData.sideA || '4'));
            container.appendChild(createInput('Seite B (m)', 'sideB', savedData.sideB || '5'));
            container.appendChild(createInput('Seite C (m)', 'sideC', savedData.sideC || '6'));
        }
    } else if (finalShape === 'quadrat') {
        container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '5'));
    } else if (finalShape === 'parallelogramm') {
        container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
        container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
        container.appendChild(createInput('Winkel (°)', 'angle', savedData.angle || '75'));
    } else if (finalShape === 'trapez') {
        container.appendChild(createInput('Basis unten (m)', 'baseBottom', savedData.baseBottom || '8'));
        container.appendChild(createInput('Basis oben (m)', 'baseTop', savedData.baseTop || '6'));
        container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '4'));
    } else if (finalShape === 'rhombus') {
        container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '6'));
        container.appendChild(createInput('Winkel (°)', 'angle', savedData.angle || '60'));
    } else if (finalShape === 'kreis') {
        if (currentVariant === 'oval') {
            container.appendChild(createInput('Radius X (m)', 'radiusX', savedData.radiusX || '6'));
            container.appendChild(createInput('Radius Y (m)', 'radiusY', savedData.radiusY || '4'));
        } else {
            container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '5'));
        }
    } else if (finalShape === 'vieleck') {
        if (currentVariant === 'lform' || currentVariant === 'tform' || currentVariant === 'uform') {
            container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
            container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
            container.appendChild(createInput('Tiefe (m)', 'depth', savedData.depth || '3'));
        } else {
            container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '5'));
        }
    } else {
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
    unit.textContent = id === 'angle' ? '°' : 'm';
    
    inputWrapper.appendChild(input);
    inputWrapper.appendChild(unit);
    wrapper.appendChild(label);
    wrapper.appendChild(inputWrapper);
    
    return wrapper;
}

function createRotationInput(labelText, id, defaultValue) {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-group';
    
    const label = document.createElement('label');
    label.textContent = labelText;
    
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-group-wrapper';
    
    const input = document.createElement('input');
    input.type = 'range';
    input.id = id;
    input.value = defaultValue || 0;
    input.min = '-180';
    input.max = '180';
    input.step = '5';
    input.style.width = '100%';
    
    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'input-unit';
    valueDisplay.textContent = (defaultValue || 0) + '°';
    
    input.addEventListener('input', function() {
        currentRotation = parseFloat(this.value);
        valueDisplay.textContent = this.value + '°';
        updateRotationDisplay();
        updateShape();
    });
    
    inputWrapper.appendChild(input);
    inputWrapper.appendChild(valueDisplay);
    wrapper.appendChild(label);
    wrapper.appendChild(inputWrapper);
    
    return wrapper;
}

function handleInputChange() {
    if (isUpdating) return;
    isUpdating = true;
    
    if (!currentShape || !currentVariant) {
        currentShape = 'viereck';
        currentVariant = 'rechteck';
    }
    
    const data = getCurrentFormData();
    const newScale = calculateDynamicScale(data);
    updateShapeWithScale(newScale);
    
    setTimeout(() => { isUpdating = false; }, 50);
}

function calculateDynamicScale(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    let maxDimension = 0;
    
    if (finalShape === 'dreieck') {
        if (variant === 'gleichseitig') {
            maxDimension = data.side || 6;
        } else if (variant === 'rechtwinklig') {
            maxDimension = Math.max(data.katheteA || 4, data.katheteB || 5);
        } else {
            maxDimension = Math.max(data.sideA || 4, data.sideB || 5, data.sideC || 6);
        }
    } else if (finalShape === 'quadrat') {
        maxDimension = data.side || 5;
    } else if (finalShape === 'kreis') {
        if (variant === 'oval') {
            maxDimension = Math.max(data.radiusX || 6, data.radiusY || 4) * 2;
        } else {
            maxDimension = (data.radius || 5) * 2;
        }
    } else {
        maxDimension = Math.max(data.length || 8, data.width || 5);
    }
    
    const availableSpace = Math.min(500, 300);
    let scale = (availableSpace * 0.7) / maxDimension;
    scale = Math.max(scale, 15);
    scale = Math.min(scale, 120);
    
    return scale;
}

function updateShapeWithScale(scale) {
    if (!svg) return;
    
    const data = getCurrentFormData();
    
    const shapeGroup = document.getElementById('roof-shape');
    const cornerGroup = document.getElementById('corner-handles');
    const labelsGroup = document.getElementById('labels');
    
    if (shapeGroup) shapeGroup.innerHTML = '';
    if (cornerGroup) cornerGroup.innerHTML = '';
    if (labelsGroup) labelsGroup.innerHTML = '';
    
    if (shapeGroup) {
        drawCurrentShape(shapeGroup, data, scale);
    }
    
    if (cornerGroup) {
        drawCornerHandlesOnShape(cornerGroup, data, scale);
    }
    
    if (labelsGroup) {
        drawLabelsOnShape(labelsGroup, data, scale);
    }
    
    updateCalculations(data);
    updateRotationDisplay();
}

function updateShape() {
    updateShapeWithScale(SCALE_FACTOR);
}

function getCurrentFormData() {
    const data = { shape: currentShape, variant: currentVariant };
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
    
    if (finalShape === 'dreieck') {
        drawTriangleShape(group, data, scale);
    } else if (finalShape === 'quadrat') {
        drawSquareShape(group, data, scale);
    } else if (finalShape === 'parallelogramm') {
        drawParallelogramShape(group, data, scale);
    } else if (finalShape === 'trapez') {
        drawTrapezShape(group, data, scale);
    } else if (finalShape === 'rhombus') {
        drawRhombusShape(group, data, scale);
    } else if (finalShape === 'kreis') {
        drawCircleShape(group, data, scale);
    } else if (finalShape === 'vieleck') {
        drawPolygonShape(group, data, scale);
    } else {
        drawRectangleShape(group, data, scale);
    }
    
    if (currentRotation !== 0) {
        group.setAttribute('transform', `rotate(${currentRotation} ${CANVAS_CENTER_X} ${CANVAS_CENTER_Y})`);
    }
}

function drawTriangleShape(group, data, scale = SCALE_FACTOR) {
    const variant = determineActualVariant();
    let points = '';
    
    if (variant === 'gleichseitig') {
        const side = (data.side || 6) * scale;
        const height = side * Math.sqrt(3) / 2;
        points = `${CANVAS_CENTER_X},${CANVAS_CENTER_Y - height/3} ${CANVAS_CENTER_X - side/2},${CANVAS_CENTER_Y + height*2/3} ${CANVAS_CENTER_X + side/2},${CANVAS_CENTER_Y + height*2/3}`;
    } else if (variant === 'rechtwinklig') {
        const katheteA = (data.katheteA || 4) * scale;
        const katheteB = (data.katheteB || 5) * scale;
        points = `${CANVAS_CENTER_X - katheteA/2},${CANVAS_CENTER_Y + katheteB/3} ${CANVAS_CENTER_X + katheteA/2},${CANVAS_CENTER_Y + katheteB/3} ${CANVAS_CENTER_X - katheteA/2},${CANVAS_CENTER_Y - katheteB*2/3}`;
    } else {
        const sideA = (data.sideA || 4) * scale;
        const avgSide = ((data.sideB || 5) + (data.sideC || 6)) / 2;
        const height = avgSide * scale * 0.8;
        points = `${CANVAS_CENTER_X},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - sideA/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + sideA/2},${CANVAS_CENTER_Y + height/2}`;
    }
    
    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    triangle.setAttribute('points', points);
    triangle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    triangle.setAttribute('stroke', '#007bff');
    triangle.setAttribute('stroke-width', '3');
    group.appendChild(triangle);
}

function drawSquareShape(group, data, scale = SCALE_FACTOR) {
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

function drawRectangleShape(group, data, scale = SCALE_FACTOR) {
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

function drawParallelogramShape(group, data, scale = SCALE_FACTOR) {
    const length = (data.length || 8) * scale;
    const width = (data.width || 5) * scale;
    const angle = (data.angle || 75) * Math.PI / 180;
    const offset = width * Math.cos(angle);
    
    const points = `${CANVAS_CENTER_X - length/2},${CANVAS_CENTER_Y + width/2} ${CANVAS_CENTER_X + length/2},${CANVAS_CENTER_Y + width/2} ${CANVAS_CENTER_X + length/2 + offset},${CANVAS_CENTER_Y - width/2} ${CANVAS_CENTER_X - length/2 + offset},${CANVAS_CENTER_Y - width/2}`;
    
    const parallelogram = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    parallelogram.setAttribute('points', points);
    parallelogram.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    parallelogram.setAttribute('stroke', '#007bff');
    parallelogram.setAttribute('stroke-width', '3');
    group.appendChild(parallelogram);
}

function drawTrapezShape(group, data, scale = SCALE_FACTOR) {
    const baseBottom = (data.baseBottom || 8) * scale;
    const baseTop = (data.baseTop || 6) * scale;
    const height = (data.height || 4) * scale;
    
    const points = `${CANVAS_CENTER_X - baseBottom/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + baseBottom/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + baseTop/2},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - baseTop/2},${CANVAS_CENTER_Y - height/2}`;
    
    const trapez = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    trapez.setAttribute('points', points);
    trapez.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    trapez.setAttribute('stroke', '#007bff');
    trapez.setAttribute('stroke-width', '3');
    group.appendChild(trapez);
}

function drawRhombusShape(group, data, scale = SCALE_FACTOR) {
    const side = (data.side || 6) * scale;
    const angle = (data.angle || 60) * Math.PI / 180;
    const width = side * Math.sin(angle);
    const height = side * Math.cos(angle);
    
    const points = `${CANVAS_CENTER_X},${CANVAS_CENTER_Y - width} ${CANVAS_CENTER_X + height},${CANVAS_CENTER_Y} ${CANVAS_CENTER_X},${CANVAS_CENTER_Y + width} ${CANVAS_CENTER_X - height},${CANVAS_CENTER_Y}`;
    
    const rhombus = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    rhombus.setAttribute('points', points);
    rhombus.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    rhombus.setAttribute('stroke', '#007bff');
    rhombus.setAttribute('stroke-width', '3');
    group.appendChild(rhombus);
}

function drawCircleShape(group, data, scale = SCALE_FACTOR) {
    const variant = determineActualVariant();
    
    if (variant === 'oval') {
        const radiusX = (data.radiusX || 6) * scale;
        const radiusY = (data.radiusY || 4) * scale;
        
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', CANVAS_CENTER_X);
        ellipse.setAttribute('cy', CANVAS_CENTER_Y);
        ellipse.setAttribute('rx', radiusX);
        ellipse.setAttribute('ry', radiusY);
        ellipse.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        ellipse.setAttribute('stroke', '#007bff');
        ellipse.setAttribute('stroke-width', '3');
        group.appendChild(ellipse);
    } else {
        const radius = (data.radius || 5) * scale;
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', CANVAS_CENTER_X);
        circle.setAttribute('cy', CANVAS_CENTER_Y);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        circle.setAttribute('stroke', '#007bff');
        circle.setAttribute('stroke-width', '3');
        group.appendChild(circle);
    }
}

function drawPolygonShape(group, data, scale = SCALE_FACTOR) {
    const variant = determineActualVariant();
    let points = '';
    
    if (variant === 'fuenfeck') {
        const radius = (data.radius || 5) * scale;
        const pointsArray = [];
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
            const x = CANVAS_CENTER_X + radius * Math.cos(angle);
            const y = CANVAS_CENTER_Y + radius * Math.sin(angle);
            pointsArray.push(`${x},${y}`);
        }
        points = pointsArray.join(' ');
    } else if (variant === 'sechseck') {
        const radius = (data.radius || 5) * scale;
        const pointsArray = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i * 2 * Math.PI / 6) - Math.PI / 2;
            const x = CANVAS_CENTER_X + radius * Math.cos(angle);
            const y = CANVAS_CENTER_Y + radius * Math.sin(angle);
            pointsArray.push(`${x},${y}`);
        }
        points = pointsArray.join(' ');
    } else if (variant === 'achteck') {
        const radius = (data.radius || 5) * scale;
        const pointsArray = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i * 2 * Math.PI / 8) - Math.PI / 2;
            const x = CANVAS_CENTER_X + radius * Math.cos(angle);
            const y = CANVAS_CENTER_Y + radius * Math.sin(angle);
            pointsArray.push(`${x},${y}`);
        }
        points = pointsArray.join(' ');
    } else if (variant === 'lform') {
        const length = (data.length || 8) * scale;
        const width = (data.width || 5) * scale;
        const depth = (data.depth || 3) * scale;
        
        points = `${CANVAS_CENTER_X - length/2},${CANVAS_CENTER_Y + width/2} ${CANVAS_CENTER_X - length/2 + depth},${CANVAS_CENTER_Y + width/2} ${CANVAS_CENTER_X - length/2 + depth},${CANVAS_CENTER_Y - width/2 + depth} ${CANVAS_CENTER_X + length/2},${CANVAS_CENTER_Y - width/2 + depth} ${CANVAS_CENTER_X + length/2},${CANVAS_CENTER_Y - width/2} ${CANVAS_CENTER_X - length/2},${CANVAS_CENTER_Y - width/2}`;
    } else {
        // Standard Pentagon
        const radius = (data.radius || 5) * scale;
        const pointsArray = [];
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
            const x = CANVAS_CENTER_X + radius * Math.cos(angle);
            const y = CANVAS_CENTER_Y + radius * Math.sin(angle);
            pointsArray.push(`${x},${y}`);
        }
        points = pointsArray.join(' ');
    }
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawCornerHandlesOnShape(group, data, scale = SCALE_FACTOR) {
    const corners = getActualCornerPositions(data, scale);
    
    corners.forEach((corner, index) => {
        const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        handle.setAttribute('cx', corner.x);
        handle.setAttribute('cy', corner.y);
        handle.setAttribute('r', CORNER_RADIUS * 1.5);
        handle.setAttribute('fill', 'rgba(0, 123, 255, 0.8)');
        handle.setAttribute('stroke', '#007bff');
        handle.setAttribute('stroke-width', '3');
        handle.style.cursor = 'grab';
        group.appendChild(handle);
        
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', corner.x);
        dot.setAttribute('cy', corner.y);
        dot.setAttribute('r', '3');
        dot.setAttribute('fill', 'white');
        dot.style.pointerEvents = 'none';
        group.appendChild(dot);
    });
}

function getActualCornerPositions(data, scale = SCALE_FACTOR) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    let corners = [];
    
    if (finalShape === 'dreieck') {
        if (variant === 'gleichseitig') {
            const side = (data.side || 6) * scale;
            const height = side * Math.sqrt(3) / 2;
            corners = [
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - height/3 },
                { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y + height*2/3 },
                { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y + height*2/3 }
            ];
        } else if (variant === 'rechtwinklig') {
            const katheteA = (data.katheteA || 4) * scale;
            const katheteB = (data.katheteB || 5) * scale;
            corners = [
                { x: CANVAS_CENTER_X - katheteA/2, y: CANVAS_CENTER_Y + katheteB/3 },
                { x: CANVAS_CENTER_X + katheteA/2, y: CANVAS_CENTER_Y + katheteB/3 },
                { x: CANVAS_CENTER_X - katheteA/2, y: CANVAS_CENTER_Y - katheteB*2/3 }
            ];
        } else {
            const sideA = (data.sideA || 4) * scale;
            const avgSide = ((data.sideB || 5) + (data.sideC || 6)) / 2;
            const height = avgSide * scale * 0.8;
            corners = [
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - height/2 },
                { x: CANVAS_CENTER_X - sideA/2, y: CANVAS_CENTER_Y + height/2 },
                { x: CANVAS_CENTER_X + sideA/2, y: CANVAS_CENTER_Y + height/2 }
            ];
        }
    } else if (finalShape === 'quadrat') {
        const side = (data.side || 5) * scale;
        corners = [
            { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y - side/2 },
            { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y - side/2 },
            { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y + side/2 },
            { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y + side/2 }
        ];
    } else {
        // Standard Rechteck
        const length = (data.length || 8) * scale;
        const width = (data.width || 5) * scale;
        corners = [
            { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y - width/2 },
            { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y - width/2 },
            { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y + width/2 },
            { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y + width/2 }
        ];
    }
    
    // Wende Rotation an
    if (currentRotation !== 0) {
        const angle = (currentRotation * Math.PI) / 180;
        corners = corners.map(corner => {
            const relX = corner.x - CANVAS_CENTER_X;
            const relY = corner.y - CANVAS_CENTER_Y;
            return {
                x: CANVAS_CENTER_X + relX * Math.cos(angle) - relY * Math.sin(angle),
                y: CANVAS_CENTER_Y + relX * Math.sin(angle) + relY * Math.cos(angle)
            };
        });
    }
    
    return corners;
}

function drawLabelsOnShape(group, data, scale = SCALE_FACTOR) {
    const corners = getActualCornerPositions(data, scale);
    const finalShape = determineActualShape();
    
    if (finalShape === 'dreieck' && corners.length >= 3) {
        const sideAMidX = (corners[1].x + corners[2].x) / 2;
        const sideAMidY = (corners[1].y + corners[2].y) / 2;
        const sideALabel = createLabel(sideAMidX, sideAMidY + 15, 'A', '#dc3545');
        group.appendChild(sideALabel);
        
        const sideBMidX = (corners[0].x + corners[1].x) / 2;
        const sideBMidY = (corners[0].y + corners[1].y) / 2;
        const sideBLabel = createLabel(sideBMidX - 15, sideBMidY, 'B', '#28a745');
        group.appendChild(sideBLabel);
        
        const sideCMidX = (corners[0].x + corners[2].x) / 2;
        const sideCMidY = (corners[0].y + corners[2].y) / 2;
        const sideCLabel = createLabel(sideCMidX + 15, sideCMidY, 'C', '#ffc107');
        group.appendChild(sideCLabel);
    } else if (corners.length >= 4) {
        const labels = ['A', 'B', 'C', 'D'];
        const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107'];
        const offsets = [
            { x: 0, y: -12 },
            { x: 12, y: 0 },
            { x: 0, y: 15 },
            { x: -12, y: 0 }
        ];
        
        for (let i = 0; i < Math.min(4, corners.length); i++) {
            const nextI = (i + 1) % corners.length;
            const midX = (corners[i].x + corners[nextI].x) / 2;
            const midY = (corners[i].y + corners[nextI].y) / 2;
            const label = createLabel(midX + offsets[i].x, midY + offsets[i].y, labels[i], colors[i]);
            group.appendChild(label);
        }
    }
}

function createLabel(x, y, text, color) {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', y);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', color);
    label.setAttribute('font-size', '12');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('stroke', 'white');
    label.setAttribute('stroke-width', '2');
    label.setAttribute('paint-order', 'stroke');
    label.textContent = text;
    return label;
}

// Vereinfachte Mouse Events (optional für Corner-Dragging)
function handleMouseDown(event) {
    event.preventDefault();
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    if (isNearCorner(mouseX, mouseY)) {
        startDragging(mouseX, mouseY);
    }
}

function handleMouseMove(event) {
    if (!isDragging) {
        const rect = svg.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        svg.style.cursor = isNearCorner(mouseX, mouseY) ? 'grab' : 'default';
        return;
    }
    
    event.preventDefault();
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    updateRotation(mouseX, mouseY);
}

function handleMouseUp(event) {
    if (isDragging) {
        stopDragging();
    }
}

function isNearCorner(x, y) {
    const data = getCurrentFormData();
    const scale = calculateDynamicScale(data);
    const corners = getActualCornerPositions(data, scale);
    
    for (let i = 0; i < corners.length; i++) {
        const corner = corners[i];
        const distance = Math.sqrt((x - corner.x) * (x - corner.x) + (y - corner.y) * (y - corner.y));
        if (distance <= CORNER_RADIUS * 3) {
            return true;
        }
    }
    return false;
}

function startDragging(x, y) {
    isDragging = true;
    svg.style.cursor = 'grabbing';
    dragStartAngle = Math.atan2(y - rotationCenter.y, x - rotationCenter.x);
    dragStartRotation = currentRotation;
}

function updateRotation(x, y) {
    if (!isDragging) return;
    
    const currentAngle = Math.atan2(y - rotationCenter.y, x - rotationCenter.x);
    let angleDiff = currentAngle - dragStartAngle;
    
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    let newRotation = dragStartRotation + (angleDiff * 180 / Math.PI);
    
    currentRotation = newRotation;
    while (currentRotation > 180) currentRotation -= 360;
    while (currentRotation < -180) currentRotation += 360;
    
    // Update auch den Slider
    const rotationSlider = document.getElementById('rotation');
    if (rotationSlider) {
        rotationSlider.value = currentRotation;
        const valueDisplay = rotationSlider.parentNode.querySelector('.input-unit');
        if (valueDisplay) {
            valueDisplay.textContent = Math.round(currentRotation) + '°';
        }
    }
    
    updateShape();
    updateRotationDisplay();
}

function stopDragging() {
    isDragging = false;
    svg.style.cursor = 'default';
}

// Berechnungen
function updateCalculations(data) {
    let area = 0;
    let perimeter = 0;
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    switch (finalShape) {
        case 'rechteck':
            const length = data.length || 8;
            const width = data.width || 5;
            area = length * width;
            perimeter = 2 * (length + width);
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
        default:
            area = 40;
            perimeter = 26;
    }
    
    const areaElement = document.getElementById('calc-area');
    const perimeterElement = document.getElementById('calc-perimeter');
    
    if (areaElement) areaElement.textContent = area.toFixed(2) + ' m²';
    if (perimeterElement) perimeterElement.textContent = perimeter.toFixed(2) + ' m';
}

// Event Listeners
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
        resetBtn.addEventListener('click', resetToDefaults);
    }
}

function resetToDefaults() {
    currentRotation = 0;
    
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    inputs.forEach(input => {
        switch(input.id) {
            case 'rotation': input.value = '0'; break;
            case 'side': input.value = currentVariant === 'quadrat' ? '5' : '6'; break;
            case 'katheteA': input.value = '4'; break;
            case 'katheteB': input.value = '5'; break;
            case 'sideA': input.value = '4'; break;
            case 'sideB': input.value = '5'; break;
            case 'sideC': input.value = '6'; break;
            case 'length': input.value = '8'; break;
            case 'width': input.value = '5'; break;
        }
    });
    
    // Update value displays
    const rotationSlider = document.getElementById('rotation');
    if (rotationSlider) {
        const valueDisplay = rotationSlider.parentNode.querySelector('.input-unit');
        if (valueDisplay) {
            valueDisplay.textContent = '0°';
        }
    }
    
    updateShape();
}

function saveCurrentData() {
    const currentData = getCurrentFormData();
    currentData.rotation = currentRotation;
    
    if (!projectData.roofShape) { projectData.roofShape = {}; }
    Object.assign(projectData.roofShape, currentData);
    
    projectData.geometry = {
        shapeType: determineActualShape(),
        variant: determineActualVariant(),
        rotation: currentRotation,
        area: calculateArea(currentData),
        dimensions: calculateDimensions(currentData)
    };
    
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
    } catch (e) {
        sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
    }
}

function calculateArea(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    switch (finalShape) {
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
            }
            return 10;
        default:
            return 40;
    }
}

function calculateDimensions(data) {
    const finalShape = determineActualShape();
    
    switch (finalShape) {
        case 'rechteck':
            return { length: data.length || 8, width: data.width || 5 };
        case 'quadrat':
            const side = data.side || 5;
            return { length: side, width: side };
        default:
            return { length: 8, width: 5 };
    }
}

console.log('Korrigierte Editor ohne Syntaxfehler geladen');
