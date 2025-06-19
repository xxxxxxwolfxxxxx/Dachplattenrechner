// Editor.js - KORRIGIERT für alle Dachformen

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

// NEUE KONSTANTEN für bessere Skalierung
const MIN_SCALE = 20;
const MAX_SCALE = 120;
const CANVAS_PADDING = 60; // Mehr Padding für bessere Sichtbarkeit

// WICHTIG: Shape-Cache hier definieren
let shapeCache = {
    lastShape: '',
    lastVariant: '',
    lastResult: ''
};

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
    
    // ENTFERNT: Maus-Event-Listener für manuelles Drehen
    // svg.addEventListener('mousedown', handleMouseDown);
    // svg.addEventListener('mousemove', handleMouseMove);
    // svg.addEventListener('mouseup', handleMouseUp);
    // svg.addEventListener('mouseleave', handleMouseUp);
    
    rotationCenter = { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y };
    
    console.log('Canvas initialisiert - manuelles Drehen deaktiviert');
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
    createRotationControls(); // NEUE FUNKTION
}

// KORRIGIERTE FUNKTION: Rotations-Steuerung hinzufügen
function createRotationControls() {
    // Prüfe ob die Buttons bereits im HTML vorhanden sind
    const existingLeftBtn = document.getElementById('btn-rotate-left');
    const existingRightBtn = document.getElementById('btn-rotate-right');
    const existingResetBtn = document.getElementById('btn-reset-rotation');
    
    if (existingLeftBtn && existingRightBtn && existingResetBtn) {
        // Buttons existieren bereits im HTML, nur Event Listeners hinzufügen
        console.log('Rotations-Buttons gefunden, füge Event Listeners hinzu');
        
        existingLeftBtn.addEventListener('click', () => {
            console.log('Links-Button geklickt');
            rotateByDegrees(-1);
        });
        
        existingRightBtn.addEventListener('click', () => {
            console.log('Rechts-Button geklickt');
            rotateByDegrees(1);
        });
        
        existingResetBtn.addEventListener('click', () => {
            console.log('Reset-Button geklickt');
            currentRotation = 0;
            updateShapeWithScale(calculateOptimalScale(getCurrentFormData()));
            updateRotationDisplay();
            showFeedback('Rotation zurückgesetzt');
        });
    } else {
        // Fallback: Buttons dynamisch erstellen
        console.log('Rotations-Buttons nicht gefunden, erstelle dynamisch');
        const toolsGrid = document.querySelector('.tools-grid');
        if (!toolsGrid) return;
        
        const rotationRow = document.createElement('div');
        rotationRow.className = 'tools-row rotation-controls';
        
        rotationRow.innerHTML = `
            <button class="btn-tool rotation rotate-left" id="btn-rotate-left" title="1° nach links drehen">
                <span style="font-size: 18px;">↺</span> -1°
            </button>
            <button class="btn-tool rotation rotate-right" id="btn-rotate-right" title="1° nach rechts drehen">
                <span style="font-size: 18px;">↻</span> +1°
            </button>
            <button class="btn-tool rotation reset" id="btn-reset-rotation" title="Rotation zurücksetzen">
                <span style="font-size: 16px;">⌂</span> 0°
            </button>
        `;
        
        toolsGrid.insertBefore(rotationRow, toolsGrid.firstChild);
        
        // Event Listeners für dynamisch erstellte Buttons
        document.getElementById('btn-rotate-left').addEventListener('click', () => rotateByDegrees(-1));
        document.getElementById('btn-rotate-right').addEventListener('click', () => rotateByDegrees(1));
        document.getElementById('btn-reset-rotation').addEventListener('click', () => {
            currentRotation = 0;
            updateShapeWithScale(calculateOptimalScale(getCurrentFormData()));
            updateRotationDisplay();
            showFeedback('Rotation zurückgesetzt');
        });
    }
}

// NEUE FUNKTION: Präzise Rotation um bestimmte Grad
function rotateByDegrees(degrees) {
    currentRotation += degrees;
    
    // Normalisierung auf -180 bis +180 Grad
    while (currentRotation > 180) currentRotation -= 360;
    while (currentRotation < -180) currentRotation += 360;
    
    const data = getCurrentFormData();
    const scale = calculateOptimalScale(data);
    updateShapeWithScale(scale);
    updateRotationDisplay();
    
    // Prüfe auf horizontale/vertikale Ausrichtung
    checkAlignmentAndHighlight();
}

