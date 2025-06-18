// Vereinfachter Editor - Corner-Handles direkt auf Form-Ecken

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
        // Grundformen
        'dreieck': 'Dreieck', 'viereck': 'Viereck', 'kreis': 'Kreis', 'vieleck': 'Vieleck',
        // Dreieck-Varianten
        'gleichseitig': 'Gleichseitiges Dreieck', 'rechtwinklig': 'Rechtwinkliges Dreieck', 'ungleichschenklig': 'Ungleichschenkliges Dreieck',
        // Viereck-Varianten
        'rechteck': 'Rechteck', 'quadrat': 'Quadrat', 'parallelogramm': 'Parallelogramm', 'trapez': 'Trapez', 'rhombus': 'Rhombus',
        // Kreis-Varianten
        'oval': 'Oval', 'halbkreis': 'Halbkreis', 'viertelkreis': 'Viertelkreis', 'langloch': 'Langloch',
        // Vieleck-Varianten
        'fuenfeck': 'Fünfeck', 'sechseck': 'Sechseck', 'achteck': 'Achteck', 'lform': 'L-Form', 'tform': 'T-Form', 'uform': 'U-Form'
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
    const baseShape = currentShape;
    const variant = currentVariant;
    
    // Spezielle Varianten die als eigene Shapes behandelt werden
    if (variant === 'quadrat') return 'quadrat';
    if (variant === 'trapez') return 'trapez';
    if (variant === 'parallelogramm') return 'parallelogramm';
    if (variant === 'rhombus') return 'rhombus';
    
    // Kreis-Varianten
    if (baseShape === 'kreis') {
        if (variant === 'oval') return 'oval';
        if (variant === 'halbkreis') return 'halbkreis';
        if (variant === 'viertelkreis') return 'viertelkreis';
        if (variant === 'langloch') return 'langloch';
        return 'kreis';
    }
    
    // Vieleck-Varianten
    if (baseShape === 'vieleck') {
        if (variant === 'fuenfeck') return 'fuenfeck';
        if (variant === 'sechseck') return 'sechseck';
        if (variant === 'achteck') return 'achteck';
        if (variant === 'lform') return 'lform';
        if (variant === 'tform') return 'tform';
        if (variant === 'uform') return 'uform';
        return 'fuenfeck'; // Fallback für Vieleck
    }
    
    // Dreieck-Varianten
    if (baseShape === 'dreieck') {
        return 'dreieck'; // Alle Dreieck-Varianten werden als dreieck behandelt
    }
    
    // Viereck-Varianten (Standard)
    if (baseShape === 'viereck') {
        return 'rechteck'; // Standard für Vierecke
    }
    
    // Fallback
    return baseShape || 'rechteck';
}

function determineActualVariant() {
    return currentVariant || 'rechteck';
}

function createInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
    container.innerHTML = '';
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    const savedData = projectData.roofShape || {};
    
    // KREISFORMEN
    if (finalShape === 'kreis') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '4'));
    }
    else if (finalShape === 'oval') {
        container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
        container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
    }
    else if (finalShape === 'halbkreis') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '4'));
    }
    else if (finalShape === 'viertelkreis') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '4'));
    }
    else if (finalShape === 'langloch') {
        container.appendChild(createInput('Länge (m)', 'length', savedData.length || '10'));
        container.appendChild(createInput('Breite (m)', 'width', savedData.width || '3'));
    }
    
    // DREIECKE
    else if (finalShape === 'dreieck') {
        if (finalVariant === 'gleichseitig') {
            container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '6'));
        } else if (finalVariant === 'rechtwinklig') {
            container.appendChild(createInput('Kathete A (m)', 'katheteA', savedData.katheteA || '4'));
            container.appendChild(createInput('Kathete B (m)', 'katheteB', savedData.katheteB || '5'));
        } else { // ungleichschenklig
            container.appendChild(createInput('Basis (m)', 'sideA', savedData.sideA || '6'));
            container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '4'));
        }
    }
    
    // VIERECKE
    else if (finalShape === 'quadrat') {
        container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '5'));
    }
    else if (finalShape === 'rechteck') {
        container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
        container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
    }
    else if (finalShape === 'trapez') {
        container.appendChild(createInput('Basis unten (m)', 'length', savedData.length || '8'));
        container.appendChild(createInput('Basis oben (m)', 'topLength', savedData.topLength || '6'));
        container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '4'));
    }
    else if (finalShape === 'parallelogramm') {
        container.appendChild(createInput('Basis (m)', 'length', savedData.length || '8'));
        container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '5'));
        container.appendChild(createInput('Neigung (m)', 'skew', savedData.skew || '2'));
    }
    else if (finalShape === 'rhombus') {
        container.appendChild(createInput('Diagonale 1 (m)', 'diagonal1', savedData.diagonal1 || '8'));
        container.appendChild(createInput('Diagonale 2 (m)', 'diagonal2', savedData.diagonal2 || '6'));
    }
    
    // VIELECKE
    else if (finalShape === 'fuenfeck') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '4'));
    }
    else if (finalShape === 'sechseck') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '4'));
    }
    else if (finalShape === 'achteck') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '4'));
    }
    else if (finalShape === 'lform') {
        container.appendChild(createInput('Gesamtlänge (m)', 'length', savedData.length || '8'));
        container.appendChild(createInput('Gesamtbreite (m)', 'width', savedData.width || '6'));
        container.appendChild(createInput('Aussparung (m)', 'cutout', savedData.cutout || '3'));
    }
    else if (finalShape === 'tform') {
        container.appendChild(createInput('Kopfbreite (m)', 'headWidth', savedData.headWidth || '8'));
        container.appendChild(createInput('Stammbreite (m)', 'stemWidth', savedData.stemWidth || '3'));
        container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '6'));
    }
    else if (finalShape === 'uform') {
        container.appendChild(createInput('Außenbreite (m)', 'outerWidth', savedData.outerWidth || '8'));
        container.appendChild(createInput('Innenbreite (m)', 'innerWidth', savedData.innerWidth || '4'));
        container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '6'));
    }
    
    // FALLBACK
    else {
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
    
    // Event-Listener für dynamische Updates
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
    
    // DYNAMISCHER MASSSTAB: Berechne neuen Maßstab bei Input-Änderung
    const data = getCurrentFormData();
    const newScale = calculateDynamicScale(data);
    
    updateShapeWithScale(newScale);
    
    setTimeout(() => { isUpdating = false; }, 50);
}

function calculateDynamicScale(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    // Berechne die maximalen Abmessungen der Form
    let maxDimension = 0;
    
    if (['kreis', 'halbkreis', 'viertelkreis'].includes(finalShape)) {
        maxDimension = (data.radius || 4) * 2; // Durchmesser
    } else if (finalShape === 'oval') {
        maxDimension = Math.max(data.length || 8, data.width || 5);
    } else if (finalShape === 'langloch') {
        maxDimension = Math.max(data.length || 10, data.width || 3);
    } else if (finalShape === 'dreieck') {
        if (variant === 'gleichseitig') {
            maxDimension = data.side || 6;
        } else if (variant === 'rechtwinklig') {
            maxDimension = Math.max(data.katheteA || 4, data.katheteB || 5);
        } else {
            maxDimension = Math.max(data.sideA || 4, data.sideB || 5, data.sideC || 6);
        }
    } else if (finalShape === 'quadrat') {
        maxDimension = data.side || 5;
    } else {
        // Alle anderen Formen (Rechteck, Trapez, etc.)
        maxDimension = Math.max(data.length || 8, data.width || 5);
    }
    
    // Verfügbarer Platz im Canvas (viel konservativer)
    const availableWidth = 500; // Canvas ist 600px breit - 100px Margin
    const availableHeight = 300; // Canvas ist 400px hoch - 100px Margin
    const availableSpace = Math.min(availableWidth, availableHeight);
    
    // Berechne Maßstab so dass die Form SICHER reinpasst
    let scale = (availableSpace * 0.6) / maxDimension; // Nur 60% der verfügbaren Fläche nutzen
    
    // Viel engere Grenzen für bessere Sichtbarkeit
    scale = Math.max(scale, 20);   // Mindestens 20px pro Meter
    scale = Math.min(scale, 80);   // Höchstens 80px pro Meter
    
    return scale;
}

