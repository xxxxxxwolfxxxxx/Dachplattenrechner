// Interaktive editor.js - Drehen durch Ziehen an den Ecken

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
            profile: {
                profilname: 'Standard Profil',
                deckbreite: 1000,
                lieferbreite: 1050,
                seitenueberlappung: 50
            },
            roofShape: {
                baseShape: 'viereck',
                variant: 'rechteck'
            }
        };
        return;
    }

    try {
        projectData = JSON.parse(dataString);
        
        if (!projectData.profile) {
            projectData.profile = {
                profilname: 'Standard Profil',
                deckbreite: 1000,
                lieferbreite: 1050,
                seitenueberlappung: 50
            };
        }
        
        if (!projectData.roofShape) {
            projectData.roofShape = {
                baseShape: 'viereck',
                variant: 'rechteck'
            };
        }
        
    } catch (e) {
        projectData = {
            profile: {
                profilname: 'Standard Profil',
                deckbreite: 1000,
                lieferbreite: 1050,
                seitenueberlappung: 50
            },
            roofShape: {
                baseShape: 'viereck',
                variant: 'rechteck'
            }
        };
    }
}

function initializeCanvas() {
    svg = document.getElementById('main-svg');
    
    if (!svg) {
        createFallbackCanvas();
    }
    
    // SVG für Maus-Events vorbereiten
    svg.addEventListener('mousedown', handleMouseDown);
    svg.addEventListener('mousemove', handleMouseMove);
    svg.addEventListener('mouseup', handleMouseUp);
    svg.addEventListener('mouseleave', handleMouseUp);
    
    // Touch-Events für mobile Geräte
    svg.addEventListener('touchstart', handleTouchStart);
    svg.addEventListener('touchmove', handleTouchMove);
    svg.addEventListener('touchend', handleTouchEnd);
    
    rotationCenter = { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y };
}

function createFallbackCanvas() {
    const container = document.querySelector('.canvas-container') || document.querySelector('main');
    
    if (!container) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-wrapper';
    wrapper.style.cssText = `
        border: 2px solid #e9ecef;
        border-radius: 8px;
        background: white;
        width: 600px;
        height: 400px;
        margin: 20px auto;
        position: relative;
        user-select: none;
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
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        font-weight: bold;
        z-index: 1000;
        pointer-events: none;
    `;
    display.textContent = '0°';
    
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (canvasWrapper) {
        canvasWrapper.appendChild(display);
    }
}

function updateRotationDisplay() {
    const display = document.getElementById('rotation-display');
    if (display) {
        display.textContent = currentRotation.toFixed(1) + '°';
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
        if (element) {
            element.textContent = value;
        }
    });
}

function updateShapeTitle() {
    const roofShape = projectData.roofShape;
    if (!roofShape) return;
    
    const shapeNames = {
        'dreieck': 'Dreieck',
        'rechteck': 'Rechteck',
        'quadrat': 'Quadrat',
        'parallelogramm': 'Parallelogramm',
        'trapez': 'Trapez',
        'rhombus': 'Rhombus',
        'kreis': 'Kreis',
        'oval': 'Oval',
        'gleichseitig': 'Gleichseitiges Dreieck',
        'rechtwinklig': 'Rechtwinkliges Dreieck',
        'ungleichschenklig': 'Ungleichschenkliges Dreieck'
    };
    
    const shapeName = shapeNames[roofShape.variant] || shapeNames[roofShape.baseShape] || 'Unbekannt';
    
    const element = document.getElementById('current-shape-name');
    if (element) {
        element.textContent = shapeName;
    }
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
        if (roofShape.mirroredH !== undefined) isMirroredH = roofShape.mirroredH;
        if (roofShape.mirroredV !== undefined) isMirroredV = roofShape.mirroredV;
    }
    
    createInputFields();
    updateShape();
}

function determineActualShape() {
    if (currentVariant === 'quadrat') return 'quadrat';
    if (currentVariant === 'trapez') return 'trapez';
    if (currentVariant === 'parallelogramm') return 'parallelogramm';
    if (currentVariant === 'rhombus') return 'rhombus';
    if (currentVariant === 'langloch') return 'langloch';
    if (['fuenfeck', 'sechseck', 'achteck', 'lform', 'tform', 'uform'].includes(currentVariant)) {
        return 'vieleck';
    }
    return currentShape || 'rechteck';
}

function determineActualVariant() {
    const validVariants = {
        'dreieck': ['gleichseitig', 'rechtwinklig', 'ungleichschenklig', 'allgemein'],
        'kreis': ['kreis', 'vollkreis', 'halbkreis', 'viertelkreis', 'oval'],
        'rechteck': ['rechteck'],
        'quadrat': ['quadrat'],
        'trapez': ['trapez'],
        'parallelogramm': ['parallelogramm'],
        'rhombus': ['rhombus'],
        'langloch': ['langloch'],
        'vieleck': ['fuenfeck', 'sechseck', 'achteck', 'lform', 'tform', 'uform']
    };
    
    const finalShape = determineActualShape();
    
    if (validVariants[finalShape] && validVariants[finalShape].includes(currentVariant)) {
        return currentVariant;
    }
    
    return validVariants[finalShape] ? validVariants[finalShape][0] : 'standard';
}

function createInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    
    const savedData = projectData.roofShape || {};
    
    if (finalShape === 'dreieck') {
        createTriangleInputs(finalVariant, container, savedData);
    } else if (finalShape === 'kreis') {
        createCircleInputs(finalVariant, container, savedData);
    } else if (finalShape === 'rechteck') {
        createRectangleInputs('rechteck', container, savedData);
    } else if (finalShape === 'quadrat') {
        createRectangleInputs('quadrat', container, savedData);
    } else if (finalShape === 'trapez') {
        createTrapezInputs(container, savedData);
    } else if (finalShape === 'parallelogramm') {
        createParallelogrammInputs(container, savedData);
    } else if (finalShape === 'rhombus') {
        createRhombusInputs(container, savedData);
    } else if (finalShape === 'langloch') {
        createLanglochInputs(container, savedData);
    } else if (finalShape === 'vieleck') {
        createPolygonInputs(finalVariant, container, savedData);
    } else {
        createRectangleInputs('rechteck', container, savedData);
    }
}

function createTriangleInputs(variant, container, savedData) {
    switch (variant) {
        case 'gleichseitig':
            container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '6'));
            break;
        case 'rechtwinklig':
            container.appendChild(createInput('Kathete A (m)', 'katheteA', savedData.katheteA || '4'));
            container.appendChild(createInput('Kathete B (m)', 'katheteB', savedData.katheteB || '5'));
            break;
        default:
            container.appendChild(createInput('Seite A (m)', 'sideA', savedData.sideA || '4'));
            container.appendChild(createInput('Seite B (m)', 'sideB', savedData.sideB || '5'));
            container.appendChild(createInput('Seite C (m)', 'sideC', savedData.sideC || '6'));
    }
}

function createCircleInputs(variant, container, savedData) {
    switch (variant) {
        case 'oval':
            container.appendChild(createInput('Halbachse A (m)', 'radiusA', savedData.radiusA || '5'));
            container.appendChild(createInput('Halbachse B (m)', 'radiusB', savedData.radiusB || '3'));
            break;
        default:
            container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '4'));
    }
}

function createRectangleInputs(variant, container, savedData) {
    if (variant === 'quadrat') {
        container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '5'));
    } else {
        container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
        container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
    }
}

function createTrapezInputs(container, savedData) {
    container.appendChild(createInput('Basis A (m)', 'baseA', savedData.baseA || '8'));
    container.appendChild(createInput('Basis B (m)', 'baseB', savedData.baseB || '5'));
    container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '4'));
}

function createParallelogrammInputs(container, savedData) {
    container.appendChild(createInput('Basis (m)', 'base', savedData.base || '8'));
    container.appendChild(createInput('Seite (m)', 'side', savedData.side || '5'));
    container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '4'));
}

function createRhombusInputs(container, savedData) {
    container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '5'));
    container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '4'));
}

function createLanglochInputs(container, savedData) {
    container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
    container.appendChild(createInput('Breite (m)', 'width', savedData.width || '3'));
    container.appendChild(createInput('Eckenradius (m)', 'radius', savedData.radius || '1'));
}

function createPolygonInputs(variant, container, savedData) {
    switch (variant) {
        case 'fuenfeck':
        case 'sechseck':
        case 'achteck':
            container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '5'));
            break;
        default:
            container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
            container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
    }
}

function createInput(labelText, id, defaultValue) {
    defaultValue = defaultValue || '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'input-group';
    
    const label = document.createElement('label');
    label.textContent = labelText;
    
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-group-wrapper';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.id = id;
    input.value = defaultValue;
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
    setTimeout(() => {
        isUpdating = false;
    }, 50);
}

// MAUS- UND TOUCH-EVENT HANDLER
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

function handleTouchStart(event) {
    event.preventDefault();
    if (event.touches.length !== 1) return;
    
    const rect = svg.getBoundingClientRect();
    const touch = event.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    
    if (isNearCorner(touchX, touchY)) {
        startDragging(touchX, touchY);
    }
}

function handleTouchMove(event) {
    if (!isDragging || event.touches.length !== 1) return;
    
    event.preventDefault();
    const rect = svg.getBoundingClientRect();
    const touch = event.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    
    updateRotation(touchX, touchY);
}

function handleTouchEnd(event) {
    if (isDragging) {
        stopDragging();
    }
}

function isNearCorner(x, y) {
    const corners = getShapeCorners();
    
    for (const corner of corners) {
        const distance = Math.sqrt((x - corner.x) * (x - corner.x) + (y - corner.y) * (y - corner.y));
        if (distance <= CORNER_RADIUS * 2) {
            return true;
        }
    }
    
    return false;
}

function getShapeCorners() {
    const currentData = getCurrentFormData();
    const shapePoints = getRawShapePoints(currentData);
    
    if (!shapePoints || shapePoints.length === 0) return [];
    
    return shapePoints.map(point => {
        const canvasX = CANVAS_CENTER_X + point.x * SCALE_FACTOR;
        const canvasY = CANVAS_CENTER_Y - point.y * SCALE_FACTOR;
        return transformPoint(canvasX, canvasY);
    });
}

function startDragging(x, y) {
    isDragging = true;
    svg.style.cursor = 'grabbing';
    
    dragStartAngle = Math.atan2(y - rotationCenter.y, x - rotationCenter.x);
    dragStartRotation = currentRotation;
    
    console.log('Drag gestartet');
}

function updateRotation(x, y) {
    if (!isDragging) return;
    
    const currentAngle = Math.atan2(y - rotationCenter.y, x - rotationCenter.x);
    
    let angleDiff = currentAngle - dragStartAngle;
    
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    const newRotation = dragStartRotation + (angleDiff * 180 / Math.PI);
    
    currentRotation = newRotation;
    while (currentRotation > 180) currentRotation -= 360;
    while (currentRotation < -180) currentRotation += 360;
    
    updateShape();
    updateRotationDisplay();
}

function stopDragging() {
    isDragging = false;
    svg.style.cursor = 'default';
    
    console.log('Drag beendet');
}

