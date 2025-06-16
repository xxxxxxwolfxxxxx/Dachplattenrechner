// editor.js – Verbesserte Version mit korrekter Traufe-Logik und dynamischen Skizzen

let projectData = {};
let currentShape = '';
let currentVariant = '';
let svg;
let isUpdating = false;

// Transformation state
let currentRotation = 0;
let isMirroredH = false;
let isMirroredV = false;
let traufePosition = 'bottom'; // Die Seite, die unten liegt (Wasserabfluss)

const CANVAS_CENTER_X = 400; // Vergrößert von 300
const CANVAS_CENTER_Y = 250; // Vergrößert von 200
const SCALE_FACTOR = 40; // Vergrößert von 25

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
        // Erstelle Standard-Projektdaten für Demo
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
        width: 800px;
        height: 500px;
        margin: 20px auto;
        position: relative;
    `;
    
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'main-svg';
    svg.setAttribute('width', '800');
    svg.setAttribute('height', '500');
    svg.setAttribute('viewBox', '0 0 800 500');
    
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
        <line x1="400" y1="0" x2="400" y2="500" stroke="#c0c0c0" stroke-width="2"/>
        <line x1="0" y1="250" x2="800" y2="250" stroke="#c0c0c0" stroke-width="2"/>
        <g id="roof-shape"></g>
        <g id="dimensions"></g>
        <g id="water-flow"></g>
        <g id="labels"></g>
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
    // Die Verlegerichtung wird durch die Traufe-Position bestimmt
    const direction = getVerlegerichtung();
    
    // Diese Info wird in einem separaten Panel angezeigt
    updateVerlegerichtungDisplay(direction);
}

function getVerlegerichtung() {
    // Basierend auf aktueller Rotation und Traufe-Position
    // Die Traufe ist immer unten, Platten werden senkrecht dazu verlegt
    
    const effectiveRotation = currentRotation % 360;
    
    // Die Verlegerichtung ist IMMER senkrecht zur Traufe
    if (Math.abs(effectiveRotation) < 45 || Math.abs(effectiveRotation) > 315) {
        // Traufe liegt horizontal unten -> Verlegerichtung ist vertikal (längs)
        return {
            name: 'Längs (senkrecht zur Traufe)',
            code: 'laengs',
            description: 'Platten verlaufen von der Traufe zum First',
            waterFlow: 'von oben nach unten'
        };
    } else if (Math.abs(effectiveRotation - 90) < 45 || Math.abs(effectiveRotation + 270) < 45) {
        // Traufe liegt vertikal -> Verlegerichtung ist horizontal (quer)
        return {
            name: 'Quer (senkrecht zur Traufe)',
            code: 'quer', 
            description: 'Platten verlaufen seitlich zur Hauptwasserlaufrichtung',
            waterFlow: 'seitlich'
        };
    } else if (Math.abs(effectiveRotation - 180) < 45 || Math.abs(effectiveRotation + 180) < 45) {
        // Traufe liegt horizontal oben -> Verlegerichtung ist vertikal
        return {
            name: 'Längs (gedreht, senkrecht zur Traufe)',
            code: 'laengs',
            description: 'Platten verlaufen von der Traufe zum First (gedreht)',
            waterFlow: 'von unten nach oben (ungewöhnlich)'
        };
    } else {
        // Traufe liegt schräg -> diagonale Verlegerichtung
        return {
            name: 'Diagonal (senkrecht zur Traufe)',
            code: 'diagonal',
            description: 'Platten verlaufen diagonal zur Standardausrichtung',
            waterFlow: 'diagonal'
        };
    }
}

function updateVerlegerichtungDisplay(direction) {
    // Nur den Tipp anzeigen, nicht das große Panel
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

function getTraufePositionText() {
    const positionNames = {
        'bottom': 'unten (Standard)',
        'top': 'oben',
        'left': 'links', 
        'right': 'rechts'
    };
    return positionNames[traufePosition] || 'unten';
}

function loadAndDrawShape() {
    const roofShape = projectData.roofShape;
    if (!roofShape) {
        console.log('Keine roofShape-Daten gefunden, verwende Standard-Rechteck');
        // Fallback: Standard-Rechteck wenn keine Daten vorhanden
        currentShape = 'viereck';
        currentVariant = 'rechteck';
    } else {
        currentShape = roofShape.baseShape || 'viereck';
        currentVariant = roofShape.variant || 'rechteck';
        
        // Lade gespeicherte Transformationen
        if (roofShape.rotation !== undefined) currentRotation = roofShape.rotation;
        if (roofShape.mirroredH !== undefined) isMirroredH = roofShape.mirroredH;
        if (roofShape.mirroredV !== undefined) isMirroredV = roofShape.mirroredV;
        if (roofShape.traufePosition !== undefined) traufePosition = roofShape.traufePosition;
    }
    
    createInputFields();
    
    // Sofort die Form zeichnen nach dem Laden
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
    
    // Lade gespeicherte Werte falls vorhanden
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
    
    if (!shapeGroup) {
        console.log('SVG-Gruppen nicht gefunden');
        return;
    }
    
    // Verhindere mehrfache gleichzeitige Updates
    if (isUpdating) return;
    isUpdating = true;
    
    // Lösche vorherige Inhalte
    shapeGroup.innerHTML = '';
    if (labelsGroup) labelsGroup.innerHTML = '';
    if (waterFlowGroup) waterFlowGroup.innerHTML = '';
    
    const currentData = getCurrentFormData();
    
    // Zeichne die Grundform
    drawTransformedShape(shapeGroup, currentData);
    
    // Zeichne IMMER Beschriftungen - direkt in die shapeGroup wenn nötig
    const targetGroup = labelsGroup || shapeGroup;
    drawLabelsAndAnnotations(targetGroup, currentData);
    
    // Aktualisiere Berechnungen
    updateCalculations(currentData);
    updateDirectionInfo();
    
    // Reset Update-Flag
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
    const transformGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    let transform = `translate(${CANVAS_CENTER_X}, ${CANVAS_CENTER_Y})`;
    
    if (currentRotation !== 0) {
        transform += ` rotate(${currentRotation})`;
    }
    
    let scaleX = isMirroredH ? -1 : 1;
    let scaleY = isMirroredV ? -1 : 1;
    if (scaleX !== 1 || scaleY !== 1) {
        transform += ` scale(${scaleX}, ${scaleY})`;
    }
    
    transform += ` translate(${-CANVAS_CENTER_X}, ${-CANVAS_CENTER_Y})`;
    
    transformGroup.setAttribute('transform', transform);
    
    drawShape(transformGroup, data);
    group.appendChild(transformGroup);
}

function drawLabelsAndAnnotations(group, data) {
    // Zeichne Seitenbeschriftung je nach Form
    drawSideLabels(group, data);
    
    // Zeichne Traufe-Markierung
    drawTraufeMarking(group, data);
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
    // Weitere Formen hier...
}

function drawTriangleLabels(group, data, variant) {
    if (variant === 'gleichseitig') {
        // Beim gleichseitigen Dreieck: nur eine Seitenlänge
        const side = (data.side || 6) * SCALE_FACTOR;
        const height = side * Math.sqrt(3) / 2;
        
        // Label für Seitenlänge an der Basis
        const sideLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        sideLabel.setAttribute('x', CANVAS_CENTER_X);
        sideLabel.setAttribute('y', CANVAS_CENTER_Y + height/2 + 20);
        sideLabel.setAttribute('text-anchor', 'middle');
        sideLabel.setAttribute('fill', '#333');
        sideLabel.setAttribute('font-size', '12');
        sideLabel.setAttribute('font-weight', 'bold');
        sideLabel.textContent = `Seitenlänge: ${(data.side || 6).toFixed(1)}m`;
        group.appendChild(sideLabel);
        
    } else if (variant === 'rechtwinklig') {
        // Rechtwinkliges Dreieck: Kathete A und B
        const a = (data.katheteA || 4) * SCALE_FACTOR;
        const b = (data.katheteB || 5) * SCALE_FACTOR;
        
        // Kathete A (horizontal)
        const kathetaALabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        kathetaALabel.setAttribute('x', CANVAS_CENTER_X);
        kathetaALabel.setAttribute('y', CANVAS_CENTER_Y + b/2 + 20);
        kathetaALabel.setAttribute('text-anchor', 'middle');
        kathetaALabel.setAttribute('fill', '#007bff');
        kathetaALabel.setAttribute('font-size', '12');
        kathetaALabel.setAttribute('font-weight', 'bold');
        kathetaALabel.textContent = `Kathete A: ${(data.katheteA || 4).toFixed(1)}m`;
        group.appendChild(kathetaALabel);
        
        // Kathete B (vertikal)
        const kathetaBLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        kathetaBLabel.setAttribute('x', CANVAS_CENTER_X - a/2 - 40);
        kathetaBLabel.setAttribute('y', CANVAS_CENTER_Y);
        kathetaBLabel.setAttribute('text-anchor', 'middle');
        kathetaBLabel.setAttribute('fill', '#28a745');
        kathetaBLabel.setAttribute('font-size', '12');
        kathetaBLabel.setAttribute('font-weight', 'bold');
        kathetaBLabel.setAttribute('transform', `rotate(-90, ${CANVAS_CENTER_X - a/2 - 40}, ${CANVAS_CENTER_Y})`);
        kathetaBLabel.textContent = `Kathete B: ${(data.katheteB || 5).toFixed(1)}m`;
        group.appendChild(kathetaBLabel);
        
    } else {
        // Allgemeines Dreieck: Seite A, B, C
        const a = (data.sideA || 4) * SCALE_FACTOR;
        
        // Seite A (Basis)
        const sideALabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        sideALabel.setAttribute('x', CANVAS_CENTER_X);
        sideALabel.setAttribute('y', CANVAS_CENTER_Y + 60);
        sideALabel.setAttribute('text-anchor', 'middle');
        sideALabel.setAttribute('fill', '#007bff');
        sideALabel.setAttribute('font-size', '12');
        sideALabel.setAttribute('font-weight', 'bold');
        sideALabel.textContent = `Seite A: ${(data.sideA || 4).toFixed(1)}m`;
        group.appendChild(sideALabel);
        
        // Seite B
        const sideBLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        sideBLabel.setAttribute('x', CANVAS_CENTER_X - a/2 - 40);
        sideBLabel.setAttribute('y', CANVAS_CENTER_Y + 20);
        sideBLabel.setAttribute('fill', '#28a745');
        sideBLabel.setAttribute('font-size', '12');
        sideBLabel.setAttribute('font-weight', 'bold');
        sideBLabel.textContent = `Seite B: ${(data.sideB || 5).toFixed(1)}m`;
        group.appendChild(sideBLabel);
        
        // Seite C
        const sideCLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        sideCLabel.setAttribute('x', CANVAS_CENTER_X + a/2 + 20);
        sideCLabel.setAttribute('y', CANVAS_CENTER_Y + 20);
        sideCLabel.setAttribute('fill', '#dc3545');
        sideCLabel.setAttribute('font-size', '12');
        sideCLabel.setAttribute('font-weight', 'bold');
        sideCLabel.textContent = `Seite C: ${(data.sideC || 6).toFixed(1)}m`;
        group.appendChild(sideCLabel);
    }
}

function drawRectangleLabels(group, data) {
    const width = (data.length || 8) * SCALE_FACTOR;
    const height = (data.width || 5) * SCALE_FACTOR;
    
    // Länge (horizontal)
    const lengthLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lengthLabel.setAttribute('x', CANVAS_CENTER_X);
    lengthLabel.setAttribute('y', CANVAS_CENTER_Y + height/2 + 20);
    lengthLabel.setAttribute('text-anchor', 'middle');
    lengthLabel.setAttribute('fill', '#007bff');
    lengthLabel.setAttribute('font-size', '12');
    lengthLabel.setAttribute('font-weight', 'bold');
    lengthLabel.textContent = `Länge: ${(data.length || 8).toFixed(1)}m`;
    group.appendChild(lengthLabel);
    
    // Breite (vertikal)
    const widthLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    widthLabel.setAttribute('x', CANVAS_CENTER_X - width/2 - 40);
    widthLabel.setAttribute('y', CANVAS_CENTER_Y);
    widthLabel.setAttribute('text-anchor', 'middle');
    widthLabel.setAttribute('fill', '#28a745');
    widthLabel.setAttribute('font-size', '12');
    widthLabel.setAttribute('font-weight', 'bold');
    widthLabel.setAttribute('transform', `rotate(-90, ${CANVAS_CENTER_X - width/2 - 40}, ${CANVAS_CENTER_Y})`);
    widthLabel.textContent = `Breite: ${(data.width || 5).toFixed(1)}m`;
    group.appendChild(widthLabel);
}

function drawSquareLabels(group, data) {
    const side = (data.side || 5) * SCALE_FACTOR;
    
    // Seitenlänge
    const sideLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sideLabel.setAttribute('x', CANVAS_CENTER_X);
    sideLabel.setAttribute('y', CANVAS_CENTER_Y + side/2 + 20);
    sideLabel.setAttribute('text-anchor', 'middle');
    sideLabel.setAttribute('fill', '#007bff');
    sideLabel.setAttribute('font-size', '12');
    sideLabel.setAttribute('font-weight', 'bold');
    sideLabel.textContent = `Seitenlänge: ${(data.side || 5).toFixed(1)}m`;
    group.appendChild(sideLabel);
}

function drawTrapezLabels(group, data) {
    const baseA = (data.baseA || 8) * SCALE_FACTOR;
    const baseB = (data.baseB || 5) * SCALE_FACTOR;
    const height = (data.height || 4) * SCALE_FACTOR;
    
    // Basis A (unten)
    const baseALabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    baseALabel.setAttribute('x', CANVAS_CENTER_X);
    baseALabel.setAttribute('y', CANVAS_CENTER_Y + height/2 + 20);
    baseALabel.setAttribute('text-anchor', 'middle');
    baseALabel.setAttribute('fill', '#007bff');
    baseALabel.setAttribute('font-size', '12');
    baseALabel.setAttribute('font-weight', 'bold');
    baseALabel.textContent = `Basis A: ${(data.baseA || 8).toFixed(1)}m`;
    group.appendChild(baseALabel);
    
    // Basis B (oben)
    const baseBLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    baseBLabel.setAttribute('x', CANVAS_CENTER_X);
    baseBLabel.setAttribute('y', CANVAS_CENTER_Y - height/2 - 10);
    baseBLabel.setAttribute('text-anchor', 'middle');
    baseBLabel.setAttribute('fill', '#28a745');
    baseBLabel.setAttribute('font-size', '12');
    baseBLabel.setAttribute('font-weight', 'bold');
    baseBLabel.textContent = `Basis B: ${(data.baseB || 5).toFixed(1)}m`;
    group.appendChild(baseBLabel);
    
    // Höhe
    const heightLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    heightLabel.setAttribute('x', CANVAS_CENTER_X - baseA/2 - 40);
    heightLabel.setAttribute('y', CANVAS_CENTER_Y);
    heightLabel.setAttribute('text-anchor', 'middle');
    heightLabel.setAttribute('fill', '#dc3545');
    heightLabel.setAttribute('font-size', '12');
    heightLabel.setAttribute('font-weight', 'bold');
    heightLabel.setAttribute('transform', `rotate(-90, ${CANVAS_CENTER_X - baseA/2 - 40}, ${CANVAS_CENTER_Y})`);
    heightLabel.textContent = `Höhe: ${(data.height || 4).toFixed(1)}m`;
    group.appendChild(heightLabel);
}

function drawCircleLabels(group, data, variant) {
    if (variant === 'oval') {
        // Halbachse A und B
        const radiusALabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        radiusALabel.setAttribute('x', CANVAS_CENTER_X);
        radiusALabel.setAttribute('y', CANVAS_CENTER_Y + 80);
        radiusALabel.setAttribute('text-anchor', 'middle');
        radiusALabel.setAttribute('fill', '#007bff');
        radiusALabel.setAttribute('font-size', '12');
        radiusALabel.setAttribute('font-weight', 'bold');
        radiusALabel.textContent = `Halbachse A: ${(data.radiusA || 5).toFixed(1)}m`;
        group.appendChild(radiusALabel);
        
        const radiusBLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        radiusBLabel.setAttribute('x', CANVAS_CENTER_X - 120);
        radiusBLabel.setAttribute('y', CANVAS_CENTER_Y);
        radiusBLabel.setAttribute('text-anchor', 'middle');
        radiusBLabel.setAttribute('fill', '#28a745');
        radiusBLabel.setAttribute('font-size', '12');
        radiusBLabel.setAttribute('font-weight', 'bold');
        radiusBLabel.setAttribute('transform', `rotate(-90, ${CANVAS_CENTER_X - 120}, ${CANVAS_CENTER_Y})`);
        radiusBLabel.textContent = `Halbachse B: ${(data.radiusB || 3).toFixed(1)}m`;
        group.appendChild(radiusBLabel);
    } else {
        // Radius
        const radiusLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        radiusLabel.setAttribute('x', CANVAS_CENTER_X);
        radiusLabel.setAttribute('y', CANVAS_CENTER_Y + 80);
        radiusLabel.setAttribute('text-anchor', 'middle');
        radiusLabel.setAttribute('fill', '#007bff');
        radiusLabel.setAttribute('font-size', '12');
        radiusLabel.setAttribute('font-weight', 'bold');
        radiusLabel.textContent = `Radius: ${(data.radius || 4).toFixed(1)}m`;
        group.appendChild(radiusLabel);
    }
}

// Weitere Label-Funktionen für andere Formen...
function drawParallelogrammLabels(group, data) {
    // Basis, Seite, Höhe beschriften
    const baseLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    baseLabel.setAttribute('x', CANVAS_CENTER_X);
    baseLabel.setAttribute('y', CANVAS_CENTER_Y + 80);
    baseLabel.setAttribute('text-anchor', 'middle');
    baseLabel.setAttribute('fill', '#007bff');
    baseLabel.setAttribute('font-size', '12');
    baseLabel.setAttribute('font-weight', 'bold');
    baseLabel.textContent = `Basis: ${(data.base || 8).toFixed(1)}m`;
    group.appendChild(baseLabel);
}

function drawRhombusLabels(group, data) {
    // Seitenlänge und Höhe
    const sideLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sideLabel.setAttribute('x', CANVAS_CENTER_X);
    sideLabel.setAttribute('y', CANVAS_CENTER_Y + 80);
    sideLabel.setAttribute('text-anchor', 'middle');
    sideLabel.setAttribute('fill', '#007bff');
    sideLabel.setAttribute('font-size', '12');
    sideLabel.setAttribute('font-weight', 'bold');
    sideLabel.textContent = `Seitenlänge: ${(data.side || 5).toFixed(1)}m`;
    group.appendChild(sideLabel);
}

function drawTraufeMarking(group, data) {
    // Vereinfachte Traufe-Markierung - nur eine kleine diskrete Markierung
    const finalShape = determineActualShape();
    
    if (finalShape === 'rechteck' || finalShape === 'quadrat') {
        let width, height;
        
        if (finalShape === 'quadrat') {
            const side = (data.side || 5) * SCALE_FACTOR;
            width = height = side;
        } else {
            width = (data.length || 8) * SCALE_FACTOR;
            height = (data.width || 5) * SCALE_FACTOR;
        }
        
        const x = CANVAS_CENTER_X - width/2;
        const y = CANVAS_CENTER_Y + height/2; // Untere Kante
        
        // Kleine Traufe-Markierung (diskret)
        const traufeLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        traufeLine.setAttribute('x1', x);
        traufeLine.setAttribute('y1', y + 8);
        traufeLine.setAttribute('x2', x + width);
        traufeLine.setAttribute('y2', y + 8);
        traufeLine.setAttribute('stroke', '#dc3545');
        traufeLine.setAttribute('stroke-width', '2');
        traufeLine.setAttribute('stroke-dasharray', '4,2');
        group.appendChild(traufeLine);
        
        // Kleines Traufe-Label
        const traufeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        traufeLabel.setAttribute('x', x + width + 10);
        traufeLabel.setAttribute('y', y + 12);
        traufeLabel.setAttribute('fill', '#dc3545');
        traufeLabel.setAttribute('font-size', '10');
        traufeLabel.setAttribute('font-weight', 'bold');
        traufeLabel.textContent = 'Traufe';
        group.appendChild(traufeLabel);
    }
}

function drawWaterFlowIndication(group, data) {
    // Zeichne Pfeile für Wasserfluss-Richtung
    const direction = getVerlegerichtung();
    
    // Mehrere Wassertropfen-Pfeile vom "First" zur "Traufe"
    for (let i = 0; i < 3; i++) {
        const startY = CANVAS_CENTER_Y - 80 + (i * 30);
        const endY = CANVAS_CENTER_Y + 80;
        const x = CANVAS_CENTER_X - 50 + (i * 50);
        
        const waterArrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        waterArrow.setAttribute('x1', x);
        waterArrow.setAttribute('y1', startY);
        waterArrow.setAttribute('x2', x);
        waterArrow.setAttribute('y2', endY);
        waterArrow.setAttribute('stroke', '#007bff');
        waterArrow.setAttribute('stroke-width', '2');
        waterArrow.setAttribute('marker-end', 'url(#arrowhead)');
        waterArrow.setAttribute('opacity', '0.7');
        
        group.appendChild(waterArrow);
    }
    
    // Label für Wasserfluss
    const waterLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    waterLabel.setAttribute('x', CANVAS_CENTER_X + 70);
    waterLabel.setAttribute('y', CANVAS_CENTER_Y - 60);
    waterLabel.setAttribute('fill', '#007bff');
    waterLabel.setAttribute('font-size', '12');
    waterLabel.setAttribute('font-weight', 'bold');
    waterLabel.textContent = '💧 Wasserfluss';
    
    group.appendChild(waterLabel);
}

// [Hier würden die restlichen Funktionen wie drawShape, drawTriangle, etc. folgen - gleich wie vorher]
// Ich kürze hier ab, da das gleiche Prinzip wie im vorherigen Code gilt

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
    
    group.appendChild(rect);
}

// Weitere draw-Funktionen hier... (gleich wie vorher)

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
            
        // Weitere Berechnungen für andere Formen...
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
    // Erstelle interaktive Seiten-Auswahl direkt auf der Skizze
    enableSideSelection();
    
    // Zeige Instruktionen
    showTraufeInstructions();
}

function enableSideSelection() {
    // Mache die Form-Seiten klickbar
    const shapeGroup = document.getElementById('roof-shape');
    if (!shapeGroup) return;
    
    // Füge Event-Listener zu allen Pfaden/Polygonen hinzu
    const shapes = shapeGroup.querySelectorAll('rect, polygon, circle, ellipse, path');
    
    shapes.forEach(shape => {
        // Mache Form visuell interaktiv
        shape.style.cursor = 'pointer';
        shape.style.stroke = '#ffc107';
        shape.style.strokeWidth = '4';
        
        // Füge Click-Handler hinzu
        shape.addEventListener('click', handleShapeClick);
    });
    
    // Erstelle unsichtbare klickbare Bereiche für jede Seite
    createClickableEdges();
}

function createTriangleEdges(data) {
    const variant = determineActualVariant();
    
    if (variant === 'gleichseitig') {
        const side = (data.side || 6) * SCALE_FACTOR;
        const height = side * Math.sqrt(3) / 2;
        
        const p1 = { x: CANVAS_CENTER_X, y: CANVAS_CENTER_Y - height/2 }; // Spitze oben
        const p2 = { x: CANVAS_CENTER_X - side/2, y: CANVAS_CENTER_Y + height/2 }; // Links unten
        const p3 = { x: CANVAS_CENTER_X + side/2, y: CANVAS_CENTER_Y + height/2 }; // Rechts unten
        
        const edges = [
            { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, side: 'left', name: 'Linke Seite' },
            { x1: p2.x, y1: p2.y, x2: p3.x, y2: p3.y, side: 'bottom', name: 'Basis (unten)' },
            { x1: p3.x, y1: p3.y, x2: p1.x, y2: p1.y, side: 'right', name: 'Rechte Seite' }
        ];
        
        edges.forEach(edge => createClickableEdge(edge));
    }
    // Weitere Dreieck-Varianten hier...
}

function createClickableEdge(edge) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', edge.x1);
    line.setAttribute('y1', edge.y1);
    line.setAttribute('x2', edge.x2);
    line.setAttribute('y2', edge.y2);
    line.setAttribute('stroke', 'transparent');
    line.setAttribute('stroke-width', '20'); // Noch dicker für besseres Klicken
    line.style.cursor = 'pointer';
    line.classList.add('clickable-edge');
    line.dataset.side = edge.side;
    line.dataset.name = edge.name;
    
    // Hover-Effekt
    line.addEventListener('mouseenter', () => {
        line.setAttribute('stroke', 'rgba(255, 193, 7, 0.7)');
        line.setAttribute('stroke-width', '8');
        showSideTooltip(edge.name, edge.x1 + (edge.x2 - edge.x1)/2, edge.y1 + (edge.y2 - edge.y1)/2);
    });
    
    line.addEventListener('mouseleave', () => {
        line.setAttribute('stroke', 'transparent');
        line.setAttribute('stroke-width', '20');
        hideSideTooltip();
    });
    
    line.addEventListener('click', (e) => {
        e.stopPropagation();
        selectTraufeSide(edge.side, edge.name);
    });
    
    svg.appendChild(line);
}

function createRectangleEdges(data) {
    let width, height;
    
    if (determineActualShape() === 'quadrat') {
        const side = (data.side || 5) * SCALE_FACTOR;
        width = height = side;
    } else {
        width = (data.length || 8) * SCALE_FACTOR;
        height = (data.width || 5) * SCALE_FACTOR;
    }
    
    const x = CANVAS_CENTER_X - width/2;
    const y = CANVAS_CENTER_Y - height/2;
    
    // Erstelle klickbare Linien für jede Seite
    const edges = [
        { x1: x, y1: y, x2: x + width, y2: y, side: 'top', name: 'Obere Seite' },
        { x1: x + width, y1: y, x2: x + width, y2: y + height, side: 'right', name: 'Rechte Seite' },
        { x1: x + width, y1: y + height, x2: x, y2: y + height, side: 'bottom', name: 'Untere Seite' },
        { x1: x, y1: y + height, x2: x, y2: y, side: 'left', name: 'Linke Seite' }
    ];
    
    edges.forEach(edge => createClickableEdge(edge));
}

function createClickableEdges() {
    const finalShape = determineActualShape();
    const currentData = getCurrentFormData();
    
    if (finalShape === 'rechteck' || finalShape === 'quadrat') {
        createRectangleEdges(currentData);
    } else if (finalShape === 'dreieck') {
        createTriangleEdges(currentData);
    }
    // Weitere Formen hier...
}

function showSideTooltip(name, x, y) {
    // Entferne alte Tooltips
    hideSideTooltip();
    
    const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    tooltip.id = 'side-tooltip';
    
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x - 40);
    rect.setAttribute('y', y - 15);
    rect.setAttribute('width', '80');
    rect.setAttribute('height', '20');
    rect.setAttribute('fill', '#ffc107');
    rect.setAttribute('rx', '3');
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y - 2);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#000');
    text.setAttribute('font-size', '11');
    text.setAttribute('font-weight', 'bold');
    text.textContent = name;
    
    tooltip.appendChild(rect);
    tooltip.appendChild(text);
    svg.appendChild(tooltip);
}

function hideSideTooltip() {
    const tooltip = document.getElementById('side-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

function selectTraufeSide(side, name) {
    // Entferne Interaktivität
    disableSideSelection();
    
    // Setze Traufe-Position
    traufePosition = side;
    
    // Rotiere entsprechend
    switch(side) {
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
    
    // Aktualisiere die Anzeige
    updateShape();
    hideTraufeInstructions();
    
    showFeedback(`✅ Traufe festgelegt: ${name} ist jetzt die Traufe (Wasserabfluss)`);
}

function disableSideSelection() {
    // Entferne klickbare Kanten
    const clickableEdges = document.querySelectorAll('.clickable-edge');
    clickableEdges.forEach(edge => edge.remove());
    
    // Entferne Tooltip
    hideSideTooltip();
    
    // Setze Form-Stil zurück
    const shapeGroup = document.getElementById('roof-shape');
    if (shapeGroup) {
        const shapes = shapeGroup.querySelectorAll('rect, polygon, circle, ellipse, path');
        shapes.forEach(shape => {
            shape.style.cursor = 'default';
            shape.style.stroke = '#007bff';
            shape.style.strokeWidth = '3';
            shape.removeEventListener('click', handleShapeClick);
        });
    }
}

function handleShapeClick(e) {
    // Fallback für Gesamtform-Klick
    e.stopPropagation();
    showFeedback('Klicken Sie auf eine spezifische Seite der Form');
}

function showTraufeInstructions() {
    const instructions = document.createElement('div');
    instructions.id = 'traufe-instructions';
    instructions.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #ffc107;
        color: #000;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        font-size: 14px;
        font-weight: bold;
        text-align: center;
        border: 2px solid #e6ac00;
    `;
    
    instructions.innerHTML = `
        🏠 <strong>Traufe auswählen:</strong> Klicken Sie auf die Seite der Form, die die Traufe (Wasserabfluss) werden soll
        <br><small>Bewegen Sie die Maus über die Seiten und klicken Sie auf die gewünschte</small>
        <button onclick="cancelTraufeSelection()" style="margin-left: 15px; padding: 5px 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Abbrechen</button>
    `;
    
    document.body.appendChild(instructions);
}