function updateShapeWithScale(scale) {
    if (!svg) return;
    
    const data = getCurrentFormData();
    
    // Lösche alles
    const shapeGroup = document.getElementById('roof-shape');
    const cornerGroup = document.getElementById('corner-handles');
    const labelsGroup = document.getElementById('labels');
    
    if (shapeGroup) shapeGroup.innerHTML = '';
    if (cornerGroup) cornerGroup.innerHTML = '';
    if (labelsGroup) labelsGroup.innerHTML = '';
    
    // Zeichne mit neuem Maßstab
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
    // Standard-Update mit festem Maßstab
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
    
    // Kreisformen
    if (['kreis', 'oval', 'halbkreis', 'viertelkreis', 'langloch'].includes(finalShape)) {
        drawCircleVariant(group, data, scale, finalShape);
    }
    // Dreiecke
    else if (finalShape === 'dreieck') {
        drawTriangleShape(group, data, scale);
    }
    // Spezielle Vierecke
    else if (finalShape === 'quadrat') {
        drawSquareShape(group, data, scale);
    }
    else if (finalShape === 'trapez') {
        drawTrapezShape(group, data, scale);
    }
    else if (finalShape === 'parallelogramm') {
        drawParallelogrammShape(group, data, scale);
    }
    else if (finalShape === 'rhombus') {
        drawRhombusShape(group, data, scale);
    }
    // Vielecke
    else if (['fuenfeck', 'sechseck', 'achteck', 'lform', 'tform', 'uform'].includes(finalShape)) {
        drawPolygonVariant(group, data, scale, finalShape);
    }
    // Standard Rechteck
    else {
        drawRectangleShape(group, data, scale);
    }
    
    // Wende Rotation an
    if (currentRotation !== 0) {
        group.setAttribute('transform', `rotate(${currentRotation} ${CANVAS_CENTER_X} ${CANVAS_CENTER_Y})`);
    }
}

