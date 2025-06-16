// editor.js – Korrigierte und vollständige Version

let projectData = {};
let currentShape = '';
let currentVariant = '';
let svg;
let isUpdating = false;

// Transformation state
let currentRotation = 0;
let isMirroredH = false;
let isMirroredV = false;
let traufePosition = 'bottom';

// Traufe-Auswahl Modus
let traufeSelectionMode = false;
let traufeOverlay = null;

const CANVAS_CENTER_X = 300;
const CANVAS_CENTER_Y = 200;
const SCALE_FACTOR = 25;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        try {
            loadProjectData();
            initializeCanvas();
            initializeUI();
            loadAndDrawShape();
            setupEventListeners();
            console.log('✅ Editor initialisiert');
        } catch (error) {
            console.error('❌ Editor-Fehler:', error);
        }
    }, 100);
});

function loadProjectData() {
    const dataString = localStorage.getItem('dachplattenrechner_data') || 
                       sessionStorage.getItem('dachplattenrechner_data');
    
    if (!dataString) {
        alert('Keine Projektdaten gefunden.');
        window.location.href = 'profil.html';
        return;
    }

    try {
        projectData = JSON.parse(dataString);
        
        if (!projectData.profile || !projectData.roofShape) {
            throw new Error('Unvollständige Daten');
        }
        
    } catch (e) {
        alert('Fehler beim Laden der Daten.');
        window.location.href = 'index.html';
    }
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
        border: 2px solid #e9ecef;
        border-radius: 8px;
        background: white;
        width: 600px;
        height: 400px;
        margin: 20px auto;
        position: relative;
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
        <g id="dimensions"></g>
    `;
    
    wrapper.appendChild(svg);
    container.appendChild(wrapper);
}

function initializeUI() {
    displayProfileInfo();
    updateShapeTitle();
    updateDirectionInfo();
}

function displayProfileInfo() {
    const profile = projectData.profile;
    if (!profile) return;
    
    const elements = {
        'current-profile-name': profile.profilname || 'Standard',
        'current-deckbreite': `${profile.deckbreite || 1000} mm`,
        'current-lieferbreite': `${profile.lieferbreite || 1050} mm`,
        'current-seitenueberlappung': `${profile.seitenueberlappung || 50} mm`
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

function updateDirectionInfo() {
    const directionElement = document.getElementById('current-direction');
    const reasonElement = document.getElementById('direction-reason');
    
    if (directionElement) {
        const direction = getRecommendedDirection();
        directionElement.textContent = direction.name;
    }
    
    if (reasonElement) {
        const reason = getDirectionReason();
        reasonElement.textContent = reason;
    }
}

function getRecommendedDirection() {
    const rotationDeg = currentRotation % 360;
    
    if (rotationDeg >= -45 && rotationDeg <= 45) {
        return { name: 'Längs (vertikal)', code: 'vertical' };
    } else if (rotationDeg >= 45 && rotationDeg <= 135) {
        return { name: 'Quer (horizontal)', code: 'horizontal' };
    } else if (rotationDeg >= 135 || rotationDeg <= -135) {
        return { name: 'Längs (gedreht)', code: 'vertical-rotated' };
    } else {
        return { name: 'Quer (gedreht)', code: 'horizontal-rotated' };
    }
}

function getDirectionReason() {
    const traufeNames = {
        'top': 'oben',
        'right': 'rechts', 
        'bottom': 'unten',
        'left': 'links'
    };
    
    return `Traufe ${traufeNames[traufePosition]}, Rotation ${currentRotation}°`;
}

function loadAndDrawShape() {
    const roofShape = projectData.roofShape;
    if (!roofShape) return;
    
    currentShape = roofShape.baseShape;
    currentVariant = roofShape.variant;
    
    createInputFields();
    updateShape();
}

function determineActualShape() {
    // Spezialfall: Quadrat
    if (currentVariant === 'quadrat') {
        return 'quadrat';
    }
    
    // Spezialfall: Trapez
    if (currentVariant === 'trapez') {
        return 'trapez';
    }
    
    // Spezialfall: Parallelogramm
    if (currentVariant === 'parallelogramm') {
        return 'parallelogramm';
    }
    
    // Spezialfall: Rhombus
    if (currentVariant === 'rhombus') {
        return 'rhombus';
    }
    
    // Spezialfall: Langloch
    if (currentVariant === 'langloch') {
        return 'langloch';
    }
    
    // Spezialfall: Vielecke
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
    
    if (finalShape === 'dreieck') {
        createTriangleInputs(finalVariant, container);
    } else if (finalShape === 'kreis') {
        createCircleInputs(finalVariant, container);
    } else if (finalShape === 'rechteck') {
        createRectangleInputs('rechteck', container);
    } else if (finalShape === 'quadrat') {
        createRectangleInputs('quadrat', container);
    } else if (finalShape === 'trapez') {
        createTrapezInputs(container);
    } else if (finalShape === 'parallelogramm') {
        createParallelogrammInputs(container);
    } else if (finalShape === 'rhombus') {
        createRhombusInputs(container);
    } else if (finalShape === 'langloch') {
        createLanglochInputs(container);
    } else if (finalShape === 'vieleck') {
        createPolygonInputs(finalVariant, container);
    } else {
        createRectangleInputs('rechteck', container);
    }
}

function createTriangleInputs(variant, container) {
    switch (variant) {
        case 'gleichseitig':
            container.appendChild(createInput('Seitenlänge (m)', 'side', '6'));
            break;
        case 'rechtwinklig':
            container.appendChild(createInput('Kathete A (m)', 'katheteA', '4'));
            container.appendChild(createInput('Kathete B (m)', 'katheteB', '5'));
            break;
        default:
            container.appendChild(createInput('Seite A (m)', 'sideA', '4'));
            container.appendChild(createInput('Seite B (m)', 'sideB', '5'));
            container.appendChild(createInput('Seite C (m)', 'sideC', '6'));
    }
}

function createCircleInputs(variant, container) {
    switch (variant) {
        case 'oval':
            container.appendChild(createInput('Halbachse A (m)', 'radiusA', '5'));
            container.appendChild(createInput('Halbachse B (m)', 'radiusB', '3'));
            break;
        default:
            container.appendChild(createInput('Radius (m)', 'radius', '4'));
    }
}

function createRectangleInputs(variant, container) {
    if (variant === 'quadrat') {
        container.appendChild(createInput('Seitenlänge (m)', 'side', '5'));
    } else {
        container.appendChild(createInput('Länge (m)', 'length', '8'));
        container.appendChild(createInput('Breite (m)', 'width', '5'));
    }
}

function createTrapezInputs(container) {
    container.appendChild(createInput('Basis A (m)', 'baseA', '8'));
    container.appendChild(createInput('Basis B (m)', 'baseB', '5'));
    container.appendChild(createInput('Höhe (m)', 'height', '4'));
}

function createParallelogrammInputs(container) {
    container.appendChild(createInput('Basis (m)', 'base', '8'));
    container.appendChild(createInput('Seite (m)', 'side', '5'));
    container.appendChild(createInput('Höhe (m)', 'height', '4'));
}

function createRhombusInputs(container) {
    container.appendChild(createInput('Seitenlänge (m)', 'side', '5'));
    container.appendChild(createInput('Höhe (m)', 'height', '4'));
}

function createLanglochInputs(container) {
    container.appendChild(createInput('Länge (m)', 'length', '8'));
    container.appendChild(createInput('Breite (m)', 'width', '3'));
    container.appendChild(createInput('Eckenradius (m)', 'radius', '1'));
}

function createPolygonInputs(variant, container) {
    switch (variant) {
        case 'fuenfeck':
        case 'sechseck':
        case 'achteck':
            container.appendChild(createInput('Seitenlänge (m)', 'side', '5'));
            break;
        default:
            container.appendChild(createInput('Länge (m)', 'length', '8'));
            container.appendChild(createInput('Breite (m)', 'width', '5'));
    }
}

function createInput(labelText, id, defaultValue = '') {
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
    
    // MEHRERE Event Listener für sofortige Reaktion
    input.addEventListener('input', handleInputChange);      // Während dem Tippen
    input.addEventListener('change', handleInputChange);     // Nach Änderung
    input.addEventListener('keyup', handleInputChange);      // Nach Tastendruck
    input.addEventListener('blur', handleInputChange);       // Beim Verlassen des Feldes
    
    console.log('Input-Feld erstellt:', id, 'mit Wert:', defaultValue);
    
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
    
    console.log('Input geändert, aktualisiere Form...');
    
    // Direkte Aktualisierung ohne isUpdating Block
    updateShape();
}

function updateShape() {
    if (!svg) {
        console.log('❌ SVG nicht verfügbar');
        return;
    }
    
    const shapeGroup = document.getElementById('roof-shape');
    if (!shapeGroup) {
        console.log('❌ Shape-Group nicht gefunden');
        return;
    }
    
    console.log('=== UPDATE SHAPE DEBUG ===');
    console.log('Aktuelle Rotation beim Update:', currentRotation);
    
    // WICHTIG: Komplett leeren und neu aufbauen
    shapeGroup.innerHTML = '';
    
    const currentData = getCurrentFormData();
    console.log('Form-Daten:', currentData);
    
    // Neue Form zeichnen
    drawTransformedShape(shapeGroup, currentData);
    updateCalculations(currentData);
    updateDirectionInfo();
    
    console.log('✅ Form-Update abgeschlossen');
    console.log('=== ENDE UPDATE SHAPE ===');
}

function getCurrentFormData() {
    const data = { 
        shape: currentShape,
        variant: currentVariant 
    };
    
    console.log('Sammle Form-Daten für:', currentShape, currentVariant);
    
    const inputs = document.querySelectorAll('#geometry-inputs-grid input');
    console.log('Gefundene Inputs:', inputs.length);
    
    inputs.forEach(input => {
        if (input.value) {
            const numValue = parseFloat(input.value);
            if (!isNaN(numValue)) {
                data[input.id] = numValue;
                console.log('Input gefunden:', input.id, '=', numValue);
            }
        }
    });
    
    console.log('Gesammelte Form-Daten:', data);
    return data;
}

function drawTransformedShape(group, data) {
    console.log('=== DRAW TRANSFORM DEBUG ===');
    console.log('Aktuelle Rotation:', currentRotation);
    console.log('Ist gespiegelt H:', isMirroredH, 'V:', isMirroredV);
    
    const transformGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // KORRIGIERTE Transform-Reihenfolge
    let transform = '';
    
    // 1. Erst zum Mittelpunkt verschieben
    transform += `translate(${CANVAS_CENTER_X}, ${CANVAS_CENTER_Y}) `;
    
    // 2. Dann rotieren (um den Mittelpunkt)
    if (currentRotation !== 0) {
        transform += `rotate(${currentRotation}) `;
        console.log('Rotation angewendet:', currentRotation);
    }
    
    // 3. Dann spiegeln (falls nötig)
    let scaleX = isMirroredH ? -1 : 1;
    let scaleY = isMirroredV ? -1 : 1;
    if (scaleX !== 1 || scaleY !== 1) {
        transform += `scale(${scaleX}, ${scaleY}) `;
        console.log('Spiegelung angewendet:', scaleX, scaleY);
    }
    
    // 4. Zurück vom Mittelpunkt
    transform += `translate(${-CANVAS_CENTER_X}, ${-CANVAS_CENTER_Y})`;
    
    console.log('Finale Transform:', transform);
    
    transformGroup.setAttribute('transform', transform);
    
    drawShape(transformGroup, data);
    group.appendChild(transformGroup);
    
    // Bemaßung hinzufügen (NACH der Transformation)
    addDimensionLines(group, data);
    
    console.log('=== ENDE DRAW TRANSFORM ===');
}

function addDimensionLines(group, data) {
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    
    console.log('Füge Bemaßung hinzu für:', finalShape, finalVariant);
    
    // Bemaßungsgruppe erstellen
    const dimGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    dimGroup.id = 'dimension-lines';
    
    if (finalShape === 'rechteck' || finalShape === 'quadrat') {
        addRectangleDimensions(dimGroup, data, finalVariant);
    } else if (finalShape === 'dreieck') {
        addTriangleDimensions(dimGroup, data, finalVariant);
    } else if (finalShape === 'kreis') {
        addCircleDimensions(dimGroup, data, finalVariant);
    } else if (finalShape === 'trapez') {
        addTrapezDimensions(dimGroup, data);
    }
    
    group.appendChild(dimGroup);
}

function addRectangleDimensions(group, data, variant) {
    let width, height;
    
    if (variant === 'quadrat') {
        const side = data.side || 5;
        width = height = side;
    } else {
        width = data.length || 8;
        height = data.width || 5;
    }
    
    const scaledWidth = width * SCALE_FACTOR;
    const scaledHeight = height * SCALE_FACTOR;
    
    // Horizontale Bemaßung (Breite)
    addDimensionLine(
        group,
        CANVAS_CENTER_X - scaledWidth/2, CANVAS_CENTER_Y + scaledHeight/2 + 30,
        CANVAS_CENTER_X + scaledWidth/2, CANVAS_CENTER_Y + scaledHeight/2 + 30,
        `${width.toFixed(1)} m`,
        'horizontal'
    );
    
    // Vertikale Bemaßung (Höhe)
    addDimensionLine(
        group,
        CANVAS_CENTER_X - scaledWidth/2 - 30, CANVAS_CENTER_Y - scaledHeight/2,
        CANVAS_CENTER_X - scaledWidth/2 - 30, CANVAS_CENTER_Y + scaledHeight/2,
        `${height.toFixed(1)} m`,
        'vertical'
    );
}

function addTriangleDimensions(group, data, variant) {
    if (variant === 'gleichseitig') {
        const side = data.side || 6;
        const scaledSide = side * SCALE_FACTOR;
        
        // Basis-Bemaßung
        addDimensionLine(
            group,
            CANVAS_CENTER_X - scaledSide/2, CANVAS_CENTER_Y + scaledSide * Math.sqrt(3)/4 + 30,
            CANVAS_CENTER_X + scaledSide/2, CANVAS_CENTER_Y + scaledSide * Math.sqrt(3)/4 + 30,
            `${side.toFixed(1)} m`,
            'horizontal'
        );
    } else if (variant === 'rechtwinklig') {
        const a = data.katheteA || 4;
        const b = data.katheteB || 5;
        
        // Kathete A (horizontal)
        addDimensionLine(
            group,
            CANVAS_CENTER_X - a * SCALE_FACTOR/2, CANVAS_CENTER_Y + b * SCALE_FACTOR/2 + 30,
            CANVAS_CENTER_X + a * SCALE_FACTOR/2, CANVAS_CENTER_Y + b * SCALE_FACTOR/2 + 30,
            `${a.toFixed(1)} m`,
            'horizontal'
        );
        
        // Kathete B (vertikal)
        addDimensionLine(
            group,
            CANVAS_CENTER_X - a * SCALE_FACTOR/2 - 30, CANVAS_CENTER_Y - b * SCALE_FACTOR/2,
            CANVAS_CENTER_X - a * SCALE_FACTOR/2 - 30, CANVAS_CENTER_Y + b * SCALE_FACTOR/2,
            `${b.toFixed(1)} m`,
            'vertical'
        );
    } else {
        // Ungleichschenkliges Dreieck - alle drei Seiten
        const sideA = data.sideA || 4;
        const sideB = data.sideB || 5;
        const sideC = data.sideC || 6;
        
        // Basis (Seite A)
        addDimensionLine(
            group,
            CANVAS_CENTER_X - sideA * SCALE_FACTOR/2, CANVAS_CENTER_Y + 60,
            CANVAS_CENTER_X + sideA * SCALE_FACTOR/2, CANVAS_CENTER_Y + 60,
            `A: ${sideA.toFixed(1)} m`,
            'horizontal'
        );
        
        // Seite B und C als Text
        addDimensionText(group, CANVAS_CENTER_X - 100, CANVAS_CENTER_Y - 100, `B: ${sideB.toFixed(1)} m`);
        addDimensionText(group, CANVAS_CENTER_X + 60, CANVAS_CENTER_Y - 100, `C: ${sideC.toFixed(1)} m`);
    }
}

function addCircleDimensions(group, data, variant) {
    if (variant === 'oval') {
        const radiusA = data.radiusA || 5;
        const radiusB = data.radiusB || 3;
        
        // Durchmesser A (horizontal)
        addDimensionLine(
            group,
            CANVAS_CENTER_X - radiusA * SCALE_FACTOR, CANVAS_CENTER_Y + radiusB * SCALE_FACTOR + 30,
            CANVAS_CENTER_X + radiusA * SCALE_FACTOR, CANVAS_CENTER_Y + radiusB * SCALE_FACTOR + 30,
            `⌀ ${(radiusA * 2).toFixed(1)} m`,
            'horizontal'
        );
        
        // Durchmesser B (vertikal)
        addDimensionLine(
            group,
            CANVAS_CENTER_X - radiusA * SCALE_FACTOR - 30, CANVAS_CENTER_Y - radiusB * SCALE_FACTOR,
            CANVAS_CENTER_X - radiusA * SCALE_FACTOR - 30, CANVAS_CENTER_Y + radiusB * SCALE_FACTOR,
            `⌀ ${(radiusB * 2).toFixed(1)} m`,
            'vertical'
        );
    } else {
        const radius = data.radius || 4;
        
        // Durchmesser
        addDimensionLine(
            group,
            CANVAS_CENTER_X - radius * SCALE_FACTOR, CANVAS_CENTER_Y + radius * SCALE_FACTOR + 30,
            CANVAS_CENTER_X + radius * SCALE_FACTOR, CANVAS_CENTER_Y + radius * SCALE_FACTOR + 30,
            `⌀ ${(radius * 2).toFixed(1)} m`,
            'horizontal'
        );
    }
}

function addTrapezDimensions(group, data) {
    const baseA = data.baseA || 8;
    const baseB = data.baseB || 5;
    const height = data.height || 4;
    
    // Basis A (unten)
    addDimensionLine(
        group,
        CANVAS_CENTER_X - baseA * SCALE_FACTOR/2, CANVAS_CENTER_Y + height * SCALE_FACTOR/2 + 30,
        CANVAS_CENTER_X + baseA * SCALE_FACTOR/2, CANVAS_CENTER_Y + height * SCALE_FACTOR/2 + 30,
        `A: ${baseA.toFixed(1)} m`,
        'horizontal'
    );
    
    // Basis B (oben)
    addDimensionLine(
        group,
        CANVAS_CENTER_X - baseB * SCALE_FACTOR/2, CANVAS_CENTER_Y - height * SCALE_FACTOR/2 - 30,
        CANVAS_CENTER_X + baseB * SCALE_FACTOR/2, CANVAS_CENTER_Y - height * SCALE_FACTOR/2 - 30,
        `B: ${baseB.toFixed(1)} m`,
        'horizontal'
    );
    
    // Höhe
    addDimensionLine(
        group,
        CANVAS_CENTER_X - baseA * SCALE_FACTOR/2 - 40, CANVAS_CENTER_Y - height * SCALE_FACTOR/2,
        CANVAS_CENTER_X - baseA * SCALE_FACTOR/2 - 40, CANVAS_CENTER_Y + height * SCALE_FACTOR/2,
        `h: ${height.toFixed(1)} m`,
        'vertical'
    );
}

function addDimensionLine(group, x1, y1, x2, y2, text, orientation) {
    // Maßlinie
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', '#666');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '2,2');
    group.appendChild(line);
    
    // Maßhilfslinien
    if (orientation === 'horizontal') {
        // Vertikale Hilfslinien
        const helper1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        helper1.setAttribute('x1', x1);
        helper1.setAttribute('y1', y1 - 10);
        helper1.setAttribute('x2', x1);
        helper1.setAttribute('y2', y1 + 10);
        helper1.setAttribute('stroke', '#666');
        helper1.setAttribute('stroke-width', '1');
        group.appendChild(helper1);
        
        const helper2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        helper2.setAttribute('x1', x2);
        helper2.setAttribute('y1', y2 - 10);
        helper2.setAttribute('x2', x2);
        helper2.setAttribute('y2', y2 + 10);
        helper2.setAttribute('stroke', '#666');
        helper2.setAttribute('stroke-width', '1');
        group.appendChild(helper2);
    } else {
        // Horizontale Hilfslinien
        const helper1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        helper1.setAttribute('x1', x1 - 10);
        helper1.setAttribute('y1', y1);
        helper1.setAttribute('x2', x1 + 10);
        helper1.setAttribute('y2', y1);
        helper1.setAttribute('stroke', '#666');
        helper1.setAttribute('stroke-width', '1');
        group.appendChild(helper1);
        
        const helper2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        helper2.setAttribute('x1', x2 - 10);
        helper2.setAttribute('y1', y2);
        helper2.setAttribute('x2', x2 + 10);
        helper2.setAttribute('y2', y2);
        helper2.setAttribute('stroke', '#666');
        helper2.setAttribute('stroke-width', '1');
        group.appendChild(helper2);
    }
    
    // Maßtext
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    addDimensionText(group, midX, midY, text);
}

function addDimensionText(group, x, y, text) {
    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElement.setAttribute('x', x);
    textElement.setAttribute('y', y);
    textElement.setAttribute('text-anchor', 'middle');
    textElement.setAttribute('alignment-baseline', 'middle');
    textElement.setAttribute('font-family', 'Arial, sans-serif');
    textElement.setAttribute('font-size', '12');
    textElement.setAttribute('font-weight', 'bold');
    textElement.setAttribute('fill', '#333');
    textElement.textContent = text;
    
    // Hintergrund für bessere Lesbarkeit
    const bbox = textElement.getBBox ? textElement.getBBox() : { x: x-20, y: y-6, width: 40, height: 12 };
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', bbox.x - 3);
    bg.setAttribute('y', bbox.y - 1);
    bg.setAttribute('width', bbox.width + 6);
    bg.setAttribute('height', bbox.height + 2);
    bg.setAttribute('fill', 'white');
    bg.setAttribute('stroke', '#ccc');
    bg.setAttribute('stroke-width', '0.5');
    bg.setAttribute('rx', '2');
    
    group.appendChild(bg);
    group.appendChild(textElement);
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
        case 'parallelogramm':
            drawParallelogramm(group, data);
            break;
        case 'rhombus':
            drawRhombus(group, data);
            break;
        case 'langloch':
            drawLangloch(group, data);
            break;
        case 'vieleck':
            drawPolygon(group, data, finalVariant);
            break;
        default:
            drawRectangle(group, data, 'rechteck');
    }
}

function drawTriangle(group, data, variant) {
    let points = '';
    
    console.log('Zeichne Dreieck:', variant, 'mit Daten:', data);
    
    if (variant === 'gleichseitig') {
        const side = (data.side || 6) * SCALE_FACTOR;
        const height = side * Math.sqrt(3) / 2;
        points = `${CANVAS_CENTER_X},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - side/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + side/2},${CANVAS_CENTER_Y + height/2}`;
        console.log('Gleichseitiges Dreieck - Seitenlänge:', side/SCALE_FACTOR, 'm');
    } else if (variant === 'rechtwinklig') {
        const a = (data.katheteA || 4) * SCALE_FACTOR;
        const b = (data.katheteB || 5) * SCALE_FACTOR;
        points = `${CANVAS_CENTER_X - a/2},${CANVAS_CENTER_Y + b/2} ${CANVAS_CENTER_X + a/2},${CANVAS_CENTER_Y + b/2} ${CANVAS_CENTER_X - a/2},${CANVAS_CENTER_Y - b/2}`;
        console.log('Rechtwinkliges Dreieck - Katheten:', a/SCALE_FACTOR, 'm ×', b/SCALE_FACTOR, 'm');
    } else {
        // KORRIGIERT: Ungleichschenkliges Dreieck mit allen drei Seiten
        const sideA = (data.sideA || 4) * SCALE_FACTOR;
        const sideB = (data.sideB || 5) * SCALE_FACTOR; 
        const sideC = (data.sideC || 6) * SCALE_FACTOR;
        
        // Berechne Positionen basierend auf allen drei Seiten
        // Basis = sideA (horizontal unten)
        const baseWidth = sideA;
        
        // Höhe über Kosinussatz berechnen
        // Für sideB und sideC die Position des dritten Punktes finden
        const cosA = (sideB*sideB + sideC*sideC - sideA*sideA) / (2 * sideB * sideC);
        const height = sideB * Math.sin(Math.acos(Math.max(-1, Math.min(1, cosA))));
        
        // X-Position des dritten Punktes
        const topX = sideB * Math.cos(Math.acos(Math.max(-1, Math.min(1, cosA))));
        
        points = `${CANVAS_CENTER_X - baseWidth/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + baseWidth/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X - baseWidth/2 + topX},${CANVAS_CENTER_Y - height/2}`;
        
        console.log('Ungleichschenkliges Dreieck - Seiten:', sideA/SCALE_FACTOR, sideB/SCALE_FACTOR, sideC/SCALE_FACTOR, 'm, Höhe:', height/SCALE_FACTOR, 'm');
    }
    
    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    triangle.setAttribute('points', points);
    triangle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    triangle.setAttribute('stroke', '#007bff');
    triangle.setAttribute('stroke-width', '3');
    
    group.appendChild(triangle);
}

function drawCircle(group, data, variant) {
    console.log('Zeichne Kreis:', variant, 'mit Daten:', data);
    
    if (variant === 'oval') {
        const radiusA = (data.radiusA || 5) * SCALE_FACTOR;
        const radiusB = (data.radiusB || 3) * SCALE_FACTOR;
        
        console.log('Oval - Radien:', radiusA/SCALE_FACTOR, '×', radiusB/SCALE_FACTOR, 'm');
        
        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', CANVAS_CENTER_X);
        ellipse.setAttribute('cy', CANVAS_CENTER_Y);
        ellipse.setAttribute('rx', radiusA);
        ellipse.setAttribute('ry', radiusB);
        ellipse.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        ellipse.setAttribute('stroke', '#007bff');
        ellipse.setAttribute('stroke-width', '3');
        
        group.appendChild(ellipse);
    } else {
        const radius = (data.radius || 4) * SCALE_FACTOR;
        
        console.log('Kreis - Radius:', radius/SCALE_FACTOR, 'm');
        
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
    
    group.appendChild(rect);
}

function drawTrapez(group, data) {
    const baseA = (data.baseA || 8) * SCALE_FACTOR;
    const baseB = (data.baseB || 5) * SCALE_FACTOR;
    const height = (data.height || 4) * SCALE_FACTOR;
    
    const points = `${CANVAS_CENTER_X - baseA/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + baseA/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + baseB/2},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - baseB/2},${CANVAS_CENTER_Y - height/2}`;
    
    const trapez = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    trapez.setAttribute('points', points);
    trapez.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    trapez.setAttribute('stroke', '#007bff');
    trapez.setAttribute('stroke-width', '3');
    
    group.appendChild(trapez);
}

function drawParallelogramm(group, data) {
    const base = (data.base || 8) * SCALE_FACTOR;
    const height = (data.height || 4) * SCALE_FACTOR;
    const shear = base * 0.3; // Vereinfachte Schrägung
    
    const points = `${CANVAS_CENTER_X - base/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + base/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + base/2 - shear},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - base/2 - shear},${CANVAS_CENTER_Y - height/2}`;
    
    const parallelogramm = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    parallelogramm.setAttribute('points', points);
    parallelogramm.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    parallelogramm.setAttribute('stroke', '#007bff');
    parallelogramm.setAttribute('stroke-width', '3');
    
    group.appendChild(parallelogramm);
}

function drawRhombus(group, data) {
    const side = (data.side || 5) * SCALE_FACTOR;
    const height = (data.height || 4) * SCALE_FACTOR;
    
    const width = side * 1.2; // Vereinfachte Berechnung
    
    const points = `${CANVAS_CENTER_X - width/2},${CANVAS_CENTER_Y} ${CANVAS_CENTER_X},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X + width/2},${CANVAS_CENTER_Y} ${CANVAS_CENTER_X},${CANVAS_CENTER_Y + height/2}`;
    
    const rhombus = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    rhombus.setAttribute('points', points);
    rhombus.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    rhombus.setAttribute('stroke', '#007bff');
    rhombus.setAttribute('stroke-width', '3');
    
    group.appendChild(rhombus);
}

function drawLangloch(group, data) {
    const length = (data.length || 8) * SCALE_FACTOR;
    const width = (data.width || 3) * SCALE_FACTOR;
    const radius = Math.min((data.radius || 1) * SCALE_FACTOR, width / 2);
    
    const x = CANVAS_CENTER_X - length/2;
    const y = CANVAS_CENTER_Y - width/2;
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M ${x + radius} ${y} L ${x + length - radius} ${y} A ${radius} ${radius} 0 0 1 ${x + length - radius} ${y + width} L ${x + radius} ${y + width} A ${radius} ${radius} 0 0 1 ${x + radius} ${y} Z`;
    
    path.setAttribute('d', d);
    path.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    path.setAttribute('stroke', '#007bff');
    path.setAttribute('stroke-width', '3');
    
    group.appendChild(path);
}