function hideTraufeInstructions() {
    const instructions = document.getElementById('traufe-instructions');
    if (instructions) {
        instructions.remove();
    }
}

// Globale Funktion für Abbrechen-Button
window.cancelTraufeSelection = function() {
    disableSideSelection();
    hideTraufeInstructions();
    showFeedback('Traufe-Auswahl abgebrochen');
};

// Globale Funktionen für Traufe-Dialog
window.setTraufePosition = function(position) {
    const oldPosition = traufePosition;
    traufePosition = position;
    
    // Rotiere das Dach so, dass die gewählte Seite nach unten zeigt
    switch(position) {
        case 'top':
            // Oberseite wird zur Traufe -> 180° drehen
            currentRotation = 180;
            break;
        case 'right':
            // Rechte Seite wird zur Traufe -> 90° nach rechts drehen
            currentRotation = 90;
            break;
        case 'bottom':
            // Unterseite bleibt Traufe -> keine Drehung
            currentRotation = 0;
            break;
        case 'left':
            // Linke Seite wird zur Traufe -> 90° nach links drehen
            currentRotation = -90;
            break;
    }
    
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
    const overlays = document.querySelectorAll('[style*="position: fixed"]');
    overlays.forEach(overlay => {
        if (overlay.parentNode && overlay.innerHTML.includes('Traufe-Position')) {
            overlay.parentNode.removeChild(overlay);
        }
    });
};

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
        max-width: 300px;
        font-size: 14px;
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
                // Allgemeines Dreieck
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
                // Approximiere Oval mit 16 Punkten
                for (let i = 0; i < 16; i++) {
                    const angle = (i * 2 * Math.PI) / 16;
                    points.push({
                        x: radiusA + radiusA * Math.cos(angle),
                        y: radiusB + radiusB * Math.sin(angle)
                    });
                }
            } else {
                const radius = data.radius || 4;
                // Approximiere Kreis mit 16 Punkten
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
            // Fallback: Rechteck
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
            }
            return 10; // Vereinfacht für andere Dreiecke
        case 'trapez':
            const baseA = data.baseA || 8;
            const baseB = data.baseB || 5;
            const height = data.height || 4;
            return 0.5 * (baseA + baseB) * height;
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

