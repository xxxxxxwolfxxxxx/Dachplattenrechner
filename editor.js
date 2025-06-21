// Editor.js - Syntax-korrigiert

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
const CORNER_RADIUS = 8;

// Konstanten für bessere Skalierung
const MIN_SCALE = 20;
const MAX_SCALE = 120;
const CANVAS_PADDING = 60;

// Shape-Cache
let shapeCache = {
    lastShape: '',
    lastVariant: '',
    lastResult: ''
};

// Auto-Repeat Variablen
let rotationInterval = null;
let rotationTimeout = null;
let rotationSpeed = 1;
let isMouseDown = false;

// Initialisierung
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        try {
            loadProjectData();
            initializeCanvas();
            initializeUI();
            loadAndDrawShape();
            setupEventListeners();
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
    
    rotationCenter = { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y };
}

function createFallbackCanvas() {
    const container = document.querySelector('.canvas-container') || document.querySelector('main');
    if (!container) return;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'canvas-wrapper';
    wrapper.style.cssText = 'border: 2px solid #e9ecef; border-radius: 8px; background: white; width: 600px; height: 400px; margin: 20px auto; position: relative; user-select: none;';
    
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'main-svg';
    svg.setAttribute('width', '600');
    svg.setAttribute('height', '400');
    svg.setAttribute('viewBox', '0 0 600 400');
    svg.style.cursor = 'default';
    
    svg.innerHTML = '<defs><pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M 25 0 L 0 0 0 25" fill="none" stroke="#e0e0e0" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /><line x1="300" y1="0" x2="300" y2="400" stroke="#c0c0c0" stroke-width="2"/><line x1="0" y1="200" x2="600" y2="200" stroke="#c0c0c0" stroke-width="2"/><g id="roof-shape"></g><g id="corner-handles"></g><g id="labels"></g>';
    
    wrapper.appendChild(svg);
    container.appendChild(wrapper);
}

function initializeUI() {
    displayProfileInfo();
    updateShapeTitle();
    createRotationDisplay();
    createRotationControls();
}

function createRotationControls() {
    const existingLeftBtn = document.getElementById('btn-rotate-left');
    const existingRightBtn = document.getElementById('btn-rotate-right');
    const existingResetBtn = document.getElementById('btn-reset-rotation');
    
    if (existingLeftBtn && existingRightBtn && existingResetBtn) {
        existingLeftBtn.addEventListener('mousedown', function(e) {
            e.preventDefault();
            startRotationRepeat(-1);
        });
        existingLeftBtn.addEventListener('mouseup', stopRotationRepeat);
        existingLeftBtn.addEventListener('mouseleave', stopRotationRepeat);
        
        existingRightBtn.addEventListener('mousedown', function(e) {
            e.preventDefault();
            startRotationRepeat(1);
        });
        existingRightBtn.addEventListener('mouseup', stopRotationRepeat);
        existingRightBtn.addEventListener('mouseleave', stopRotationRepeat);
        
        existingResetBtn.addEventListener('click', function() {
            currentRotation = 0;
            updateShapeWithScale(calculateOptimalScale(getCurrentFormData()));
            updateRotationDisplay();
            showFeedback('Rotation zurückgesetzt');
        });
    }
}

function startRotationRepeat(direction) {
    if (isMouseDown) return;
    
    isMouseDown = true;
    rotationSpeed = 1;
    
    rotateByDegrees(direction * 1);
    
    rotationTimeout = setTimeout(function() {
        if (!isMouseDown) return;
        
        rotationSpeed = 1;
        rotationInterval = setInterval(function() {
            if (!isMouseDown) return;
            rotateByDegrees(direction * rotationSpeed);
        }, 200);
    }, 800);
}

function stopRotationRepeat() {
    isMouseDown = false;
    rotationSpeed = 1;
    
    if (rotationTimeout) {
        clearTimeout(rotationTimeout);
        rotationTimeout = null;
    }
    
    if (rotationInterval) {
        clearInterval(rotationInterval);
        rotationInterval = null;
    }
}

function rotateByDegrees(degrees) {
    currentRotation += degrees;
    
    while (currentRotation > 360) currentRotation -= 360;
    while (currentRotation < 0) currentRotation += 360;
    
    const data = getCurrentFormData();
    const scale = calculateOptimalScale(data);
    updateShapeWithScale(scale);
    updateRotationDisplay();
}