function updateShape() {
    if (!svg || isUpdating) return;
    
    isUpdating = true;
    
    const shapeGroup = document.getElementById('roof-shape');
    const cornerGroup = document.getElementById('corner-handles');
    const labelsGroup = document.getElementById('labels');
    
    if (!shapeGroup) {
        isUpdating = false;
        return;
    }
    
    shapeGroup.innerHTML = '';
    if (cornerGroup) cornerGroup.innerHTML = '';
    if (labelsGroup) labelsGroup.innerHTML = '';
    
    const allTexts = svg.querySelectorAll('text');
    allTexts.forEach(text => text.remove());
    
    const currentData = getCurrentFormData();
    
    drawTransformedShape(shapeGroup, currentData);
    
    if (cornerGroup) {
        drawCornerHandles(cornerGroup, currentData);
    }
    
    const targetGroup = labelsGroup || svg;
    drawLabelsAndAnnotations(targetGroup, currentData);
    
    updateCalculations(currentData);
    updateRotationDisplay();
    
    setTimeout(() => {
        isUpdating = false;
    }, 50);
}

function drawCornerHandles(group, data) {
    const corners = getShapeCorners();
    
    corners.forEach((corner, index) => {
        const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        handle.setAttribute('cx', corner.x);
        handle.setAttribute('cy', corner.y);
        handle.setAttribute('r', CORNER_RADIUS);
        handle.setAttribute('fill', 'rgba(0, 123, 255, 0.7)');
        handle.setAttribute('stroke', '#007bff');
        handle.setAttribute('stroke-width', '2');
        handle.setAttribute('class', 'corner-handle');
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

function getCurrentFormData() {
    const data = { 
        shape: currentShape,
        variant: currentVariant 
    };
    
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    
    inputs.forEach(input => {
        if (input.value) {
            const numValue = parseFloat(input.value);
            if (!isNaN(numValue)) {
                data[input.id] = numValue;
            }
        }
    });
    
    return data;
}

function drawTransformedShape(group, data) {
    drawShape(group, data);
    
    let transforms = [];
    
    if (currentRotation !== 0) {
        transforms.push('rotate(' + currentRotation + ' ' + CANVAS_CENTER_X + ' ' + CANVAS_CENTER_Y + ')');
    }
    
    if (isMirroredH || isMirroredV) {
        const scaleX = isMirroredH ? -1 : 1;
        const scaleY = isMirroredV ? -1 : 1;
        transforms.push('translate(' + CANVAS_CENTER_X + ' ' + CANVAS_CENTER_Y + ')');
        transforms.push('scale(' + scaleX + ' ' + scaleY + ')');
        transforms.push('translate(' + (-CANVAS_CENTER_X) + ' ' + (-CANVAS_CENTER_Y) + ')');
    }
    
    if (transforms.length > 0) {
        const fullTransform = transforms.join(' ');
        group.setAttribute('transform', fullTransform);
    } else {
        group.removeAttribute('transform');
    }
}

function transformPoint(x, y) {
    let newX = x;
    let newY = y;
    
    if (isMirroredH || isMirroredV) {
        const relX = x - CANVAS_CENTER_X;
        const relY = y - CANVAS_CENTER_Y;
        
        const scaleX = isMirroredH ? -1 : 1;
        const scaleY = isMirroredV ? -1 : 1;
        
        newX = CANVAS_CENTER_X + relX * scaleX;
        newY = CANVAS_CENTER_Y + relY * scaleY;
    }
    
    if (currentRotation !== 0) {
        const angle = (currentRotation * Math.PI) / 180;
        const relX = newX - CANVAS_CENTER_X;
        const relY = newY - CANVAS_CENTER_Y;
        
        newX = CANVAS_CENTER_X + relX * Math.cos(angle) - relY * Math.sin(angle);
        newY = CANVAS_CENTER_Y + relX * Math.sin(angle) + relY * Math.cos(angle);
    }
    
    return { x: newX, y: newY };
}

function getRawShapePoints(data) {
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    
    let points = [];
    
    if (finalShape === 'dreieck') {
        if (finalVariant === 'gleichseitig') {
            const side = data.side || 6;
            const height = side * Math.sqrt(3) / 2;
            points = [
                { x: side/2, y: height/2 },
                { x: 0, y: -height/2 },
                { x: side, y: -height/2 }
            ];
        } else if (finalVariant === 'rechtwinklig') {
            const a = data.katheteA || 4;
            const b = data.katheteB || 5;
            points = [
                { x: 0, y: 0 },
                { x: a, y: 0 },
                { x: 0, y: b }
            ];
        } else {
            const a = data.sideA || 4;
            const b = data.sideB || 5;
            const c = data.sideC || 6;
            
            const height = Math.sqrt(Math.max(0, c*c - (a/2)*(a/2)));
            points = [
                { x: a/2, y: height/2 },
                { x: 0, y: -height/2 },
                { x: a, y: -height/2 }
            ];
        }
    } else if (finalShape === 'rechteck') {
        const length = data.length || 8;
        const width = data.width || 5;
        points = [
            { x: 0, y: width/2 },
            { x: length, y: width/2 },
            { x: length, y: -width/2 },
            { x: 0, y: -width/2 }
        ];
    } else if (finalShape === 'quadrat') {
        const side = data.side || 5;
        points = [
            { x: 0, y: side/2 },
            { x: side, y: side/2 },
            { x: side, y: -side/2 },
            { x: 0, y: -side/2 }
        ];
    } else if (finalShape === 'trapez') {
        const baseA = data.baseA || 8;
        const baseB = data.baseB || 5;
        const height = data.height || 4;
        const offset = (baseA - baseB) / 2;
        points = [
            { x: offset, y: height/2 },
            { x: baseA - offset, y: height/2 },
            { x: baseA, y: -height/2 },
            { x: 0, y: -height/2 }
        ];
    } else if (finalShape === 'kreis') {
        const radius = data.radius || 4;
        for (let i = 0; i < 8; i++) {
            const angle = (i * 2 * Math.PI) / 8;
            points.push({
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle)
            });
        }
    } else {
        points = [
            { x: 0, y: 2.5 },
            { x: 8, y: 2.5 },
            { x: 8, y: -2.5 },
            { x: 0, y: -2.5 }
        ];
    }
    
    return points;
}

function drawLabelsAndAnnotations(group, data) {
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    
    if (finalShape === 'dreieck') {
        drawTriangleLabels(group, data, finalVariant);
    } else if (finalShape === 'rechteck' || finalShape === 'quadrat') {
        drawRectangleLabels(group, data);
    } else if (finalShape === 'trapez') {
        drawTrapezLabels(group, data);
    } else if (finalShape === 'kreis') {
        drawCircleLabels(group, data, finalVariant);
    }
}

function drawTriangleLabels(group, data, variant) {
    if (variant === 'gleichseitig') {
        // Label direkt an der Basis
        const sideLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        sideLabel.setAttribute('x', CANVAS_CENTER_X);
        sideLabel.setAttribute('y', CANVAS_CENTER_Y + 80); // Näher an der Form
        sideLabel.setAttribute('text-anchor', 'middle');
        sideLabel.setAttribute('fill', '#dc3545');
        sideLabel.setAttribute('font-size', '14');
        sideLabel.setAttribute('font-weight', 'bold');
        sideLabel.textContent = 'Seite: ' + (data.side || 6).toFixed(1) + 'm';
        group.appendChild(sideLabel);
        
        // Labels direkt an den Seiten
        const side = (data.side || 6) * SCALE_FACTOR;
        const height = side * Math.sqrt(3) / 2;
        
        // Basis-Label (unten)
        const basisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        basisLabel.setAttribute('x', CANVAS_CENTER_X);
        basisLabel.setAttribute('y', CANVAS_CENTER_Y + height/3 + 20);
        basisLabel.setAttribute('text-anchor', 'middle');
        basisLabel.setAttribute('fill', '#007bff');
        basisLabel.setAttribute('font-size', '12');
        basisLabel.setAttribute('font-weight', 'bold');
        basisLabel.textContent = 'Basis';
        group.appendChild(basisLabel);
        
        // Linke Seite
        const leftLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        leftLabel.setAttribute('x', CANVAS_CENTER_X - side/4);
        leftLabel.setAttribute('y', CANVAS_CENTER_Y);
        leftLabel.setAttribute('text-anchor', 'middle');
        leftLabel.setAttribute('fill', '#28a745');
        leftLabel.setAttribute('font-size', '12');
        leftLabel.setAttribute('font-weight', 'bold');
        leftLabel.setAttribute('transform', 'rotate(-60, ' + (CANVAS_CENTER_X - side/4) + ', ' + CANVAS_CENTER_Y + ')');
        leftLabel.textContent = 'Links';
        group.appendChild(leftLabel);
        
        // Rechte Seite
        const rightLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        rightLabel.setAttribute('x', CANVAS_CENTER_X + side/4);
        rightLabel.setAttribute('y', CANVAS_CENTER_Y);
        rightLabel.setAttribute('text-anchor', 'middle');
        rightLabel.setAttribute('fill', '#ffc107');
        rightLabel.setAttribute('font-size', '12');
        rightLabel.setAttribute('font-weight', 'bold');
        rightLabel.setAttribute('transform', 'rotate(60, ' + (CANVAS_CENTER_X + side/4) + ', ' + CANVAS_CENTER_Y + ')');
        rightLabel.textContent = 'Rechts';
        group.appendChild(rightLabel);
        
    } else if (variant === 'rechtwinklig') {
        const a = (data.katheteA || 4) * SCALE_FACTOR;
        const b = (data.katheteB || 5) * SCALE_FACTOR;
        
        // Kathete A Label (horizontale Seite)
        const kathetaALabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        kathetaALabel.setAttribute('x', CANVAS_CENTER_X);
        kathetaALabel.setAttribute('y', CANVAS_CENTER_Y + b/3 + 20);
        kathetaALabel.setAttribute('text-anchor', 'middle');
        kathetaALabel.setAttribute('fill', '#007bff');
        kathetaALabel.setAttribute('font-size', '12');
        kathetaALabel.setAttribute('font-weight', 'bold');
        kathetaALabel.textContent = 'Kathete A: ' + (data.katheteA || 4).toFixed(1) + 'm';
        group.appendChild(kathetaALabel);
        
        // Kathete B Label (vertikale Seite)
        const kathetaBLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        kathetaBLabel.setAttribute('x', CANVAS_CENTER_X - a/2 - 30);
        kathetaBLabel.setAttribute('y', CANVAS_CENTER_Y);
        kathetaBLabel.setAttribute('text-anchor', 'middle');
        kathetaBLabel.setAttribute('fill', '#28a745');
        kathetaBLabel.setAttribute('font-size', '12');
        kathetaBLabel.setAttribute('font-weight', 'bold');
        kathetaBLabel.setAttribute('transform', 'rotate(-90, ' + (CANVAS_CENTER_X - a/2 - 30) + ', ' + CANVAS_CENTER_Y + ')');
        kathetaBLabel.textContent = 'Kathete B: ' + (data.katheteB || 5).toFixed(1) + 'm';
        group.appendChild(kathetaBLabel);
        
        // Hypotenuse Label
        const hypLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        hypLabel.setAttribute('x', CANVAS_CENTER_X - a/4 + 20);
        hypLabel.setAttribute('y', CANVAS_CENTER_Y - b/6);
        hypLabel.setAttribute('text-anchor', 'middle');
        hypLabel.setAttribute('fill', '#dc3545');
        hypLabel.setAttribute('font-size', '12');
        hypLabel.setAttribute('font-weight', 'bold');
        hypLabel.textContent = 'Hypotenuse';
        group.appendChild(hypLabel);
    }
}

function drawRectangleLabels(group, data) {
    const finalShape = determineActualShape();
    
    if (finalShape === 'quadrat') {
        const side = (data.side || 5) * SCALE_FACTOR;
        
        // Oben
        const topLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        topLabel.setAttribute('x', CANVAS_CENTER_X);
        topLabel.setAttribute('y', CANVAS_CENTER_Y - side/2 - 10);
        topLabel.setAttribute('text-anchor', 'middle');
        topLabel.setAttribute('fill', '#007bff');
        topLabel.setAttribute('font-size', '12');
        topLabel.setAttribute('font-weight', 'bold');
        topLabel.textContent = 'Oben: ' + (data.side || 5).toFixed(1) + 'm';
        group.appendChild(topLabel);
        
        // Rechts
        const rightLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        rightLabel.setAttribute('x', CANVAS_CENTER_X + side/2 + 15);
        rightLabel.setAttribute('y', CANVAS_CENTER_Y + 5);
        rightLabel.setAttribute('text-anchor', 'middle');
        rightLabel.setAttribute('fill', '#28a745');
        rightLabel.setAttribute('font-size', '12');
        rightLabel.setAttribute('font-weight', 'bold');
        rightLabel.setAttribute('transform', 'rotate(90, ' + (CANVAS_CENTER_X + side/2 + 15) + ', ' + (CANVAS_CENTER_Y + 5) + ')');
        rightLabel.textContent = 'Rechts: ' + (data.side || 5).toFixed(1) + 'm';
        group.appendChild(rightLabel);
        
        // Unten
        const bottomLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        bottomLabel.setAttribute('x', CANVAS_CENTER_X);
        bottomLabel.setAttribute('y', CANVAS_CENTER_Y + side/2 + 20);
        bottomLabel.setAttribute('text-anchor', 'middle');
        bottomLabel.setAttribute('fill', '#dc3545');
        bottomLabel.setAttribute('font-size', '12');
        bottomLabel.setAttribute('font-weight', 'bold');
        bottomLabel.textContent = 'Unten: ' + (data.side || 5).toFixed(1) + 'm';
        group.appendChild(bottomLabel);
        
        // Links
        const leftLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        leftLabel.setAttribute('x', CANVAS_CENTER_X - side/2 - 15);
        leftLabel.setAttribute('y', CANVAS_CENTER_Y + 5);
        leftLabel.setAttribute('text-anchor', 'middle');
        leftLabel.setAttribute('fill', '#ffc107');
        leftLabel.setAttribute('font-size', '12');
        leftLabel.setAttribute('font-weight', 'bold');
        leftLabel.setAttribute('transform', 'rotate(-90, ' + (CANVAS_CENTER_X - side/2 - 15) + ', ' + (CANVAS_CENTER_Y + 5) + ')');
        leftLabel.textContent = 'Links: ' + (data.side || 5).toFixed(1) + 'm';
        group.appendChild(leftLabel);
        
    } else {
        // Rechteck
        const width = (data.length || 8) * SCALE_FACTOR;
        const height = (data.width || 5) * SCALE_FACTOR;
        
        // Oben (Länge)
        const topLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        topLabel.setAttribute('x', CANVAS_CENTER_X);
        topLabel.setAttribute('y', CANVAS_CENTER_Y - height/2 - 10);
        topLabel.setAttribute('text-anchor', 'middle');
        topLabel.setAttribute('fill', '#007bff');
        topLabel.setAttribute('font-size', '12');
        topLabel.setAttribute('font-weight', 'bold');
        topLabel.textContent = 'Länge: ' + (data.length || 8).toFixed(1) + 'm';
        group.appendChild(topLabel);
        
        // Rechts (Breite)
        const rightLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        rightLabel.setAttribute('x', CANVAS_CENTER_X + width/2 + 15);
        rightLabel.setAttribute('y', CANVAS_CENTER_Y + 5);
        rightLabel.setAttribute('text-anchor', 'middle');
        rightLabel.setAttribute('fill', '#28a745');
        rightLabel.setAttribute('font-size', '12');
        rightLabel.setAttribute('font-weight', 'bold');
        rightLabel.setAttribute('transform', 'rotate(90, ' + (CANVAS_CENTER_X + width/2 + 15) + ', ' + (CANVAS_CENTER_Y + 5) + ')');
        rightLabel.textContent = 'Breite: ' + (data.width || 5).toFixed(1) + 'm';
        group.appendChild(rightLabel);
        
        // Unten
        const bottomLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        bottomLabel.setAttribute('x', CANVAS_CENTER_X);
        bottomLabel.setAttribute('y', CANVAS_CENTER_Y + height/2 + 20);
        bottomLabel.setAttribute('text-anchor', 'middle');
        bottomLabel.setAttribute('fill', '#dc3545');
        bottomLabel.setAttribute('font-size', '12');
        bottomLabel.setAttribute('font-weight', 'bold');
        bottomLabel.textContent = 'Traufe';
        group.appendChild(bottomLabel);
        
        // Links
        const leftLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        leftLabel.setAttribute('x', CANVAS_CENTER_X - width/2 - 15);
        leftLabel.setAttribute('y', CANVAS_CENTER_Y + 5);
        leftLabel.setAttribute('text-anchor', 'middle');
        leftLabel.setAttribute('fill', '#ffc107');
        leftLabel.setAttribute('font-size', '12');
        leftLabel.setAttribute('font-weight', 'bold');
        leftLabel.setAttribute('transform', 'rotate(-90, ' + (CANVAS_CENTER_X - width/2 - 15) + ', ' + (CANVAS_CENTER_Y + 5) + ')');
        leftLabel.textContent = 'Seite';
        group.appendChild(leftLabel);
    }
}

function drawTrapezLabels(group, data) {
    const baseLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    baseLabel.setAttribute('x', CANVAS_CENTER_X);
    baseLabel.setAttribute('y', CANVAS_CENTER_Y + 120);
    baseLabel.setAttribute('text-anchor', 'middle');
    baseLabel.setAttribute('fill', '#007bff');
    baseLabel.setAttribute('font-size', '12');
    baseLabel.setAttribute('font-weight', 'bold');
    baseLabel.textContent = 'Basis A: ' + (data.baseA || 8).toFixed(1) + 'm, Basis B: ' + (data.baseB || 5).toFixed(1) + 'm, Höhe: ' + (data.height || 4).toFixed(1) + 'm';
    group.appendChild(baseLabel);
}

function drawCircleLabels(group, data, variant) {
    const radiusLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    radiusLabel.setAttribute('x', CANVAS_CENTER_X);
    radiusLabel.setAttribute('y', CANVAS_CENTER_Y + 120);
    radiusLabel.setAttribute('text-anchor', 'middle');
    radiusLabel.setAttribute('fill', '#007bff');
    radiusLabel.setAttribute('font-size', '12');
    radiusLabel.setAttribute('font-weight', 'bold');
    
    if (variant === 'oval') {
        radiusLabel.textContent = 'Halbachse A: ' + (data.radiusA || 5).toFixed(1) + 'm, Halbachse B: ' + (data.radiusB || 3).toFixed(1) + 'm';
    } else {
        radiusLabel.textContent = 'Radius: ' + (data.radius || 4).toFixed(1) + 'm';
    }
    group.appendChild(radiusLabel);
}

function drawShape(group, data) {
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    
    switch (finalShape) {
        case 'dreieck':
            drawTriangle(group, data, finalVariant);
            break;
        case 'kreis':
            drawCircle(group, data, finalVariant);
            break;
        case 'rechteck':
            drawRectangle(group, data, 'rechteck');
            break;
        case 'quadrat':
            drawRectangle(group, data, 'quadrat');
            break;
        case 'trapez':
            drawTrapez(group, data);
            break;
        default:
            drawRectangle(group, data, 'rechteck');
    }
}

function drawRectangle(group, data, variant) {
    let width, height;
    
    if (variant === 'quadrat') {
        const side = (data.side || 5) * SCALE_FACTOR;
        width = height = side;
    } else {
        width = (data.length || 8) * SCALE_FACTOR;
        height = (data.width || 5) * SCALE_FACTOR;
    }
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', CANVAS_CENTER_X - width/2);
    rect.setAttribute('y', CANVAS_CENTER_Y - height/2);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    rect.setAttribute('stroke', '#007bff');
    rect.setAttribute('stroke-width', '3');
    rect.setAttribute('data-shape', 'rectangle');
    
    group.appendChild(rect);
}

function drawTriangle(group, data, variant) {
    let points = '';
    
    if (variant === 'gleichseitig') {
        const side = (data.side || 6) * SCALE_FACTOR;
        const height = side * Math.sqrt(3) / 2;
        
        const top_x = CANVAS_CENTER_X;
        const top_y = CANVAS_CENTER_Y - height/3;
        const left_x = CANVAS_CENTER_X - side/2;
        const left_y = CANVAS_CENTER_Y + height/3;
        const right_x = CANVAS_CENTER_X + side/2;
        const right_y = CANVAS_CENTER_Y + height/3;
        
        points = top_x + ',' + top_y + ' ' + left_x + ',' + left_y + ' ' + right_x + ',' + right_y;
        
    } else if (variant === 'rechtwinklig') {
        const a = (data.katheteA || 4) * SCALE_FACTOR;
        const b = (data.katheteB || 5) * SCALE_FACTOR;
        
        const bottom_left_x = CANVAS_CENTER_X - a/2;
        const bottom_left_y = CANVAS_CENTER_Y + b/3;
        const bottom_right_x = CANVAS_CENTER_X + a/2;
        const bottom_right_y = CANVAS_CENTER_Y + b/3;
        const top_left_x = CANVAS_CENTER_X - a/2;
        const top_left_y = CANVAS_CENTER_Y - b/3;
        
        points = bottom_left_x + ',' + bottom_left_y + ' ' + bottom_right_x + ',' + bottom_right_y + ' ' + top_left_x + ',' + top_left_y;
        
    } else {
        const a = (data.sideA || 4) * SCALE_FACTOR;
        const height = a * 0.8;
        
        const top_x = CANVAS_CENTER_X;
        const top_y = CANVAS_CENTER_Y - height/3;
        const left_x = CANVAS_CENTER_X - a/2;
        const left_y = CANVAS_CENTER_Y + height/3;
        const right_x = CANVAS_CENTER_X + a/2 - 30;
        const right_y = CANVAS_CENTER_Y + height/3;
        
        points = top_x + ',' + top_y + ' ' + left_x + ',' + left_y + ' ' + right_x + ',' + right_y;
    }
    
    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    triangle.setAttribute('points', points);
    triangle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    triangle.setAttribute('stroke', '#007bff');
    triangle.setAttribute('stroke-width', '3');
    triangle.setAttribute('data-shape', 'triangle');
    
    group.appendChild(triangle);
}

function drawCircle(group, data, variant) {
    if (variant === 'oval') {
        const radiusA = (data.radiusA || 5) * SCALE_FACTOR;
        const radiusB = (data.radiusB || 3) * SCALE_FACTOR;
        
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', CANVAS_CENTER_X);
        ellipse.setAttribute('cy', CANVAS_CENTER_Y);
        ellipse.setAttribute('rx', radiusA);
        ellipse.setAttribute('ry', radiusB);
        ellipse.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        ellipse.setAttribute('stroke', '#007bff');
        ellipse.setAttribute('stroke-width', '3');
        ellipse.setAttribute('data-shape', 'ellipse');
        
        group.appendChild(ellipse);
    } else {
        const radius = (data.radius || 4) * SCALE_FACTOR;
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', CANVAS_CENTER_X);
        circle.setAttribute('cy', CANVAS_CENTER_Y);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        circle.setAttribute('stroke', '#007bff');
        circle.setAttribute('stroke-width', '3');
        circle.setAttribute('data-shape', 'circle');
        
        group.appendChild(circle);
    }
}

function drawTrapez(group, data) {
    const baseA = (data.baseA || 8) * SCALE_FACTOR;
    const baseB = (data.baseB || 5) * SCALE_FACTOR;
    const height = (data.height || 4) * SCALE_FACTOR;
    
    const points = (CANVAS_CENTER_X - baseA/2) + ',' + (CANVAS_CENTER_Y + height/2) + ' ' + 
                   (CANVAS_CENTER_X + baseA/2) + ',' + (CANVAS_CENTER_Y + height/2) + ' ' + 
                   (CANVAS_CENTER_X + baseB/2) + ',' + (CANVAS_CENTER_Y - height/2) + ' ' + 
                   (CANVAS_CENTER_X - baseB/2) + ',' + (CANVAS_CENTER_Y - height/2);
    
    const trapez = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    trapez.setAttribute('points', points);
    trapez.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    trapez.setAttribute('stroke', '#007bff');
    trapez.setAttribute('stroke-width', '3');
    trapez.setAttribute('data-shape', 'trapez');
    
    group.appendChild(trapez);
}

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
            if (determineActualVariant() === 'rechtwinklig') {
                const a = data.katheteA || 4;
                const b = data.katheteB || 5;
                area = 0.5 * a * b;
                const c = Math.sqrt(a*a + b*b);
                perimeter = a + b + c;
            } else if (determineActualVariant() === 'gleichseitig') {
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
            
        case 'kreis':
            if (determineActualVariant() === 'oval') {
                const a = data.radiusA || 5;
                const b = data.radiusB || 3;
                area = Math.PI * a * b;
                perimeter = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
            } else {
                const r = data.radius || 4;
                area = Math.PI * r * r;
                perimeter = 2 * Math.PI * r;
            }
            break;
            
        case 'trapez':
            const baseA = data.baseA || 8;
            const baseB = data.baseB || 5;
            const height = data.height || 4;
            area = 0.5 * (baseA + baseB) * height;
            perimeter = baseA + baseB + 2 * Math.sqrt(height * height + Math.pow((baseA - baseB) / 2, 2));
            break;
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
    
    setupToolButtons();
}

function setupToolButtons() {
    const resetBtn = document.getElementById('btn-reset');
    
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            console.log('RESET Button geklickt');
            resetToDefaults();
        });
    }
}