function drawPolygon(group, data, variant) {
    if (['fuenfeck', 'sechseck', 'achteck'].includes(variant)) {
        const sides = variant === 'fuenfeck' ? 5 : variant === 'sechseck' ? 6 : 8;
        const radius = (data.side || 5) * SCALE_FACTOR / 2;
        
        let points = '';
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
            const x = CANVAS_CENTER_X + radius * Math.cos(angle);
            const y = CANVAS_CENTER_Y + radius * Math.sin(angle);
            points += `${x},${y} `;
        }
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', points.trim());
        polygon.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
        polygon.setAttribute('stroke', '#007bff');
        polygon.setAttribute('stroke-width', '3');
        
        group.appendChild(polygon);
    } else {
        drawRectangle(group, data, 'rechteck');
    }
}

function updateCalculations(data) {
    let area = 0;
    let perimeter = 0;
    
    console.log('Berechne für Daten:', data);
    
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    
    console.log('Shape:', finalShape, 'Variant:', finalVariant);
    
    switch (finalShape) {
        case 'dreieck':
            if (finalVariant === 'gleichseitig') {
                const side = data.side || 6;
                area = (Math.sqrt(3) / 4) * side * side;
                perimeter = 3 * side;
                console.log('Gleichseitiges Dreieck - Seite:', side, 'Fläche:', area);
            } else if (finalVariant === 'rechtwinklig') {
                const a = data.katheteA || 4;
                const b = data.katheteB || 5;
                area = 0.5 * a * b;
                perimeter = a + b + Math.sqrt(a*a + b*b);
                console.log('Rechtwinkliges Dreieck - a:', a, 'b:', b, 'Fläche:', area);
            } else {
                // Ungleichschenkliges Dreieck - Näherung
                const sideA = data.sideA || 4;
                const sideB = data.sideB || 5;
                const sideC = data.sideC || 6;
                // Heron's Formel
                const s = (sideA + sideB + sideC) / 2;
                area = Math.sqrt(s * (s - sideA) * (s - sideB) * (s - sideC));
                perimeter = sideA + sideB + sideC;
                console.log('Ungleichschenkliges Dreieck - Seiten:', sideA, sideB, sideC, 'Fläche:', area);
            }
            break;
            
        case 'kreis':
            if (finalVariant === 'oval') {
                const radiusA = data.radiusA || 5;
                const radiusB = data.radiusB || 3;
                area = Math.PI * radiusA * radiusB;
                perimeter = Math.PI * (3 * (radiusA + radiusB) - Math.sqrt((3 * radiusA + radiusB) * (radiusA + 3 * radiusB)));
                console.log('Oval - Radien:', radiusA, radiusB, 'Fläche:', area);
            } else {
                const radius = data.radius || 4;
                area = Math.PI * radius * radius;
                perimeter = 2 * Math.PI * radius;
                console.log('Kreis - Radius:', radius, 'Fläche:', area);
            }
            break;
            
        case 'rechteck':
            const length = data.length || 8;
            const width = data.width || 5;
            area = length * width;
            perimeter = 2 * (length + width);
            console.log('Rechteck - Länge:', length, 'Breite:', width, 'Fläche:', area);
            break;
            
        case 'quadrat':
            const side = data.side || 5;
            area = side * side;
            perimeter = 4 * side;
            console.log('Quadrat - Seite:', side, 'Fläche:', area);
            break;
            
        case 'trapez':
            const baseA = data.baseA || 8;
            const baseB = data.baseB || 5;
            const height = data.height || 4;
            area = 0.5 * (baseA + baseB) * height;
            perimeter = baseA + baseB + 2 * Math.sqrt(height*height + ((baseA-baseB)/2)*((baseA-baseB)/2));
            console.log('Trapez - Basen:', baseA, baseB, 'Höhe:', height, 'Fläche:', area);
            break;
            
        case 'parallelogramm':
            const base = data.base || 8;
            const pSide = data.side || 5;
            const pHeight = data.height || 4;
            area = base * pHeight;
            perimeter = 2 * (base + pSide);
            console.log('Parallelogramm - Basis:', base, 'Seite:', pSide, 'Höhe:', pHeight, 'Fläche:', area);
            break;
            
        case 'rhombus':
            const rhombusSide = data.side || 5;
            const rhombusHeight = data.height || 4;
            area = rhombusSide * rhombusHeight;
            perimeter = 4 * rhombusSide;
            console.log('Rhombus - Seite:', rhombusSide, 'Höhe:', rhombusHeight, 'Fläche:', area);
            break;
            
        case 'langloch':
            const lLength = data.length || 8;
            const lWidth = data.width || 3;
            const lRadius = data.radius || 1;
            // Vereinfachte Berechnung: Rechteck + 2 Halbkreise
            area = (lLength - 2 * lRadius) * lWidth + Math.PI * lRadius * lRadius;
            perimeter = 2 * (lLength - 2 * lRadius) + 2 * Math.PI * lRadius;
            console.log('Langloch - Länge:', lLength, 'Breite:', lWidth, 'Radius:', lRadius, 'Fläche:', area);
            break;
            
        default:
            console.log('Unbekannte Form, verwende Standard-Rechteck');
            area = 40; // 8m × 5m Standard
            perimeter = 26;
    }
    
    console.log('Finale Berechnungen - Fläche:', area, 'Umfang:', perimeter);
    
    const areaElement = document.getElementById('calc-area');
    const perimeterElement = document.getElementById('calc-perimeter');
    
    if (areaElement) {
        areaElement.textContent = `${area.toFixed(2)} m²`;
        console.log('Fläche aktualisiert:', area.toFixed(2));
    }
    if (perimeterElement) {
        perimeterElement.textContent = `${perimeter.toFixed(2)} m`;
        console.log('Umfang aktualisiert:', perimeter.toFixed(2));
    }
}