function createRotationDisplay() {
    const existing = document.getElementById('rotation-display');
    if (existing) existing.remove();
    
    const display = document.createElement('div');
    display.id = 'rotation-display';
    display.style.cssText = 'position: absolute; top: 10px; right: 10px; background: rgba(0, 0, 0, 0.8); color: white; padding: 8px 12px; border-radius: 6px; font-family: monospace; font-size: 14px; font-weight: bold; z-index: 1000; pointer-events: none;';
    display.textContent = '0°';
    
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (canvasWrapper) { 
        canvasWrapper.appendChild(display); 
    }
}

function updateRotationDisplay() {
    const display = document.getElementById('rotation-display');
    if (display) {
        const roundedRotation = Math.round(currentRotation * 10) / 10;
        display.textContent = roundedRotation + '°';
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
    
    for (const id in elements) {
        const element = document.getElementById(id);
        if (element) { 
            element.textContent = elements[id]; 
        }
    }
}

function updateShapeTitle() {
    const roofShape = projectData.roofShape;
    if (!roofShape) return;
    
    const shapeNames = {
        'kreis': 'Kreis', 'oval': 'Oval', 'halbkreis': 'Halbkreis', 'viertelkreis': 'Viertelkreis', 'langloch': 'Langloch',
        'dreieck': 'Dreieck', 'gleichseitig': 'Gleichseitiges Dreieck', 'rechtwinklig': 'Rechtwinkliges Dreieck', 
        'ungleichschenklig': 'Ungleichschenkliges Dreieck', 'viereck': 'Viereck', 'rechteck': 'Rechteck', 'quadrat': 'Quadrat',
        'parallelogramm': 'Parallelogramm', 'trapez': 'Trapez', 'rhombus': 'Rhombus', 'vieleck': 'Vieleck',
        'fuenfeck': 'Fünfeck', 'sechseck': 'Sechseck', 'achteck': 'Achteck', 'lform': 'L-Form', 'tform': 'T-Form', 'uform': 'U-Form'
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
    }
    
    createInputFields();
    updateShape();
}

// KORRIGIERTE determineActualShape() - ALLE Profile behandelt
function determineActualShape() {
    if (shapeCache.lastShape === currentShape && shapeCache.lastVariant === currentVariant) {
        return shapeCache.lastResult;
    }
    
    let result = 'rechteck';
    
    // VOLLSTÄNDIGE Shape-Zuordnung
    if (currentVariant === 'trapez') result = 'trapez';
    else if (currentVariant === 'quadrat') result = 'quadrat';
    else if (currentVariant === 'parallelogramm') result = 'parallelogramm';
    else if (currentVariant === 'rhombus') result = 'rhombus';
    else if (currentVariant === 'rechteck') result = 'rechteck';
    else if (currentVariant === 'kreis') result = 'kreis';
    else if (currentVariant === 'oval') result = 'oval';
    else if (currentVariant === 'halbkreis') result = 'halbkreis';
    else if (currentVariant === 'viertelkreis') result = 'viertelkreis';
    else if (currentVariant === 'langloch') result = 'langloch';
    else if (currentVariant === 'gleichseitig' || currentVariant === 'rechtwinklig' || currentVariant === 'ungleichschenklig') result = 'dreieck';
    else if (currentVariant === 'fuenfeck') result = 'fuenfeck';
    else if (currentVariant === 'sechseck') result = 'sechseck';
    else if (currentVariant === 'achteck') result = 'achteck';
    else if (currentVariant === 'lform') result = 'lform';
    else if (currentVariant === 'tform') result = 'tform';
    else if (currentVariant === 'uform') result = 'uform';
    else if (currentShape === 'kreis') result = 'kreis';
    else if (currentShape === 'dreieck') result = 'dreieck';
    else if (currentShape === 'vieleck') result = 'fuenfeck';
    
    shapeCache.lastShape = currentShape;
    shapeCache.lastVariant = currentVariant;
    shapeCache.lastResult = result;
    
    console.log('determineActualShape:', { currentShape: currentShape, currentVariant: currentVariant, result: result });
    
    return result;
}

function determineActualVariant() {
    return currentVariant || 'rechteck';
}

// VOLLSTÄNDIGE createInputFields() - ALLE Profile
function createInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
    container.innerHTML = '';
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    const savedData = projectData.roofShape || {};
    
    console.log('createInputFields - finalShape:', finalShape, 'variant:', variant);
    
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
        container.appendChild(createInput('Seite A (unten) (m)', 'sideA', savedData.sideA || '8'));
        container.appendChild(createInput('Seite B (oben) (m)', 'sideB', savedData.sideB || '6'));
        container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '4'));
        container.appendChild(createInput('Versatz (m)', 'offset', savedData.offset || '1'));
    } else {
        // Standard Rechteck
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
    window.inputTimeout = setTimeout(function() {
        if (isUpdating) return;
        isUpdating = true;
        
        try {
            const data = getCurrentFormData();
            const newScale = calculateOptimalScale(data);
            updateShapeWithScale(newScale);
        } catch (error) {
            console.error('Input-Change Fehler:', error);
        } finally {
            setTimeout(function() { isUpdating = false; }, 50);
        }
    }, 100);
}