function resetToDefaults() {
    console.log('Setze auf Standard-Werte zurück');
    
    const labelsGroup = document.getElementById('labels');
    if (labelsGroup) labelsGroup.innerHTML = '';
    
    const allTexts = svg.querySelectorAll('text');
    allTexts.forEach(text => text.remove());
    
    currentRotation = 0;
    isMirroredH = false;
    isMirroredV = false;
    
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    
    inputs.forEach(input => {
        switch(input.id) {
            case 'side': input.value = currentVariant === 'quadrat' ? '5' : '6'; break;
            case 'katheteA': input.value = '4'; break;
            case 'katheteB': input.value = '5'; break;
            case 'sideA': input.value = '4'; break;
            case 'sideB': input.value = '5'; break;
            case 'sideC': input.value = '6'; break;
            case 'radius': input.value = '4'; break;
            case 'radiusA': input.value = '5'; break;
            case 'radiusB': input.value = '3'; break;
            case 'length': input.value = '8'; break;
            case 'width': input.value = '5'; break;
            case 'base': input.value = '8'; break;
            case 'baseA': input.value = '8'; break;
            case 'baseB': input.value = '5'; break;
            case 'height': input.value = '4'; break;
        }
    });
    
    updateShape();
    showFeedback('Zurückgesetzt: Form, Rotation und alle Parameter');
}