// NEUE FUNKTION: Prüfung und Hervorhebung von horizontalen/vertikalen Linien
function checkAlignmentAndHighlight() {
    const data = getCurrentFormData();
    const corners = getActualCornerPositions(data, calculateOptimalScale(data));
    
    let hasHorizontalLine = false;
    let hasVerticalLine = false;
    let alignedEdges = [];
    
    // Prüfe alle Kanten der Form
    for (let i = 0; i < corners.length; i++) {
        const nextIndex = (i + 1) % corners.length;
        const p1 = corners[i];
        const p2 = corners[nextIndex];
        
        // Rotation auf die Punkte anwenden
        let rotatedP1 = rotatePoint(p1.x, p1.y, currentRotation);
        let rotatedP2 = rotatePoint(p2.x, p2.y, currentRotation);
        
        const deltaX = Math.abs(rotatedP2.x - rotatedP1.x);
        const deltaY = Math.abs(rotatedP2.y - rotatedP1.y);
        
        // Toleranz für "horizontal" oder "vertikal" (±1 Grad entspricht ca. ±1.7% Abweichung)
        const tolerance = 3; // Pixel-Toleranz
        
        if (deltaY <= tolerance && deltaX > tolerance) {
            // Horizontale Linie
            hasHorizontalLine = true;
            alignedEdges.push({
                type: 'horizontal',
                p1: rotatedP1,
                p2: rotatedP2,
                originalP1: p1,
                originalP2: p2
            });
        } else if (deltaX <= tolerance && deltaY > tolerance) {
            // Vertikale Linie
            hasVerticalLine = true;
            alignedEdges.push({
                type: 'vertical',
                p1: rotatedP1,
                p2: rotatedP2,
                originalP1: p1,
                originalP2: p2
            });
        }
    }
    
    // Visuelle Rückmeldung
    if (hasHorizontalLine || hasVerticalLine) {
        highlightAlignedEdges(alignedEdges);
        showAlignmentFeedback(hasHorizontalLine, hasVerticalLine);
    } else {
        removeAlignmentHighlights();
    }
}

// NEUE FUNKTION: Punkt rotieren
function rotatePoint(x, y, angleDegrees) {
    const angle = (angleDegrees * Math.PI) / 180;
    const relX = x - CANVAS_CENTER_X;
    const relY = y - CANVAS_CENTER_Y;
    return {
        x: CANVAS_CENTER_X + relX * Math.cos(angle) - relY * Math.sin(angle),
        y: CANVAS_CENTER_Y + relX * Math.sin(angle) + relY * Math.cos(angle)
    };
}

// NEUE FUNKTION: Ausgerichtete Kanten hervorheben
function highlightAlignedEdges(alignedEdges) {
    // Entferne vorherige Highlights
    removeAlignmentHighlights();
    
    alignedEdges.forEach((edge, index) => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.id = `alignment-highlight-${index}`;
        line.setAttribute('x1', edge.originalP1.x);
        line.setAttribute('y1', edge.originalP1.y);
        line.setAttribute('x2', edge.originalP2.x);
        line.setAttribute('y2', edge.originalP2.y);
        line.setAttribute('stroke', '#28a745');
        line.setAttribute('stroke-width', '4');
        line.setAttribute('opacity', '0.8');
        line.style.pointerEvents = 'none';
        
        // Animation hinzufügen
        line.style.animation = 'alignmentPulse 1s ease-in-out 2';
        
        svg.appendChild(line);
    });
    
    // CSS-Animation hinzufügen falls noch nicht vorhanden
    if (!document.getElementById('alignment-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'alignment-animation-styles';
        style.textContent = `
            @keyframes alignmentPulse {
                0%, 100% { opacity: 0.8; stroke-width: 4; }
                50% { opacity: 1; stroke-width: 6; }
            }
        `;
        document.head.appendChild(style);
    }
}

// NEUE FUNKTION: Entferne Ausrichtungs-Highlights
function removeAlignmentHighlights() {
    if (!svg) return;
    
    // Entferne alle Highlight-Linien
    const highlights = svg.querySelectorAll('[id^="alignment-highlight-"]');
    highlights.forEach(highlight => highlight.remove());
    
    // Entferne auch die Highlight-Gruppe falls vorhanden
    const highlightGroup = document.getElementById('alignment-highlights');
    if (highlightGroup) {
        highlightGroup.innerHTML = '';
    }
}

// NEUE FUNKTION: Zeige Ausrichtungs-Feedback
function showAlignmentFeedback(hasHorizontal, hasVertical) {
    let message = '📐 Ausgerichtet: ';
    const messages = [];
    
    if (hasHorizontal) messages.push('Horizontal');
    if (hasVertical) messages.push('Vertikal');
    
    message += messages.join(' & ');
    
    showFeedback(message, '#28a745');
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
        
        // Farbe basierend auf Ausrichtung
        const isAligned = Math.abs(roundedRotation % 90) < 1;
        display.style.background = isAligned ? '#28a745' : 'rgba(0, 0, 0, 0.8)';
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
        'kreis': 'Kreis', 'oval': 'Oval', 'halbkreis': 'Halbkreis', 'viertelkreis': 'Viertelkreis', 'langloch': 'Langloch',
        'dreieck': 'Dreieck', 'gleichseitig': 'Gleichseitiges Dreieck', 'rechtwinklig': 'Rechtwinkliges Dreieck', 
        'ungleichschenklig': 'Ungleichschenkliges Dreieck', 'viereck': 'Viereck', 'rechteck': 'Rechteck', 'quadrat': 'Quadrat',
        'parallelogramm': 'Parallelogramm', 'trapez': 'Trapez', 'rhombus': 'Rhombus', 'vieleck': 'Vieleck',
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
    
    console.log('Lade Form:', { currentShape, currentVariant, roofShape });
    
    createInputFields();
    updateShape();
}

