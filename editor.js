// Editor.js - Komplett neu und sauber

let projectData = {};
let currentShape = '';
let currentVariant = '';
let svg;
let isUpdating = false;

// Transformation state
let currentRotation = 0;

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
    console.log('Editor wird geladen...');
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
    
    svg.addEventListener('mousedown', handleMouseDown);
    svg.addEventListener('mousemove', handleMouseMove);
    svg.addEventListener('mouseup', handleMouseUp);
    svg.addEventListener('mouseleave', handleMouseUp);
    
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
        
        // Zeige grün wenn nahe bei 90° Schritten
        if (Math.abs(roundedRotation % 90) < 2) {
            display.style.background = '#28a745';
        } else {
            display.style.background = 'rgba(0, 0, 0, 0.8)';
        }
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
        'dreieck': 'Dreieck', 'rechteck': 'Rechteck', 'quadrat': 'Quadrat',
        'gleichseitig': 'Gleichseitiges Dreieck', 'rechtwinklig': 'Rechtwinkliges Dreieck'
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
    
    createInputFields();
    updateShape();
}

function determineActualShape() {
    if (currentVariant === 'quadrat') return 'quadrat';
    if (currentVariant === 'trapez') return 'trapez';
    return currentShape || 'rechteck';
}

function createInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
    container.innerHTML = '';
    const finalShape = determineActualShape();
    const savedData = projectData.roofShape || {};
    
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
    unit.textContent = 'm';
    
    inputWrapper.appendChild(input);
    inputWrapper.appendChild(unit);
    wrapper.appendChild(label);
    wrapper.appendChild(inputWrapper);
    
    return wrapper;
}

function handleInputChange() {
    if (isUpdating) return;
    isUpdating = true;
    
    updateShape();
    
    setTimeout(() => { isUpdating = false; }, 50);
}

function updateShape() {
    if (!svg) return;
    
    const data = getCurrentFormData();
    
    // Lösche alles
    const shapeGroup = document.getElementById('roof-shape');
    const cornerGroup = document.getElementById('corner-handles');
    const labelsGroup = document.getElementById('labels');
    
    if (shapeGroup) shapeGroup.innerHTML = '';
    if (cornerGroup) cornerGroup.innerHTML = '';
    if (labelsGroup) labelsGroup.innerHTML = '';
    
    // Zeichne neu
    if (shapeGroup) {
        drawCurrentShape(shapeGroup, data, SCALE_FACTOR);
    }
    
    if (cornerGroup) {
        drawCornerHandlesOnShape(cornerGroup, data, SCALE_FACTOR);
    }
    
    if (labelsGroup) {
        drawLabelsOnShape(labelsGroup, data, SCALE_FACTOR);
    }
    
    updateCalculations(data);
    updateRotationDisplay();
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
    } else {
        drawRectangleShape(group, data, scale);
    }
    
    // Wende Rotation an
    if (currentRotation !== 0) {
        group.setAttribute('transform', `rotate(${currentRotation} ${CANVAS_CENTER_X} ${CANVAS_CENTER_Y})`);
    }
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

