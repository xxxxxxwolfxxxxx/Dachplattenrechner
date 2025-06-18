function getActualCornerPositions(data, scale = SCALE_FACTOR) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    let corners = [];
    
    console.log('Berechne Corner-Positionen für:', finalShape, variant, 'mit Daten:', data, 'Scale:', scale);
    
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
            const sideB = (data.sideB || 5) * scale;
            const sideC = (data.sideC || 6) * scale;
            const avgSide = (sideB + sideC) / 2;
            const height = avgSide * 0.8;
            
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
        
        console.log(`Rechteck-Corners: length=${length}px, width=${width}px`);
        
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
    
    console// Vereinfachter Editor - Corner-Handles direkt auf Form-Ecken

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

function determineActualVariant() {
    return currentVariant || 'rechteck';
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
    
    // Mehrere Event-Listener für sicheres Update
    input.addEventListener('input', function() {
        console.log(`Input ${id} geändert zu: ${input.value}`);
        handleInputChange();
    });
    input.addEventListener('change', function() {
        console.log(`Input ${id} change event: ${input.value}`);
        handleInputChange();
    });
    input.addEventListener('keyup', function() {
        console.log(`Input ${id} keyup event: ${input.value}`);
        handleInputChange();
    });
    
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
    console.log('Input geändert, aktualisiere Form');
    
    // Wichtig: Kleine Verzögerung um sicherzustellen, dass der Input-Wert gesetzt ist
    setTimeout(() => {
        updateShape();
        isUpdating = false;
    }, 10);
}

// === HAUPTFUNKTION: Alles zeichnen ===
function updateShape() {
    if (!svg) return;
    
    console.log('updateShape() aufgerufen');
    
    // Aktuelle Form-Daten aus Input-Feldern lesen
    const data = getCurrentFormData();
    console.log('Aktuelle Daten:', data);
    
    // NEUE: Dynamischen Maßstab berechnen
    const dynamicScale = calculateDynamicScale(data);
    console.log('Dynamischer Maßstab:', dynamicScale);
    
    // 1. Lösche alles
    const shapeGroup = document.getElementById('roof-shape');
    const cornerGroup = document.getElementById('corner-handles');
    const labelsGroup = document.getElementById('labels');
    
    if (shapeGroup) shapeGroup.innerHTML = '';
    if (cornerGroup) cornerGroup.innerHTML = '';
    if (labelsGroup) labelsGroup.innerHTML = '';
    
    // Entferne auch vorherige Highlights
    removeSnapEffects();
    
    // 2. Zeichne die Form mit dynamischem Maßstab
    if (shapeGroup) {
        drawCurrentShape(shapeGroup, data, dynamicScale);
        console.log('Form gezeichnet');
    }
    
    // 3. Zeichne Corner-Handles DIREKT auf die Form-Ecken
    if (cornerGroup) {
        drawCornerHandlesOnShape(cornerGroup, data, dynamicScale);
        console.log('Corner-Handles gezeichnet');
    }
    
    // 4. Zeichne Labels
    if (labelsGroup) {
        drawLabelsOnShape(labelsGroup, data, dynamicScale);
        console.log('Labels gezeichnet');
    }
    
    updateCalculations(data);
    updateRotationDisplay();
}

function calculateDynamicScale(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    // Berechne die maximalen Abmessungen der Form
    let maxDimension = 0;
    
    if (finalShape === 'dreieck') {
        if (variant === 'gleichseitig') {
            maxDimension = Math.max(data.side || 6);
        } else if (variant === 'rechtwinklig') {
            maxDimension = Math.max(data.katheteA || 4, data.katheteB || 5);
        } else {
            maxDimension = Math.max(data.sideA || 4, data.sideB || 5, data.sideC || 6);
        }
    } else if (finalShape === 'quadrat') {
        maxDimension = data.side || 5;
    } else {
        maxDimension = Math.max(data.length || 8, data.width || 5);
    }
    
    // Verfügbarer Platz im Canvas (mit Margin für Labels und Handles)
    const availableWidth = 500;  // 600px Canvas - 100px Margin
    const availableHeight = 300; // 400px Canvas - 100px Margin
    const availableSpace = Math.min(availableWidth, availableHeight);
    
    // Berechne Maßstab so dass die Form gut reinpasst
    const targetSize = availableSpace * 0.6; // 60% des verfügbaren Platzes
    let scale = targetSize / maxDimension;
    
    // Mindest- und Höchstmaßstab
    scale = Math.max(scale, 20);   // Mindestens 20px pro Meter
    scale = Math.min(scale, 100);  // Höchstens 100px pro Meter
    
    return scale;
}