// KORRIGIERTE Shape-Bestimmung
function determineActualShape() {
    console.log('determineActualShape Input:', { currentShape, currentVariant });
    
    // Cache prüfen
    if (shapeCache.lastShape === currentShape && shapeCache.lastVariant === currentVariant) {
        console.log('Cache hit:', shapeCache.lastResult);
        return shapeCache.lastResult;
    }
    
    let result = 'rechteck'; // Fallback
    
    // KORRIGIERTE Logik: Erst Variant prüfen, dann Shape
    if (currentVariant === 'quadrat') {
        result = 'quadrat';
    } else if (currentVariant === 'trapez') {
        result = 'trapez';
    } else if (currentVariant === 'parallelogramm') {
        result = 'parallelogramm';
    } else if (currentVariant === 'rhombus') {
        result = 'rhombus';
    } else if (currentVariant === 'rechteck') {
        result = 'rechteck';
    }
    // Kreis-Varianten
    else if (currentVariant === 'kreis') {
        result = 'kreis';
    } else if (currentVariant === 'oval') {
        result = 'oval';
    } else if (currentVariant === 'halbkreis') {
        result = 'halbkreis';
    } else if (currentVariant === 'viertelkreis') {
        result = 'viertelkreis';
    } else if (currentVariant === 'langloch') {
        result = 'langloch';
    }
    // Dreieck-Varianten
    else if (currentVariant === 'gleichseitig' || currentVariant === 'rechtwinklig' || currentVariant === 'ungleichschenklig') {
        result = 'dreieck';
    }
    // Vieleck-Varianten
    else if (currentVariant === 'fuenfeck') {
        result = 'fuenfeck';
    } else if (currentVariant === 'sechseck') {
        result = 'sechseck';
    } else if (currentVariant === 'achteck') {
        result = 'achteck';
    } else if (currentVariant === 'lform') {
        result = 'lform';
    } else if (currentVariant === 'tform') {
        result = 'tform';
    } else if (currentVariant === 'uform') {
        result = 'uform';
    }
    // Fallback auf Shape
    else if (currentShape === 'kreis') {
        result = 'kreis';
    } else if (currentShape === 'dreieck') {
        result = 'dreieck';
    } else if (currentShape === 'vieleck') {
        result = 'fuenfeck';
    }
    
    // Cache aktualisieren
    shapeCache.lastShape = currentShape;
    shapeCache.lastVariant = currentVariant;
    shapeCache.lastResult = result;
    
    console.log('determineActualShape Result:', result);
    return result;
}

function determineActualVariant() {
    return currentVariant || 'rechteck';
}

// KORRIGIERTE Input-Felder für alle Formen
function createInputFields() {
    const container = document.getElementById('geometry-inputs-grid');
    if (!container) return;
    
    container.innerHTML = '';
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    const savedData = projectData.roofShape || {};
    
    console.log('Erstelle Input-Felder für:', { finalShape, variant });
    
    // Kreisformen
    if (finalShape === 'kreis') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '3'));
    } else if (finalShape === 'oval') {
        container.appendChild(createInput('Radius X (m)', 'radiusX', savedData.radiusX || '4'));
        container.appendChild(createInput('Radius Y (m)', 'radiusY', savedData.radiusY || '2.5'));
    } else if (finalShape === 'halbkreis') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '4'));
    } else if (finalShape === 'viertelkreis') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '5'));
    } else if (finalShape === 'langloch') {
        container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
        container.appendChild(createInput('Breite (m)', 'width', savedData.width || '3'));
    }
    
    // Dreiecke
    else if (finalShape === 'dreieck') {
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
    }
    
    // Quadrat
    else if (finalShape === 'quadrat') {
        container.appendChild(createInput('Seitenlänge (m)', 'side', savedData.side || '5'));
    }
    
    // Trapez
    else if (finalShape === 'trapez') {
        container.appendChild(createInput('Seite A (m)', 'sideA', savedData.sideA || '8'));
        container.appendChild(createInput('Seite B (m)', 'sideB', savedData.sideB || '6'));
        container.appendChild(createInput('Höhe (m)', 'height', savedData.height || '4'));
    }
    
    // Parallelogramm
    else if (finalShape === 'parallelogramm') {
        container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
        container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
        container.appendChild(createInput('Winkel (°)', 'angle', savedData.angle || '75'));
    }
    
    // Rhombus
    else if (finalShape === 'rhombus') {
        container.appendChild(createInput('Diagonale 1 (m)', 'diagonal1', savedData.diagonal1 || '6'));
        container.appendChild(createInput('Diagonale 2 (m)', 'diagonal2', savedData.diagonal2 || '4'));
    }
    
    // Vielecke
    else if (finalShape === 'fuenfeck') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '3'));
    } else if (finalShape === 'sechseck') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '3'));
    } else if (finalShape === 'achteck') {
        container.appendChild(createInput('Radius (m)', 'radius', savedData.radius || '3'));
    } else if (finalShape === 'lform') {
        container.appendChild(createInput('Länge 1 (m)', 'length1', savedData.length1 || '8'));
        container.appendChild(createInput('Breite 1 (m)', 'width1', savedData.width1 || '3'));
        container.appendChild(createInput('Länge 2 (m)', 'length2', savedData.length2 || '5'));
        container.appendChild(createInput('Breite 2 (m)', 'width2', savedData.width2 || '4'));
    } else if (finalShape === 'tform') {
        container.appendChild(createInput('Breite Kopf (m)', 'headWidth', savedData.headWidth || '8'));
        container.appendChild(createInput('Höhe Kopf (m)', 'headHeight', savedData.headHeight || '2'));
        container.appendChild(createInput('Breite Stamm (m)', 'stemWidth', savedData.stemWidth || '3'));
        container.appendChild(createInput('Höhe Stamm (m)', 'stemHeight', savedData.stemHeight || '5'));
    } else if (finalShape === 'uform') {
        container.appendChild(createInput('Außenbreite (m)', 'outerWidth', savedData.outerWidth || '8'));
        container.appendChild(createInput('Außenhöhe (m)', 'outerHeight', savedData.outerHeight || '6'));
        container.appendChild(createInput('Innenbreite (m)', 'innerWidth', savedData.innerWidth || '4'));
        container.appendChild(createInput('Innenhöhe (m)', 'innerHeight', savedData.innerHeight || '4'));
    }
    
    // Fallback: Rechteck
    else {
        container.appendChild(createInput('Länge (m)', 'length', savedData.length || '8'));
        container.appendChild(createInput('Breite (m)', 'width', savedData.width || '5'));
    }
    
    console.log('Input-Felder erstellt für:', finalShape);
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
            const newScale = calculateOptimalScale(data);
            updateShapeWithScale(newScale);
        } catch (error) {
            console.error('Input-Change Fehler:', error);
        } finally {
            setTimeout(() => { isUpdating = false; }, 50);
        }
    }, 100);
}