function drawDimensions(group, data) {
    // Vereinfachte Bemaßung für das aktuelle Rechteck/Quadrat
    const finalShape = determineActualShape();
    
    if (finalShape === 'rechteck' || finalShape === 'quadrat') {
        let width, height;
        
        if (finalShape === 'quadrat') {
            const side = (data.side || 5) * SCALE_FACTOR;
            width = height = side;
        } else {
            width = (data.length || 8) * SCALE_FACTOR;
            height = (data.width || 5) * SCALE_FACTOR;
        }
        
        const x = CANVAS_CENTER_X - width/2;
        const y = CANVAS_CENTER_Y - height/2;
        
        // Horizontale Bemaßung unten
        const dimLineY = y + height + 20;
        const dimLine1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        dimLine1.setAttribute('x1', x);
        dimLine1.setAttribute('y1', dimLineY);
        dimLine1.setAttribute('x2', x + width);
        dimLine1.setAttribute('y2', dimLineY);
        dimLine1.setAttribute('stroke', '#666');
        dimLine1.setAttribute('stroke-width', '1');
        group.appendChild(dimLine1);
        
        const dimText1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        dimText1.setAttribute('x', x + width/2);
        dimText1.setAttribute('y', dimLineY + 15);
        dimText1.setAttribute('text-anchor', 'middle');
        dimText1.setAttribute('fill', '#666');
        dimText1.setAttribute('font-size', '11');
        dimText1.textContent = `${(data.length || data.side || 8).toFixed(1)}m`;
        group.appendChild(dimText1);
        
        // Vertikale Bemaßung rechts (nur bei Rechteck)
        if (finalShape === 'rechteck') {
            const dimLineX = x + width + 20;
            const dimLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            dimLine2.setAttribute('x1', dimLineX);
            dimLine2.setAttribute('y1', y);
            dimLine2.setAttribute('x2', dimLineX);
            dimLine2.setAttribute('y2', y + height);
            dimLine2.setAttribute('stroke', '#666');
            dimLine2.setAttribute('stroke-width', '1');
            group.appendChild(dimLine2);
            
            const dimText2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            dimText2.setAttribute('x', dimLineX + 15);
            dimText2.setAttribute('y', y + height/2);
            dimText2.setAttribute('text-anchor', 'middle');
            dimText2.setAttribute('fill', '#666');
            dimText2.setAttribute('font-size', '11');
            dimText2.setAttribute('transform', `rotate(90, ${dimLineX + 15}, ${y + height/2})`);
            dimText2.textContent = `${(data.width || 5).toFixed(1)}m`;
            group.appendChild(dimText2);
        }
    }
}

