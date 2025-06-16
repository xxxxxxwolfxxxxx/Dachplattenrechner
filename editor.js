// editor.js – Korrigierte Version mit fixer Beschriftung und funktionierender Traufe

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
            console.log('✅ Editor erfolgreich initialisiert');
        } catch (error) {
            console.error('❌ Editor-Fehler:', error);
        }
    }, 100);
});

function loadProjectData() {
    const dataString = localStorage.getItem('dachplattenrechner_data') || 
                       sessionStorage.getItem('dachplattenrechner_data');
    
    if (!dataString) {
        console.log('Keine Projektdaten gefunden, verwende Standard-Daten');
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
            console.log('Profile-Daten fehlen, erstelle Standard-Profil');
            projectData.profile = {
                profilname: 'Standard Profil',
                deckbreite: 1000,
                lieferbreite: 1050,
                seitenueberlappung: 50
            };
        }
        
        if (!projectData.roofShape) {
            console.log('RoofShape-Daten fehlen, erstelle Standard-Form');
            projectData.roofShape = {
                baseShape: 'viereck',
                variant: 'rechteck'
            };
        }
        
    } catch (e) {
        console.log('Fehler beim Parsen der Daten, verwende Standard-Daten');
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
            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                    refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#dc3545" />
            </marker>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <line x1="300" y1="0" x2="300" y2="400" stroke="#c0c0c0" stroke-width="2"/>
        <line x1="0" y1="200" x2="600" y2="200" stroke="#c0c0c0" stroke-width="2"/>
        <g id="roof-shape"></g>
        <g id="dimensions"></g>
        <g id="water-flow"></g>
        <g id="labels"></g>
        <g id="traufe-elements"></g>
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

function updateDirectionInfo() {
    const direction = getVerlegerichtung();
    updateVerlegerichtungDisplay(direction);
}

function getVerlegerichtung() {
    const effectiveRotation = currentRotation % 360;
    
    if (Math.abs(effectiveRotation) < 45 || Math.abs(effectiveRotation) > 315) {
        return {
            name: 'Längs (senkrecht zur Traufe)',
            code: 'laengs',
            description: 'Platten verlaufen von der Traufe zum First',
            waterFlow: 'von oben nach unten'
        };
    } else if (Math.abs(effectiveRotation - 90) < 45 || Math.abs(effectiveRotation + 270) < 45) {
        return {
            name: 'Quer (senkrecht zur Traufe)',
            code: 'quer', 
            description: 'Platten verlaufen seitlich zur Hauptwasserlaufrichtung',
            waterFlow: 'seitlich'
        };
    } else if (Math.abs(effectiveRotation - 180) < 45 || Math.abs(effectiveRotation + 180) < 45) {
        return {
            name: 'Längs (gedreht, senkrecht zur Traufe)',
            code: 'laengs',
            description: 'Platten verlaufen von der Traufe zum First (gedreht)',
            waterFlow: 'von unten nach oben (ungewöhnlich)'
        };
    } else {
        return {
            name: 'Diagonal (senkrecht zur Traufe)',
            code: 'diagonal',
            description: 'Platten verlaufen diagonal zur Standardausrichtung',
            waterFlow: 'diagonal'
        };
    }
}

function updateVerlegerichtungDisplay(direction) {
    let infoPanel = document.getElementById('direction-info-panel');
    if (!infoPanel) {
        infoPanel = document.createElement('div');
        infoPanel.id = 'direction-info-panel';
        infoPanel.style.cssText = `
            margin: 10px 0;
            padding: 8px 12px;
            background: rgba(0,123,255,0.1);
            border-radius: 4px;
            font-size: 12px;
            border-left: 3px solid #007bff;
        `;
        
        const controlsPanel = document.querySelector('.controls-panel');
        if (controlsPanel) {
            controlsPanel.appendChild(infoPanel);
        }
    }
    
    infoPanel.innerHTML = `
        💡 <strong>Tipp:</strong> Die Traufe ist die Seite, wo das Wasser abfließt (unten im Bild). 
        Platten werden immer senkrecht zur Traufe verlegt.
    `;
}

function loadAndDrawShape() {
    const roofShape = projectData.roofShape;
    if (!roofShape) {
        console.log('Keine roofShape-Daten gefunden, verwende Standard-Rechteck');
        currentShape = 'viereck';
        currentVariant = 'rechteck';
    } else {
        currentShape = roofShape.baseShape || 'viereck';
        currentVariant = roofShape.variant || 'rechteck';
        
        if (roofShape.rotation !== undefined) currentRotation = roofShape.rotation;
        if (roofShape.mirroredH !== undefined) isMirroredH = roofShape.mirroredH;
        if (roofShape.mirroredV !== undefined) isMirroredV = roofShape.mirroredV;
        if (roofShape.traufePosition !== undefined) traufePosition = roofShape.traufePosition;
    }
    
    createInputFields();
    
    setTimeout(() => {
        updateShape();
    }, 100);
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

function updateShape() {
    if (!svg) return;
    
    const shapeGroup = document.getElementById('roof-shape');
    const labelsGroup = document.getElementById('labels');
    const waterFlowGroup = document.getElementById('water-flow');
    const traufeGroup = document.getElementById('traufe-elements');
    
    if (!shapeGroup) {
        console.log('SVG-Gruppen nicht gefunden');
        return;
    }
    
    if (isUpdating) return;
    isUpdating = true;
    
    // Lösche vorherige Inhalte
    shapeGroup.innerHTML = '';
    if (labelsGroup) labelsGroup.innerHTML = '';
    if (waterFlowGroup) waterFlowGroup.innerHTML = '';
    if (traufeGroup) traufeGroup.innerHTML = '';
    
    const currentData = getCurrentFormData();
    
    // Zeichne die transformierte Form
    drawTransformedShape(shapeGroup, currentData);
    
    // KORRIGIERT: Beschriftungen werden NICHT transformiert (separate Gruppe)
    const targetGroup = labelsGroup || svg;
    drawLabelsAndAnnotations(targetGroup, currentData);
    
    // Traufe-Markierung (nicht transformiert)
    const traufeTargetGroup = traufeGroup || svg;
    drawTraufeMarking(traufeTargetGroup, currentData);
    
    // Aktualisiere Berechnungen
    updateCalculations(currentData);
    updateDirectionInfo();
    
    setTimeout(() => {
        isUpdating = false;
    }, 50);
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
    console.log(`🎨 ZEICHNE Form - Rotation: ${currentRotation}°, H-Spiegel: ${isMirroredH}, V-Spiegel: ${isMirroredV}`);
    
    drawShape(group, data);
    
    let transforms = [];
    
    if (currentRotation !== 0) {
        transforms.push(`rotate(${currentRotation} ${CANVAS_CENTER_X} ${CANVAS_CENTER_Y})`);
    }
    
    if (isMirroredH || isMirroredV) {
        const scaleX = isMirroredH ? -1 : 1;
        const scaleY = isMirroredV ? -1 : 1;
        transforms.push(`translate(${CANVAS_CENTER_X} ${CANVAS_CENTER_Y})`);
        transforms.push(`scale(${scaleX} ${scaleY})`);
        transforms.push(`translate(${-CANVAS_CENTER_X} ${-CANVAS_CENTER_Y})`);
    }
    
    if (transforms.length > 0) {
        const fullTransform = transforms.join(' ');
        group.setAttribute('transform', fullTransform);
        console.log(`✅ TRANSFORM GESETZT: ${fullTransform}`);
    } else {
        group.removeAttribute('transform');
    }
}

// KORRIGIERT: Labels werden NICHT transformiert, bleiben immer lesbar
function drawLabelsAndAnnotations(group, data) {
    // WICHTIG: Diese Funktion bekommt die NICHT-transformierte Gruppe
    // Daher bleiben alle Texte immer lesbar, egal wie die Form gedreht/gespiegelt ist
    
    drawSideLabels(group, data);
}

function drawSideLabels(group, data) {
    const finalShape = determineActualShape();
    const finalVariant = determineActualVariant();
    
    if (finalShape === 'dreieck') {
        drawTriangleLabels(group, data, finalVariant);
    } else if (finalShape === 'rechteck') {
        drawRectangleLabels(group, data);
    } else if (finalShape === 'quadrat') {
        drawSquareLabels(group, data);
    } else if (finalShape === 'trapez') {
        drawTrapezLabels(group, data);
    } else if (finalShape === 'parallelogramm') {
        drawParallelogrammLabels(group, data);
    } else if (finalShape === 'rhombus') {
        drawRhombusLabels(group, data);
    } else if (finalShape === 'kreis') {
        drawCircleLabels(group, data, finalVariant);
    }
}

function drawTriangleLabels(group, data, variant) {
    if (variant === 'gleichseitig') {
        const sideLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        sideLabel.setAttribute('x', CANVAS_CENTER_X);
        sideLabel.setAttribute('y', CANVAS_CENTER_Y + 120); // Fest unter der Form
        sideLabel.setAttribute('text-anchor', 'middle');
        sideLabel.setAttribute('fill', '#333');
        sideLabel.setAttribute('font-size', '12');
        sideLabel.setAttribute('font-weight', 'bold');
        sideLabel.textContent = `Seitenlänge: ${(data.side || 6).toFixed(1)}m`;
        group.appendChild(sideLabel);
        
    } else if (variant === 'rechtwinklig') {
        const kathetaALabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        kathetaALabel.setAttribute('x', CANVAS_CENTER_X - 80);
        kathetaALabel.setAttribute('y', CANVAS_CENTER_Y + 120);
        kathetaALabel.setAttribute('text-anchor', 'middle');
        kathetaALabel.setAttribute('fill', '#007bff');
        kathetaALabel.setAttribute('font-size', '12');
        kathetaALabel.setAttribute('font-weight', 'bold');
        kathetaALabel.textContent = `Kathete A: ${(data.katheteA || 4).toFixed(1)}m`;
        group.appendChild(kathetaALabel);
        
        const kathetaBLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        kathetaBLabel.setAttribute('x', CANVAS_CENTER_X + 80);
        kathetaBLabel.setAttribute('y', CANVAS_CENTER_Y + 120);
        kathetaBLabel.setAttribute('text-anchor', 'middle');
        kathetaBLabel.setAttribute('fill', '#28a745');
        kathetaBLabel.setAttribute('font-size', '12');
        kathetaBLabel.setAttribute('font-weight', 'bold');
        kathetaBLabel.textContent = `Kathete B: ${(data.katheteB || 5).toFixed(1)}m`;
        group.appendChild(kathetaBLabel);
        
    } else {
        const sideALabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        sideALabel.setAttribute('x', CANVAS_CENTER_X - 100);
        sideALabel.setAttribute('y', CANVAS_CENTER_Y + 120);
        sideALabel.setAttribute('text-anchor', 'middle');
        sideALabel.setAttribute('fill', '#007bff');
        sideALabel.setAttribute('font-size', '12');
        sideALabel.setAttribute('font-weight', 'bold');
        sideALabel.textContent = `Seite A: ${(data.sideA || 4).toFixed(1)}m`;
        group.appendChild(sideALabel);
        
        const sideBLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        sideBLabel.setAttribute('x', CANVAS_CENTER_X);
        sideBLabel.setAttribute('y', CANVAS_CENTER_Y + 120);
        sideBLabel.setAttribute('fill', '#28a745');
        sideBLabel.setAttribute('font-size', '12');
        sideBLabel.setAttribute('font-weight', 'bold');
        sideBLabel.setAttribute('text-anchor', 'middle');
        sideBLabel.textContent = `Seite B: ${(data.sideB || 5).toFixed(1)}m`;
        group.appendChild(sideBLabel);
        
        const sideCLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        sideCLabel.setAttribute('x', CANVAS_CENTER_X + 100);
        sideCLabel.setAttribute('y', CANVAS_CENTER_Y + 120);
        sideCLabel.setAttribute('fill', '#dc3545');
        sideCLabel.setAttribute('font-size', '12');
        sideCLabel.setAttribute('font-weight', 'bold');
        sideCLabel.setAttribute('text-anchor', 'middle');
        sideCLabel.textContent = `Seite C: ${(data.sideC || 6).toFixed(1)}m`;
        group.appendChild(sideCLabel);
    }
}

function drawRectangleLabels(group, data) {
    const lengthLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lengthLabel.setAttribute('x', CANVAS_CENTER_X - 80);
    lengthLabel.setAttribute('y', CANVAS_CENTER_Y + 120);
    lengthLabel.setAttribute('text-anchor', 'middle');
    lengthLabel.setAttribute('fill', '#007bff');
    lengthLabel.setAttribute('font-size', '12');
    lengthLabel.setAttribute('font-weight', 'bold');
    lengthLabel.textContent = `Länge: ${(data.length || 8).toFixed(1)}m`;
    group.appendChild(lengthLabel);
    
    const widthLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    widthLabel.setAttribute('x', CANVAS_CENTER_X + 80);
    widthLabel.setAttribute('y', CANVAS_CENTER_Y + 120);
    widthLabel.setAttribute('text-anchor', 'middle');
    widthLabel.setAttribute('fill', '#28a745');
    widthLabel.setAttribute('font-size', '12');
    widthLabel.setAttribute('font-weight', 'bold');
    widthLabel.textContent = `Breite: ${(data.width || 5).toFixed(1)}m`;
    group.appendChild(widthLabel);
}

function drawSquareLabels(group, data) {
    const sideLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sideLabel.setAttribute('x', CANVAS_CENTER_X);
    sideLabel.setAttribute('y', CANVAS_CENTER_Y + 120);
    sideLabel.setAttribute('text-anchor', 'middle');
    sideLabel.setAttribute('fill', '#007bff');
    sideLabel.setAttribute('font-size', '12');
    sideLabel.setAttribute('font-weight', 'bold');
    sideLabel.textContent = `Seitenlänge: ${(data.side || 5).toFixed(1)}m`;
    group.appendChild(sideLabel);
}

function drawTrapezLabels(group, data) {
    const baseALabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    baseALabel.setAttribute('x', CANVAS_CENTER_X - 100);
    baseALabel.setAttribute('y', CANVAS_CENTER_Y + 120);
    baseALabel.setAttribute('text-anchor', 'middle');
    baseALabel.setAttribute('fill', '#007bff');
    baseALabel.setAttribute('font-size', '12');
    baseALabel.setAttribute('font-weight', 'bold');
    baseALabel.textContent = `Basis A: ${(data.baseA || 8).toFixed(1)}m`;
    group.appendChild(baseALabel);
    
    const baseBLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    baseBLabel.setAttribute('x', CANVAS_CENTER_X);
    baseBLabel.setAttribute('y', CANVAS_CENTER_Y + 120);
    baseBLabel.setAttribute('text-anchor', 'middle');
    baseBLabel.setAttribute('fill', '#28a745');
    baseBLabel.setAttribute('font-size', '12');
    baseBLabel.setAttribute('font-weight', 'bold');
    baseBLabel.textContent = `Basis B: ${(data.baseB || 5).toFixed(1)}m`;
    group.appendChild(baseBLabel);
    
    const heightLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    heightLabel.setAttribute('x', CANVAS_CENTER_X + 100);
    heightLabel.setAttribute('y', CANVAS_CENTER_Y + 120);
    heightLabel.setAttribute('text-anchor', 'middle');
    heightLabel.setAttribute('fill', '#dc3545');
    heightLabel.setAttribute('font-size', '12');
    heightLabel.setAttribute('font-weight', 'bold');
    heightLabel.textContent = `Höhe: ${(data.height || 4).toFixed(1)}m`;
    group.appendChild(heightLabel);
}

function drawCircleLabels(group, data, variant) {
    if (variant === 'oval') {
        const radiusALabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        radiusALabel.setAttribute('x', CANVAS_CENTER_X - 80);
        radiusALabel.setAttribute('y', CANVAS_CENTER_Y + 120);
        radiusALabel.setAttribute('text-anchor', 'middle');
        radiusALabel.setAttribute('fill', '#007bff');
        radiusALabel.setAttribute('font-size', '12');
        radiusALabel.setAttribute('font-weight', 'bold');
        radiusALabel.textContent = `Halbachse A: ${(data.radiusA || 5).toFixed(1)}m`;
        group.appendChild(radiusALabel);
        
        const radiusBLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        radiusBLabel.setAttribute('x', CANVAS_CENTER_X + 80);
        radiusBLabel.setAttribute('y', CANVAS_CENTER_Y + 120);
        radiusBLabel.setAttribute('text-anchor', 'middle');
        radiusBLabel.setAttribute('fill', '#28a745');
        radiusBLabel.setAttribute('font-size', '12');
        radiusBLabel.setAttribute('font-weight', 'bold');
        radiusBLabel.textContent = `Halbachse B: ${(data.radiusB || 3).toFixed(1)}m`;
        group.appendChild(radiusBLabel);
    } else {
        const radiusLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        radiusLabel.setAttribute('x', CANVAS_CENTER_X);
        radiusLabel.setAttribute('y', CANVAS_CENTER_Y + 120);
        radiusLabel.setAttribute('text-anchor', 'middle');
        radiusLabel.setAttribute('fill', '#007bff');
        radiusLabel.setAttribute('font-size', '12');
        radiusLabel.setAttribute('font-weight', 'bold');
        radiusLabel.textContent = `Radius: ${(data.radius || 4).toFixed(1)}m`;
        group.appendChild(radiusLabel);
    }
}

function drawParallelogrammLabels(group, data) {
    const baseLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    baseLabel.setAttribute('x', CANVAS_CENTER_X);
    baseLabel.setAttribute('y', CANVAS_CENTER_Y + 120);
    baseLabel.setAttribute('text-anchor', 'middle');
    baseLabel.setAttribute('fill', '#007bff');
    baseLabel.setAttribute('font-size', '12');
    baseLabel.setAttribute('font-weight', 'bold');
    baseLabel.textContent = `Basis: ${(data.base || 8).toFixed(1)}m`;
    group.appendChild(baseLabel);
}

function drawRhombusLabels(group, data) {
    const sideLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sideLabel.setAttribute('x', CANVAS_CENTER_X);
    sideLabel.setAttribute('y', CANVAS_CENTER_Y + 120);
    sideLabel.setAttribute('text-anchor', 'middle');
    sideLabel.setAttribute('fill', '#007bff');
    sideLabel.setAttribute('font-size', '12');
    sideLabel.setAttribute('font-weight', 'bold');
    sideLabel.textContent = `Seitenlänge: ${(data.side || 5).toFixed(1)}m`;
    group.appendChild(sideLabel);
}

// KORRIGIERTE Traufe-Markierung: Bleibt immer an derselben visuellen Position
function drawTraufeMarking(group, data) {
    const finalShape = determineActualShape();
    
    if (finalShape === 'rechteck' || finalShape === 'quadrat') {
        // Traufe-Markierung wird IMMER unten angezeigt, unabhängig von Transformationen
        const traufeLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        traufeLine.setAttribute('x1', CANVAS_CENTER_X - 120);
        traufeLine.setAttribute('y1', CANVAS_CENTER_Y + 80);
        traufeLine.setAttribute('x2', CANVAS_CENTER_X + 120);
        traufeLine.setAttribute('y2', CANVAS_CENTER_Y + 80);
        traufeLine.setAttribute('stroke', '#dc3545');
        traufeLine.setAttribute('stroke-width', '3');
        traufeLine.setAttribute('stroke-dasharray', '8,4');
        group.appendChild(traufeLine);
        
        const traufeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        traufeLabel.setAttribute('x', CANVAS_CENTER_X + 130);
        traufeLabel.setAttribute('y', CANVAS_CENTER_Y + 85);
        traufeLabel.setAttribute('fill', '#dc3545');
        traufeLabel.setAttribute('font-size', '12');
        traufeLabel.setAttribute('font-weight', 'bold');
        traufeLabel.textContent = 'Traufe (Wasserabfluss)';
        group.appendChild(traufeLabel);
        
        // Pfeil zur Verdeutlichung
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        arrow.setAttribute('points', `${CANVAS_CENTER_X},${CANVAS_CENTER_Y + 90} ${CANVAS_CENTER_X - 8},${CANVAS_CENTER_Y + 75} ${CANVAS_CENTER_X + 8},${CANVAS_CENTER_Y + 75}`);
        arrow.setAttribute('fill', '#dc3545');
        group.appendChild(arrow);
    }
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
        
        points = `${top_x},${top_y} ${left_x},${left_y} ${right_x},${right_y}`;
        
    } else if (variant === 'rechtwinklig') {
        const a = (data.katheteA || 4) * SCALE_FACTOR;
        const b = (data.katheteB || 5) * SCALE_FACTOR;
        
        const bottom_left_x = CANVAS_CENTER_X - a/2;
        const bottom_left_y = CANVAS_CENTER_Y + b/3;
        const bottom_right_x = CANVAS_CENTER_X + a/2;
        const bottom_right_y = CANVAS_CENTER_Y + b/3;
        const top_left_x = CANVAS_CENTER_X - a/2;
        const top_left_y = CANVAS_CENTER_Y - b/3;
        
        points = `${bottom_left_x},${bottom_left_y} ${bottom_right_x},${bottom_right_y} ${top_left_x},${top_left_y}`;
        
    } else {
        const a = (data.sideA || 4) * SCALE_FACTOR;
        const height = a * 0.8;
        
        const top_x = CANVAS_CENTER_X;
        const top_y = CANVAS_CENTER_Y - height/3;
        const left_x = CANVAS_CENTER_X - a/2;
        const left_y = CANVAS_CENTER_Y + height/3;
        const right_x = CANVAS_CENTER_X + a/2 - 30;
        const right_y = CANVAS_CENTER_Y + height/3;
        
        points = `${top_x},${top_y} ${left_x},${left_y} ${right_x},${right_y}`;
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
    
    const points = `${CANVAS_CENTER_X - baseA/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + baseA/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + baseB/2},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - baseB/2},${CANVAS_CENTER_Y - height/2}`;
    
    const trapez = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    trapez.setAttribute('points', points);
    trapez.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    trapez.setAttribute('stroke', '#007bff');
    trapez.setAttribute('stroke-width', '3');
    trapez.setAttribute('data-shape', 'trapez');
    
    group.appendChild(trapez);
}

function drawParallelogramm(group, data) {
    const base = (data.base || 8) * SCALE_FACTOR;
    const height = (data.height || 4) * SCALE_FACTOR;
    const shear = base * 0.3;
    
    const points = `${CANVAS_CENTER_X - base/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + base/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + base/2 - shear},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - base/2 - shear},${CANVAS_CENTER_Y - height/2}`;
    
    const parallelogramm = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    parallelogramm.setAttribute('points', points);
    parallelogramm.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    parallelogramm.setAttribute('stroke', '#007bff');
    parallelogramm.setAttribute('stroke-width', '3');
    parallelogramm.setAttribute('data-shape', 'parallelogramm');
    
    group.appendChild(parallelogramm);
}

function drawRhombus(group, data) {
    const side = (data.side || 5) * SCALE_FACTOR;
    const height = (data.height || 4) * SCALE_FACTOR;
    const width = side * 1.2;
    
    const points = `${CANVAS_CENTER_X - width/2},${CANVAS_CENTER_Y} ${CANVAS_CENTER_X},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X + width/2},${CANVAS_CENTER_Y} ${CANVAS_CENTER_X},${CANVAS_CENTER_Y + height/2}`;
    
    const rhombus = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    rhombus.setAttribute('points', points);
    rhombus.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    rhombus.setAttribute('stroke', '#007bff');
    rhombus.setAttribute('stroke-width', '3');
    rhombus.setAttribute('data-shape', 'rhombus');
    
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
    path.setAttribute('data-shape', 'langloch');
    
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
        polygon.setAttribute('data-shape', 'polygon');
        
        group.appendChild(polygon);
    } else {
        drawRectangle(group, data, 'rechteck');
    }
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
            // Vereinfachte Umfangsberechnung
            perimeter = baseA + baseB + 2 * Math.sqrt(height * height + Math.pow((baseA - baseB) / 2, 2));
            break;
    }
    
    const areaElement = document.getElementById('calc-area');
    const perimeterElement = document.getElementById('calc-perimeter');
    
    if (areaElement) areaElement.textContent = `${area.toFixed(2)} m²`;
    if (perimeterElement) perimeterElement.textContent = `${perimeter.toFixed(2)} m`;
}