function showFeedback(message) {
    console.log('Feedback: ' + message);
    
    const existingFeedback = document.querySelectorAll('.feedback-message');
    existingFeedback.forEach(function(fb) { 
        fb.remove(); 
    });
    
    const feedback = document.createElement('div');
    feedback.className = 'feedback-message';
    feedback.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        max-width: 300px;
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;
    
    if (!document.getElementById('feedback-styles')) {
        const style = document.createElement('style');
        style.id = 'feedback-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    setTimeout(function() {
        feedback.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(function() {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, 300);
    }, 3000);
}

function saveCurrentData() {
    console.log('Speichere aktuelle Daten');
    
    const currentData = getCurrentFormData();
    
    currentData.rotation = currentRotation;
    currentData.mirroredH = isMirroredH;
    currentData.mirroredV = isMirroredV;
    
    const direction = getVerlegerichtung();
    currentData.verlegerichtung = direction.code;
    currentData.verlegerichtungName = direction.name;
    currentData.verlegerichtungDescription = direction.description;
    
    if (!projectData.roofShape) {
        projectData.roofShape = {};
    }
    
    Object.assign(projectData.roofShape, currentData);
    
    projectData.roofShape.points = generateRoofPoints(currentData);
    
    projectData.geometry = {
        shapeType: determineActualShape(),
        variant: determineActualVariant(),
        points: projectData.roofShape.points,
        preferredDirection: direction.code,
        rotation: currentRotation,
        area: calculateArea(currentData),
        dimensions: calculateDimensions(currentData)
    };
    
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        console.log('Erfolgreich in localStorage gespeichert');
    } catch (e) {
        sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        console.log('Erfolgreich in sessionStorage gespeichert');
    }
}