function getCurrentFormData() {
    const data = { shape: currentShape, variant: currentVariant };
    
    // Lese ALLE Input-Felder und deren aktuelle Werte
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    console.log('Gefundene Inputs:', inputs.length);
    
    inputs.forEach(input => {
        console.log(`Input ${input.id}: ${input.value}`);
        if (input.value && input.value.trim() !== '') {
            const numValue = parseFloat(input.value);
            if (!isNaN(numValue) && numValue > 0) {
                data[input.id] = numValue;
                console.log(`Gesetzt: ${input.id} = ${numValue}`);
            }
        }
    });
    
    console.log('Finale Form-Daten:', data);
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

function drawTriangleShape(group, data, scale = SCALE_FACTOR) {
    const variant = determineActualVariant();
    let points = '';
    
    console.log('Zeichne Dreieck mit Daten:', data, 'Scale:', scale);
    
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
        
        console.log(`Rechtwinkliges Dreieck: katheteA=${data.katheteA}, katheteB=${data.katheteB}`);
        console.log(`Skaliert: katheteA=${katheteA}px, katheteB=${katheteB}px`);
        
        const leftX = CANVAS_CENTER_X - katheteA/2;
        const rightX = CANVAS_CENTER_X + katheteA/2;
        const bottomY = CANVAS_CENTER_Y + katheteB/3;
        const topY = CANVAS_CENTER_Y - katheteB*2/3;
        
        points = `${leftX},${bottomY} ${rightX},${bottomY} ${leftX},${topY}`;
        
    } else {
        const sideA = (data.sideA || 4) * scale;
        const sideB = (data.sideB || 5) * scale;
        const sideC = (data.sideC || 6) * scale;
        
        console.log(`Ungleichschenkliges Dreieck: A=${data.sideA}, B=${data.sideB}, C=${data.sideC}`);
        
        const avgSide = (sideB + sideC) / 2;
        const height = avgSide * 0.8;
        
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
    
    console.log(`Zeichne Rechteck: length=${data.length} (${length}px), width=${data.width} (${width}px)`);
    
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

function drawCornerHandlesOnShape(group, data) {
    const corners = getActualCornerPositions(data);
    
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

function getActualCornerPositions(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    let corners = [];
    
    console.log('Berechne Corner-Positionen für:', finalShape, variant, 'mit Daten:', data);
    
    if (finalShape === 'dreieck') {
        if (variant === 'gleichseitig') {
            const side = (data.side || 6) * SCALE_FACTOR;
            const height = side * Math.sqrt(3) / 2;
            corners = [
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - height/3 },
                { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y + height*2/3 },
                { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y + height*2/3 }
            ];
        } else if (variant === 'rechtwinklig') {
            // KORRIGIERT: Verwende katheteA und katheteB korrekt
            const katheteA = (data.katheteA || 4) * SCALE_FACTOR;
            const katheteB = (data.katheteB || 5) * SCALE_FACTOR;
            
            corners = [
                { x: CANVAS_CENTER_X - katheteA/2, y: CANVAS_CENTER_Y + katheteB/3 },   // Unten links (rechter Winkel)
                { x: CANVAS_CENTER_X + katheteA/2, y: CANVAS_CENTER_Y + katheteB/3 },   // Unten rechts  
                { x: CANVAS_CENTER_X - katheteA/2, y: CANVAS_CENTER_Y - katheteB*2/3 }  // Oben links
            ];
        } else {
            // KORRIGIERT: Ungleichschenkliges Dreieck mit allen drei Seiten
            const sideA = (data.sideA || 4) * SCALE_FACTOR;
            const sideB = (data.sideB || 5) * SCALE_FACTOR;
            const sideC = (data.sideC || 6) * SCALE_FACTOR;
            const avgSide = (sideB + sideC) / 2;
            const height = avgSide * 0.8;
            
            corners = [
                { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - height/2 },           // Spitze oben
                { x: CANVAS_CENTER_X - sideA/2, y: CANVAS_CENTER_Y + height/2 }, // Links unten
                { x: CANVAS_CENTER_X + sideA/2, y: CANVAS_CENTER_Y + height/2 }  // Rechts unten
            ];
        }
    } else if (finalShape === 'quadrat') {
        const side = (data.side || 5) * SCALE_FACTOR;
        corners = [
            { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y - side/2 },
            { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y - side/2 },
            { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y + side/2 },
            { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y + side/2 }
        ];
    } else {
        // KORRIGIERT: Rechteck mit korrekter Länge/Breite-Zuordnung
        const length = (data.length || 8) * SCALE_FACTOR;  // Horizontal
        const width = (data.width || 5) * SCALE_FACTOR;    // Vertikal
        
        console.log(`Rechteck-Corners: length=${length}px, width=${width}px`);
        
        corners = [
            { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y - width/2 },  // Links oben
            { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y - width/2 },  // Rechts oben
            { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y + width/2 },  // Rechts unten
            { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y + width/2 }   // Links unten
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
    
    console.log('Finale Corner-Positionen:', corners);
    return corners;
}

// === MAUS-EVENTS MIT KORRIGIERTER EINRASTFUNKTION ===
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
    // KORRIGIERT: Verwende aktuelle Daten und dynamischen Maßstab
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
    currentRotation = newRotation;
    while (currentRotation > 180) currentRotation -= 360;
    while (currentRotation < -180) currentRotation += 360;
    
    // KORRIGIERT: Prüfe auf horizontale Basis mit aktuellen Daten
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
    
    updateShape();
    updateRotationDisplay();
}

function checkForHorizontalBase(corners) {
    if (corners.length < 3) return false;
    
    // Finde die zwei untersten Punkte
    let bottomPoints = [...corners].sort((a, b) => b.y - a.y).slice(0, 2);
    
    // Prüfe ob diese eine waagerechte Linie bilden (±3 Pixel Toleranz)
    const yDiff = Math.abs(bottomPoints[0].y - bottomPoints[1].y);
    console.log('Horizontal-Check: yDiff =', yDiff, 'für Punkte:', bottomPoints);
    return yDiff <= 3;
}

function highlightBottomEdge(corners) {
    removeSnapEffects();
    
    let bottomPoints = [...corners].sort((a, b) => b.y - a.y).slice(0, 2);
    bottomPoints.sort((a, b) => a.x - b.x);
    
    console.log('Highlight Bottom Edge für Punkte:', bottomPoints);
    
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
    console.log('Reset aufgerufen');
    
    // Reset Rotation und Transformationen
    currentRotation = 0;
    isMirroredH = false;
    isMirroredV = false;
    
    // Reset Input-Felder
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    console.log('Setze', inputs.length, 'Inputs zurück');
    
    inputs.forEach(input => {
        let defaultValue = '';
        switch(input.id) {
            case 'side': 
                defaultValue = currentVariant === 'quadrat' ? '5' : '6'; 
                break;
            case 'katheteA': defaultValue = '4'; break;
            case 'katheteB': defaultValue = '5'; break;
            case 'sideA': defaultValue = '4'; break;
            case 'sideB': defaultValue = '5'; break;
            case 'sideC': defaultValue = '6'; break;
            case 'length': defaultValue = '8'; break;
            case 'width': defaultValue = '5'; break;
        }
        
        console.log(`Reset ${input.id} zu ${defaultValue}`);
        input.value = defaultValue;
        
        // Trigger Input-Event um Update zu forcieren
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    // Force Update nach Reset
    setTimeout(() => {
        console.log('Force Update nach Reset');
        updateShape();
        showFeedback('Zurückgesetzt: Form, Rotation und alle Parameter');
    }, 100);
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

console.log('Vereinfachter Editor mit dynamischem Maßstab geladen');
}

function drawLabelsOnShape(group, data) {
    const corners = getActualCornerPositions(data);
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
    const corners = getActualCornerPositions(data);
    
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
    currentRotation = newRotation;
    while (currentRotation > 180) currentRotation -= 360;
    while (currentRotation < -180) currentRotation += 360;
    
    // Prüfe auf horizontale Basis
    const data = getCurrentFormData();
    const corners = getActualCornerPositions(data);
    const isHorizontal = checkForHorizontalBase(corners);
    
    if (isHorizontal) {
        if (!document.getElementById('snap-feedback')) {
            showSnapFeedback();
            highlightBottomEdge(corners);
        }
    } else {
        removeSnapEffects();
    }
    
    updateShape();
    updateRotationDisplay();
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
    console.log('Reset aufgerufen');
    
    // Reset Rotation und Transformationen
    currentRotation = 0;
    isMirroredH = false;
    isMirroredV = false;
    
    // Reset Input-Felder
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    console.log('Setze', inputs.length, 'Inputs zurück');
    
    inputs.forEach(input => {
        let defaultValue = '';
        switch(input.id) {
            case 'side': 
                defaultValue = currentVariant === 'quadrat' ? '5' : '6'; 
                break;
            case 'katheteA': defaultValue = '4'; break;
            case 'katheteB': defaultValue = '5'; break;
            case 'sideA': defaultValue = '4'; break;
            case 'sideB': defaultValue = '5'; break;
            case 'sideC': defaultValue = '6'; break;
            case 'length': defaultValue = '8'; break;
            case 'width': defaultValue = '5'; break;
        }
        
        console.log(`Reset ${input.id} zu ${defaultValue}`);
        input.value = defaultValue;
        
        // Trigger Input-Event um Update zu forcieren
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    // Force Update nach Reset
    setTimeout(() => {
        console.log('Force Update nach Reset');
        updateShape();
        showFeedback('Zurückgesetzt: Form, Rotation und alle Parameter');
    }, 100);
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

console.log('Vereinfachter Editor geladen');