// VERBESSERTE FUNKTION: Optimale Skalierung berechnen
function calculateOptimalScale(data) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    
    let maxDimension = 0;
    let aspectRatio = 1;
    
    // Bestimme maximale Dimension und Seitenverhältnis
    if (finalShape === 'kreis' || finalShape === 'fuenfeck' || finalShape === 'sechseck' || finalShape === 'achteck') {
        maxDimension = (data.radius || 3) * 2;
        aspectRatio = 1;
    } else if (finalShape === 'oval') {
        const radiusX = data.radiusX || 4;
        const radiusY = data.radiusY || 2.5;
        maxDimension = Math.max(radiusX * 2, radiusY * 2);
        aspectRatio = radiusX / radiusY;
    } else if (finalShape === 'rechteck') {
        const length = data.length || 8;
        const width = data.width || 5;
        maxDimension = Math.max(length, width);
        aspectRatio = length / width;
    } else if (finalShape === 'quadrat') {
        maxDimension = data.side || 5;
        aspectRatio = 1;
    } else if (finalShape === 'dreieck') {
        if (variant === 'gleichseitig') {
            maxDimension = data.side || 6;
            aspectRatio = 1;
        } else if (variant === 'rechtwinklig') {
            maxDimension = Math.max(data.katheteA || 4, data.katheteB || 5);
            aspectRatio = (data.katheteA || 4) / (data.katheteB || 5);
        } else {
            maxDimension = Math.max(data.sideA || 4, data.sideB || 5, data.sideC || 6);
            aspectRatio = 1.2;
        }
    } else {
        // Fallback
        maxDimension = Math.max(data.length || 8, data.width || 5);
        aspectRatio = (data.length || 8) / (data.width || 5);
    }
    
    // Canvas-Abmessungen mit Padding
    const canvasWidth = 600 - (CANVAS_PADDING * 2);
    const canvasHeight = 400 - (CANVAS_PADDING * 2);
    
    // Berechne optimale Skalierung basierend auf Seitenverhältnis
    let scaleX = canvasWidth / maxDimension;
    let scaleY = canvasHeight / maxDimension;
    
    // Berücksichtige Seitenverhältnis
    if (aspectRatio > 1) {
        // Form ist breiter als hoch
        scaleY = canvasHeight / (maxDimension / aspectRatio);
    } else if (aspectRatio < 1) {
        // Form ist höher als breit
        scaleX = canvasWidth / (maxDimension * aspectRatio);
    }
    
    // Nimm den kleineren Maßstab um sicherzustellen, dass alles passt
    let scale = Math.min(scaleX, scaleY) * 0.85; // 85% für etwas mehr Padding
    
    // Begrenze Skalierung
    scale = Math.max(scale, MIN_SCALE);
    scale = Math.min(scale, MAX_SCALE);
    
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
        shapeGroup.removeAttribute('transform');
        drawCurrentShape(shapeGroup, data, scale);
    }
    
    // KORRIGIERT: Corner-Handles nicht mehr zeichnen
    // if (cornerGroup) {
    //     drawCornerHandlesOnShape(cornerGroup, data, scale);
    // }
    
    if (labelsGroup) {
        drawLabelsOnShape(labelsGroup, data, scale);
    }
    
    updateCalculations(data);
    updateRotationDisplay();
    
    // Prüfe Ausrichtung nach jeder Aktualisierung
    checkAlignmentAndHighlight();
}