function setupEventListeners() {
    // Navigation
    const backBtn = document.getElementById('btn-back');
    const continueBtn = document.getElementById('btn-continue');
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            saveCurrentData();
            window.location.href = 'dachform.html';
        });
    }
    
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            saveCurrentData();
            window.location.href = 'berechnung.html';
        });
    }
    
    setupToolButtons();
}

function setupToolButtons() {
    const tools = {
        'btn-reset': resetToDefaults,
        'btn-mirror-horizontal': () => {
            isMirroredH = !isMirroredH;
            updateShape();
            showFeedback(isMirroredH ? 'Horizontal gespiegelt' : 'Horizontale Spiegelung aufgehoben');
        },
        'btn-mirror-vertical': () => {
            isMirroredV = !isMirroredV;
            updateShape();
            showFeedback(isMirroredV ? 'Vertikal gespiegelt' : 'Vertikale Spiegelung aufgehoben');
        },
        'btn-rotate-left': () => {
            currentRotation -= 45;
            if (currentRotation <= -180) currentRotation += 360;
            updateShape();
            showFeedback(`Um 45° links gedreht (${currentRotation}°)`);
        },
        'btn-rotate-right': () => {
            currentRotation += 45;
            if (currentRotation >= 180) currentRotation -= 360;
            updateShape();
            showFeedback(`Um 45° rechts gedreht (${currentRotation}°)`);
        },
        'btn-traufe': selectTraufePosition
    };
    
    Object.entries(tools).forEach(([id, handler]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
        }
    });
}