// Weitere draw-Funktionen (vereinfacht, da sie dem gleichen Muster folgen)
function drawTriangle(group, data, variant) {
    let points = '';
    
    if (variant === 'gleichseitig') {
        const side = (data.side || 6) * SCALE_FACTOR;
        const height = side * Math.sqrt(3) / 2;
        points = `${CANVAS_CENTER_X},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - side/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + side/2},${CANVAS_CENTER_Y + height/2}`;
    } else if (variant === 'rechtwinklig') {
        const a = (data.katheteA || 4) * SCALE_FACTOR;
        const b = (data.katheteB || 5) * SCALE_FACTOR;
        points = `${CANVAS_CENTER_X - a/2},${CANVAS_CENTER_Y + b/2} ${CANVAS_CENTER_X + a/2},${CANVAS_CENTER_Y + b/2} ${CANVAS_CENTER_X - a/2},${CANVAS_CENTER_Y - b/2}`;
    } else {
        const a = (data.sideA || 4) * SCALE_FACTOR;
        const height = a * 0.8;
        points = `${CANVAS_CENTER_X},${CANVAS_CENTER_Y - height/2} ${CANVAS_CENTER_X - a/2},${CANVAS_CENTER_Y + height/2} ${CANVAS_CENTER_X + a/2 - 20},${CANVAS_CENTER_Y + height/2}`;
    }
    
    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    triangle.setAttribute('points', points);
    triangle.setAttribute('fill', 'rgba(0, 123, 255, 0.3)');
    triangle.setAttribute('stroke', '#007bff');
    triangle.setAttribute('stroke-width', '3');
    
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

console.log('✅ Verbesserter Editor mit korrekter Traufe-Logik geladen');