// VOLLSTÄNDIGE calculateOptimalScale() - ALLE Profile
function calculateOptimalScale(data) {
    const finalShape = determineActualShape();
    let maxDimension = 0;
    
    if (finalShape === 'kreis') {
        maxDimension = (data.radius || 3) * 2;
    } else if (finalShape === 'oval') {
        maxDimension = Math.max((data.radiusX || 4) * 2, (data.radiusY || 2.5) * 2);
    } else if (finalShape === 'rechteck') {
        maxDimension = Math.max(data.length || 8, data.width || 5);
    } else if (finalShape === 'quadrat') {
        maxDimension = data.side || 5;
    } else if (finalShape === 'dreieck') {
        maxDimension = Math.max(data.sideA || 4, data.sideB || 5, data.sideC || 6, data.side || 6);
    } else if (finalShape === 'trapez') {
        const sideA = data.sideA || 8;
        const sideB = data.sideB || 6;
        const height = data.height || 4;
        const offset = Math.abs(data.offset || 1);
        const maxWidth = Math.max(sideA, sideB + offset * 2);
        maxDimension = Math.max(maxWidth, height);
    } else {
        maxDimension = Math.max(data.length || 8, data.width || 5);
    }
    
    const canvasWidth = 600 - (CANVAS_PADDING * 2);
    const canvasHeight = 400 - (CANVAS_PADDING * 2);
    
    let scale = Math.min(canvasWidth / maxDimension, canvasHeight / maxDimension) * 0.85;
    scale = Math.max(scale, MIN_SCALE);
    scale = Math.min(scale, MAX_SCALE);
    
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
        shapeGroup.removeAttribute('transform');
        drawCurrentShape(shapeGroup, data, scale);
    }
    
    if (labelsGroup) {
        drawLabelsOnShape(labelsGroup, data, scale);
    }
    
    updateCalculations(data);
    updateRotationDisplay();
}

function updateShape() {
    const data = getCurrentFormData();
    const optimalScale = calculateOptimalScale(data);
    updateShapeWithScale(optimalScale);
}

function getCurrentFormData() {
    const data = { shape: currentShape, variant: currentVariant };
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        if (input.value && input.value.trim() !== '') {
            const numValue = parseFloat(input.value);
            if (!isNaN(numValue) && numValue > 0) {
                data[input.id] = numValue;
            }
        }
    }
    
    return data;
}

// VOLLSTÄNDIGE drawCurrentShape() - ALLE Profile
function drawCurrentShape(group, data, scale) {
    const finalShape = determineActualShape();
    
    if (finalShape === 'kreis') {
        drawCircleShape(group, data, scale);
    } else if (finalShape === 'oval') {
        drawOvalShape(group, data, scale);
    } else if (finalShape === 'rechteck') {
        drawRectangleShape(group, data, scale);
    } else if (finalShape === 'quadrat') {
        drawSquareShape(group, data, scale);
    } else if (finalShape === 'dreieck') {
        drawTriangleShape(group, data, scale);
    } else if (finalShape === 'trapez') {
        drawTrapezShape(group, data, scale);
    } else {
        drawRectangleShape(group, data, scale);
    }
    
    if (currentRotation !== 0) {
        group.setAttribute('transform', 'rotate(' + currentRotation + ' ' + CANVAS_CENTER_X + ' ' + CANVAS_CENTER_Y + ')');
    }
}

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