function drawCircleVariant(group, data, scale, variant) {
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    if (variant === 'oval') {
        const length = (data.length || 8) * scale;
        const width = (data.width || 5) * scale;
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', centerX);
        ellipse.setAttribute('cy', centerY);
        ellipse.setAttribute('rx', length / 2);
        ellipse.setAttribute('ry', width / 2);
        ellipse.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        ellipse.setAttribute('stroke', '#007bff');
        ellipse.setAttribute('stroke-width', '3');
        group.appendChild(ellipse);
    } else if (variant === 'langloch') {
        const length = (data.length || 10) * scale;
        const width = (data.width || 3) * scale;
        const radius = width / 2;
        const straightLength = length - width;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${centerX - straightLength/2} ${centerY - radius} 
                   L ${centerX + straightLength/2} ${centerY - radius}
                   A ${radius} ${radius} 0 0 1 ${centerX + straightLength/2} ${centerY + radius}
                   L ${centerX - straightLength/2} ${centerY + radius}
                   A ${radius} ${radius} 0 0 1 ${centerX - straightLength/2} ${centerY - radius} Z`;
        path.setAttribute('d', d);
        path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        path.setAttribute('stroke', '#007bff');
        path.setAttribute('stroke-width', '3');
        group.appendChild(path);
    } else if (variant === 'halbkreis') {
        const radius = (data.radius || 4) * scale;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${centerX - radius} ${centerY} 
                   A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY} Z`;
        path.setAttribute('d', d);
        path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        path.setAttribute('stroke', '#007bff');
        path.setAttribute('stroke-width', '3');
        group.appendChild(path);
    } else if (variant === 'viertelkreis') {
        const radius = (data.radius || 4) * scale;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${centerX} ${centerY} 
                   L ${centerX + radius} ${centerY}
                   A ${radius} ${radius} 0 0 1 ${centerX} ${centerY - radius} Z`;
        path.setAttribute('d', d);
        path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        path.setAttribute('stroke', '#007bff');
        path.setAttribute('stroke-width', '3');
        group.appendChild(path);
    } else {
        // Standard Kreis
        const radius = (data.radius || 4) * scale;
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', centerX);
        circle.setAttribute('cy', centerY);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        circle.setAttribute('stroke', '#007bff');
        circle.setAttribute('stroke-width', '3');
        group.appendChild(circle);
    }
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
        // ungleichschenklig mit Basis und Höhe
        const basis = (data.sideA || 6) * scale;
        const height = (data.height || 4) * scale;
        
        const topX = CANVAS_CENTER_X;
        const topY = CANVAS_CENTER_Y - height/2;
        const leftX = CANVAS_CENTER_X - basis/2;
        const leftY = CANVAS_CENTER_Y + height/2;
        const rightX = CANVAS_CENTER_X + basis/2;
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

function drawTrapezShape(group, data, scale = SCALE_FACTOR) {
    const bottomLength = (data.length || 8) * scale;
    const topLength = (data.topLength || 6) * scale;
    const height = (data.height || 4) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    const topY = centerY - height/2;
    const bottomY = centerY + height/2;
    
    const points = `${centerX - bottomLength/2},${bottomY} ${centerX + bottomLength/2},${bottomY} ${centerX + topLength/2},${topY} ${centerX - topLength/2},${topY}`;
    
    const trapez = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    trapez.setAttribute('points', points);
    trapez.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    trapez.setAttribute('stroke', '#007bff');
    trapez.setAttribute('stroke-width', '3');
    group.appendChild(trapez);
}

function drawParallelogrammShape(group, data, scale = SCALE_FACTOR) {
    const basis = (data.length || 8) * scale;
    const height = (data.height || 5) * scale;
    const skew = (data.skew || 2) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    const topY = centerY - height/2;
    const bottomY = centerY + height/2;
    
    const points = `${centerX - basis/2 + skew},${topY} ${centerX + basis/2 + skew},${topY} ${centerX + basis/2},${bottomY} ${centerX - basis/2},${bottomY}`;
    
    const parallelogram = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    parallelogram.setAttribute('points', points);
    parallelogram.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    parallelogram.setAttribute('stroke', '#007bff');
    parallelogram.setAttribute('stroke-width', '3');
    group.appendChild(parallelogram);
}

function drawRhombusShape(group, data, scale = SCALE_FACTOR) {
    const diagonal1 = (data.diagonal1 || 8) * scale;
    const diagonal2 = (data.diagonal2 || 6) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    const points = `${centerX},${centerY - diagonal2/2} ${centerX + diagonal1/2},${centerY} ${centerX},${centerY + diagonal2/2} ${centerX - diagonal1/2},${centerY}`;
    
    const rhombus = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    rhombus.setAttribute('points', points);
    rhombus.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    rhombus.setAttribute('stroke', '#007bff');
    rhombus.setAttribute('stroke-width', '3');
    group.appendChild(rhombus);
}

function drawPolygonVariant(group, data, scale, variant) {
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    let points = '';
    
    if (variant === 'fuenfeck' || variant === 'sechseck' || variant === 'achteck') {
        // Regelmäßige Vielecke mit Radius
        const radius = (data.radius || 4) * scale;
        const sides = variant === 'fuenfeck' ? 5 : (variant === 'sechseck' ? 6 : 8);
        const pointsArray = [];
        
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) - Math.PI/2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            pointsArray.push(`${x},${y}`);
        }
        points = pointsArray.join(' ');
    } 
    else if (variant === 'lform') {
        // L-Form mit besseren Parametern
        const length = (data.length || 8) * scale;
        const width = (data.width || 6) * scale;
        const cutout = (data.cutout || 3) * scale;
        
        const leftX = centerX - length/2;
        const rightX = centerX + length/2;
        const topY = centerY - width/2;
        const bottomY = centerY + width/2;
        const cutY = topY + cutout;
        const cutX = leftX + cutout;
        
        points = `${leftX},${topY} ${cutX},${topY} ${cutX},${cutY} ${rightX},${cutY} ${rightX},${bottomY} ${leftX},${bottomY}`;
    } 
    else if (variant === 'tform') {
        // T-Form mit spezifischen Parametern
        const headWidth = (data.headWidth || 8) * scale;
        const stemWidth = (data.stemWidth || 3) * scale;
        const height = (data.height || 6) * scale;
        
        const topY = centerY - height/2;
        const bottomY = centerY + height/2;
        const stemTop = topY + height/3; // 1/3 für den Kopf
        
        points = `${centerX - headWidth/2},${topY} ${centerX + headWidth/2},${topY} ${centerX + headWidth/2},${stemTop} ${centerX + stemWidth/2},${stemTop} ${centerX + stemWidth/2},${bottomY} ${centerX - stemWidth/2},${bottomY} ${centerX - stemWidth/2},${stemTop} ${centerX - headWidth/2},${stemTop}`;
    } 
    else if (variant === 'uform') {
        // U-Form mit spezifischen Parametern
        const outerWidth = (data.outerWidth || 8) * scale;
        const innerWidth = (data.innerWidth || 4) * scale;
        const height = (data.height || 6) * scale;
        
        const wallThickness = (outerWidth - innerWidth) / 2;
        const topY = centerY - height/2;
        const bottomY = centerY + height/2;
        const innerBottom = bottomY - height/3; // 2/3 Tiefe
        
        points = `${centerX - outerWidth/2},${topY} ${centerX + outerWidth/2},${topY} ${centerX + outerWidth/2},${bottomY} ${centerX + innerWidth/2},${bottomY} ${centerX + innerWidth/2},${innerBottom} ${centerX - innerWidth/2},${innerBottom} ${centerX - innerWidth/2},${bottomY} ${centerX - outerWidth/2},${bottomY}`;
    }
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}width', '3');
    group.appendChild(polygon);
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
    const variant = determineActualVariant();
    let corners = [];
    
    // Für Kreisformen: Approximation mit Eckpunkten
    if (['kreis', 'oval', 'halbkreis', 'viertelkreis', 'langloch'].includes(finalShape)) {
        if (finalShape === 'oval') {
            const length = (data.length || 8) * scale;
            const width = (data.width || 5) * scale;
            // 8 Punkte für Oval
            for (let i = 0; i < 8; i++) {
                const angle = (i * 2 * Math.PI) / 8;
                const x = CANVAS_CENTER_X + (length/2) * Math.cos(angle);
                const y = CANVAS_CENTER_Y + (width/2) * Math.sin(angle);
                corners.push({ x, y });
            }
        } else if (finalShape === 'langloch') {
            const length = (data.length || 10) * scale;
            const width = (data.width || 3) * scale;
            const radius = width / 2;
            const straightLength = length - width;
            // 8 Eckpunkte für Langloch
            corners = [
                { x: CANVAS_CENTER_X - straightLength/2, y: CANVAS_CENTER_Y - radius },
                { x: CANVAS_CENTER_X + straightLength/2, y: CANVAS_CENTER_Y - radius },
                { x: CANVAS_CENTER_X + straightLength/2 + radius*0.7, y: CANVAS_CENTER_Y - radius*0.7 },
                { x: CANVAS_CENTER_X + straightLength/2 + radius, y: CANVAS_CENTER_Y },
                { x: CANVAS_CENTER_X + straightLength/2 + radius*0.7, y: CANVAS_CENTER_Y + radius*0.7 },
                { x: CANVAS_CENTER_X + straightLength/2, y: CANVAS_CENTER_Y + radius },
                { x: CANVAS_CENTER_X - straightLength/2, y: CANVAS_CENTER_Y + radius },
                { x: CANVAS_CENTER_X - straightLength/2 - radius, y: CANVAS_CENTER_Y }
            ];
        } else {
            // Kreis, Halbkreis, Viertelkreis
            const radius = (data.radius || 4) * scale;
            const numPoints = finalShape === 'halbkreis' ? 6 : (finalShape === 'viertelkreis' ? 4 : 8);
            const startAngle = finalShape === 'halbkreis' ? 0 : (finalShape === 'viertelkreis' ? 0 : 0);
            const endAngle = finalShape === 'halbkreis' ? Math.PI : (finalShape === 'viertelkreis' ? Math.PI/2 : 2*Math.PI);
            
            for (let i = 0; i < numPoints; i++) {
                const angle = startAngle + (i * (endAngle - startAngle)) / (numPoints - 1);
                const x = CANVAS_CENTER_X + radius * Math.cos(angle);
                const y = CANVAS_CENTER_Y + radius * Math.sin(angle);
                corners.push({ x, y });
            }
            
            if (finalShape === 'halbkreis' || finalShape === 'viertelkreis') {
                corners.push({ x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y }); // Zentrum hinzufügen
            }
        }
    }
    // Dreiecke
    else if (finalShape === 'dreieck') {
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
    }
    // Spezielle Vierecke
    else if (finalShape === 'quadrat') {
        const side = (data.side || 5) * scale;
        corners = [
            { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y - side/2 },
            { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y - side/2 },
            { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y + side/2 },
            { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y + side/2 }
        ];
    }
    else if (finalShape === 'trapez') {
        const length = (data.length || 8) * scale;
        const width = (data.width || 5) * scale;
        const angle = (data.angle || 2) * scale;
        corners = [
            { x: CANVAS_CENTER_X - length/2 + angle, y: CANVAS_CENTER_Y - width/2 },
            { x: CANVAS_CENTER_X + length/2 - angle, y: CANVAS_CENTER_Y - width/2 },
            { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y + width/2 },
            { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y + width/2 }
        ];
    }
    else if (finalShape === 'parallelogramm') {
        const length = (data.length || 8) * scale;
        const width = (data.width || 5) * scale;
        const skew = length * 0.2;
        corners = [
            { x: CANVAS_CENTER_X - length/2 + skew, y: CANVAS_CENTER_Y - width/2 },
            { x: CANVAS_CENTER_X + length/2 + skew, y: CANVAS_CENTER_Y - width/2 },
            { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y + width/2 },
            { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y + width/2 }
        ];
    }
    else if (finalShape === 'rhombus') {
        const length = (data.length || 8) * scale;
        const width = (data.width || 5) * scale;
        corners = [
            { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - width/2 },
            { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y },
            { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y + width/2 },
            { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y }
        ];
    }
    // Vielecke
    else if (['fuenfeck', 'sechseck', 'achteck'].includes(finalShape)) {
        const radius = Math.min((data.length || 8), (data.width || 6)) * scale / 2;
        const sides = finalShape === 'fuenfeck' ? 5 : (finalShape === 'sechseck' ? 6 : 8);
        
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) - Math.PI/2;
            const x = CANVAS_CENTER_X + radius * Math.cos(angle);
            const y = CANVAS_CENTER_Y + radius * Math.sin(angle);
            corners.push({ x, y });
        }
    }
    else if (['lform', 'tform', 'uform'].includes(finalShape)) {
        // Vereinfacht als Rechteck-Eckpunkte behandeln
        const length = (data.length || 8) * scale;
        const width = (data.width || 6) * scale;
        corners = [
            { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y - width/2 },
            { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y - width/2 },
            { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y + width/2 },
            { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y + width/2 }
        ];
    }
    // Standard Rechteck
    else {
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
        // Seite A (zwischen Punkt 1 und 2)
        const sideAMidX = (corners[1].x + corners[2].x) / 2;
        const sideAMidY = (corners[1].y + corners[2].y) / 2;
        const sideALabel = createLabel(sideAMidX, sideAMidY + 15, 'A', '#dc3545');
        group.appendChild(sideALabel);
        
        // Seite B (zwischen Punkt 0 und 1)
        const sideBMidX = (corners[0].x + corners[1].x) / 2;
        const sideBMidY = (corners[0].y + corners[1].y) / 2;
        const sideBLabel = createLabel(sideBMidX - 15, sideBMidY, 'B', '#28a745');
        group.appendChild(sideBLabel);
        
        // Seite C (zwischen Punkt 0 und 2)
        const sideCMidX = (corners[0].x + corners[2].x) / 2;
        const sideCMidY = (corners[0].y + corners[2].y) / 2;
        const sideCLabel = createLabel(sideCMidX + 15, sideCMidY, 'C', '#ffc107');
        group.appendChild(sideCLabel);
        
    } else if (corners.length >= 4) {
        // Rechteck/Quadrat Labels
        const labels = ['A', 'B', 'C', 'D'];
        const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107'];
        const offsets = [
            { x: 0, y: -12 },   // A oben
            { x: 12, y: 0 },    // B rechts
            { x: 0, y: 15 },    // C unten
            { x: -12, y: 0 }    // D links
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

// === MAUS-EVENTS ===
function handleMouseDown(event) {
    event.preventDefault();
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Prüfe ob nahe einem Corner-Handle
    if (isNearCorner(mouseX, mouseY)) {
        startDragging(mouseX, mouseY);
    }
}

function handleMouseMove(event) {
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    if (!isDragging) {
        // Cursor-Änderung bei Hover über Corner-Handles
        svg.style.cursor = isNearCorner(mouseX, mouseY) ? 'grab' : 'default';
        return;
    }
    
    event.preventDefault();
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
    
    // Berechne den Startwinkel relativ zum Rotationszentrum
    dragStartAngle = Math.atan2(y - rotationCenter.y, x - rotationCenter.x);
    dragStartRotation = currentRotation;
}

function updateRotation(x, y) {
    if (!isDragging) return;
    
    // Berechne den aktuellen Winkel
    const currentAngle = Math.atan2(y - rotationCenter.y, x - rotationCenter.x);
    let angleDiff = currentAngle - dragStartAngle;
    
    // Normalisiere den Winkelunterschied
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    // Berechne neue Rotation
    let newRotation = dragStartRotation + (angleDiff * 180 / Math.PI);
    
    // Normalisiere die Rotation auf -180° bis +180°
    currentRotation = newRotation;
    while (currentRotation > 180) currentRotation -= 360;
    while (currentRotation < -180) currentRotation += 360;
    
    // Aktualisiere die Anzeige mit dynamischem Maßstab
    const data = getCurrentFormData();
    const scale = calculateDynamicScale(data);
    updateShapeWithScale(scale);
    updateRotationDisplay();
    
    // Prüfe auf Einrasten (horizontale Basis)
    checkForSnapping();
}

function checkForSnapping() {
    const data = getCurrentFormData();
    const scale = calculateDynamicScale(data);
    const corners = getActualCornerPositions(data, scale);
    const isHorizontal = checkForHorizontalBase(corners);
    
    if (isHorizontal) {
        if (!document.getElementById('snap-feedback')) {
            showSnapFeedback();
            highlightBottomEdge(corners);
        }
    } else {
        removeSnapEffects();
    }
}

function checkForHorizontalBase(corners) {
    if (corners.length < 3) return false;
    
    // Finde die zwei untersten Punkte
    let bottomPoints = [...corners].sort((a, b) => b.y - a.y).slice(0, 2);
    
    // Prüfe ob diese eine waagerechte Linie bilden (±3 Pixel Toleranz)
    const yDiff = Math.abs(bottomPoints[0].y - bottomPoints[1].y);
    return yDiff <= 3;
}

function highlightBottomEdge(corners) {
    removeSnapEffects();
    
    let bottomPoints = [...corners].sort((a, b) => b.y - a.y).slice(0, 2);
    bottomPoints.sort((a, b) => a.x - b.x);
    
    const highlightLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    highlightLine.id = 'bottom-edge-highlight';
    highlightLine.setAttribute('x1', bottomPoints[0].x);
    highlightLine.setAttribute('y1', bottomPoints[0].y);
    highlightLine.setAttribute('x2', bottomPoints[1].x);
    highlightLine.setAttribute('y2', bottomPoints[1].y);
    highlightLine.setAttribute('stroke', '#28a745');
    highlightLine.setAttribute('stroke-width', '6');
    highlightLine.setAttribute('opacity', '0.8');
    highlightLine.style.pointerEvents = 'none';
    
    svg.appendChild(highlightLine);
    
    // Animation
    highlightLine.animate([
        { opacity: 0.8 }, { opacity: 0.3 }, { opacity: 0.8 }
    ], { duration: 500, iterations: 2 });
}

function showSnapFeedback() {
    const feedback = document.createElement('div');
    feedback.id = 'snap-feedback';
    feedback.style.cssText = `
        position: absolute; top: 50px; right: 10px; background: #28a745; color: white;
        padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;
        z-index: 1001; pointer-events: none;
    `;
    feedback.textContent = '📐 Eingerastet!';
    
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (canvasWrapper) { canvasWrapper.appendChild(feedback); }
}

function removeSnapEffects() {
    const snapFeedback = document.getElementById('snap-feedback');
    if (snapFeedback) { snapFeedback.remove(); }
    
    const highlight = document.getElementById('bottom-edge-highlight');
    if (highlight) { highlight.remove(); }
}

function stopDragging() {
    isDragging = false;
    svg.style.cursor = 'default';
    
    setTimeout(() => { removeSnapEffects(); }, 1000);
}

// === BERECHNUNGEN ===
function updateCalculations(data) {
    let area = 0;
    let perimeter = 0;
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    
    if (['kreis', 'halbkreis', 'viertelkreis'].includes(finalShape)) {
        const radius = data.radius || 4;
        if (finalShape === 'kreis') {
            area = Math.PI * radius * radius;
            perimeter = 2 * Math.PI * radius;
        } else if (finalShape === 'halbkreis') {
            area = (Math.PI * radius * radius) / 2;
            perimeter = Math.PI * radius + 2 * radius;
        } else if (finalShape === 'viertelkreis') {
            area = (Math.PI * radius * radius) / 4;
            perimeter = (Math.PI * radius) / 2 + 2 * radius;
        }
    } else if (finalShape === 'oval') {
        const length = data.length || 8;
        const width = data.width || 5;
        const a = length / 2;
        const b = width / 2;
        area = Math.PI * a * b;
        perimeter = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))); // Approximation
    } else if (finalShape === 'langloch') {
        const length = data.length || 10;
        const width = data.width || 3;
        const radius = width / 2;
        const straightLength = length - width;
        area = straightLength * width + Math.PI * radius * radius;
        perimeter = 2 * straightLength + 2 * Math.PI * radius;
    } else if (finalShape === 'dreieck') {
        if (finalVariant === 'rechtwinklig') {
            const a = data.katheteA || 4;
            const b = data.katheteB || 5;
            area = 0.5 * a * b;
            const c = Math.sqrt(a*a + b*b);
            perimeter = a + b + c;
        } else if (finalVariant === 'gleichseitig') {
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
    } else if (finalShape === 'quadrat') {
        const side = data.side || 5;
        area = side * side;
        perimeter = 4 * side;
    } else if (finalShape === 'trapez') {
        const length = data.length || 8;
        const width = data.width || 5;
        const angle = data.angle || 2;
        const topLength = length - 2 * angle;
        area = 0.5 * (length + topLength) * width;
        const sideLength = Math.sqrt(angle * angle + width * width);
        perimeter = length + topLength + 2 * sideLength;
    } else if (finalShape === 'parallelogramm') {
        const length = data.length || 8;
        const width = data.width || 5;
        area = length * width;
        const skew = length * 0.2;
        const sideLength = Math.sqrt(width * width + skew * skew);
        perimeter = 2 * length + 2 * sideLength;
    } else if (finalShape === 'rhombus') {
        const length = data.length || 8;
        const width = data.width || 5;
        area = 0.5 * length * width;
        const sideLength = Math.sqrt((length/2)*(length/2) + (width/2)*(width/2));
        perimeter = 4 * sideLength;
    } else if (['fuenfeck', 'sechseck', 'achteck'].includes(finalShape)) {
        const radius = Math.min((data.length || 8), (data.width || 6)) / 2;
        const sides = finalShape === 'fuenfeck' ? 5 : (finalShape === 'sechseck' ? 6 : 8);
        const sideLength = 2 * radius * Math.sin(Math.PI / sides);
        area = 0.5 * sides * radius * radius * Math.sin(2 * Math.PI / sides);
        perimeter = sides * sideLength;
    } else if (['lform', 'tform', 'uform'].includes(finalShape)) {
        // Vereinfachte Berechnung als zusammengesetzte Rechtecke
        const length = data.length || 8;
        const width = data.width || 6;
        const cutout = data.cutout || 3;
        
        if (finalShape === 'lform') {
            area = length * width - (length - cutout) * (width - cutout);
            perimeter = 2 * length + 2 * width - 2 * cutout;
        } else {
            area = length * width * 0.7; // Approximation
            perimeter = (length + width) * 2.2; // Approximation
        }
    } else {
        // Standard Rechteck
        const length = data.length || 8;
        const width = data.width || 5;
        area = length * width;
        perimeter = 2 * (length + width);
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
    isMirroredH = false;
    isMirroredV = false;
    
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    inputs.forEach(input => {
        switch(input.id) {
            case 'side': 
                input.value = currentVariant === 'quadrat' ? '5' : '6'; 
                break;
            case 'radius': input.value = '4'; break;
            case 'katheteA': input.value = '4'; break;
            case 'katheteB': input.value = '5'; break;
            case 'sideA': input.value = '4'; break;
            case 'sideB': input.value = '5'; break;
            case 'sideC': input.value = '6'; break;
            case 'length': input.value = '8'; break;
            case 'width': input.value = '5'; break;
            case 'angle': input.value = '2'; break;
            case 'cutout': input.value = '3'; break;
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
        variant: determineActualVariant(),
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
            if (determineActualVariant() === 'gleichseitig') {
                const triangleSide = data.side || 6;
                const height = triangleSide * Math.sqrt(3) / 2;
                points = [
                    { x: triangleSide/2, y: height },
                    { x: 0, y: 0 }, { x: triangleSide, y: 0 }
                ];
            } else if (determineActualVariant() === 'rechtwinklig') {
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
            if (determineActualVariant() === 'rechtwinklig') {
                return 0.5 * (data.katheteA || 4) * (data.katheteB || 5);
            } else if (determineActualVariant() === 'gleichseitig') {
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

console.log('Smart Editor mit allen Formen geladen');