function selectTraufePosition() {
    if (traufeSelectionMode) {
        // Modus beenden
        exitTraufeMode();
        return;
    }
    
    // Modus aktivieren
    traufeSelectionMode = true;
    
    // Overlay OHNE Vollbild-Blocking - nur Anzeige
    traufeOverlay = document.createElement('div');
    traufeOverlay.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        pointer-events: none;
    `;
    
    traufeOverlay.innerHTML = `
        <div style="background: rgba(0,0,0,0.9); padding: 20px; border-radius: 12px; text-align: center; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #ffff00;">🎯 Traufe bestimmen</h3>
            <p style="margin: 0 0 15px 0; font-size: 14px; color: white; line-height: 1.3;">
                <strong>Klicken Sie auf einen gelben Bereich</strong><br>
                um diese Seite als Traufe festzulegen
            </p>
            <button onclick="exitTraufeMode()" style="padding: 8px 16px; background: #6c757d; color: white; border: none; cursor: pointer; border-radius: 6px; font-size: 12px; pointer-events: auto;">
                Abbrechen (ESC)
            </button>
        </div>
    `;
    
    document.body.appendChild(traufeOverlay);
    
    // ESC-Taste zum Beenden
    document.addEventListener('keydown', handleTraufeKeydown);
    
    // Klickbare Bereiche zur Form hinzufügen
    addTraufeClickAreas();
    
    // Canvas leicht abdunkeln aber klickbar lassen
    const canvas = document.querySelector('.canvas-wrapper');
    if (canvas) {
        canvas.style.background = 'rgba(0,0,0,0.1)';
        canvas.style.transition = 'background 0.3s';
    }
    
    showFeedback('Traufe-Modus aktiviert - Klicken Sie auf einen gelben Bereich');
}

function handleTraufeKeydown(event) {
    if (event.key === 'Escape') {
        exitTraufeMode();
    }
}

function exitTraufeMode() {
    traufeSelectionMode = false;
    
    if (traufeOverlay) {
        document.body.removeChild(traufeOverlay);
        traufeOverlay = null;
    }
    
    document.removeEventListener('keydown', handleTraufeKeydown);
    removeTraufeClickAreas();
    
    // Canvas-Hintergrund zurücksetzen
    const canvas = document.querySelector('.canvas-wrapper');
    if (canvas) {
        canvas.style.background = 'white';
    }
    
    showFeedback('Traufe-Modus beendet');
}

function addTraufeClickAreas() {
    const shapeGroup = document.getElementById('roof-shape');
    if (!shapeGroup) return;
    
    // Finde die Form
    const shape = shapeGroup.querySelector('polygon, rect, circle, ellipse, path');
    if (!shape) return;
    
    const finalShape = determineActualShape();
    
    if (finalShape === 'rechteck' || finalShape === 'quadrat') {
        addRectangleClickAreas(shape);
    } else if (finalShape === 'dreieck') {
        addTriangleClickAreas(shape);
    } else if (finalShape === 'kreis') {
        addCircleClickAreas(shape);
    } else if (['trapez', 'parallelogramm', 'rhombus'].includes(finalShape)) {
        addPolygonClickAreas(shape);
    }
}

function addRectangleClickAreas(rect) {
    const x = parseFloat(rect.getAttribute('x'));
    const y = parseFloat(rect.getAttribute('y'));
    const width = parseFloat(rect.getAttribute('width'));
    const height = parseFloat(rect.getAttribute('height'));
    
    // Vier klickbare Bereiche für die Seiten erstellen
    const sides = [
        { 
            name: 'top', 
            x: x, y: y - 15, width: width, height: 30, 
            label: 'Obere Seite als Traufe',
            description: 'Diese Seite wird horizontal nach unten gedreht'
        },
        { 
            name: 'right', 
            x: x + width - 15, y: y, width: 30, height: height, 
            label: 'Rechte Seite als Traufe',
            description: 'Diese Seite wird horizontal nach unten gedreht'
        },
        { 
            name: 'bottom', 
            x: x, y: y + height - 15, width: width, height: 30, 
            label: 'Untere Seite als Traufe',
            description: 'Diese Seite ist bereits unten (Standard)'
        },
        { 
            name: 'left', 
            x: x - 15, y: y, width: 30, height: height, 
            label: 'Linke Seite als Traufe',
            description: 'Diese Seite wird horizontal nach unten gedreht'
        }
    ];
    
    sides.forEach(side => {
        const clickArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        clickArea.setAttribute('x', side.x);
        clickArea.setAttribute('y', side.y);
        clickArea.setAttribute('width', side.width);
        clickArea.setAttribute('height', side.height);
        clickArea.setAttribute('fill', 'rgba(255, 255, 0, 0.3)');
        clickArea.setAttribute('stroke', '#ffff00');
        clickArea.setAttribute('stroke-width', '2');
        clickArea.setAttribute('stroke-dasharray', '5,5');
        clickArea.classList.add('traufe-click-area');
        clickArea.style.cursor = 'pointer';
        
        clickArea.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Klick auf', side.name, 'Seite');
            setTraufePositionDirect(side.name);
        });
        
        clickArea.addEventListener('mouseenter', () => {
            clickArea.setAttribute('fill', 'rgba(255, 255, 0, 0.6)');
            showFeedback(side.label);
        });
        
        clickArea.addEventListener('mouseleave', () => {
            clickArea.setAttribute('fill', 'rgba(255, 255, 0, 0.3)');
        });
        
        document.getElementById('roof-shape').appendChild(clickArea);
    });
}

function addTriangleClickAreas(triangle) {
    const points = triangle.getAttribute('points').split(' ');
    
    console.log('Dreieck-Punkte für Klickbereiche:', points);
    
    // KORRIGIERTE Zuordnung der Seiten basierend auf der tatsächlichen Geometrie
    const sides = [
        { 
            name: 'bottom', 
            points: [points[1], points[2]], // Untere horizontale Linie (zwischen 2. und 3. Punkt)
            label: 'Basis als Traufe',
            description: 'Basis horizontal unten (Standard)'
        },
        { 
            name: 'left', 
            points: [points[0], points[1]], // Linke Seite (zwischen 1. und 2. Punkt) 
            label: 'Linke Seite als Traufe',
            description: 'Linke Seite wird nach unten gedreht'
        },
        { 
            name: 'right', 
            points: [points[2], points[0]], // Rechte Seite (zwischen 3. und 1. Punkt)
            label: 'Rechte Seite als Traufe', 
            description: 'Rechte Seite wird nach unten gedreht'
        }
    ];
    
    sides.forEach((side, index) => {
        // Mittelpunkt der Seite berechnen
        const p1 = side.points[0].split(',');
        const p2 = side.points[1].split(',');
        const midX = (parseFloat(p1[0]) + parseFloat(p2[0])) / 2;
        const midY = (parseFloat(p1[1]) + parseFloat(p2[1])) / 2;
        
        console.log(`${side.name} Seite - Mittelpunkt:`, midX, midY);
        
        // Klickbereich erstellen
        const clickArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        clickArea.setAttribute('cx', midX);
        clickArea.setAttribute('cy', midY);
        clickArea.setAttribute('r', '18');
        clickArea.setAttribute('fill', 'rgba(255, 255, 0, 0.4)');
        clickArea.setAttribute('stroke', '#ffff00');
        clickArea.setAttribute('stroke-width', '3');
        clickArea.classList.add('traufe-click-area');
        clickArea.style.cursor = 'pointer';
        
        // Kleine Beschriftung hinzufügen
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', midX);
        label.setAttribute('y', midY + 4);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-family', 'Arial');
        label.setAttribute('font-size', '10');
        label.setAttribute('font-weight', 'bold');
        label.setAttribute('fill', '#333');
        label.textContent = side.name.charAt(0).toUpperCase(); // B, L, R
        label.classList.add('traufe-click-area');
        
        clickArea.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Klick auf', side.name, 'Seite des Dreiecks');
            setTraufePositionDirect(side.name);
        });
        
        clickArea.addEventListener('mouseenter', () => {
            clickArea.setAttribute('fill', 'rgba(255, 255, 0, 0.7)');
            showFeedback(side.label);
        });
        
        clickArea.addEventListener('mouseleave', () => {
            clickArea.setAttribute('fill', 'rgba(255, 255, 0, 0.4)');
        });
        
        document.getElementById('roof-shape').appendChild(clickArea);
        document.getElementById('roof-shape').appendChild(label);
    });
}

function addCircleClickAreas(circle) {
    const cx = parseFloat(circle.getAttribute('cx'));
    const cy = parseFloat(circle.getAttribute('cy'));
    const r = parseFloat(circle.getAttribute('r')) || 50;
    
    // Vier Bereiche um den Kreis
    const sides = [
        { name: 'top', x: cx, y: cy - r, rotation: 180 },
        { name: 'right', x: cx + r, y: cy, rotation: -90 },
        { name: 'bottom', x: cx, y: cy + r, rotation: 0 },
        { name: 'left', x: cx - r, y: cy, rotation: 90 }
    ];
    
    sides.forEach(side => {
        const clickArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        clickArea.setAttribute('cx', side.x);
        clickArea.setAttribute('cy', side.y);
        clickArea.setAttribute('r', '12');
        clickArea.setAttribute('fill', 'rgba(255, 255, 0, 0.4)');
        clickArea.setAttribute('stroke', '#ffff00');
        clickArea.setAttribute('stroke-width', '2');
        clickArea.classList.add('traufe-click-area');
        clickArea.style.cursor = 'pointer';
        
        clickArea.addEventListener('click', () => {
            setTraufePositionDirect(side.name, side.rotation);
        });
        
        clickArea.addEventListener('mouseenter', () => {
            clickArea.setAttribute('fill', 'rgba(255, 255, 0, 0.6)');
            showFeedback(`Klicken: ${side.name.toUpperCase()}-Bereich als Traufe`);
        });
        
        clickArea.addEventListener('mouseleave', () => {
            clickArea.setAttribute('fill', 'rgba(255, 255, 0, 0.4)');
        });
        
        document.getElementById('roof-shape').appendChild(clickArea);
    });
}

function addPolygonClickAreas(polygon) {
    // Für komplexere Formen - vereinfacht 4 Hauptrichtungen
    const sides = [
        { name: 'top', x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - 80, rotation: 180 },
        { name: 'right', x: CANVAS_CENTER_X + 80, y: CANVAS_CENTER_Y, rotation: -90 },
        { name: 'bottom', x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y + 80, rotation: 0 },
        { name: 'left', x: CANVAS_CENTER_X - 80, y: CANVAS_CENTER_Y, rotation: 90 }
    ];
    
    sides.forEach(side => {
        const clickArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        clickArea.setAttribute('cx', side.x);
        clickArea.setAttribute('cy', side.y);
        clickArea.setAttribute('r', '12');
        clickArea.setAttribute('fill', 'rgba(255, 255, 0, 0.4)');
        clickArea.setAttribute('stroke', '#ffff00');
        clickArea.setAttribute('stroke-width', '2');
        clickArea.classList.add('traufe-click-area');
        clickArea.style.cursor = 'pointer';
        
        clickArea.addEventListener('click', () => {
            setTraufePositionDirect(side.name, side.rotation);
        });
        
        clickArea.addEventListener('mouseenter', () => {
            clickArea.setAttribute('fill', 'rgba(255, 255, 0, 0.6)');
            showFeedback(`Klicken: ${side.name.toUpperCase()}-Seite als Traufe`);
        });
        
        clickArea.addEventListener('mouseleave', () => {
            clickArea.setAttribute('fill', 'rgba(255, 255, 0, 0.4)');
        });
        
        document.getElementById('roof-shape').appendChild(clickArea);
    });
}

function removeTraufeClickAreas() {
    document.querySelectorAll('.traufe-click-area').forEach(area => {
        area.remove();
    });
}

function setTraufePositionDirect(position) {
    traufePosition = position;
    
    console.log('=== TRAUFE DEBUG ===');
    console.log('Position:', position);
    console.log('Aktuelle Rotation vor Änderung:', currentRotation);
    
    // KORRIGIERTE Rotationen - andere Richtung!
    let newRotation = currentRotation;
    
    if (position === 'bottom') {
        newRotation = 0;      // Bleibt wie es ist
    } else if (position === 'top') {
        newRotation = 180;    // Kopfüber
    } else if (position === 'left') {
        newRotation = -90;    // KORRIGIERT: -90° statt +90°
    } else if (position === 'right') {
        newRotation = 90;     // KORRIGIERT: +90° statt +270°/-90°
    }
    
    console.log('KORRIGIERTE Rotation:', newRotation);
    currentRotation = newRotation;
    
    updateShape();
    
    console.log('Rotation nach Update:', currentRotation);
    console.log('=== ENDE DEBUG ===');
    
    exitTraufeMode();
    
    showFeedback(`KORRIGIERT: ${position} → ${newRotation}°`);
}

// ZUSÄTZLICHE DEBUG-FUNKTION
window.testRotation = function(angle) {
    console.log('Teste Rotation:', angle);
    currentRotation = angle;
    updateShape();
    showFeedback(`Test-Rotation: ${angle}°`);
};

// ZUSÄTZLICHE DEBUG-FUNKTION FÜR SCHRITTWEISE ROTATION
window.rotateStep = function(step = 15) {
    currentRotation += step;
    if (currentRotation >= 360) currentRotation -= 360;
    if (currentRotation < 0) currentRotation += 360;
    updateShape();
    showFeedback(`Schritt-Rotation: ${currentRotation}°`);
    console.log('Aktuelle Rotation:', currentRotation);
};

function calculateActualSideRotation(traufePosition) {
    // Hole die aktuell gezeichnete Form aus dem SVG
    const shapeElement = document.querySelector('#roof-shape polygon, #roof-shape rect, #roof-shape circle, #roof-shape ellipse');
    
    if (!shapeElement) {
        console.log('Keine Form gefunden, verwende Standard-Rotation');
        return getStandardRotation(traufePosition);
    }
    
    const finalShape = determineActualShape();
    
    if (finalShape === 'dreieck') {
        return calculateTriangleSideRotation(shapeElement, traufePosition);
    } else if (finalShape === 'rechteck' || finalShape === 'quadrat') {
        return calculateRectangleSideRotation(traufePosition);
    } else {
        return getStandardRotation(traufePosition);
    }
}

function calculateTriangleSideRotation(triangleElement, traufePosition) {
    // Hole die aktuellen Punkte des Dreiecks aus dem SVG
    const pointsStr = triangleElement.getAttribute('points');
    const points = pointsStr.split(' ').map(p => {
        const [x, y] = p.split(',');
        return { x: parseFloat(x), y: parseFloat(y) };
    });
    
    console.log('Dreieck-Punkte aus SVG:', points);
    
    let sideAngle = 0;
    
    if (traufePosition === 'bottom') {
        // Unterste Seite: zwischen den beiden unteren Punkten
        // Finde die zwei Punkte mit der größten Y-Koordinate (unterste)
        const sortedByY = [...points].sort((a, b) => b.y - a.y);
        const p1 = sortedByY[0];
        const p2 = sortedByY[1];
        sideAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
        console.log('Bottom Seite:', p1, p2, '→ Winkel:', sideAngle);
        
    } else if (traufePosition === 'left') {
        // Linke Seite: Verbindung zwischen dem linkesten und einem anderen Punkt
        const sortedByX = [...points].sort((a, b) => a.x - b.x);
        const leftPoint = sortedByX[0];
        
        // Finde den anderen Punkt der linken Seite (nicht der rechteste)
        const otherPoints = points.filter(p => p !== leftPoint);
        otherPoints.sort((a, b) => a.x - b.x); // Nach X sortieren
        const p2 = otherPoints[0]; // Der zweit-linkeste Punkt
        
        sideAngle = Math.atan2(p2.y - leftPoint.y, p2.x - leftPoint.x) * 180 / Math.PI;
        console.log('Left Seite:', leftPoint, p2, '→ Winkel:', sideAngle);
        
    } else if (traufePosition === 'right') {
        // Rechte Seite: Verbindung zwischen dem rechtesten und einem anderen Punkt
        const sortedByX = [...points].sort((a, b) => b.x - a.x);
        const rightPoint = sortedByX[0];
        
        // Finde den anderen Punkt der rechten Seite
        const otherPoints = points.filter(p => p !== rightPoint);
        otherPoints.sort((a, b) => b.x - a.x); // Nach X sortieren (absteigend)
        const p2 = otherPoints[0]; // Der zweit-rechteste Punkt
        
        sideAngle = Math.atan2(p2.y - rightPoint.y, p2.x - rightPoint.x) * 180 / Math.PI;
        console.log('Right Seite:', rightPoint, p2, '→ Winkel:', sideAngle);
        
    } else if (traufePosition === 'top') {
        // Obere Seite: zwischen den beiden obersten Punkten  
        const sortedByY = [...points].sort((a, b) => a.y - b.y);
        const p1 = sortedByY[0];
        const p2 = sortedByY[1];
        sideAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
        console.log('Top Seite:', p1, p2, '→ Winkel:', sideAngle);
    }
    
    // Um die Seite horizontal zu machen, drehen wir um den negativen Winkel
    return -sideAngle;
}

function calculateRectangleSideRotation(traufePosition) {
    // Rechteck: Seiten sind bereits horizontal/vertikal
    switch(traufePosition) {
        case 'bottom': return 0;
        case 'top': return 180;
        case 'left': return 90;
        case 'right': return -90;
        default: return 0;
    }
}

function getStandardRotation(traufePosition) {
    switch(traufePosition) {
        case 'bottom': return 0;
        case 'top': return 180;
        case 'left': return 90;
        case 'right': return -90;
        default: return 0;
    }
}

function calculateSimpleTraufeRotation(traufePosition) {
    // SIMPLE REGEL: Finde heraus, wo die gewählte Seite aktuell ist und drehe sie nach unten
    
    const currentData = getCurrentFormData();
    const finalShape = determineActualShape();
    
    // Hole die aktuellen Koordinaten der Form (ohne Rotation)
    const shapePoints = getShapePoints(finalShape, currentData);
    
    if (!shapePoints || shapePoints.length < 2) {
        console.log('Keine Punkte gefunden, verwende Standard-Rotation');
        return getStandardRotation(traufePosition);
    }
    
    // Finde die gewählte Seite und ihren aktuellen Winkel
    const sideAngle = getSideAngle(shapePoints, traufePosition, finalShape);
    
    console.log('Aktueller Winkel der', traufePosition, 'Seite:', sideAngle, '°');
    
    // Rotation = -aktueller Winkel (um die Seite horizontal zu machen)
    return -sideAngle;
}

function getShapePoints(shape, data) {
    // Einfache Punkt-Generierung für jede Form (ohne SVG-Transformation)
    const centerX = 0;
    const centerY = 0;
    
    if (shape === 'rechteck' || shape === 'quadrat') {
        let width, height;
        if (shape === 'quadrat') {
            const side = data.side || 5;
            width = height = side;
        } else {
            width = data.length || 8;
            height = data.width || 5;
        }
        
        return [
            { x: centerX - width/2, y: centerY - height/2, side: 'top' },
            { x: centerX + width/2, y: centerY - height/2, side: 'top' },
            { x: centerX + width/2, y: centerY + height/2, side: 'right' },
            { x: centerX - width/2, y: centerY + height/2, side: 'bottom' },
            { x: centerX - width/2, y: centerY - height/2, side: 'left' }
        ];
    } else if (shape === 'dreieck') {
        const variant = determineActualVariant();
        
        if (variant === 'gleichseitig') {
            const side = data.side || 6;
            const height = side * Math.sqrt(3) / 2;
            return [
                { x: centerX, y: centerY - height/2, side: 'top' },
                { x: centerX - side/2, y: centerY + height/2, side: 'left' },
                { x: centerX + side/2, y: centerY + height/2, side: 'bottom' }
            ];
        } else if (variant === 'rechtwinklig') {
            const a = data.katheteA || 4;
            const b = data.katheteB || 5;
            return [
                { x: centerX - a/2, y: centerY + b/2, side: 'bottom' },
                { x: centerX + a/2, y: centerY + b/2, side: 'bottom' },
                { x: centerX - a/2, y: centerY - b/2, side: 'left' }
            ];
        } else {
            // Ungleichschenkliges Dreieck
            const sideA = data.sideA || 4;
            const sideB = data.sideB || 5;
            const sideC = data.sideC || 6;
            
            // Basis horizontal, Spitze darüber
            const s = (sideA + sideB + sideC) / 2;
            const area = Math.sqrt(s * (s - sideA) * (s - sideB) * (s - sideC));
            const height = 2 * area / sideA;
            const cosC = (sideA*sideA + sideB*sideB - sideC*sideC) / (2 * sideA * sideB);
            const xTop = sideB * cosC;
            
            return [
                { x: centerX - sideA/2, y: centerY, side: 'bottom' },           // Links unten
                { x: centerX + sideA/2, y: centerY, side: 'bottom' },           // Rechts unten  
                { x: centerX - sideA/2 + xTop, y: centerY - height, side: 'top' }  // Spitze oben
            ];
        }
    }
    
    return [];
}

function getSideAngle(points, traufePosition, shape) {
    if (shape === 'rechteck' || shape === 'quadrat') {
        // Rechteck: Seiten sind bereits horizontal/vertikal
        switch(traufePosition) {
            case 'bottom': return 0;    // Bereits horizontal
            case 'top': return 180;     // Kopfüber  
            case 'left': return 90;     // 90° drehen
            case 'right': return -90;   // -90° drehen
        }
    } else if (shape === 'dreieck') {
        // Dreieck: Berechne Winkel der tatsächlichen Seiten
        if (traufePosition === 'bottom') {
            // Basis: Von Punkt 0 zu Punkt 1
            const p1 = points[0];
            const p2 = points[1];
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
            return angle;
        } else if (traufePosition === 'left') {
            // Linke Seite: Von Punkt 1 zu Punkt 2  
            const p1 = points[1];
            const p2 = points[2];
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
            return angle;
        } else if (traufePosition === 'right') {
            // Rechte Seite: Von Punkt 2 zu Punkt 0
            const p1 = points[2];
            const p2 = points[0];
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
            return angle;
        }
    }
    
    return 0;
}

function getStandardRotation(traufePosition) {
    // Fallback für unbekannte Formen
    switch(traufePosition) {
        case 'bottom': return 0;
        case 'top': return 180;
        case 'left': return 90;
        case 'right': return -90;
        default: return 0;
    }
}

function calculateTriangleTraufeRotation(traufePosition, variant, data) {
    console.log('Berechne Dreieck-Rotation für:', variant, 'Daten:', data, 'Traufe:', traufePosition);
    
    if (variant === 'gleichseitig') {
        // Gleichseitiges Dreieck: alle Seiten sind 60° zur Horizontalen geneigt
        switch(traufePosition) {
            case 'bottom': return 0;    // Basis ist bereits horizontal
            case 'left': return 60;     // Linke Seite um 60° nach rechts drehen
            case 'right': return -60;   // Rechte Seite um 60° nach links drehen
            case 'top': return 180;     // Spitze nach unten
        }
    } else if (variant === 'rechtwinklig') {
        // Rechtwinkliges Dreieck
        const a = data.katheteA || 4;
        const b = data.katheteB || 5;
        
        switch(traufePosition) {
            case 'bottom': return 0;    // Horizontale Kathete ist bereits horizontal
            case 'left': return 90;     // Vertikale Kathete um 90° drehen
            case 'right': {
                // Hypotenuse: Winkel zur Horizontalen berechnen
                const hypotenuseAngle = Math.atan2(b, a) * 180 / Math.PI;
                console.log('Hypotenuse-Winkel berechnet:', hypotenuseAngle);
                return -hypotenuseAngle; // Negativ, um horizontal nach unten zu drehen
            }
            case 'top': return 90;
        }
    } else {
        // Ungleichschenkliges Dreieck - NEUE KORREKTE Berechnung
        const sideA = data.sideA || 4; // Basis (horizontal)
        const sideB = data.sideB || 5; // Linke Seite
        const sideC = data.sideC || 6; // Rechte Seite
        
        console.log('Ungleichschenkliges Dreieck - Seiten:', {sideA, sideB, sideC});
        
        // Berechne die Höhe des Dreiecks und die Position der Spitze
        // Verwende Heron's Formel für die Fläche, dann h = 2*Fläche/Basis
        const s = (sideA + sideB + sideC) / 2; // Semiperimeter
        const area = Math.sqrt(s * (s - sideA) * (s - sideB) * (s - sideC));
        const height = 2 * area / sideA;
        
        // Position der Spitze relativ zur Basis (Kosinussatz)
        const cosB = (sideA*sideA + sideC*sideC - sideB*sideB) / (2 * sideA * sideC);
        const xTop = sideC * cosB; // X-Position der Spitze von der linken Ecke aus
        
        console.log('Dreieck-Geometrie:', {area, height, xTop, cosB});
        
        switch(traufePosition) {
            case 'bottom': 
                return 0; // Basis (sideA) ist bereits horizontal
            
            case 'left': {
                // Linke Seite (sideB): Von (0,0) zu (xTop, height)
                const leftAngle = Math.atan2(height, xTop) * 180 / Math.PI;
                console.log('Linke Seite - Winkel zur Horizontalen:', leftAngle);
                // Um diese Seite horizontal zu machen, drehen wir um den negativen Winkel
                return -leftAngle;
            }
            
            case 'right': {
                // Rechte Seite (sideC): Von (sideA, 0) zu (xTop, height)
                const dx = xTop - sideA;
                const dy = height;
                const rightAngle = Math.atan2(dy, dx) * 180 / Math.PI;
                console.log('Rechte Seite - Winkel zur Horizontalen:', rightAngle);
                // Um diese Seite horizontal zu machen, drehen wir um den negativen Winkel
                return -rightAngle;
            }
            
            case 'top': 
                return 180; // Spitze nach unten (Basis oben)
        }
    }
    
    return 0;
}

function calculateRectangleTraufeRotation(traufePosition) {
    // Rechteck/Quadrat: Seiten sind bereits horizontal/vertikal
    switch(traufePosition) {
        case 'bottom': return 0;    // Bereits horizontal unten
        case 'top': return 180;     // Obere Seite nach unten drehen
        case 'left': return 90;     // Linke Seite um 90° drehen
        case 'right': return -90;   // Rechte Seite um -90° drehen
    }
    return 0;
}

function calculateTrapezTraufeRotation(traufePosition) {
    // Trapez: Basis-Seiten sind horizontal, Schenkel sind geneigt
    switch(traufePosition) {
        case 'bottom': return 0;    // Große Basis bereits horizontal
        case 'top': return 180;     // Kleine Basis nach unten
        case 'left': return 90;     // Linker Schenkel (vereinfacht)
        case 'right': return -90;   // Rechter Schenkel (vereinfacht)
    }
    return 0;
}

function calculateStandardTraufeRotation(traufePosition) {
    // Standard-Rotation für andere Formen
    switch(traufePosition) {
        case 'bottom': return 0;
        case 'top': return 180;
        case 'left': return 90;
        case 'right': return -90;
    }
    return 0;
}

// Globale Funktionen entfernen da nicht mehr benötigt
window.setTraufePosition = function() {};
window.closeTraufeDialog = function() {};

function showFeedback(message) {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        if (feedback.parentNode) {
            document.body.removeChild(feedback);
        }
    }, 3000);
}

function resetToDefaults() {
    currentRotation = 0;
    isMirroredH = false;
    isMirroredV = false;
    traufePosition = 'bottom';
    
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
            case 'length': input.value = '8'; break;
            case 'width': input.value = '5'; break;
            case 'base': input.value = '8'; break;
            case 'baseA': input.value = '8'; break;
            case 'baseB': input.value = '5'; break;
            case 'height': input.value = '4'; break;
        }
    });
    
    updateShape();
    showFeedback('Komplett zurückgesetzt: Form, Rotation und Spiegelung');
}

function saveCurrentData() {
    const currentData = getCurrentFormData();
    
    currentData.rotation = currentRotation;
    currentData.mirroredH = isMirroredH;
    currentData.mirroredV = isMirroredV;
    currentData.traufePosition = traufePosition;
    
    if (!projectData.roofShape) {
        projectData.roofShape = {};
    }
    
    Object.assign(projectData.roofShape, currentData);
    
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
    } catch (e) {
        sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
    }
}

console.log('✅ Editor komplett geladen');