function updateShape() {
    const data = getCurrentFormData();
    const optimalScale = calculateOptimalScale(data);
    updateShapeWithScale(optimalScale);
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

// KORRIGIERTE Zeichenfunktionen mit mehr Formen
function drawCurrentShape(group, data, scale) {
    const finalShape = determineActualShape();
    
    console.log('drawCurrentShape:', { finalShape, data });
    
    // Kreisformen
    if (finalShape === 'kreis') {
        drawCircleShape(group, data, scale);
    } else if (finalShape === 'oval') {
        drawOvalShape(group, data, scale);
    } else if (finalShape === 'halbkreis') {
        drawHalfCircleShape(group, data, scale);
    } else if (finalShape === 'viertelkreis') {
        drawQuarterCircleShape(group, data, scale);
    } else if (finalShape === 'langloch') {
        drawLanglochShape(group, data, scale);
    }
    
    // Dreiecke
    else if (finalShape === 'dreieck') {
        drawTriangleShape(group, data, scale);
    }
    
    // Vierecke
    else if (finalShape === 'quadrat') {
        drawSquareShape(group, data, scale);
    } else if (finalShape === 'trapez') {
        drawTrapezShape(group, data, scale);
    } else if (finalShape === 'parallelogramm') {
        drawParallelogrammShape(group, data, scale);
    } else if (finalShape === 'rhombus') {
        drawRhombusShape(group, data, scale);
    }
    
    // Vielecke
    else if (finalShape === 'fuenfeck') {
        drawPolygonShape(group, data, scale, 5);
    } else if (finalShape === 'sechseck') {
        drawPolygonShape(group, data, scale, 6);
    } else if (finalShape === 'achteck') {
        drawPolygonShape(group, data, scale, 8);
    } else if (finalShape === 'lform') {
        drawLShape(group, data, scale);
    } else if (finalShape === 'tform') {
        drawTShape(group, data, scale);
    } else if (finalShape === 'uform') {
        drawUShape(group, data, scale);
    }
    
    // Fallback: Rechteck
    else {
        drawRectangleShape(group, data, scale);
    }
    
    // Rotation anwenden
    if (currentRotation !== 0) {
        group.setAttribute('transform', `rotate(${currentRotation} ${CANVAS_CENTER_X} ${CANVAS_CENTER_Y})`);
    }
}

// NEUE Zeichenfunktionen hinzufügen
function drawHalfCircleShape(group, data, scale) {
    const radius = (data.radius || 4) * scale;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    const d = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY} Z`;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    path.setAttribute('stroke', '#007bff');
    path.setAttribute('stroke-width', '3');
    group.appendChild(path);
}

function drawQuarterCircleShape(group, data, scale) {
    const radius = (data.radius || 5) * scale;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    const d = `M ${centerX} ${centerY} L ${centerX + radius} ${centerY} A ${radius} ${radius} 0 0 0 ${centerX} ${centerY - radius} Z`;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    path.setAttribute('stroke', '#007bff');
    path.setAttribute('stroke-width', '3');
    group.appendChild(path);
}

function drawLanglochShape(group, data, scale) {
    const length = (data.length || 8) * scale;
    const width = (data.width || 3) * scale;
    const radius = width / 2;
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    const halfLength = length / 2 - radius;
    
    const d = `
        M ${centerX - halfLength} ${centerY - radius}
        L ${centerX + halfLength} ${centerY - radius}
        A ${radius} ${radius} 0 0 1 ${centerX + halfLength} ${centerY + radius}
        L ${centerX - halfLength} ${centerY + radius}
        A ${radius} ${radius} 0 0 1 ${centerX - halfLength} ${centerY - radius} Z
    `;
    path.setAttribute('d', d);
    path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    path.setAttribute('stroke', '#007bff');
    path.setAttribute('stroke-width', '3');
    group.appendChild(path);
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
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawLShape(group, data, scale) {
    const length1 = (data.length1 || 8) * scale;
    const width1 = (data.width1 || 3) * scale;
    const length2 = (data.length2 || 5) * scale;
    const width2 = (data.width2 || 4) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    const points = `
        ${centerX - length1/2},${centerY - width1/2}
        ${centerX - length1/2 + length2},${centerY - width1/2}
        ${centerX - length1/2 + length2},${centerY - width1/2 + width2}
        ${centerX + length1/2},${centerY - width1/2 + width2}
        ${centerX + length1/2},${centerY + width1/2}
        ${centerX - length1/2},${centerY + width1/2}
    `;
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawTShape(group, data, scale) {
    const headWidth = (data.headWidth || 8) * scale;
    const headHeight = (data.headHeight || 2) * scale;
    const stemWidth = (data.stemWidth || 3) * scale;
    const stemHeight = (data.stemHeight || 5) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    const totalHeight = headHeight + stemHeight;
    
    const points = `
        ${centerX - headWidth/2},${centerY - totalHeight/2}
        ${centerX + headWidth/2},${centerY - totalHeight/2}
        ${centerX + headWidth/2},${centerY - totalHeight/2 + headHeight}
        ${centerX + stemWidth/2},${centerY - totalHeight/2 + headHeight}
        ${centerX + stemWidth/2},${centerY + totalHeight/2}
        ${centerX - stemWidth/2},${centerY + totalHeight/2}
        ${centerX - stemWidth/2},${centerY - totalHeight/2 + headHeight}
        ${centerX - headWidth/2},${centerY - totalHeight/2 + headHeight}
    `;
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
}

function drawUShape(group, data, scale) {
    const outerWidth = (data.outerWidth || 8) * scale;
    const outerHeight = (data.outerHeight || 6) * scale;
    const innerWidth = (data.innerWidth || 4) * scale;
    const innerHeight = (data.innerHeight || 4) * scale;
    
    const centerX = CANVAS_CENTER_X;
    const centerY = CANVAS_CENTER_Y;
    
    const points = `
        ${centerX - outerWidth/2},${centerY - outerHeight/2}
        ${centerX + outerWidth/2},${centerY - outerHeight/2}
        ${centerX + outerWidth/2},${centerY + outerHeight/2}
        ${centerX + innerWidth/2},${centerY + outerHeight/2}
        ${centerX + innerWidth/2},${centerY - outerHeight/2 + (outerHeight - innerHeight)}
        ${centerX - innerWidth/2},${centerY - outerHeight/2 + (outerHeight - innerHeight)}
        ${centerX - innerWidth/2},${centerY + outerHeight/2}
        ${centerX - outerWidth/2},${centerY + outerHeight/2}
    `;
    
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    polygon.setAttribute('stroke', '#007bff');
    polygon.setAttribute('stroke-width', '3');
    group.appendChild(polygon);
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

// KORRIGIERTE Corner-Positionen für alle Formen
function getActualCornerPositions(data, scale) {
    const finalShape = determineActualShape();
    const variant = determineActualVariant();
    let corners = [];
    
    console.log('getActualCornerPositions für:', finalShape, 'mit Daten:', data);
    
    // Kreisformen - vereinfacht als Polygone für Handles
    if (finalShape === 'kreis') {
        const radius = (data.radius || 3) * scale;
        for (let i = 0; i < 12; i++) {
            const angle = (i * 2 * Math.PI) / 12;
            corners.push({
                x: CANVAS_CENTER_X + radius * Math.cos(angle),
                y: CANVAS_CENTER_Y + radius * Math.sin(angle)
            });
        }
    } else if (finalShape === 'oval') {
        const radiusX = (data.radiusX || 4) * scale;
        const radiusY = (data.radiusY || 2.5) * scale;
        for (let i = 0; i < 12; i++) {
            const angle = (i * 2 * Math.PI) / 12;
            corners.push({
                x: CANVAS_CENTER_X + radiusX * Math.cos(angle),
                y: CANVAS_CENTER_Y + radiusY * Math.sin(angle)
            });
        }
    } else if (finalShape === 'halbkreis') {
        const radius = (data.radius || 4) * scale;
        // Halbkreis-Punkte von 0° bis 180°
        for (let i = 0; i <= 8; i++) {
            const angle = (i * Math.PI) / 8;
            corners.push({
                x: CANVAS_CENTER_X + radius * Math.cos(angle),
                y: CANVAS_CENTER_Y + radius * Math.sin(angle)
            });
        }
        // Gerade Linie zurück
        corners.push({
            x: CANVAS_CENTER_X - radius,
            y: CANVAS_CENTER_Y
        });
    } else if (finalShape === 'viertelkreis') {
        const radius = (data.radius || 5) * scale;
        corners = [
            { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y },
            { x: CANVAS_CENTER_X + radius, y: CANVAS_CENTER_Y }
        ];
        // Viertelkreis-Bogen
        for (let i = 1; i <= 4; i++) {
            const angle = (i * Math.PI / 2) / 4;
            corners.push({
                x: CANVAS_CENTER_X + radius * Math.cos(angle),
                y: CANVAS_CENTER_Y - radius * Math.sin(angle)
            });
        }
        corners.push({ x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - radius });
    } else if (finalShape === 'langloch') {
        const length = (data.length || 8) * scale;
        const width = (data.width || 3) * scale;
        const radius = width / 2;
        const halfLength = length / 2 - radius;
        
        // Vereinfacht als Rechteck mit abgerundeten Enden
        corners = [
            { x: CANVAS_CENTER_X - halfLength, y: CANVAS_CENTER_Y - radius },
            { x: CANVAS_CENTER_X + halfLength, y: CANVAS_CENTER_Y - radius },
            { x: CANVAS_CENTER_X + halfLength, y: CANVAS_CENTER_Y + radius },
            { x: CANVAS_CENTER_X - halfLength, y: CANVAS_CENTER_Y + radius }
        ];
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
    
    // Quadrat
    else if (finalShape === 'quadrat') {
        const side = (data.side || 5) * scale;
        corners = [
            { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y - side/2 },
            { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y - side/2 },
            { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y + side/2 },
            { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y + side/2 }
        ];
    }
    
    // Trapez
    else if (finalShape === 'trapez') {
        const sideA = (data.sideA || 8) * scale;
        const sideB = (data.sideB || 6) * scale;
        const height = (data.height || 4) * scale;
        corners = [
            { x: CANVAS_CENTER_X - sideA/2, y: CANVAS_CENTER_Y + height/2 },
            { x: CANVAS_CENTER_X + sideA/2, y: CANVAS_CENTER_Y + height/2 },
            { x: CANVAS_CENTER_X + sideB/2, y: CANVAS_CENTER_Y - height/2 },
            { x: CANVAS_CENTER_X - sideB/2, y: CANVAS_CENTER_Y - height/2 }
        ];
    }
    
    // Parallelogramm
    else if (finalShape === 'parallelogramm') {
        const length = (data.length || 8) * scale;
        const width = (data.width || 5) * scale;
        const angle = (data.angle || 75) * Math.PI / 180;
        const offset = width * Math.cos(angle);
        corners = [
            { x: CANVAS_CENTER_X - length/2, y: CANVAS_CENTER_Y + width/2 },
            { x: CANVAS_CENTER_X + length/2, y: CANVAS_CENTER_Y + width/2 },
            { x: CANVAS_CENTER_X + length/2 + offset, y: CANVAS_CENTER_Y - width/2 },
            { x: CANVAS_CENTER_X - length/2 + offset, y: CANVAS_CENTER_Y - width/2 }
        ];
    }
    
    // Rhombus
    else if (finalShape === 'rhombus') {
        const diagonal1 = (data.diagonal1 || 6) * scale;
        const diagonal2 = (data.diagonal2 || 4) * scale;
        corners = [
            { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - diagonal2/2 },
            { x: CANVAS_CENTER_X + diagonal1/2, y: CANVAS_CENTER_Y },
            { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y + diagonal2/2 },
            { x: CANVAS_CENTER_X - diagonal1/2, y: CANVAS_CENTER_Y }
        ];
    }
    
    // Vielecke
    else if (['fuenfeck', 'sechseck', 'achteck'].includes(finalShape)) {
        const radius = (data.radius || 3) * scale;
        const sides = finalShape === 'fuenfeck' ? 5 : finalShape === 'sechseck' ? 6 : 8;
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
            corners.push({
                x: CANVAS_CENTER_X + radius * Math.cos(angle),
                y: CANVAS_CENTER_Y + radius * Math.sin(angle)
            });
        }
    }
    
    // L-Form
    else if (finalShape === 'lform') {
        const length1 = (data.length1 || 8) * scale;
        const width1 = (data.width1 || 3) * scale;
        const length2 = (data.length2 || 5) * scale;
        const width2 = (data.width2 || 4) * scale;
        corners = [
            { x: CANVAS_CENTER_X - length1/2, y: CANVAS_CENTER_Y - width1/2 },
            { x: CANVAS_CENTER_X - length1/2 + length2, y: CANVAS_CENTER_Y - width1/2 },
            { x: CANVAS_CENTER_X - length1/2 + length2, y: CANVAS_CENTER_Y - width1/2 + width2 },
            { x: CANVAS_CENTER_X + length1/2, y: CANVAS_CENTER_Y - width1/2 + width2 },
            { x: CANVAS_CENTER_X + length1/2, y: CANVAS_CENTER_Y + width1/2 },
            { x: CANVAS_CENTER_X - length1/2, y: CANVAS_CENTER_Y + width1/2 }
        ];
    }
    
    // T-Form
    else if (finalShape === 'tform') {
        const headWidth = (data.headWidth || 8) * scale;
        const headHeight = (data.headHeight || 2) * scale;
        const stemWidth = (data.stemWidth || 3) * scale;
        const stemHeight = (data.stemHeight || 5) * scale;
        const totalHeight = headHeight + stemHeight;
        corners = [
            { x: CANVAS_CENTER_X - headWidth/2, y: CANVAS_CENTER_Y - totalHeight/2 },
            { x: CANVAS_CENTER_X + headWidth/2, y: CANVAS_CENTER_Y - totalHeight/2 },
            { x: CANVAS_CENTER_X + headWidth/2, y: CANVAS_CENTER_Y - totalHeight/2 + headHeight },
            { x: CANVAS_CENTER_X + stemWidth/2, y: CANVAS_CENTER_Y - totalHeight/2 + headHeight },
            { x: CANVAS_CENTER_X + stemWidth/2, y: CANVAS_CENTER_Y + totalHeight/2 },
            { x: CANVAS_CENTER_X - stemWidth/2, y: CANVAS_CENTER_Y + totalHeight/2 },
            { x: CANVAS_CENTER_X - stemWidth/2, y: CANVAS_CENTER_Y - totalHeight/2 + headHeight },
            { x: CANVAS_CENTER_X - headWidth/2, y: CANVAS_CENTER_Y - totalHeight/2 + headHeight }
        ];
    }
    
    // U-Form
    else if (finalShape === 'uform') {
        const outerWidth = (data.outerWidth || 8) * scale;
        const outerHeight = (data.outerHeight || 6) * scale;
        const innerWidth = (data.innerWidth || 4) * scale;
        const innerHeight = (data.innerHeight || 4) * scale;
        corners = [
            { x: CANVAS_CENTER_X - outerWidth/2, y: CANVAS_CENTER_Y - outerHeight/2 },
            { x: CANVAS_CENTER_X + outerWidth/2, y: CANVAS_CENTER_Y - outerHeight/2 },
            { x: CANVAS_CENTER_X + outerWidth/2, y: CANVAS_CENTER_Y + outerHeight/2 },
            { x: CANVAS_CENTER_X + innerWidth/2, y: CANVAS_CENTER_Y + outerHeight/2 },
            { x: CANVAS_CENTER_X + innerWidth/2, y: CANVAS_CENTER_Y - outerHeight/2 + (outerHeight - innerHeight) },
            { x: CANVAS_CENTER_X - innerWidth/2, y: CANVAS_CENTER_Y - outerHeight/2 + (outerHeight - innerHeight) },
            { x: CANVAS_CENTER_X - innerWidth/2, y: CANVAS_CENTER_Y + outerHeight/2 },
            { x: CANVAS_CENTER_X - outerWidth/2, y: CANVAS_CENTER_Y + outerHeight/2 }
        ];
    }
    
    // Fallback: Rechteck
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
    
    console.log('Generierte', corners.length, 'Eckpunkte für', finalShape);
    
    // WICHTIG: Rotation wird hier NICHT angewendet, da sie später im SVG-Transform erfolgt
    // Die checkAlignmentAndHighlight Funktion arbeitet mit den unrotierten Koordinaten
    // und berechnet die Rotation selbst
    
    return corners;
}

function drawCornerHandlesOnShape(group, data, scale) {
    // ENTFERNT: Keine Corner-Handles mehr zeichnen
    // Die bunten Punkte an den Ecken werden nicht mehr angezeigt
    console.log('Corner-Handles deaktiviert - keine visuellen Handles mehr');
}

function drawLabelsOnShape(group, data, scale) {
    const corners = getActualCornerPositions(data, scale);
    const finalShape = determineActualShape();
    
    if (finalShape === 'dreieck' && corners.length >= 3) {
        // Dreiecks-Labels
        const labels = ['A', 'B', 'C'];
        const colors = ['#dc3545', '#28a745', '#ffc107'];
        
        for (let i = 0; i < 3; i++) {
            const nextI = (i + 1) % 3;
            const midX = (corners[i].x + corners[nextI].x) / 2;
            const midY = (corners[i].y + corners[nextI].y) / 2;
            
            const label = createLabel(midX, midY + 15, labels[i], colors[i]);
            group.appendChild(label);
        }
    } else if (corners.length >= 4 && ['quadrat', 'rechteck'].includes(finalShape)) {
        // Viereck-Labels
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

// Maus-Events (DEAKTIVIERT - nur für Referenz behalten)
function handleMouseDown(event) {
    // DEAKTIVIERT: Kein manuelles Drehen mehr
    console.log('Manuelles Drehen ist deaktiviert - verwende die Rotations-Buttons');
}

function handleMouseMove(event) {
    // DEAKTIVIERT: Kein manuelles Drehen mehr
    // Nur noch Standard-Cursor
    if (svg) {
        svg.style.cursor = 'default';
    }
}

function handleMouseUp(event) {
    // DEAKTIVIERT: Kein manuelles Drehen mehr
}

function isNearCorner(x, y) {
    // DEAKTIVIERT: Keine Corner-Detection mehr nötig
    return false;
}

function startDragging(x, y) {
    // DEAKTIVIERT
}

function updateRotation(x, y) {
    // DEAKTIVIERT
}

function stopDragging() {
    // DEAKTIVIERT
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
    
    const data = getCurrentFormData();
    const scale = calculateOptimalScale(data);
    updateShapeWithScale(scale);
    updateRotationDisplay();
}

function stopDragging() {
    isDragging = false;
    svg.style.cursor = 'default';
    
    setTimeout(() => { removeAlignmentHighlights(); }, 2000);
}

// Berechnungen
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
        default:
            area = 40;
            perimeter = 26;
    }
    
    const areaElement = document.getElementById('calc-area');
    const perimeterElement = document.getElementById('calc-perimeter');
    
    if (areaElement) areaElement.textContent = area.toFixed(2) + ' m²';
    if (perimeterElement) perimeterElement.textContent = perimeter.toFixed(2) + ' m';
}

// Event Listeners und Setup-Funktionen
function setupEventListeners() {
    console.log('setupEventListeners aufgerufen');
    
    const backBtn = document.getElementById('btn-back');
    const continueBtn = document.getElementById('btn-continue');
    
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            saveCurrentData();
            window.location.href = 'dachform.html';
        });
        console.log('Back-Button Event Listener hinzugefügt');
    }
    
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            saveCurrentData();
            window.location.href = 'berechnung.html';
        });
        console.log('Continue-Button Event Listener hinzugefügt');
    }
    
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            resetToDefaults();
        });
        console.log('Reset-Button Event Listener hinzugefügt');
    }
}

function resetToDefaults() {
    currentRotation = 0;
    removeAlignmentHighlights();
    
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
        }
    });
    
    updateShape();
    showFeedback('Zurückgesetzt: Form, Rotation und alle Parameter');
}

function showFeedback(message, backgroundColor = '#28a745') {
    const existingFeedback = document.querySelectorAll('.feedback-message');
    existingFeedback.forEach(fb => fb.remove());
    
    const feedback = document.createElement('div');
    feedback.className = 'feedback-message';
    feedback.style.cssText = `
        position: fixed; top: 100px; right: 20px; background: ${backgroundColor}; color: white;
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
        default:
            // Rechteck
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
        default:
            return { length: 8, width: 5 };
    }
}

console.log('Korrigierte Editor.js mit vollständiger Funktionalität geladen');

// WICHTIG: Diese Funktion muss am Ende der Datei stehen
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== EDITOR DOM CONTENT LOADED ===');
    setTimeout(() => {
        try {
            console.log('Starte Editor-Initialisierung...');
            loadProjectData();
            initializeCanvas();
            initializeUI();
            loadAndDrawShape();
            setupEventListeners();
            console.log('✅ Editor erfolgreich initialisiert');
        } catch (error) {
            console.error('❌ Editor-Fehler:', error);
            console.error('Stack:', error.stack);
        }
    }, 100);
});