function setupEventListeners() {
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
        'btn-reset': () => {
            console.log('🔄 RESET Button geklickt');
            resetToDefaults();
        },
        'btn-mirror-horizontal': () => {
            console.log('🪞 H-SPIEGEL Button geklickt');
            isMirroredH = !isMirroredH;
            console.log(`H-Spiegelung jetzt: ${isMirroredH}`);
            updateShape();
            showFeedback(isMirroredH ? 'Horizontal gespiegelt' : 'Horizontale Spiegelung aufgehoben');
        },
        'btn-mirror-vertical': () => {
            console.log('🪞 V-SPIEGEL Button geklickt');
            isMirroredV = !isMirroredV;
            console.log(`V-Spiegelung jetzt: ${isMirroredV}`);
            updateShape();
            showFeedback(isMirroredV ? 'Vertikal gespiegelt' : 'Vertikale Spiegelung aufgehoben');
        },
        'btn-rotate-left': () => {
            console.log('↺ LINKS-ROTATION Button geklickt');
            currentRotation -= 45;
            if (currentRotation <= -180) currentRotation += 360;
            console.log(`Neue Rotation: ${currentRotation}°`);
            updateShape();
            showFeedback(`Um 45° links gedreht (${currentRotation}°)`);
        },
        'btn-rotate-right': () => {
            console.log('↻ RECHTS-ROTATION Button geklickt');
            currentRotation += 45;
            if (currentRotation >= 180) currentRotation -= 360;
            console.log(`Neue Rotation: ${currentRotation}°`);
            updateShape();
            showFeedback(`Um 45° rechts gedreht (${currentRotation}°)`);
        },
        'btn-traufe': () => {
            console.log('🏠 TRAUFE Button geklickt');
            selectTraufePosition();
        }
    };
    
    Object.entries(tools).forEach(([id, handler]) => {
        const element = document.getElementById(id);
        if (element) {
            element.removeEventListener('click', handler);
            element.addEventListener('click', handler);
            console.log(`✅ Event Listener für ${id} hinzugefügt`);
        } else {
            console.log(`❌ Element ${id} nicht gefunden`);
        }
    });
}