function drawTriangleShape(group, data, scale) {
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
        points = topX + ',' + topY + ' ' + leftX + ',' + leftY + ' ' + rightX + ',' + rightY;
    } else if (variant === 'rechtwinklig') {
        const katheteA = (data.katheteA || 4) * scale;
        const katheteB = (data.katheteB || 5) * scale;
        
        const leftX = CANVAS_CENTER_X - katheteA/2;
        const rightX = CANVAS_CENTER_X + katheteA/2;
        const bottomY = CANVAS_CENTER_Y + katheteB/3;
        const topY = CANVAS_CENTER_Y - katheteB*2/3;
        
        points = leftX + ',' + bottomY + ' ' + rightX + ',' + bottomY + ' ' + leftX + ',' + topY;
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
        
        points = topX + ',' + topY + ' ' + leftX + ',' + leftY + ' ' + rightX + ',' + rightY;
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
    const offset = (data.offset || 1) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    const points = [
        { x: centerX - sideA/2, y: centerY + height/2 },
        { x: centerX + sideA/2, y: centerY + height/2 },
        { x: centerX + sideB/2 + offset, y: centerY - height/2 },
        { x: centerX - sideB/2 + offset, y: centerY - height/2 }
    ];
    
    const pointsStr = points.map(function(p) { return p.x + ',' + p.y; }).join(' ');
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', pointsStr);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawLabelsOnShape(group, data, scale) {
    // Vereinfachte Labels für bessere Browser-Kompatibilität
    const finalShape = determineActualShape();
    
    if (finalShape === 'dreieck') {
        const variant = determineActualVariant();
        const labels = ['A', 'B', 'C'];
        const colors = ['#dc3545', '#28a745', '#ffc107'];
        
        // Einfache Positionierung
        const positions = [
            { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - 50 },
            { x: CANVAS_CENTER_X - 40, y: CANVAS_CENTER_Y + 30 },
            { x: CANVAS_CENTER_X + 40, y: CANVAS_CENTER_Y + 30 }
        ];
        
        for (let i = 0; i < 3; i++) {
            const label = createLabel(positions[i].x, positions[i].y, labels[i], colors[i]);
            group.appendChild(label);
        }
    } else if (finalShape === 'trapez' || finalShape === 'rechteck' || finalShape === 'quadrat') {
        const labels = ['A', 'B', 'C', 'D'];
        const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107'];
        
        const positions = [
            { x: CANVAS_CENTER_X - 40, y: CANVAS_CENTER_Y - 30 },
            { x: CANVAS_CENTER_X + 40, y: CANVAS_CENTER_Y - 30 },
            { x: CANVAS_CENTER_X + 40, y: CANVAS_CENTER_Y + 40 },
            { x: CANVAS_CENTER_X - 40, y: CANVAS_CENTER_Y + 40 }
        ];
        
        for (let i = 0; i < 4; i++) {
            const label = createLabel(positions[i].x, positions[i].y, labels[i], colors[i]);
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

// VOLLSTÄNDIGE updateCalculations() - ALLE Profile
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
            const offset = data.offset || 1;
            const sideLength = Math.sqrt(height * height + offset * offset);
            perimeter = sideA + sideB + 2 * sideLength;
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

// VOLLSTÄNDIGE generateRoofPoints() - ALLE Profile
function generateRoofPoints(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    let points = [];
    
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
            const offset = data.offset || 1;
            
            points = [
                { x: -sideA/2, y: -height/2 },
                { x: sideA/2, y: -height/2 },
                { x: sideB/2 + offset, y: height/2 },
                { x: -sideB/2 + offset, y: height/2 }
            ];
            break;
        default:
            const rectLength = data.length || 8;
            const rectWidth = data.width || 5;
            points = [
                { x: -rectLength/2, y: -rectWidth/2 }, { x: rectLength/2, y: -rectWidth/2 },
                { x: rectLength/2, y: rectWidth/2 }, { x: -rectLength/2, y: rectWidth/2 }
            ];
    }
    
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
            return { length: (data.radiusX || 4) * 2, width: (data.radiusY || 2.5) * 2 };
        case 'rechteck':
            return { length: data.length || 8, width: data.width || 5 };
        case 'quadrat':
            const side = data.side || 5;
            return { length: side, width: side };
        case 'trapez':
            return { length: Math.max(data.sideA || 8, data.sideB || 6), width: data.height || 4 };
        default:
            return { length: 8, width: 5 };
    }
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
    currentRotation = 0;
    
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const finalShape = determineActualShape();
        
        switch(input.id) {
            case 'radius': input.value = '3'; break;
            case 'radiusX': input.value = '4'; break;
            case 'radiusY': input.value = '2.5'; break;
            case 'side': input.value = finalShape === 'quadrat' ? '5' : '6'; break;
            case 'katheteA': input.value = '4'; break;
            case 'katheteB': input.value = '5'; break;
            case 'sideA': input.value = finalShape === 'trapez' ? '8' : '4'; break;
            case 'sideB': input.value = finalShape === 'trapez' ? '6' : '5'; break;
            case 'sideC': input.value = '6'; break;
            case 'length': input.value = '8'; break;
            case 'width': input.value = '5'; break;
            case 'height': input.value = '4'; break;
            case 'offset': input.value = '1'; break;
        }
    }
    
    updateShape();
    showFeedback('Zurückgesetzt: Form, Rotation und alle Parameter');
}