function drawTriangleShape(group, data, scale = SCALE_FACTOR) {
    const variant = currentVariant;
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

function drawCornerHandlesOnShape(group, data, scale = SCALE_FACTOR) {
    const corners = getActualCornerPositions(data, scale);
    
    corners.forEach((corner, index) => {
        const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        handle.setAttribute('cx', corner.x);
        handle.setAttribute('cy', corner.y);
        handle.setAttribute('r', CORNER_RADIUS);
        handle.setAttribute('fill', 'rgba(0, 123, 255, 0.7)');
        handle.setAttribute('stroke', '#007bff');
        handle.setAttribute('stroke-width', '2');
        handle.style.cursor = 'grab';
        group.appendChild(handle);
        
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', corner.x);
        dot.setAttribute('cy', corner.y);
        dot.setAttribute('r', '2');
        dot.setAttribute('fill', 'white');
        dot.style.pointerEvents = 'none';
        group.appendChild(dot);
    });
}

function getActualCornerPositions(data, scale = SCALE_FACTOR) {
    const finalShape = determineActualShape();
    let corners = [];
    
    if (finalShape === 'dreieck') {
        if (currentVariant === 'gleichseitig') {
            const side = (data.side || 6) * scale;
            const height = side * Math.sqrt(3) / 2;
            corners = [
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - height/3 },
                { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y + height*2/3 },
                { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y + height*2/3 }
            ];
        } else if (currentVariant === 'rechtwinklig') {
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
        
        for (let i = 0; i < 4; i++) {
            const nextI = (i + 1) % 4;
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

// === MAUS-EVENTS ===
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
    const corners = getActualCornerPositions(data, SCALE_FACTOR);
    
    for (const corner of corners) {
        const distance = Math.sqrt((x - corner.x) * (x - corner.x) + (y - corner.y) * (y - corner.y));
        if (distance <= CORNER_RADIUS * 2) {
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
    
    // Normalisiere die Rotation
    while (newRotation > 180) newRotation -= 360;
    while (newRotation < -180) newRotation += 360;
    
    // EINFACHES EINRASTEN bei 90° Schritten
    const snapTolerance = 3; // Grad
    const snapTargets = [0, 90, 180, -90, -180];
    
    let snapped = false;
    for (const target of snapTargets) {
        if (Math.abs(newRotation - target) <= snapTolerance) {
            currentRotation = target;
            snapped = true;
            break;
        }
    }
    
    if (!snapped) {
        currentRotation = newRotation;
    }
    
    updateShape();
}

function stopDragging() {
    isDragging = false;
    svg.style.cursor = 'default';
}

// === BERECHNUNGEN ===
function updateCalculations(data) {
    let area = 0;
    let perimeter = 0;
    const finalShape = determineActualShape();
    
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
            if (currentVariant === 'rechtwinklig') {
                const a = data.katheteA || 4;
                const b = data.katheteB || 5;
                area = 0.5 * a * b;
                const c = Math.sqrt(a*a + b*b);
                perimeter = a + b + c;
            } else if (currentVariant === 'gleichseitig') {
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
    }
    
    const areaElement = document.getElementById('calc-area');
    const perimeterElement = document.getElementById('calc-perimeter');
    
    if (areaElement) areaElement.textContent = area.toFixed(2) + ' m²';
    if (perimeterElement) perimeterElement.textContent = perimeter.toFixed(2) + ' m';
}

// === EVENT LISTENERS ===
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
    currentRotation = 0;
    
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    inputs.forEach(input => {
        switch(input.id) {
            case 'side': 
                input.value = currentVariant === 'quadrat' ? '5' : '6'; 
                break;
            case 'katheteA': input.value = '4'; break;
            case 'katheteB': input.value = '5'; break;
            case 'sideA': input.value = '4'; break;
            case 'sideB': input.value = '5'; break;
            case 'sideC': input.value = '6'; break;
            case 'length': input.value = '8'; break;
            case 'width': input.value = '5'; break;
        }
    });
    
    updateShape();
    showFeedback('Zurückgesetzt: Form, Rotation und alle Parameter');
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
    currentData.rotation = currentRotation;
    
    if (!projectData.roofShape) { projectData.roofShape = {}; }
    Object.assign(projectData.roofShape, currentData);
    
    projectData.roofShape.points = generateRoofPoints(currentData);
    
    projectData.geometry = {
        shapeType: determineActualShape(),
        variant: currentVariant,
        points: projectData.roofShape.points,
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

function generateRoofPoints(data) {
    const finalShape = determineActualShape();
    let points = [];
    
    switch (finalShape) {
        case 'rechteck':
            const length = data.length || 8;
            const width = data.width || 5;
            points = [
                { x: 0, y: 0 }, { x: length, y: 0 },
                { x: length, y: width }, { x: 0, y: width }
            ];
            break;
        case 'quadrat':
            const side = data.side || 5;
            points = [
                { x: 0, y: 0 }, { x: side, y: 0 },
                { x: side, y: side }, { x: 0, y: side }
            ];
            break;
        case 'dreieck':
            if (currentVariant === 'gleichseitig') {
                const triangleSide = data.side || 6;
                const height = triangleSide * Math.sqrt(3) / 2;
                points = [
                    { x: triangleSide/2, y: height },
                    { x: 0, y: 0 }, { x: triangleSide, y: 0 }
                ];
            } else if (currentVariant === 'rechtwinklig') {
                const a = data.katheteA || 4;
                const b = data.katheteB || 5;
                points = [
                    { x: 0, y: 0 }, { x: a, y: 0 }, { x: 0, y: b }
                ];
            }
            break;
        default:
            points = [
                { x: 0, y: 0 }, { x: 8, y: 0 },
                { x: 8, y: 5 }, { x: 0, y: 5 }
            ];
    }
    
    return points;
}

function calculateArea(data) {
    const finalShape = determineActualShape();
    
    switch (finalShape) {
        case 'rechteck':
            return (data.length || 8) * (data.width || 5);
        case 'quadrat':
            const side = data.side || 5;
            return side * side;
        case 'dreieck':
            if (currentVariant === 'rechtwinklig') {
                return 0.5 * (data.katheteA || 4) * (data.katheteB || 5);
            } else if (currentVariant === 'gleichseitig') {
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

console.log('Sauberer Editor geladen - Version 2.0');