// KORRIGIERTE Traufe-Auswahl: Funktionsfähiger Traufe-Dialog
function selectTraufePosition() {
    console.log('🏠 Traufe-Auswahl gestartet');
    
    // Erstelle einen einfachen Dialog
    showTraufeDialog();
}

function showTraufeDialog() {
    // Entferne alte Dialoge
    const existingDialog = document.getElementById('traufe-dialog');
    if (existingDialog) {
        existingDialog.remove();
    }
    
    // Erstelle neuen Dialog
    const dialog = document.createElement('div');
    dialog.id = 'traufe-dialog';
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 1000;
        max-width: 400px;
        border: 2px solid #007bff;
    `;
    
    dialog.innerHTML = `
        <h3 style="margin-bottom: 20px; color: #007bff;">Traufe-Position wählen</h3>
        <p style="margin-bottom: 20px; color: #666;">Welche Seite soll die Traufe (Wasserabfluss) werden?</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <button onclick="setTraufeAndClose('top')" class="traufe-btn" style="padding: 10px; background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 6px; cursor: pointer;">
                Oben
            </button>
            <button onclick="setTraufeAndClose('right')" class="traufe-btn" style="padding: 10px; background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 6px; cursor: pointer;">
                Rechts
            </button>
            <button onclick="setTraufeAndClose('bottom')" class="traufe-btn" style="padding: 10px; background: #28a745; color: white; border: 2px solid #28a745; border-radius: 6px; cursor: pointer;">
                Unten (Standard)
            </button>
            <button onclick="setTraufeAndClose('left')" class="traufe-btn" style="padding: 10px; background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 6px; cursor: pointer;">
                Links
            </button>
        </div>
        
        <div style="text-align: center;">
            <button onclick="closeTraufeDialog()" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">
                Abbrechen
            </button>
        </div>
    `;
    
    // Overlay für Hintergrund
    const overlay = document.createElement('div');
    overlay.id = 'traufe-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 999;
    `;
    
    // Klick auf Overlay schließt Dialog
    overlay.addEventListener('click', closeTraufeDialog);
    
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    
    // Hover-Effekte für Buttons
    const buttons = dialog.querySelectorAll('.traufe-btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            if (btn.textContent.trim() !== 'Unten (Standard)') {
                btn.style.background = '#007bff';
                btn.style.color = 'white';
                btn.style.borderColor = '#007bff';
            }
        });
        btn.addEventListener('mouseleave', () => {
            if (btn.textContent.trim() !== 'Unten (Standard)') {
                btn.style.background = '#f8f9fa';
                btn.style.color = '#000';
                btn.style.borderColor = '#dee2e6';
            }
        });
    });
    
    console.log('✅ Traufe-Dialog angezeigt');
}