function showFeedback(message, backgroundColor) {
    if (!backgroundColor) backgroundColor = '#28a745';
    
    const existingFeedback = document.querySelectorAll('.feedback-message');
    for (let i = 0; i < existingFeedback.length; i++) {
        existingFeedback[i].remove();
    }
    
    const feedback = document.createElement('div');
    feedback.className = 'feedback-message';
    feedback.style.cssText = 'position: fixed; top: 100px; right: 20px; background: ' + backgroundColor + '; color: white; padding: 12px 20px; border-radius: 6px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.2); max-width: 300px; font-size: 14px; font-weight: 500;';
    
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    setTimeout(function() {
        if (feedback.parentNode) { 
            feedback.remove(); 
        }
    }, 3000);
}

function saveCurrentData() {
    const currentData = getCurrentFormData();
    currentData.rotation = currentRotation;
    
    if (!projectData.roofShape) { 
        projectData.roofShape = {}; 
    }
    
    // Kopiere alle Eigenschaften
    for (const key in currentData) {
        projectData.roofShape[key] = currentData[key];
    }
    
    projectData.roofShape.points = generateRoofPoints(currentData);
    
    projectData.geometry = {
        shapeType: determineActualShape(),
        variant: determineActualVariant(),
        points: projectData.roofShape.points,
        rotation: currentRotation,
        area: calculateArea(currentData),
        dimensions: calculateDimensions(currentData)
    };
    
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        console.log('Daten erfolgreich gespeichert');
    } catch (e) {
        sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        console.log('Daten in sessionStorage gespeichert');
    }
}

// Globale Event Listener
document.addEventListener('mouseup', function() {
    if (isMouseDown) {
        stopRotationRepeat();
    }
});

// Canvas-Größe bei Fenster-Resize anpassen
window.addEventListener('resize', function() {
    if (svg) {
        const container = svg.parentElement;
        if (container) {
            const newWidth = Math.min(600, container.clientWidth - 40);
            const newHeight = (newWidth / 600) * 400;
            
            svg.setAttribute('width', newWidth);
            svg.setAttribute('height', newHeight);
            svg.style.width = newWidth + 'px';
            svg.style.height = newHeight + 'px';
            
            setTimeout(function() {
                const data = getCurrentFormData();
                const scale = calculateOptimalScale(data);
                updateShapeWithScale(scale);
            }, 100);
        }
    }
});

// Überprüfung der Projektdaten nach dem Laden
window.addEventListener('load', function() {
    const profile = projectData.profile;
    const roof = projectData.roofShape;
    
    if (!profile || !profile.deckbreite) {
        setTimeout(function() {
            if (confirm('Profil-Daten fehlen. Möchten Sie zu Schritt 1 zurückkehren?')) {
                window.location.href = 'profil.html';
            }
        }, 1000);
    } else if (!roof || !roof.baseShape) {
        setTimeout(function() {
            if (confirm('Dachform-Daten fehlen. Möchten Sie zu Schritt 2 zurückkehren?')) {
                window.location.href = 'dachform.html';
            }
        }, 1000);
    }
});

console.log('Syntax-korrigierte editor.js erfolgreich geladen');