function getVerlegerichtung() {
    const effectiveRotation = currentRotation % 360;
    
    if (Math.abs(effectiveRotation) < 45 || Math.abs(effectiveRotation) > 315) {
        return {
            name: 'Längs (senkrecht zur Traufe)',
            code: 'laengs',
            description: 'Platten verlaufen von der Traufe zum First'
        };
    } else if (Math.abs(effectiveRotation - 90) < 45 || Math.abs(effectiveRotation + 270) < 45) {
        return {
            name: 'Quer (senkrecht zur Traufe)',
            code: 'quer', 
            description: 'Platten verlaufen seitlich zur Hauptwasserlaufrichtung'
        };
    } else {
        return {
            name: 'Diagonal',
            code: 'diagonal',
            description: 'Platten verlaufen diagonal zur Standardausrichtung'
        };
    }
}

function generateRoofPoints(data) {
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    
    let points = [];
    
    switch (finalShape) {
        case 'rechteck':
            const length = data.length || 8;
            const width = data.width || 5;
            points = [
                { x: 0, y: 0 },
                { x: length, y: 0 },
                { x: length, y: width },
                { x: 0, y: width }
            ];
            break;
            
        case 'quadrat':
            const side = data.side || 5;
            points = [
                { x: 0, y: 0 },
                { x: side, y: 0 },
                { x: side, y: side },
                { x: 0, y: side }
            ];
            break;
            
        case 'dreieck':
            if (finalVariant === 'gleichseitig') {
                const triangleSide = data.side || 6;
                const height = triangleSide * Math.sqrt(3) / 2;
                points = [
                    { x: triangleSide/2, y: height },
                    { x: 0, y: 0 },
                    { x: triangleSide, y: 0 }
                ];
            } else if (finalVariant === 'rechtwinklig') {
                const a = data.katheteA || 4;
                const b = data.katheteB || 5;
                points = [
                    { x: 0, y: 0 },
                    { x: a, y: 0 },
                    { x: 0, y: b }
                ];
            } else {
                const a = data.sideA || 4;
                const b = data.sideB || 5;
                const c = data.sideC || 6;
                const height = Math.sqrt(Math.max(0, c*c - (a/2)*(a/2)));
                points = [
                    { x: a/2, y: height },
                    { x: 0, y: 0 },
                    { x: a, y: 0 }
                ];
            }
            break;
            
        case 'trapez':
            const baseA = data.baseA || 8;
            const baseB = data.baseB || 5;
            const height = data.height || 4;
            const offset = (baseA - baseB) / 2;
            points = [
                { x: 0, y: 0 },
                { x: baseA, y: 0 },
                { x: baseA - offset, y: height },
                { x: offset, y: height }
            ];
            break;
            
        case 'kreis':
            if (finalVariant === 'oval') {
                const radiusA = data.radiusA || 5;
                const radiusB = data.radiusB || 3;
                for (let i = 0; i < 16; i++) {
                    const angle = (i * 2 * Math.PI) / 16;
                    points.push({
                        x: radiusA + radiusA * Math.cos(angle),
                        y: radiusB + radiusB * Math.sin(angle)
                    });
                }
            } else {
                const radius = data.radius || 4;
                for (let i = 0; i < 16; i++) {
                    const angle = (i * 2 * Math.PI) / 16;
                    points.push({
                        x: radius + radius * Math.cos(angle),
                        y: radius + radius * Math.sin(angle)
                    });
                }
            }
            break;
            
        default:
            points = [
                { x: 0, y: 0 },
                { x: 8, y: 0 },
                { x: 8, y: 5 },
                { x: 0, y: 5 }
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
            if (determineActualVariant() === 'rechtwinklig') {
                return 0.5 * (data.katheteA || 4) * (data.katheteB || 5);
            } else if (determineActualVariant() === 'gleichseitig') {
                const s = data.side || 6;
                return (Math.sqrt(3) / 4) * s * s;
            }
            return 10;
        case 'trapez':
            const baseA = data.baseA || 8;
            const baseB = data.baseB || 5;
            const height = data.height || 4;
            return 0.5 * (baseA + baseB) * height;
        case 'kreis':
            if (determineActualVariant() === 'oval') {
                const a = data.radiusA || 5;
                const b = data.radiusB || 3;
                return Math.PI * a * b;
            } else {
                const r = data.radius || 4;
                return Math.PI * r * r;
            }
        default:
            return 40;
    }
}

function calculateDimensions(data) {
    const finalShape = determineActualShape();
    
    switch (finalShape) {
        case 'rechteck':
            return {
                length: data.length || 8,
                width: data.width || 5
            };
        case 'quadrat':
            const side = data.side || 5;
            return {
                length: side,
                width: side
            };
        default:
            return {
                length: 8,
                width: 5
            };
    }
}

console.log('Interaktiver Editor mit Drag-Rotation geladen');