// Globale Funktionen für den Dialog
window.setTraufeAndClose = function(position) {
    console.log(`🎯 Traufe-Position gewählt: ${position}`);
    
    const oldPosition = traufePosition;
    traufePosition = position;
    
    // Rotiere das Dach so, dass die gewählte Seite nach unten zeigt
    switch(position) {
        case 'top':
            currentRotation = 180;
            break;
        case 'right':
            currentRotation = 90;
            break;
        case 'bottom':
            currentRotation = 0;
            break;
        case 'left':
            currentRotation = -90;
            break;
    }
    
    console.log(`Rotation geändert auf: ${currentRotation}°`);
    
    updateShape();
    closeTraufeDialog();
    
    const positionNames = {
        'top': 'obere Seite',
        'right': 'rechte Seite',
        'bottom': 'untere Seite (Standard)',
        'left': 'linke Seite'
    };
    
    showFeedback(`Traufe geändert: ${positionNames[position]} ist jetzt unten (Wasserabfluss)`);
};

window.closeTraufeDialog = function() {
    console.log('🚪 Traufe-Dialog wird geschlossen');
    
    const dialog = document.getElementById('traufe-dialog');
    const overlay = document.getElementById('traufe-overlay');
    
    if (dialog) dialog.remove();
    if (overlay) overlay.remove();
};

function showFeedback(message) {
    console.log(`💬 Feedback: ${message}`);
    
    // Entferne alte Feedback-Nachrichten
    const existingFeedback = document.querySelectorAll('.feedback-message');
    existingFeedback.forEach(fb => fb.remove());
    
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
    
    // CSS Animation hinzufügen
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
    
    // Automatisch nach 3 Sekunden entfernen
    setTimeout(() => {
        feedback.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, 300);
    }, 3000);
}

function resetToDefaults() {
    console.log('🔄 Setze auf Standard-Werte zurück');
    
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
    showFeedback('🔄 Zurückgesetzt: Form, Rotation, Spiegelung und Traufe');
}

function saveCurrentData() {
    console.log('💾 Speichere aktuelle Daten');
    
    const currentData = getCurrentFormData();
    
    // Speichere alle Transformationen
    currentData.rotation = currentRotation;
    currentData.mirroredH = isMirroredH;
    currentData.mirroredV = isMirroredV;
    currentData.traufePosition = traufePosition;
    
    // Speichere Verlegerichtung für nachfolgende Berechnungen
    const direction = getVerlegerichtung();
    currentData.verlegerichtung = direction.code;
    currentData.verlegerichtungName = direction.name;
    currentData.verlegerichtungDescription = direction.description;
    
    if (!projectData.roofShape) {
        projectData.roofShape = {};
    }
    
    // Erweitere bestehende roofShape-Daten
    Object.assign(projectData.roofShape, currentData);
    
    // Erstelle Punkte für die weitere Verarbeitung
    projectData.roofShape.points = generateRoofPoints(currentData);
    
    // Zusätzliche Geometrie-Daten für Berechnung
    projectData.geometry = {
        shapeType: determineActualShape(),
        variant: determineActualVariant(),
        points: projectData.roofShape.points,
        preferredDirection: direction.code,
        traufePosition: traufePosition,
        rotation: currentRotation,
        area: calculateArea(currentData),
        dimensions: calculateDimensions(currentData)
    };
    
    console.log('💾 Speichere Daten:', {
        roofShape: projectData.roofShape,
        geometry: projectData.geometry
    });
    
    try {
        localStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        console.log('✅ Erfolgreich in localStorage gespeichert');
    } catch (e) {
        sessionStorage.setItem('dachplattenrechner_data', JSON.stringify(projectData));
        console.log('✅ Erfolgreich in sessionStorage gespeichert');
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
            return 10; // Vereinfacht für andere Dreiecke
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
            return 40; // Fallback
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

console.log('✅ Korrigierter Editor mit fixer Beschriftung und funktionierender Traufe geladen');
